import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

/**
 * Determines the appropriate role for a user based on secure criteria
 * SECURITY: Only uses explicit allowlists and verified claims to prevent privilege escalation
 */
async function determineUserRole(
  claims: any,
  existingUser: any,
  organizationId: string
): Promise<"admin" | "employee"> {
  const email = claims["email"];
  
  // 1. Check explicit admin emails from environment variable (exact match only)
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
  if (email && adminEmails.includes(email.toLowerCase())) {
    return "admin";
  }

  // 2. Check verified OIDC claims for admin indicators from trusted identity provider
  const roles = claims["roles"] || [];
  const groups = claims["groups"] || [];
  const isAdmin = claims["is_admin"];
  
  if (isAdmin === true || 
      roles.includes("admin") || 
      groups.includes("admin") || 
      groups.includes("administrators")) {
    return "admin";
  }

  // 3. Preserve existing admin role for current users (allows manual admin assignments)
  if (existingUser?.role === "admin") {
    return "admin";
  }

  // 4. Fallback: First user in organization gets admin role
  const teamMembers = await storage.getTeamMembers(organizationId);
  const isFirstUser = teamMembers.length === 0;
  
  return isFirstUser ? "admin" : "employee";
}

async function upsertUser(
  claims: any,
) {
  // Get or create default organization
  let defaultOrg = await storage.getOrganizationByDomain('default.local');
  if (!defaultOrg) {
    defaultOrg = await storage.createOrganization({
      name: 'Default Organization',
      domain: 'default.local'
    });
  }

  // Check if user already exists to determine role
  const existingUser = await storage.getUser(claims["sub"]);
  const role = await determineUserRole(claims, existingUser, defaultOrg.id);
  
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    organizationId: defaultOrg.id,
    role: role,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims());
      verified(null, user);
    } catch (error: any) {
      // Handle errors gracefully - pass error to passport instead of crashing server
      console.error('Authentication error during user upsert:', error);
      
      // Check if it's an email conflict error for better user feedback
      if (error.name === 'EmailConflictError') {
        console.error('Email conflict detected during authentication:', error.message);
      }
      
      // Pass null to passport to fail authentication gracefully (prevents server crash)
      // Passport treats (null, false) as auth failure and honors failureRedirect
      verified(null, false, { message: error?.name === 'EmailConflictError' ? 'email_conflict' : 'auth_error' });
    }
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
