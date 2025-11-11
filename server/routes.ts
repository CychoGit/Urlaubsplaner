import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin, isApproved, isTenantAdmin, isOrgAdmin } from "./localAuth";
import passport from "passport";
import { createNotificationService, getNotificationService } from "./notificationService";
import { 
  insertVacationRequestSchema, 
  updateVacationRequestStatusSchema, 
  updateUserBalanceSchema, 
  insertNotificationSchema, 
  updateNotificationPreferencesSchema, 
  updateThemePreferenceSchema,
  updateOrganizationSettingsSchema,
  registerUserSchema,
  loginUserSchema,
  approveUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  type User,
  type VacationRequestWithUser, 
  type ConflictAnalysis, 
  type TeamCoverageAnalysis, 
  type CoverageSuggestion 
} from "@shared/schema";
import { z } from "zod";
import { createEvents } from "ics";
import { hashPassword, sanitizeEmail } from "./authUtils";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission, getObjectAclPolicy, setObjectAclPolicy } from "./objectAcl";
import { calculateBusinessDays } from "./holidays";

// Extended request type for authenticated routes
interface AuthenticatedRequest extends Request {
  user: User;
}

// Type assertion helper for authenticated routes
const asAuthenticatedRequest = (req: Request): req is AuthenticatedRequest => {
  return req.user !== undefined;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server that will be returned at the end
  const server = createServer(app);
  
  // Auth middleware
  await setupAuth(app);

  // Registration endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName, organizationId } = req.body;

      if (!email || !password || !firstName || !lastName || !organizationId) {
        return res.status(400).json({ message: 'Alle Felder sind erforderlich' });
      }

      const sanitizedEmail = sanitizeEmail(email);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(sanitizedEmail);
      if (existingUser) {
        return res.status(400).json({ message: 'E-Mail-Adresse bereits registriert' });
      }

      // Verify organization exists
      const organization = await storage.getOrganization(organizationId);
      if (!organization) {
        return res.status(400).json({ message: 'Organisation nicht gefunden' });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Check if this is the first user in the organization
      const teamMembers = await storage.getTeamMembers(organizationId);
      const isFirstUser = teamMembers.length === 0;

      // Create user with appropriate status and role
      const user = await storage.createUser({
        email: sanitizedEmail,
        password: hashedPassword,
        firstName,
        lastName,
        organizationId,
        status: isFirstUser ? 'approved' : 'pending',
        role: isFirstUser ? 'admin' : 'employee',
      });

      res.status(201).json({ 
        message: isFirstUser 
          ? 'Registrierung erfolgreich. Sie sind der erste Administrator Ihrer Organisation.' 
          : 'Registrierung erfolgreich. Bitte warten Sie auf die Genehmigung eines Administrators.',
        userId: user.id,
        requiresApproval: !isFirstUser
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ message: 'Registrierung fehlgeschlagen' });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: User | false, info: any) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: 'Anmeldefehler' });
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Ungültige Anmeldedaten' });
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error("Session error:", err);
          return res.status(500).json({ message: 'Sitzungsfehler' });
        }
        
        return res.json({ 
          message: 'Erfolgreich angemeldet',
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
            organizationId: user.organizationId,
          }
        });
      });
    })(req, res, next);
  });

  // Logout endpoint (POST)
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Abmeldefehler' });
      }
      res.json({ message: 'Erfolgreich abgemeldet' });
    });
  });

  // Change password endpoint (for all authenticated users)
  app.post('/api/auth/change-password', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validate inputs
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'Alle Felder sind erforderlich' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Neue Passwörter stimmen nicht überein' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Neues Passwort muss mindestens 8 Zeichen lang sein' });
      }

      // Get user with password
      const user = await storage.getUserByEmail(authReq.user.email);
      if (!user) {
        return res.status(404).json({ message: 'Benutzer nicht gefunden' });
      }

      // Verify current password
      const bcrypt = await import('bcryptjs');
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Aktuelles Passwort ist falsch' });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await storage.updateUserPassword(user.id, hashedPassword);

      res.json({ message: 'Passwort erfolgreich geändert' });
    } catch (error: any) {
      console.error("Password change error:", error);
      res.status(500).json({ message: 'Fehler beim Ändern des Passworts' });
    }
  });

  // Update user vacation tracking preference
  app.patch('/api/auth/user/vacation-tracking', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ message: 'Ungültiger Wert für enabled' });
      }

      // Tenant admins and users without organization cannot use vacation tracking
      if (!authReq.user.organizationId) {
        return res.status(400).json({ 
          message: 'Urlaubssaldo-Tracking ist nur für Mitarbeiter einer Organisation verfügbar.' 
        });
      }

      // Authorization: Check if organization has vacation tracking enabled
      if (enabled) {
        const organization = await storage.getOrganization(authReq.user.organizationId);
        
        if (!organization) {
          return res.status(404).json({ message: 'Organisation nicht gefunden' });
        }
        
        if (!organization.vacationTrackingEnabled) {
          return res.status(403).json({ 
            message: 'Das Urlaubssaldo-Tracking ist für Ihre Organisation deaktiviert. Bitte kontaktieren Sie Ihren Administrator.' 
          });
        }
      }

      const updatedUser = await storage.updateUserVacationTracking(authReq.user.id, enabled);

      res.json({ 
        message: 'Urlaubssaldo-Tracking erfolgreich aktualisiert',
        user: updatedUser
      });
    } catch (error: any) {
      console.error("Error updating vacation tracking:", error);
      res.status(500).json({ message: 'Fehler beim Aktualisieren der Einstellung' });
    }
  });

  // Logout endpoint (GET) - for navbar link
  app.get('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.redirect('/login');
      }
      res.redirect('/login');
    });
  });

  // Get current user
  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Fehler beim Abrufen des Benutzers" });
    }
  });

  // Get all organizations for registration (public endpoint)
  // Public API to get all organizations for registration page
  app.get('/api/organizations', async (req, res) => {
    try {
      const organizations = await storage.getAllOrganizations();
      // Filter out system organization
      const publicOrgs = organizations.filter(org => org.domain !== 'system.local');
      res.json(publicOrgs);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Fehler beim Abrufen der Organisationen" });
    }
  });

  // ===== TENANT ADMIN ENDPOINTS =====
  
  // Get all organizations with admin counts (tenant admin only)
  app.get('/api/tenant/organizations', isAuthenticated, isTenantAdmin, async (req, res) => {
    try {
      const organizations = await storage.getAllOrganizations();
      
      // Add admin count for each organization
      const orgsWithAdminCount = await Promise.all(
        organizations.map(async (org) => {
          const teamMembers = await storage.getTeamMembers(org.id);
          const adminCount = teamMembers.filter(
            user => user.role === 'admin' || user.role === 'tenant_admin'
          ).length;
          
          return {
            ...org,
            adminCount,
          };
        })
      );
      
      res.json(orgsWithAdminCount);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Fehler beim Abrufen der Organisationen" });
    }
  });

  // Create organization (tenant admin only)
  app.post('/api/tenant/organizations', isAuthenticated, isTenantAdmin, async (req, res) => {
    try {
      const { name, domain } = req.body;
      
      if (!name || !domain) {
        return res.status(400).json({ message: "Name und Domain sind erforderlich" });
      }

      const organization = await storage.createOrganization({ name, domain });
      res.status(201).json({
        message: "Organisation erfolgreich erstellt",
        organization
      });
    } catch (error: any) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Fehler beim Erstellen der Organisation" });
    }
  });

  // Get admins for organization (tenant admin only)
  app.get('/api/tenant/organizations/:orgId/admins', isAuthenticated, isTenantAdmin, async (req, res) => {
    try {
      const { orgId } = req.params;
      
      // Get all team members for the organization
      const teamMembers = await storage.getTeamMembers(orgId);
      
      // Filter for admins and tenant_admins, exclude password
      const admins = teamMembers
        .filter(user => user.role === 'admin' || user.role === 'tenant_admin')
        .map(({ password, ...user }) => user);
      
      res.json(admins);
    } catch (error: any) {
      console.error("Error fetching admins:", error);
      res.status(500).json({ message: "Fehler beim Abrufen der Administratoren" });
    }
  });

  // Create admin for organization (tenant admin only)
  app.post('/api/tenant/organizations/:orgId/admin', isAuthenticated, isTenantAdmin, async (req, res) => {
    try {
      const { orgId } = req.params;
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Alle Felder sind erforderlich" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email.toLowerCase().trim());
      if (existingUser) {
        return res.status(400).json({ message: "E-Mail-Adresse bereits registriert" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create admin user
      const user = await storage.createUser({
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        firstName,
        lastName,
        organizationId: orgId,
        role: 'admin',
        status: 'approved',
      });

      res.status(201).json({
        message: "Administrator erfolgreich erstellt",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        }
      });
    } catch (error: any) {
      console.error("Error creating admin:", error);
      res.status(500).json({ message: "Fehler beim Erstellen des Administrators" });
    }
  });

  // Update organization name (tenant admin only)
  app.patch('/api/tenant/organizations/:orgId', isAuthenticated, isTenantAdmin, async (req, res) => {
    try {
      const { orgId } = req.params;
      const { name } = req.body;
      
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ message: "Name ist erforderlich" });
      }

      const organization = await storage.updateOrganizationSettings(orgId, { customName: name });
      
      res.json({ 
        message: "Organisation erfolgreich umbenannt",
        organization
      });
    } catch (error: any) {
      console.error("Error updating organization:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren der Organisation" });
    }
  });

  // Update admin for organization (tenant admin only)
  app.patch('/api/tenant/organizations/:orgId/admins/:userId', isAuthenticated, isTenantAdmin, async (req, res) => {
    try {
      const { orgId, userId } = req.params;
      const { email, firstName, lastName } = req.body;
      
      if (!email || !firstName || !lastName) {
        return res.status(400).json({ message: "Alle Felder sind erforderlich" });
      }

      // Get the user to verify they exist and belong to this org
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Benutzer nicht gefunden" });
      }
      
      if (user.organizationId !== orgId) {
        return res.status(403).json({ message: "Benutzer gehört nicht zu dieser Organisation" });
      }

      // Check if email is already used by another user
      const sanitizedEmail = sanitizeEmail(email);
      const existingUser = await storage.getUserByEmail(sanitizedEmail);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "E-Mail-Adresse bereits registriert" });
      }

      // Update user
      const updatedUser = await storage.updateUserProfile(userId, {
        email: sanitizedEmail,
        firstName,
        lastName,
      });

      res.json({
        message: "Administrator erfolgreich aktualisiert",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
        }
      });
    } catch (error: any) {
      console.error("Error updating admin:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren des Administrators" });
    }
  });

  // Delete admin for organization (tenant admin only)
  app.delete('/api/tenant/organizations/:orgId/admins/:userId', isAuthenticated, isTenantAdmin, async (req, res) => {
    try {
      const { orgId, userId } = req.params;
      
      // Get the user to verify they exist and belong to this org
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Benutzer nicht gefunden" });
      }
      
      if (user.organizationId !== orgId) {
        return res.status(403).json({ message: "Benutzer gehört nicht zu dieser Organisation" });
      }

      // Delete the user
      await storage.deleteUser(userId);

      res.json({ message: "Administrator erfolgreich gelöscht" });
    } catch (error: any) {
      console.error("Error deleting admin:", error);
      res.status(500).json({ message: "Fehler beim Löschen des Administrators" });
    }
  });

  // Delete organization (tenant admin only)
  app.delete('/api/tenant/organizations/:orgId', isAuthenticated, isTenantAdmin, async (req, res) => {
    try {
      const { orgId } = req.params;
      
      // Delete organization (with CASCADE to all related data)
      await storage.deleteOrganization(orgId);
      
      res.json({ message: "Organisation erfolgreich gelöscht" });
    } catch (error: any) {
      console.error("Error deleting organization:", error);
      if (error.message === "Cannot delete system organization") {
        return res.status(403).json({ message: "System-Organisation kann nicht gelöscht werden" });
      }
      if (error.message === "Organization not found") {
        return res.status(404).json({ message: "Organisation nicht gefunden" });
      }
      res.status(500).json({ message: "Fehler beim Löschen der Organisation" });
    }
  });

  // Object Storage Endpoints (referenced from blueprint:javascript_object_storage)
  // Note: /objects/* route is registered in server/index.ts before Vite middleware
  
  // Get organization details (all authenticated users can view their own org)
  // Users can view their own organization to check settings like vacationTrackingEnabled
  app.get("/api/organizations/:orgId", isAuthenticated, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const { orgId } = req.params;

    // Verify user belongs to this organization or is tenant admin
    if (authReq.user.organizationId !== orgId && authReq.user.role !== 'tenant_admin') {
      return res.status(403).json({ error: "Nicht berechtigt für diese Organization" });
    }

    try {
      const org = await storage.getOrganization(orgId);
      if (!org) {
        return res.status(404).json({ error: "Organisation nicht gefunden" });
      }
      
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.json(org);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update organization branding (admin only)
  app.put("/api/organizations/:orgId/branding", isAuthenticated, isOrgAdmin, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const { orgId } = req.params;
    const { customName, logoURL } = req.body;

    // Verify admin belongs to this organization
    if (authReq.user.organizationId !== orgId) {
      return res.status(403).json({ error: "Nicht berechtigt für diese Organisation" });
    }

    try {
      const { fileStorageService } = await import('./fileStorage');
      let normalizedLogoUrl = null;

      // If logo URL provided, normalize and set ACL
      if (logoURL) {
        normalizedLogoUrl = await fileStorageService.normalizeLogo(
          logoURL,
          authReq.user.id
        );
      }

      // Update organization
      const updated = await storage.updateOrganizationBranding(
        orgId,
        customName || null,
        normalizedLogoUrl
      );

      res.status(200).json({
        message: "Branding erfolgreich aktualisiert",
        organization: updated
      });
    } catch (error) {
      console.error("Error updating organization branding:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update organization settings (admin only)
  app.patch("/api/organizations/:orgId/settings", isAuthenticated, isOrgAdmin, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const { orgId } = req.params;

    // Verify admin belongs to this organization
    if (authReq.user.organizationId !== orgId) {
      return res.status(403).json({ error: "Nicht berechtigt für diese Organisation" });
    }

    try {
      const validatedData = updateOrganizationSettingsSchema.parse(req.body);
      
      const settings: { defaultVacationDays?: number; customName?: string | null; logoUrl?: string | null; vacationTrackingEnabled?: boolean } = {};
      
      if (validatedData.defaultVacationDays !== undefined) {
        settings.defaultVacationDays = validatedData.defaultVacationDays;
      }
      if (validatedData.customName !== undefined) {
        settings.customName = validatedData.customName;
      }
      if (validatedData.logoUrl !== undefined) {
        settings.logoUrl = validatedData.logoUrl;
      }
      if (validatedData.vacationTrackingEnabled !== undefined) {
        settings.vacationTrackingEnabled = validatedData.vacationTrackingEnabled;
      }

      const updated = await storage.updateOrganizationSettings(orgId, settings);

      // Cascade: If vacation tracking was disabled, disable it for all users in the organization
      if (validatedData.vacationTrackingEnabled === false) {
        await storage.disableVacationTrackingForAllUsers(orgId);
      }

      res.status(200).json({
        message: "Einstellungen erfolgreich aktualisiert",
        organization: updated
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Ungültige Daten", details: error.errors });
      }
      console.error("Error updating organization settings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get pending users (admin only)
  app.get('/api/users/pending', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user;
      
      if (!user.organizationId) {
        return res.status(400).json({ message: "Benutzer muss einer Organisation angehören" });
      }

      const pendingUsers = await storage.getPendingUsers(user.organizationId);
      res.json(pendingUsers);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Fehler beim Abrufen ausstehender Benutzer" });
    }
  });

  // Approve user (admin only)
  app.post('/api/users/:userId/approve', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { userId } = req.params;
      const validatedData = approveUserSchema.parse({ ...req.body, userId });

      const approvedUser = await storage.approveUser(
        userId, 
        authReq.user.id,
        validatedData.role
      );

      res.json({ 
        message: 'Benutzer erfolgreich genehmigt',
        user: approvedUser 
      });
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500).json({ message: "Fehler beim Genehmigen des Benutzers" });
    }
  });

  // Delete user (admin only)
  app.delete('/api/users/:userId', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { userId } = req.params;
      
      // Prevent self-deletion
      if (userId === authReq.user.id) {
        return res.status(400).json({ message: "Sie können sich nicht selbst löschen" });
      }

      await storage.deleteUser(userId);

      res.json({ 
        message: 'Benutzer erfolgreich gelöscht'
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Fehler beim Löschen des Benutzers" });
    }
  });

  // Update user role (admin only)
  // Only tenant_admin can change user roles
  app.patch('/api/users/:userId/role', isAuthenticated, isTenantAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const validatedData = updateUserRoleSchema.parse(req.body);

      const updatedUser = await storage.updateUserRole(userId, validatedData.role);

      res.json({ 
        message: 'Benutzerrolle erfolgreich aktualisiert',
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren der Benutzerrolle" });
    }
  });

  // Update user status (admin only)
  // Only tenant_admin can change user status
  app.patch('/api/users/:userId/status', isAuthenticated, isTenantAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const validatedData = updateUserStatusSchema.parse(req.body);

      const updatedUser = await storage.updateUserStatus(userId, validatedData.status);

      res.json({ 
        message: 'Benutzerstatus erfolgreich aktualisiert',
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren des Benutzerstatus" });
    }
  });

  // Organization routes
  app.post('/api/organizations', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { name, domain } = req.body;
      const organization = await storage.createOrganization({ name, domain });
      
      // Update user with organization
      const userId = authReq.user.id;
      await storage.upsertUser({ 
        id: userId, 
        organizationId: organization.id,
        role: "admin" 
      });

      res.json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  // Vacation request routes
  app.post('/api/vacation-requests', isAuthenticated, isApproved, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      // Security: Tenant admins cannot create vacation requests
      if (user.role === "tenant_admin") {
        return res.status(403).json({ message: "Tenant administrators cannot create vacation requests" });
      }

      // Server validation schema excluding userId (populated from session)
      const serverValidationSchema = insertVacationRequestSchema.omit({ userId: true });
      const validatedData = serverValidationSchema.parse(req.body);
      
      // Validate date range
      const startDate = new Date(validatedData.startDate);
      const endDate = new Date(validatedData.endDate);
      
      if (startDate > endDate) {
        return res.status(400).json({ 
          message: "Das Enddatum muss nach dem Startdatum liegen.",
          code: "INVALID_DATE_RANGE"
        });
      }
      
      // Calculate requested days using business days (excluding weekends and holidays)
      const holidayDates = await storage.getHolidayDates(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      const requestedDays = calculateBusinessDays(startDate, endDate, holidayDates);
      
      // Validate that requested days is greater than 0
      if (requestedDays <= 0) {
        return res.status(400).json({ 
          message: "Der Urlaubszeitraum muss mindestens einen Arbeitstag enthalten (Wochenenden und Feiertage werden nicht gezählt).",
          code: "NO_BUSINESS_DAYS",
          requestedDays
        });
      }
      
      // Get user's current balance
      const balance = await storage.getUserBalance(userId);
      
      // Check if request would exceed available balance
      if (requestedDays > balance.remainingDays) {
        return res.status(400).json({ 
          message: `Urlaubsantrag überschreitet verfügbares Saldo. Beantragt: ${requestedDays} Tage, Verfügbar: ${balance.remainingDays} Tage`,
          code: "INSUFFICIENT_BALANCE",
          requestedDays,
          availableDays: balance.remainingDays
        });
      }
      
      // Check if user already has a request for the same/overlapping period
      const userExistingRequests = await storage.getVacationRequestsByUser(userId);
      const overlappingUserRequest = userExistingRequests.find(existing => 
        (existing.status === 'pending' || existing.status === 'approved') &&
        existing.startDate <= validatedData.endDate &&
        existing.endDate >= validatedData.startDate
      );
      
      if (overlappingUserRequest) {
        return res.status(400).json({ 
          message: `Sie haben bereits einen Urlaubsantrag für diesen Zeitraum (${overlappingUserRequest.startDate} bis ${overlappingUserRequest.endDate}, Status: ${overlappingUserRequest.status === 'approved' ? 'Genehmigt' : 'Wartend'})`,
          code: "DUPLICATE_REQUEST",
          existingRequest: {
            id: overlappingUserRequest.id,
            startDate: overlappingUserRequest.startDate,
            endDate: overlappingUserRequest.endDate,
            status: overlappingUserRequest.status
          }
        });
      }
      
      // Check for conflicts
      const conflicts = await storage.getVacationRequestsInDateRange(
        user.organizationId,
        validatedData.startDate,
        validatedData.endDate
      );
      
      const approvedConflicts = conflicts.filter(
        request => request.status === "approved" && request.userId !== userId
      );

      const request = await storage.createVacationRequest({
        ...validatedData,
        userId,
        organizationId: user.organizationId,
      });

      // Send notification to admins about new vacation request
      try {
        const notificationService = getNotificationService();
        const requesterName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Ein Benutzer';
        const dateRange = `${validatedData.startDate} bis ${validatedData.endDate}`;
        
        // Get all admins in the organization to notify them
        const teamMembers = await storage.getTeamMembers(user.organizationId);
        const admins = teamMembers.filter(member => member.role === 'admin');
        
        for (const admin of admins) {
          await notificationService.createAndSendNotification({
            userId: admin.id,
            organizationId: user.organizationId,
            type: 'vacation_request_submitted',
            title: 'Neuer Urlaubsantrag',
            message: `${requesterName} hat einen neuen Urlaubsantrag für ${dateRange} eingereicht und wartet auf Genehmigung.`,
            relatedEntityId: request.id,
            relatedEntityType: 'vacation_request',
            deliveryChannels: ['browser'],
            metadata: { 
              requestId: request.id, 
              requesterName, 
              dateRange,
              requestedDays 
            }
          });
        }

        // If conflicts detected, send notifications to affected users
        if (approvedConflicts.length > 0) {
          for (const conflict of approvedConflicts) {
            await notificationService.createAndSendNotification({
              userId: conflict.userId,
              organizationId: user.organizationId,
              type: 'vacation_conflict_detected',
              title: 'Urlaubskonflikt erkannt',
              message: `Ein neuer Urlaubsantrag von ${requesterName} für ${dateRange} überschneidet sich mit Ihrem genehmigten Urlaub.`,
              relatedEntityId: request.id,
              relatedEntityType: 'vacation_request',
              deliveryChannels: ['browser'],
              metadata: { 
                conflictingRequestId: request.id,
                conflictingRequester: requesterName,
                dateRange
              }
            });
          }
        }
      } catch (notificationError) {
        console.error('Error sending notifications for new vacation request:', notificationError);
        // Don't fail the request creation if notification fails
      }

      res.json({ 
        request, 
        conflicts: approvedConflicts.length > 0 ? approvedConflicts : undefined 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error creating vacation request:", error);
      res.status(500).json({ message: "Failed to create vacation request" });
    }
  });

  app.get('/api/vacation-requests', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      // Always return only the current user's requests for "Meine Anträge"
      const requests = await storage.getVacationRequestsByUser(userId);

      res.json(requests);
    } catch (error) {
      console.error("Error fetching vacation requests:", error);
      res.status(500).json({ message: "Failed to fetch vacation requests" });
    }
  });

  app.get('/api/vacation-requests/pending', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      // Authorization: Only admins and tenant admins can view pending requests
      if (!user?.organizationId || (user.role !== "admin" && user.role !== "tenant_admin")) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const requests = await storage.getPendingVacationRequests(user.organizationId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({ message: "Failed to fetch pending requests" });
    }
  });

  app.patch('/api/vacation-requests/:id/status', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      // Authorization: Only admins and tenant admins can approve/reject requests
      if (!user?.organizationId || (user.role !== "admin" && user.role !== "tenant_admin")) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const validatedData = updateVacationRequestStatusSchema.parse(req.body);
      
      // Get the request details before updating status to know which user to update balance for
      const requestDetails = await storage.getVacationRequest(id);
      if (!requestDetails) {
        return res.status(404).json({ message: "Vacation request not found" });
      }

      // Security: Prevent self-approval for employees
      // Admins can approve their own requests, employees cannot
      if (requestDetails.userId === userId && user.role === "employee") {
        return res.status(403).json({ message: "You cannot approve your own vacation request" });
      }

      // Security: Ensure the request belongs to the same organization
      const requestOwner = await storage.getUser(requestDetails.userId);
      if (!requestOwner || requestOwner.organizationId !== user.organizationId) {
        return res.status(403).json({ message: "You can only manage requests from your own organization" });
      }
      
      // Update the vacation request status
      const request = await storage.updateVacationRequestStatus(id, validatedData, userId);
      
      // Automatically update the user's balance based on approved requests
      const requestUserId = requestDetails.userId;
      const usedDays = await storage.calculateUsedDays(requestUserId);
      await storage.updateUsedDays(requestUserId, usedDays);

      // Send notification to the requester about status change
      try {
        const notificationService = getNotificationService();
        const requesterUser = await storage.getUser(requestUserId);
        const adminName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Ein Administrator';
        const dateRange = `${requestDetails.startDate} bis ${requestDetails.endDate}`;
        
        if (requesterUser) {
          const isApproved = validatedData.status === 'approved';
          const notificationType = isApproved ? 'vacation_request_approved' : 'vacation_request_rejected';
          const title = isApproved ? 'Urlaubsantrag genehmigt' : 'Urlaubsantrag abgelehnt';
          const message = isApproved 
            ? `Ihr Urlaubsantrag für ${dateRange} wurde von ${adminName} genehmigt.`
            : `Ihr Urlaubsantrag für ${dateRange} wurde von ${adminName} abgelehnt.`;

          await notificationService.createAndSendNotification({
            userId: requestUserId,
            organizationId: user.organizationId,
            type: notificationType,
            title,
            message,
            relatedEntityId: request.id,
            relatedEntityType: 'vacation_request',
            deliveryChannels: ['browser'],
            metadata: { 
              requestId: request.id, 
              adminName,
              dateRange,
              previousStatus: requestDetails.status,
              newStatus: validatedData.status
            }
          });

          // If request was approved, send balance warning if user is running low
          if (isApproved && requesterUser) {
            const balance = await storage.getUserBalance(requestUserId);
            const remainingDays = balance.remainingDays;
            
            if (remainingDays <= 5 && remainingDays > 0) {
              await notificationService.createAndSendNotification({
                userId: requestUserId,
                organizationId: user.organizationId,
                type: 'balance_warning',
                title: 'Urlaubstage werden knapp',
                message: `Nach Genehmigung Ihres Antrags haben Sie nur noch ${remainingDays} Urlaubstage übrig.`,
                relatedEntityId: requestUserId,
                relatedEntityType: 'user',
                deliveryChannels: ['browser'],
                metadata: { 
                  remainingDays,
                  requestId: request.id
                }
              });
            }
          }
        }
      } catch (notificationError) {
        console.error('Error sending notifications for status update:', notificationError);
        // Don't fail the status update if notification fails
      }
      
      res.json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid status data", errors: error.errors });
      }
      console.error("Error updating request status:", error);
      res.status(500).json({ message: "Failed to update request status" });
    }
  });

  // Delete vacation request (user can delete their own pending or approved requests)
  app.delete('/api/vacation-requests/:id', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const { id } = req.params;
      
      // Get the vacation request to verify ownership and status
      const request = await storage.getVacationRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Urlaubsantrag nicht gefunden" });
      }
      
      // Security: Users can only delete their own requests
      if (request.userId !== userId) {
        return res.status(403).json({ message: "Sie können nur Ihre eigenen Anträge löschen" });
      }
      
      // Only allow deletion of pending or approved requests, not rejected ones
      if (request.status !== 'pending' && request.status !== 'approved') {
        return res.status(400).json({ message: "Nur wartende oder genehmigte Anträge können gelöscht werden" });
      }
      
      // Delete the request
      await storage.deleteVacationRequest(id);
      
      // If the request was approved, recalculate used days to return the vacation days
      if (request.status === 'approved') {
        const usedDays = await storage.calculateUsedDays(userId);
        await storage.updateUsedDays(userId, usedDays);
      }
      
      res.json({ message: "Urlaubsantrag erfolgreich gelöscht" });
    } catch (error) {
      console.error("Error deleting vacation request:", error);
      res.status(500).json({ message: "Fehler beim Löschen des Urlaubsantrags" });
    }
  });

  // Calendar data route
  app.get('/api/calendar', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }

      const requests = await storage.getVacationRequestsInDateRange(
        user.organizationId,
        startDate as string,
        endDate as string
      );

      res.json(requests);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      res.status(500).json({ message: "Failed to fetch calendar data" });
    }
  });

  // Advanced conflict analysis and coverage suggestion routes
  app.get('/api/vacation-requests/:id/conflict-analysis', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const conflictAnalysis = await storage.getCoverageAnalysisForRequest(id);
      
      if (!conflictAnalysis) {
        return res.json({ message: "No conflicts detected", conflicts: [] });
      }

      res.json(conflictAnalysis);
    } catch (error) {
      console.error("Error fetching conflict analysis:", error);
      res.status(500).json({ message: "Failed to fetch conflict analysis" });
    }
  });

  app.get('/api/coverage-suggestions', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      const { startDate, endDate, requiredSkills } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }

      const skillsArray = requiredSkills ? (requiredSkills as string).split(',') : [];
      const suggestions = await storage.generateCoverageSuggestions(
        user.organizationId,
        startDate as string,
        endDate as string,
        skillsArray
      );

      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching coverage suggestions:", error);
      res.status(500).json({ message: "Failed to fetch coverage suggestions" });
    }
  });

  // Team coverage analysis - available for all users
  app.get('/api/team-coverage-analysis', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }

      const coverageAnalysis = await storage.getTeamCoverageAnalysis(
        user.organizationId,
        startDate as string,
        endDate as string
      );

      res.json(coverageAnalysis);
    } catch (error) {
      console.error("Error fetching team coverage analysis:", error);
      res.status(500).json({ message: "Failed to fetch team coverage analysis" });
    }
  });

  // Balance routes
  app.get('/api/users/balance', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      
      const balance = await storage.getUserBalance(userId);
      
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.json(balance);
    } catch (error) {
      console.error("Error fetching user balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  // Only admins can view all user balances
  app.get('/api/users/balance/all', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const balances = await storage.getAllUsersBalance(user.organizationId);
      res.json(balances);
    } catch (error) {
      console.error("Error fetching all users balance:", error);
      res.status(500).json({ message: "Failed to fetch team balances" });
    }
  });

  // Only admins can update user vacation balance
  app.put('/api/users/:id/balance', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id: targetUserId } = req.params;
      const validatedData = updateUserBalanceSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserBalance(targetUserId, validatedData);
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid balance data", errors: error.errors });
      }
      console.error("Error updating user balance:", error);
      res.status(500).json({ message: "Failed to update balance" });
    }
  });

  // Update own vacation days (all users)
  app.patch('/api/users/me/settings', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const validatedData = updateUserBalanceSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserBalance(authReq.user.id, validatedData);
      res.json({
        message: 'Einstellungen erfolgreich aktualisiert',
        user: updatedUser
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Ungültige Daten", errors: error.errors });
      }
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Fehler beim Aktualisieren der Einstellungen" });
    }
  });

  // Team routes
  app.get('/api/team', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      const teamMembers = await storage.getTeamMembers(user.organizationId);
      res.json(teamMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  // Statistics route
  // Admins can view organization statistics, employees can view their own statistics
  app.get('/api/stats', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      const isAdmin = user.role === 'admin' || user.role === 'tenant_admin';

      // Get requests based on role
      const allRequests = isAdmin
        ? await storage.getVacationRequestsByOrganization(user.organizationId)
        : await storage.getVacationRequestsByUser(userId);

      const pendingRequests = allRequests.filter(r => r.status === "pending");
      const approvedRequests = allRequests.filter(r => r.status === "approved");
      
      // Conflict detection - organization-wide for all users
      const orgRequests = await storage.getVacationRequestsByOrganization(user.organizationId);
      const orgPendingRequests = orgRequests.filter(r => r.status === "pending");
      const conflicts = orgPendingRequests.filter(request => {
        return orgPendingRequests.some(other => 
          other.id !== request.id &&
          other.userId !== request.userId &&
          new Date(other.startDate) <= new Date(request.endDate) &&
          new Date(other.endDate) >= new Date(request.startDate)
        );
      }).length;

      // Team members count - available for all users
      const members = await storage.getTeamMembers(user.organizationId);
      const teamMembers = members.length;

      // Get pending users count for admins
      let pendingUsers = 0;
      if (isAdmin) {
        const pendingUserList = await storage.getPendingUsers(user.organizationId);
        pendingUsers = pendingUserList.length;
      }

      res.json({
        pendingRequests: pendingRequests.length,
        approvedRequests: approvedRequests.length,
        teamMembers: teamMembers,
        conflicts: conflicts,
        pendingUsers: pendingUsers,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Comprehensive Analytics Endpoints
  // Only admins can view analytics
  app.get('/api/analytics/overview', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { startDate, endDate } = req.query;
      const dateRange = startDate && endDate ? { 
        startDate: startDate as string, 
        endDate: endDate as string 
      } : undefined;

      const overview = await storage.getAnalyticsOverview(user.organizationId, dateRange);
      res.json(overview);
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
      res.status(500).json({ message: "Failed to fetch analytics overview" });
    }
  });

  app.get('/api/analytics/team-usage', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { startDate, endDate } = req.query;
      const dateRange = startDate && endDate ? { 
        startDate: startDate as string, 
        endDate: endDate as string 
      } : undefined;

      const teamUsage = await storage.getTeamUsageAnalytics(user.organizationId, dateRange);
      res.json(teamUsage);
    } catch (error) {
      console.error("Error fetching team usage analytics:", error);
      res.status(500).json({ message: "Failed to fetch team usage analytics" });
    }
  });

  app.get('/api/analytics/trends', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { period } = req.query;
      const validPeriods = ['monthly', 'quarterly', 'yearly'];
      const selectedPeriod = validPeriods.includes(period as string) ? period as 'monthly' | 'quarterly' | 'yearly' : 'monthly';

      const trends = await storage.getVacationTrends(user.organizationId, selectedPeriod);
      res.json(trends);
    } catch (error) {
      console.error("Error fetching vacation trends:", error);
      res.status(500).json({ message: "Failed to fetch vacation trends" });
    }
  });

  app.get('/api/analytics/department-comparison', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { startDate, endDate } = req.query;
      const dateRange = startDate && endDate ? { 
        startDate: startDate as string, 
        endDate: endDate as string 
      } : undefined;

      const departmentComparison = await storage.getDepartmentComparison(user.organizationId, dateRange);
      res.json(departmentComparison);
    } catch (error) {
      console.error("Error fetching department comparison:", error);
      res.status(500).json({ message: "Failed to fetch department comparison" });
    }
  });

  app.get('/api/analytics/employee-details/:employeeId', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      const { employeeId } = req.params;
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      // Allow employees to view their own analytics, admins can view all
      if (user.role !== "admin" && userId !== employeeId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Verify employee belongs to same organization
      const targetEmployee = await storage.getUser(employeeId);
      if (!targetEmployee || targetEmployee.organizationId !== user.organizationId) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const { startDate, endDate } = req.query;
      const dateRange = startDate && endDate ? { 
        startDate: startDate as string, 
        endDate: endDate as string 
      } : undefined;

      const employeeAnalytics = await storage.getEmployeeAnalytics(employeeId, dateRange);
      res.json(employeeAnalytics);
    } catch (error) {
      console.error("Error fetching employee analytics:", error);
      res.status(500).json({ message: "Failed to fetch employee analytics" });
    }
  });

  app.get('/api/analytics/utilization', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { startDate, endDate } = req.query;
      const dateRange = startDate && endDate ? { 
        startDate: startDate as string, 
        endDate: endDate as string 
      } : undefined;

      const utilizationMetrics = await storage.getUtilizationMetrics(user.organizationId, dateRange);
      res.json(utilizationMetrics);
    } catch (error) {
      console.error("Error fetching utilization metrics:", error);
      res.status(500).json({ message: "Failed to fetch utilization metrics" });
    }
  });

  app.get('/api/analytics/patterns', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const vacationPatterns = await storage.getVacationPatterns(user.organizationId);
      res.json(vacationPatterns);
    } catch (error) {
      console.error("Error fetching vacation patterns:", error);
      res.status(500).json({ message: "Failed to fetch vacation patterns" });
    }
  });

  app.get('/api/analytics/processing', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { startDate, endDate } = req.query;
      const dateRange = startDate && endDate ? { 
        startDate: startDate as string, 
        endDate: endDate as string 
      } : undefined;

      const processingMetrics = await storage.getProcessingMetrics(user.organizationId, dateRange);
      res.json(processingMetrics);
    } catch (error) {
      console.error("Error fetching processing metrics:", error);
      res.status(500).json({ message: "Failed to fetch processing metrics" });
    }
  });

  // Helper function to convert vacation requests to iCal format
  const generateVacationIcal = (requests: VacationRequestWithUser[], organizationName?: string): string => {
    const events = requests
      .filter(request => request.status === "approved") // Only export approved requests
      .map(request => {
        const startDate = new Date(request.startDate);
        const endDate = new Date(request.endDate);
        // Add one day to end date for all-day events
        endDate.setDate(endDate.getDate() + 1);
        
        const userName = request.user 
          ? `${request.user.firstName || ''} ${request.user.lastName || ''}`.trim()
          : 'Gelöschter Benutzer';
        
        const createdDate = request.createdAt ? new Date(request.createdAt) : new Date();
        const modifiedDate = request.updatedAt ? new Date(request.updatedAt) : new Date();
        
        return {
          uid: `vacation-${request.id}@vacation-planner`,
          title: `${userName} - Urlaub`,
          description: request.reason ? `Grund: ${request.reason}` : 'Urlaubsantrag',
          start: [startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()] as [number, number, number],
          end: [endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate()] as [number, number, number],
          status: 'CONFIRMED' as const,
          busyStatus: 'BUSY' as const,
          organizer: { name: organizationName || 'Vacation Planner', email: 'noreply@vacation-planner.com' },
          attendees: [{
            name: userName,
            email: request.user?.email || 'noreply@vacation-planner.com',
            rsvp: false,
            partstat: 'ACCEPTED' as const,
            role: 'REQ-PARTICIPANT' as const
          }],
          created: [createdDate.getFullYear(), createdDate.getMonth() + 1, createdDate.getDate(), createdDate.getHours(), createdDate.getMinutes()] as [number, number, number, number, number],
          lastModified: [modifiedDate.getFullYear(), modifiedDate.getMonth() + 1, modifiedDate.getDate(), modifiedDate.getHours(), modifiedDate.getMinutes()] as [number, number, number, number, number],
        };
      });

    const { error, value } = createEvents(events);
    if (error) {
      console.error('Error creating iCal:', error);
      throw new Error('Failed to generate iCal data');
    }
    
    return value || '';
  };

  // Export a single vacation request as iCal
  app.get('/api/vacation-requests/:id/export/ical', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const requestId = req.params.id;
      
      const request = await storage.getVacationRequest(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Vacation request not found" });
      }
      
      // Check if user owns this request
      if (request.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Only export approved requests
      if (request.status !== 'approved') {
        return res.status(400).json({ message: "Only approved requests can be exported" });
      }
      
      const user = await storage.getUser(userId);
      const organizationName = user?.organization?.name;
      
      // Generate iCal for single request
      const icalData = generateVacationIcal([request], organizationName);
      
      const fileName = `urlaub-${request.startDate}-${request.endDate}.ics`
        .replace(/\s+/g, '-')
        .toLowerCase();
      
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(icalData);
    } catch (error) {
      console.error("Error exporting vacation request:", error);
      res.status(500).json({ message: "Failed to export vacation request" });
    }
  });

  // Export user's vacation requests as iCal (all requests)
  app.get('/api/vacation-requests/export/ical', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      const requests = await storage.getVacationRequestsByUser(userId);
      
      const organizationName = user.organization?.name;
      const icalData = generateVacationIcal(requests, organizationName);
      
      const fileName = `urlaub-${user.firstName || 'user'}-${user.lastName || ''}.ics`.replace(/\s+/g, '-').toLowerCase();
      
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(icalData);
    } catch (error) {
      console.error("Error exporting user vacation data:", error);
      res.status(500).json({ message: "Failed to export vacation data" });
    }
  });

  // Export user's vacation requests as CSV
  app.get('/api/vacation-requests/export/csv', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      const requests = await storage.getVacationRequestsByUser(userId);
      
      // Generate CSV with German headers and proper formatting
      const csvHeader = "Startdatum;Enddatum;Arbeitstage;Status;Grund;Antragsdatum;Genehmigt von;Genehmigungsdatum\n";
      
      const csvRows = await Promise.all(requests.map(async (request) => {
        // Calculate business days (excluding weekends and holidays)
        const holidayDates = await storage.getHolidayDates(request.startDate, request.endDate);
        const businessDays = calculateBusinessDays(request.startDate, request.endDate, holidayDates);
        
        // Get reviewer name if approved or rejected
        let reviewerName = '';
        if (request.reviewedBy) {
          const reviewer = await storage.getUser(request.reviewedBy);
          if (reviewer) {
            reviewerName = `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim() || reviewer.email || '';
          }
        }
        
        // Format status in German
        const statusMap: Record<string, string> = {
          'pending': 'Wartend',
          'approved': 'Genehmigt',
          'rejected': 'Abgelehnt'
        };
        const statusGerman = statusMap[request.status] || request.status;
        
        // Format dates
        const reviewedDate = request.reviewedAt 
          ? new Date(request.reviewedAt).toLocaleDateString('de-DE')
          : '';
        const createdDate = request.createdAt 
          ? new Date(request.createdAt).toLocaleDateString('de-DE')
          : '';
        
        // Escape CSV fields (wrap in quotes if they contain semicolons or quotes)
        const escapeCSV = (field: string) => {
          if (field.includes(';') || field.includes('"') || field.includes('\n')) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        };
        
        return [
          request.startDate,
          request.endDate,
          businessDays.toString(),
          statusGerman,
          escapeCSV(request.reason || ''),
          createdDate,
          escapeCSV(reviewerName),
          reviewedDate
        ].join(';');
      }));
      
      const csvData = csvHeader + csvRows.join('\n');
      
      const fileName = `meine-urlaube-${user.firstName || 'user'}-${user.lastName || ''}.csv`
        .replace(/\s+/g, '-')
        .toLowerCase();
      
      // Use UTF-8 BOM for proper Excel compatibility with German characters
      const BOM = '\uFEFF';
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(BOM + csvData);
    } catch (error) {
      console.error("Error exporting user vacation CSV:", error);
      res.status(500).json({ message: "Failed to export vacation data" });
    }
  });

  // Export team's vacation requests as iCal (admin only)
  app.get('/api/vacation-requests/export/ical/team', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const requests = await storage.getVacationRequestsByOrganization(user.organizationId);
      
      const organizationName = user.organization?.name;
      const icalData = generateVacationIcal(requests, organizationName);
      
      const fileName = `team-urlaub-${organizationName || 'organization'}.ics`.replace(/\s+/g, '-').toLowerCase();
      
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(icalData);
    } catch (error) {
      console.error("Error exporting team vacation data:", error);
      res.status(500).json({ message: "Failed to export team vacation data" });
    }
  });

  // Export route (CSV)
  app.get('/api/export', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const requests = await storage.getVacationRequestsByOrganization(user.organizationId);
      
      // Generate CSV
      const csvHeader = "Name,Start Date,End Date,Status,Reason,Created At\n";
      const csvData = requests.map(request => {
        const name = request.user 
          ? `${request.user.firstName || ''} ${request.user.lastName || ''}`.trim()
          : 'Gelöschter Benutzer';
        return `"${name}","${request.startDate}","${request.endDate}","${request.status}","${request.reason || ''}","${request.createdAt}"`;
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="vacation-requests.csv"');
      res.send(csvHeader + csvData);
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Notification API routes
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      
      const { limit = '20', offset = '0' } = req.query;
      const notifications = await storage.getNotificationsByUser(
        userId, 
        parseInt(limit as string), 
        parseInt(offset as string)
      );
      
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/count', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      
      const unreadCount = await storage.getUnreadNotificationCount(userId);
      res.json({ unreadCount });
    } catch (error) {
      console.error("Error fetching notification count:", error);
      res.status(500).json({ message: "Failed to fetch notification count" });
    }
  });

  app.put('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const { id } = req.params;
      
      // Verify the notification belongs to the user
      const notification = await storage.getNotification(id);
      if (!notification || notification.userId !== userId) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(id);
      res.json(updatedNotification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  app.get('/api/user/notification-preferences', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      
      const preferences = await storage.getUserNotificationPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "Failed to fetch notification preferences" });
    }
  });

  app.put('/api/user/notification-preferences', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      
      const validatedData = updateNotificationPreferencesSchema.parse(req.body);
      const updatedUser = await storage.updateUserNotificationPreferences(userId, validatedData);
      
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid preferences data", errors: error.errors });
      }
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  app.post('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertNotificationSchema.parse(req.body);
      
      // Use notification service to create and send notification
      const notificationService = getNotificationService();
      const notification = await notificationService.createAndSendNotification({
        ...validatedData,
        userId: validatedData.userId,
        organizationId: user.organizationId
      });
      
      res.json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid notification data", errors: error.errors });
      }
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.delete('/api/notifications/:id', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const { id } = req.params;
      
      // Verify the notification belongs to the user
      const notification = await storage.getNotification(id);
      if (!notification || notification.userId !== userId) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      await storage.deleteNotification(id);
      res.json({ message: "Notification deleted successfully" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Theme preference endpoints
  app.get('/api/user/theme-preference', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ themePreference: user.themePreference || 'modern' });
    } catch (error) {
      console.error("Error fetching theme preference:", error);
      res.status(500).json({ message: "Failed to fetch theme preference" });
    }
  });

  app.put('/api/user/theme-preference', isAuthenticated, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      
      const { themePreference } = req.body;
      
      if (!['modern', 'elegant', 'vibrant'].includes(themePreference)) {
        return res.status(400).json({ message: "Invalid theme preference" });
      }
      
      const updatedUser = await storage.updateUserThemePreference(userId, themePreference);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating theme preference:", error);
      res.status(500).json({ message: "Failed to update theme preference" });
    }
  });

  // Object storage endpoints
  app.post('/api/object-storage/presigned-url', isAuthenticated, isOrgAdmin, async (req, res) => {
    try {
      const { fileName, contentType, folder } = req.body;

      if (!fileName || !contentType) {
        return res.status(400).json({ error: "fileName and contentType are required" });
      }

      const { fileStorageService } = await import('./fileStorage');
      const { uploadUrl, objectUrl } = await fileStorageService.getUploadUrl(fileName, contentType);

      res.json({
        uploadUrl,
        objectUrl
      });
    } catch (error: any) {
      console.error("Error generating presigned URL:", error);
      res.status(500).json({ error: error.message || "Failed to generate presigned URL" });
    }
  });

  // Handle file uploads for local filesystem (PUT to /uploads/logos/filename)
  app.put('/uploads/logos/:filename', async (req, res) => {
    try {
      const { filename } = req.params;
      const fs = await import('fs/promises');
      const path = await import('path');

      // Ensure uploads/logos directory exists
      const uploadsDir = path.join(process.cwd(), 'uploads', 'logos');
      await fs.mkdir(uploadsDir, { recursive: true });

      // Write file
      const filePath = path.join(uploadsDir, filename);
      const chunks: Buffer[] = [];

      req.on('data', (chunk) => {
        chunks.push(chunk);
      });

      req.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          await fs.writeFile(filePath, buffer);
          res.status(200).send('OK');
        } catch (error: any) {
          console.error("Error writing file:", error);
          res.status(500).json({ error: "Failed to write file" });
        }
      });

      req.on('error', (error) => {
        console.error("Error uploading file:", error);
        res.status(500).json({ error: "Upload failed" });
      });
    } catch (error: any) {
      console.error("Error handling file upload:", error);
      res.status(500).json({ error: error.message || "Failed to handle upload" });
    }
  });

  // Set ACL policy for uploaded organization logo
  app.post('/api/object-storage/set-logo-acl', isAuthenticated, isOrgAdmin, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const organizationId = authReq.user.organizationId;
      const { uploadUrl } = req.body;
      
      if (!uploadUrl) {
        return res.status(400).json({ error: "uploadUrl is required" });
      }

      if (!organizationId) {
        return res.status(400).json({ error: "User must belong to an organization" });
      }

      const { fileStorageService } = await import('./fileStorage');
      
      // Set file policy (works for both Object Storage and local filesystem)
      const objectPath = await fileStorageService.setFilePolicy(
        uploadUrl,
        organizationId,
        'public'
      );
      
      res.json({
        objectPath,
        success: true
      });
    } catch (error: any) {
      console.error("Error setting logo ACL:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Uploaded object not found" });
      }
      res.status(500).json({ error: error.message || "Failed to set logo ACL" });
    }
  });

  // Holiday routes
  app.get('/api/holidays', async (req, res) => {
    try {
      const { startYear = '2025', endYear = '2030' } = req.query;
      const holidays = await storage.getHolidays(
        parseInt(startYear as string),
        parseInt(endYear as string)
      );
      res.json(holidays);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      res.status(500).json({ message: "Failed to fetch holidays" });
    }
  });

  // Calculate business days between two dates (for frontend preview)
  app.post('/api/calculate-business-days', async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          message: 'Start date and end date are required',
          businessDays: 0 
        });
      }
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Validate date range
      if (start > end) {
        return res.json({ 
          businessDays: 0,
          error: 'Das Enddatum muss nach dem Startdatum liegen.'
        });
      }
      
      // Get holidays for the date range
      const holidayDates = await storage.getHolidayDates(
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0]
      );
      
      const businessDays = calculateBusinessDays(start, end, holidayDates);
      
      res.json({ 
        businessDays,
        startDate,
        endDate
      });
    } catch (error) {
      console.error('Error calculating business days:', error);
      res.status(500).json({ 
        message: 'Failed to calculate business days',
        businessDays: 0 
      });
    }
  });

  // Initialize notification service with the server
  const notificationService = createNotificationService(server);
  
  return server;
}
