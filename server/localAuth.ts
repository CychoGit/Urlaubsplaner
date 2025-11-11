import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, Request, Response, NextFunction } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { comparePassword } from "./authUtils";
import type { User } from "@shared/schema";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Passport Local Strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email.toLowerCase().trim());
          
          if (!user) {
            return done(null, false, { message: 'E-Mail oder Passwort ungültig' });
          }

          if (!user.password) {
            return done(null, false, { message: 'E-Mail oder Passwort ungültig' });
          }

          const isValidPassword = await comparePassword(password, user.password);
          
          if (!isValidPassword) {
            return done(null, false, { message: 'E-Mail oder Passwort ungültig' });
          }

          if (user.status !== 'approved') {
            return done(null, false, { 
              message: 'Ihr Konto wartet noch auf Freigabe. Bitte warten Sie, bis ein Administrator Ihr Konto genehmigt hat.' 
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error('Error deserializing user:', error);
      return done(null, false);
    }
  });
}

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Middleware to check if user has specific role
export const hasRole = (...roles: Array<'tenant_admin' | 'admin' | 'employee'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = req.user as User;
    if (!roles.includes(user.role as any)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

// Middleware to check if user is approved
export const isApproved = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = req.user as User;
  if (user.status !== 'approved') {
    return res.status(403).json({ message: 'Your account is pending approval' });
  }

  next();
};

// Middleware to check if user is tenant admin
export const isTenantAdmin = hasRole('tenant_admin');

// Middleware to check if user is admin or tenant admin
export const isAdmin = hasRole('tenant_admin', 'admin');

// Middleware to check if user is org admin (admin OR tenant_admin)
export const isOrgAdmin = hasRole('tenant_admin', 'admin');
