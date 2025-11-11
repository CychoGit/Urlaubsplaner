import {
  users,
  organizations,
  vacationRequests,
  notifications,
  holidays,
  type User,
  type UpsertUser,
  type Organization,
  type InsertOrganization,
  type VacationRequest,
  type InsertVacationRequest,
  type UpdateVacationRequestStatus,
  type UpdateUserBalance,
  type VacationBalance,
  type UserWithOrganization,
  type VacationRequestWithUser,
  type CoverageSuggestion,
  type ConflictAnalysis,
  type TeamCoverageAnalysis,
  type Notification,
  type InsertNotification,
  type UpdateNotificationStatus,
  type NotificationPreferences,
  type UpdateNotificationPreferences,
  type Holiday,
  type InsertHoliday,
  type AnalyticsOverview,
  type TeamUsageAnalytics,
  type VacationTrends,
  type DepartmentComparison,
  type EmployeeAnalytics,
  type UtilizationMetrics,
  type VacationPatterns,
  type ProcessingMetrics,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, sql, isNull } from "drizzle-orm";
import { calculateBusinessDays } from "./holidays";

export interface IStorage {
  // User operations (enhanced for email/password auth)
  getUser(id: string): Promise<UserWithOrganization | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<UpsertUser, 'id'> & { password: string }): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getPendingUsers(organizationId: string): Promise<User[]>;
  approveUser(userId: string, approverId: string, role?: 'admin' | 'employee'): Promise<User>;
  updateUserRole(userId: string, role: 'tenant_admin' | 'admin' | 'employee'): Promise<User>;
  updateUserStatus(userId: string, status: 'pending' | 'approved' | 'suspended'): Promise<User>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<User>;
  updateUserProfile(userId: string, profile: { email?: string; firstName?: string; lastName?: string }): Promise<User>;
  updateUserVacationTracking(userId: string, enabled: boolean): Promise<User>;
  disableVacationTrackingForAllUsers(organizationId: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  
  // Organization operations
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationByDomain(domain: string): Promise<Organization | undefined>;
  getAllOrganizations(): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganizationBranding(id: string, customName: string | null, logoUrl: string | null): Promise<Organization>;
  updateOrganizationSettings(id: string, settings: { defaultVacationDays?: number; customName?: string | null; logoUrl?: string | null; vacationTrackingEnabled?: boolean }): Promise<Organization>;
  deleteOrganization(id: string): Promise<void>;
  
  // Vacation request operations
  createVacationRequest(request: InsertVacationRequest & { userId: string; organizationId: string }): Promise<VacationRequest>;
  getVacationRequest(id: string): Promise<VacationRequestWithUser | undefined>;
  getVacationRequestsByOrganization(organizationId: string): Promise<VacationRequestWithUser[]>;
  getVacationRequestsByUser(userId: string): Promise<VacationRequestWithUser[]>;
  getPendingVacationRequests(organizationId: string): Promise<VacationRequestWithUser[]>;
  updateVacationRequestStatus(id: string, status: UpdateVacationRequestStatus, reviewerId: string): Promise<VacationRequest>;
  getVacationRequestsInDateRange(organizationId: string, startDate: string, endDate: string): Promise<VacationRequestWithUser[]>;
  deleteVacationRequest(id: string): Promise<void>;
  
  // Team operations
  getTeamMembers(organizationId: string): Promise<User[]>;
  
  // Balance operations
  getUserBalance(userId: string): Promise<VacationBalance>;
  getAllUsersBalance(organizationId: string): Promise<(User & VacationBalance)[]>;
  updateUserBalance(userId: string, balance: UpdateUserBalance): Promise<User>;
  calculateUsedDays(userId: string): Promise<number>;
  updateUsedDays(userId: string, usedDays: number): Promise<User>;

  // Coverage analysis operations
  getCoverageAnalysisForRequest(requestId: string): Promise<ConflictAnalysis | undefined>;
  generateCoverageSuggestions(organizationId: string, startDate: string, endDate: string, requiredSkills?: string[]): Promise<CoverageSuggestion[]>;
  getTeamCoverageAnalysis(organizationId: string, startDate: string, endDate: string): Promise<TeamCoverageAnalysis>;
  calculateCoverageScore(userId: string, requiredSkills: string[], conflictPeriod: { start: string; end: string }): Promise<number>;
  getAvailableUsersInDateRange(organizationId: string, startDate: string, endDate: string): Promise<User[]>;

  // Notification operations
  createNotification(notification: InsertNotification & { userId: string; organizationId: string }): Promise<Notification>;
  getNotification(id: string): Promise<Notification | undefined>;
  getNotificationsByUser(userId: string, limit?: number, offset?: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationAsRead(id: string): Promise<Notification>;
  markNotificationAsDelivered(id: string, channel: "browser" | "email"): Promise<Notification>;
  deleteNotification(id: string): Promise<void>;
  deleteExpiredNotifications(): Promise<number>;

  // User notification preferences operations
  getUserNotificationPreferences(userId: string): Promise<NotificationPreferences>;
  updateUserNotificationPreferences(userId: string, preferences: UpdateNotificationPreferences): Promise<User>;

  // User theme preferences operations  
  updateUserThemePreference(userId: string, themePreference: string): Promise<User>;

  // Comprehensive Analytics operations
  getAnalyticsOverview(organizationId: string, dateRange?: { startDate: string; endDate: string }): Promise<AnalyticsOverview>;
  getTeamUsageAnalytics(organizationId: string, dateRange?: { startDate: string; endDate: string }): Promise<TeamUsageAnalytics>;
  getVacationTrends(organizationId: string, period: 'monthly' | 'quarterly' | 'yearly'): Promise<VacationTrends>;
  getDepartmentComparison(organizationId: string, dateRange?: { startDate: string; endDate: string }): Promise<DepartmentComparison>;
  getEmployeeAnalytics(userId: string, dateRange?: { startDate: string; endDate: string }): Promise<EmployeeAnalytics>;
  getUtilizationMetrics(organizationId: string, dateRange?: { startDate: string; endDate: string }): Promise<UtilizationMetrics>;
  getVacationPatterns(organizationId: string): Promise<VacationPatterns>;
  getProcessingMetrics(organizationId: string, dateRange?: { startDate: string; endDate: string }): Promise<ProcessingMetrics>;

  // Holiday operations
  createHoliday(holiday: Omit<InsertHoliday, 'id' | 'createdAt'>): Promise<Holiday>;
  getHolidays(startYear: number, endYear: number): Promise<Holiday[]>;
  getHolidayDates(startDate: string, endDate: string): Promise<string[]>;
  deleteAllHolidays(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<UserWithOrganization | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .where(and(eq(users.id, id), isNull(users.deletedAt)));
    
    if (!user) return undefined;
    
    return {
      ...user.users,
      organization: user.organizations || undefined,
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'> & { password: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getPendingUsers(organizationId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(
        eq(users.organizationId, organizationId),
        eq(users.status, 'pending'),
        isNull(users.deletedAt)
      ))
      .orderBy(asc(users.createdAt));
  }

  async approveUser(userId: string, approverId: string, role?: 'admin' | 'employee'): Promise<User> {
    const updateData: any = {
      status: 'approved',
      approvedBy: approverId,
      approvedAt: new Date(),
      updatedAt: new Date(),
    };

    if (role) {
      updateData.role = role;
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    
    return user;
  }

  async updateUserRole(userId: string, role: 'tenant_admin' | 'admin' | 'employee'): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    return user;
  }

  async updateUserStatus(userId: string, status: 'pending' | 'approved' | 'suspended'): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    return user;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    return user;
  }

  async updateUserProfile(userId: string, profile: { email?: string; firstName?: string; lastName?: string }): Promise<User> {
    const updateData: any = { updatedAt: new Date() };
    
    if (profile.email !== undefined) updateData.email = profile.email;
    if (profile.firstName !== undefined) updateData.firstName = profile.firstName;
    if (profile.lastName !== undefined) updateData.lastName = profile.lastName;

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    
    return user;
  }

  async updateUserVacationTracking(userId: string, enabled: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        vacationTrackingEnabled: enabled,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return user;
  }

  async disableVacationTrackingForAllUsers(organizationId: string): Promise<void> {
    await db
      .update(users)
      .set({
        vacationTrackingEnabled: false,
        updatedAt: new Date()
      })
      .where(eq(users.organizationId, organizationId));
  }

  async deleteUser(userId: string): Promise<void> {
    // Soft delete implementation with dependency cleanup
    // This preserves historical data while ensuring data consistency
    
    // 1. Delete user's notifications (ephemeral data can be removed)
    await db
      .delete(notifications)
      .where(eq(notifications.userId, userId));
    
    // 2. Clear userId from vacation requests (preserves analytics data)
    await db
      .update(vacationRequests)
      .set({ userId: null })
      .where(eq(vacationRequests.userId, userId));
    
    // 3. Clear approvedBy references (so UI doesn't show deleted user as approver)
    await db
      .update(users)
      .set({ approvedBy: null })
      .where(eq(users.approvedBy, userId));
    
    // 4. Mark user as deleted (soft delete)
    await db
      .update(users)
      .set({ 
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      // SECURITY: Use ID (OIDC subject) as conflict target to prevent account takeover
      // The ID is the immutable OIDC subject - only this user can update their own record
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            // Only update profile fields, never the ID itself
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            organizationId: userData.organizationId,
            role: userData.role,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error: any) {
      // Handle email uniqueness constraint violations
      if (error.code === '23505' && error.constraint === 'users_email_unique') {
        // Check if a different user already has this email
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, userData.email!))
          .limit(1);
        
        if (existingUser.length > 0 && existingUser[0].id !== userData.id) {
          // Create a specific error type for email conflicts that can be handled gracefully
          const emailConflictError = new Error(`Email ${userData.email} is already registered to a different user`);
          emailConflictError.name = 'EmailConflictError';
          throw emailConflictError;
        }
      }
      throw error;
    }
  }

  // Organization operations
  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async getOrganizationByDomain(domain: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.domain, domain));
    return org;
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations);
  }

  async createOrganization(orgData: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values(orgData).returning();
    return org;
  }

  async updateOrganizationBranding(id: string, customName: string | null, logoUrl: string | null): Promise<Organization> {
    const [org] = await db
      .update(organizations)
      .set({ 
        customName,
        logoUrl,
        updatedAt: new Date()
      })
      .where(eq(organizations.id, id))
      .returning();
    
    if (!org) {
      throw new Error("Organization not found");
    }
    
    return org;
  }

  async updateOrganizationSettings(id: string, settings: { defaultVacationDays?: number; customName?: string | null; logoUrl?: string | null; vacationTrackingEnabled?: boolean }): Promise<Organization> {
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (settings.defaultVacationDays !== undefined) {
      updateData.defaultVacationDays = settings.defaultVacationDays;
    }
    if (settings.customName !== undefined) {
      updateData.customName = settings.customName;
    }
    if (settings.logoUrl !== undefined) {
      updateData.logoUrl = settings.logoUrl;
    }
    if (settings.vacationTrackingEnabled !== undefined) {
      updateData.vacationTrackingEnabled = settings.vacationTrackingEnabled;
    }
    
    const [org] = await db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, id))
      .returning();
    
    if (!org) {
      throw new Error("Organization not found");
    }
    
    return org;
  }

  async deleteOrganization(id: string): Promise<void> {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new Error("Organization not found");
    }

    // Prevent deletion of system organization
    const org = await this.getOrganization(id);
    if (!org) {
      throw new Error("Organization not found");
    }
    if (org.domain === 'system.local') {
      throw new Error("Cannot delete system organization");
    }

    // CASCADE DELETE: Delete all related data in a transaction
    // This ensures either all deletions succeed or none (atomic operation)
    await db.transaction(async (tx) => {
      // The users table contains all balance, preference, and theme data as columns
      // No separate tables exist for these
      
      // 1. Delete all notifications for this organization
      await tx.delete(notifications)
        .where(eq(notifications.organizationId, id));

      // 2. Delete all vacation requests for this organization
      await tx.delete(vacationRequests)
        .where(eq(vacationRequests.organizationId, id));

      // 3. Delete all users in this organization
      // This also removes all balance data (annualAllowance, usedDays),
      // preferences (notificationPreferences, themePreference),
      // and team data (department, skills, workload) stored in user columns
      // Sessions will be cascade deleted by DB foreign key constraint
      await tx.delete(users)
        .where(eq(users.organizationId, id));

      // 4. Finally, delete the organization itself
      await tx.delete(organizations)
        .where(eq(organizations.id, id));
    });
  }

  // Vacation request operations
  async createVacationRequest(requestData: InsertVacationRequest & { userId: string; organizationId: string }): Promise<VacationRequest> {
    // Calculate actual business days (excluding weekends and holidays)
    const holidayDates = await this.getHolidayDates(requestData.startDate, requestData.endDate);
    const businessDays = calculateBusinessDays(requestData.startDate, requestData.endDate, holidayDates);
    
    // Override daysRequested with calculated business days
    const dataWithCorrectDays = {
      ...requestData,
      daysRequested: businessDays,
    };
    
    const [request] = await db.insert(vacationRequests).values(dataWithCorrectDays).returning();
    return request;
  }

  async getVacationRequest(id: string): Promise<VacationRequestWithUser | undefined> {
    const [result] = await db
      .select()
      .from(vacationRequests)
      .leftJoin(users, and(eq(vacationRequests.userId, users.id), isNull(users.deletedAt)))
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .where(eq(vacationRequests.id, id));

    if (!result) return undefined;

    return {
      ...result.vacation_requests,
      user: result.users || null,
    };
  }

  async getVacationRequestsByOrganization(organizationId: string): Promise<VacationRequestWithUser[]> {
    const results = await db
      .select()
      .from(vacationRequests)
      .leftJoin(users, and(eq(vacationRequests.userId, users.id), isNull(users.deletedAt)))
      .where(eq(vacationRequests.organizationId, organizationId))
      .orderBy(desc(vacationRequests.createdAt));

    return results.map(result => ({
      ...result.vacation_requests,
      user: result.users || null,
    }));
  }

  async getVacationRequestsByUser(userId: string): Promise<VacationRequestWithUser[]> {
    const results = await db
      .select()
      .from(vacationRequests)
      .leftJoin(users, and(eq(vacationRequests.userId, users.id), isNull(users.deletedAt)))
      .where(eq(vacationRequests.userId, userId))
      .orderBy(desc(vacationRequests.createdAt));

    return results.map(result => ({
      ...result.vacation_requests,
      user: result.users || null,
    }));
  }

  async getPendingVacationRequests(organizationId: string): Promise<VacationRequestWithUser[]> {
    const results = await db
      .select()
      .from(vacationRequests)
      .leftJoin(users, and(eq(vacationRequests.userId, users.id), isNull(users.deletedAt)))
      .where(
        and(
          eq(vacationRequests.organizationId, organizationId),
          eq(vacationRequests.status, "pending")
        )
      )
      .orderBy(asc(vacationRequests.startDate));

    return results.map(result => ({
      ...result.vacation_requests,
      user: result.users || null,
    }));
  }

  async updateVacationRequestStatus(id: string, statusData: UpdateVacationRequestStatus, reviewerId: string): Promise<VacationRequest> {
    const [request] = await db
      .update(vacationRequests)
      .set({
        status: statusData.status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(vacationRequests.id, id))
      .returning();
    return request;
  }

  async deleteVacationRequest(id: string): Promise<void> {
    await db
      .delete(vacationRequests)
      .where(eq(vacationRequests.id, id));
  }

  async getVacationRequestsInDateRange(organizationId: string, startDate: string, endDate: string): Promise<VacationRequestWithUser[]> {
    const results = await db
      .select()
      .from(vacationRequests)
      .leftJoin(users, and(eq(vacationRequests.userId, users.id), isNull(users.deletedAt)))
      .where(
        and(
          eq(vacationRequests.organizationId, organizationId),
          gte(vacationRequests.endDate, startDate),
          lte(vacationRequests.startDate, endDate)
        )
      )
      .orderBy(asc(vacationRequests.startDate));

    return results.map(result => ({
      ...result.vacation_requests,
      user: result.users || null,
    }));
  }

  async getTeamMembers(organizationId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(
        eq(users.organizationId, organizationId),
        isNull(users.deletedAt)
      ))
      .orderBy(asc(users.firstName));
  }

  // Balance operations
  async getUserBalance(userId: string): Promise<VacationBalance> {
    const [result] = await db
      .select({
        customVacationDays: users.customVacationDays,
        usedDays: users.usedDays,
        organizationId: users.organizationId,
        defaultVacationDays: organizations.defaultVacationDays,
      })
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .where(eq(users.id, userId));
    
    if (!result) {
      throw new Error('User not found');
    }

    const totalDays = result.customVacationDays ?? result.defaultVacationDays ?? 30;

    return {
      totalDays,
      usedDays: result.usedDays || 0,
      remainingDays: totalDays - (result.usedDays || 0),
    };
  }

  async getAllUsersBalance(organizationId: string): Promise<(User & VacationBalance)[]> {
    const results = await db
      .select({
        user: users,
        defaultVacationDays: organizations.defaultVacationDays,
      })
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .where(and(
        eq(users.organizationId, organizationId),
        isNull(users.deletedAt)
      ))
      .orderBy(asc(users.firstName));

    return results.map(({ user, defaultVacationDays }) => {
      const totalDays = user.customVacationDays ?? defaultVacationDays ?? 30;
      return {
        ...user,
        totalDays,
        remainingDays: totalDays - (user.usedDays || 0),
      };
    });
  }

  async updateUserBalance(userId: string, balanceData: UpdateUserBalance): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        customVacationDays: balanceData.customVacationDays,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async calculateUsedDays(userId: string): Promise<number> {
    const approvedRequests = await db
      .select({
        startDate: vacationRequests.startDate,
        endDate: vacationRequests.endDate,
      })
      .from(vacationRequests)
      .where(
        and(
          eq(vacationRequests.userId, userId),
          eq(vacationRequests.status, "approved")
        )
      );

    // Calculate total business days from approved requests (excluding weekends and holidays)
    let totalDays = 0;
    for (const request of approvedRequests) {
      // Get holidays within the vacation period
      const holidayDates = await this.getHolidayDates(request.startDate, request.endDate);
      
      // Calculate business days (excluding weekends and holidays)
      const businessDays = calculateBusinessDays(request.startDate, request.endDate, holidayDates);
      totalDays += businessDays;
    }
    
    return totalDays;
  }

  async updateUsedDays(userId: string, usedDays: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        usedDays: usedDays,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Coverage analysis operations
  async getCoverageAnalysisForRequest(requestId: string): Promise<ConflictAnalysis | undefined> {
    const request = await this.getVacationRequest(requestId);
    if (!request || !request.user || !request.user.organizationId) return undefined;

    const conflicts = await this.getVacationRequestsInDateRange(
      request.user.organizationId,
      request.startDate,
      request.endDate
    );

    const conflictingRequests = conflicts.filter(
      r => r.id !== requestId && r.status === 'approved' && r.userId !== request.userId
    );

    if (conflictingRequests.length === 0) {
      return undefined;
    }

    // Calculate conflict severity and metrics
    const conflictDays = this.calculateDateRangeOverlap(
      request.startDate,
      request.endDate,
      conflictingRequests
    );

    const affectedUsers = conflictingRequests.map(r => r.userId);
    const departmentsAffected = [...new Set(conflictingRequests.map(r => r.user.department).filter(Boolean))];
    const criticalRolesAffected = conflictingRequests
      .filter(r => r.user.role === 'admin')
      .map(r => r.user.jobTitle || 'Admin')
      .filter(Boolean);

    // Calculate coverage gap
    const totalTeamSize = await this.getTeamMembers(request.user.organizationId);
    const coverageGap = Math.min(100, (conflictingRequests.length / totalTeamSize.length) * 100);

    // Generate coverage suggestions
    const suggestions = await this.generateCoverageSuggestions(
      request.user.organizationId,
      request.startDate,
      request.endDate,
      request.coverageRequired || []
    );

    const severity = this.calculateConflictSeverity(conflictingRequests.length, coverageGap, criticalRolesAffected.length);

    return {
      conflictId: requestId,
      severity,
      affectedUsers,
      conflictDays,
      coverageGap,
      impactMetrics: {
        totalAffectedDays: conflictDays,
        departmentsAffected,
        criticalRolesAffected,
      },
      suggestions,
    };
  }

  async generateCoverageSuggestions(
    organizationId: string,
    startDate: string,
    endDate: string,
    requiredSkills: string[] = []
  ): Promise<CoverageSuggestion[]> {
    const availableUsers = await this.getAvailableUsersInDateRange(organizationId, startDate, endDate);
    
    const suggestions = await Promise.all(
      availableUsers.map(async (user) => {
        const score = await this.calculateCoverageScore(user.id, requiredSkills, { start: startDate, end: endDate });
        const skillMatch = this.calculateSkillMatch(user.skills || [], requiredSkills);
        const availability = this.determineAvailability(user);
        const workloadImpact = user.currentWorkload || 50;

        return {
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`.trim() || user.email || 'Unknown User',
          score,
          reason: this.generateCoverageReason(user, skillMatch, availability, workloadImpact),
          availability,
          skillMatch,
          workloadImpact,
        };
      })
    );

    // Sort by score (highest first) and return top suggestions
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Return top 10 suggestions
  }

  async getTeamCoverageAnalysis(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<TeamCoverageAnalysis> {
    const teamMembers = await this.getTeamMembers(organizationId);
    const vacationRequests = await this.getVacationRequestsInDateRange(organizationId, startDate, endDate);
    
    const approvedVacations = vacationRequests.filter(r => r.status === 'approved');
    
    // Generate daily coverage analysis
    const dailyCoverage = this.generateDailyCoverageReport(
      teamMembers,
      approvedVacations,
      startDate,
      endDate
    );

    // Calculate overall coverage percentage
    const overallCoverage = dailyCoverage.reduce((sum, day) => sum + day.coveragePercentage, 0) / dailyCoverage.length;

    // Generate recommendations
    const recommendations = this.generateCoverageRecommendations(dailyCoverage, teamMembers);

    return {
      dateRange: { startDate, endDate },
      overallCoverage: Math.round(overallCoverage),
      dailyCoverage,
      recommendations,
    };
  }

  async calculateCoverageScore(
    userId: string,
    requiredSkills: string[],
    conflictPeriod: { start: string; end: string }
  ): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) return 0;

    let score = 50; // Base score

    // Skill compatibility (40% of score)
    const skillMatch = this.calculateSkillMatch(user.skills || [], requiredSkills);
    score += (skillMatch * 0.4);

    // Workload impact (20% of score) - lower workload = higher score
    const workloadScore = 100 - (user.currentWorkload || 50);
    score += (workloadScore * 0.2);

    // Availability (25% of score)
    const availabilityScore = user.isAvailableForCoverage === 'true' ? 25 : 
                             user.isAvailableForCoverage === 'limited' ? 15 : 0;
    score += availabilityScore;

    // Role compatibility (15% of score)
    const roleScore = user.role === 'admin' ? 15 : 10; // Admins get slight boost
    score += roleScore;

    return Math.min(100, Math.max(0, score));
  }

  async getAvailableUsersInDateRange(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<User[]> {
    const teamMembers = await this.getTeamMembers(organizationId);
    const conflictingVacations = await this.getVacationRequestsInDateRange(organizationId, startDate, endDate);
    
    const usersOnVacation = new Set(
      conflictingVacations
        .filter(r => r.status === 'approved')
        .map(r => r.userId)
    );

    return teamMembers.filter(user => !usersOnVacation.has(user.id));
  }

  // Helper methods for coverage analysis
  private calculateDateRangeOverlap(startDate: string, endDate: string, requests: VacationRequestWithUser[]): number {
    const requestStart = new Date(startDate);
    const requestEnd = new Date(endDate);
    let totalOverlapDays = 0;

    requests.forEach(request => {
      const conflictStart = new Date(request.startDate);
      const conflictEnd = new Date(request.endDate);
      
      const overlapStart = new Date(Math.max(requestStart.getTime(), conflictStart.getTime()));
      const overlapEnd = new Date(Math.min(requestEnd.getTime(), conflictEnd.getTime()));
      
      if (overlapStart <= overlapEnd) {
        const diffTime = overlapEnd.getTime() - overlapStart.getTime();
        totalOverlapDays += Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }
    });

    return totalOverlapDays;
  }

  private calculateConflictSeverity(
    conflictCount: number,
    coverageGap: number,
    criticalRolesCount: number
  ): "low" | "medium" | "high" | "critical" {
    if (criticalRolesCount > 0 || coverageGap > 75) return "critical";
    if (conflictCount > 2 || coverageGap > 50) return "high";
    if (conflictCount > 1 || coverageGap > 25) return "medium";
    return "low";
  }

  private calculateSkillMatch(userSkills: string[], requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 75; // Default match if no specific skills required
    
    const matchedSkills = userSkills.filter(skill => 
      requiredSkills.some(required => 
        skill.toLowerCase().includes(required.toLowerCase()) ||
        required.toLowerCase().includes(skill.toLowerCase())
      )
    );

    return (matchedSkills.length / requiredSkills.length) * 100;
  }

  private determineAvailability(user: User): "available" | "limited" | "unavailable" {
    if (user.isAvailableForCoverage === 'false') return "unavailable";
    if (user.isAvailableForCoverage === 'limited') return "limited";
    if ((user.currentWorkload || 50) > 85) return "limited";
    return "available";
  }

  private generateCoverageReason(
    user: User,
    skillMatch: number,
    availability: string,
    workloadImpact: number
  ): string {
    const reasons = [];
    
    if (skillMatch > 80) reasons.push("Excellent skill match");
    else if (skillMatch > 60) reasons.push("Good skill compatibility");
    else if (skillMatch > 40) reasons.push("Partial skill match");
    
    if (availability === "available") reasons.push("Fully available");
    else if (availability === "limited") reasons.push("Limited availability");
    
    if (workloadImpact < 50) reasons.push("Low current workload");
    else if (workloadImpact > 80) reasons.push("High workload impact");
    
    if (user.department) reasons.push(`${user.department} department`);
    
    return reasons.length > 0 ? reasons.join(", ") : "Available for coverage";
  }

  private generateDailyCoverageReport(
    teamMembers: User[],
    approvedVacations: VacationRequestWithUser[],
    startDate: string,
    endDate: string
  ): Array<{
    date: string;
    coveragePercentage: number;
    availableUsers: number;
    onVacationUsers: number;
    gaps: string[];
  }> {
    const report = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      const vacationsOnDate = approvedVacations.filter(v =>
        dateStr >= v.startDate && dateStr <= v.endDate
      );
      
      const onVacationUsers = vacationsOnDate.length;
      const availableUsers = teamMembers.length - onVacationUsers;
      const coveragePercentage = (availableUsers / teamMembers.length) * 100;
      
      // Identify skill/department gaps
      const onVacationDepartments = [...new Set(vacationsOnDate.map(v => v.user?.department).filter(Boolean))];
      const availableDepartments = [...new Set(
        teamMembers
          .filter(member => !vacationsOnDate.some(v => v.userId === member.id))
          .map(member => member.department)
          .filter(Boolean)
      )];
      
      const gaps = onVacationDepartments.filter(dept => !availableDepartments.includes(dept));
      
      report.push({
        date: dateStr,
        coveragePercentage: Math.round(coveragePercentage),
        availableUsers,
        onVacationUsers,
        gaps,
      });
    }
    
    return report;
  }

  private generateCoverageRecommendations(
    dailyCoverage: Array<{ coveragePercentage: number; gaps: string[] }>,
    teamMembers: User[]
  ): string[] {
    const recommendations = [];
    
    const lowCoverageDays = dailyCoverage.filter(day => day.coveragePercentage < 70).length;
    if (lowCoverageDays > 0) {
      recommendations.push(`${lowCoverageDays} Tage mit kritischer Personaldeckung (<70%)`);
    }
    
    const uniqueGaps = [...new Set(dailyCoverage.flatMap(day => day.gaps))];
    if (uniqueGaps.length > 0) {
      recommendations.push(`Abteilungslücken: ${uniqueGaps.join(', ')}`);
    }
    
    const avgCoverage = dailyCoverage.reduce((sum, day) => sum + day.coveragePercentage, 0) / dailyCoverage.length;
    if (avgCoverage < 80) {
      recommendations.push("Erwägen Sie gestaffelte Urlaubszeiten zur besseren Abdeckung");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("Gute Personalabdeckung während des Zeitraums");
    }
    
    return recommendations;
  }

  // Notification operations implementation
  async createNotification(notificationData: InsertNotification & { userId: string; organizationId: string }): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async getNotificationsByUser(userId: string, limit: number = 50, offset: number = 0): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.status, "unread")));
    
    return result[0]?.count || 0;
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ 
        status: "read",
        actionTaken: "clicked",
        actionTakenAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async markNotificationAsDelivered(id: string, channel: "browser" | "email"): Promise<Notification> {
    const updateData: Record<string, any> = {
      status: "delivered",
      updatedAt: new Date()
    };
    
    if (channel === "browser") {
      updateData.browserDelivered = new Date();
    } else if (channel === "email") {
      updateData.emailDelivered = new Date();
    }

    const [notification] = await db
      .update(notifications)
      .set(updateData)
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async deleteExpiredNotifications(): Promise<number> {
    const result = await db
      .delete(notifications)
      .where(lte(notifications.expiresAt, new Date()));
    
    return result.rowCount || 0;
  }

  // User notification preferences operations
  async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user || !user.notificationPreferences) {
      // Return default preferences if user not found or no preferences set
      return {
        channels: {
          browser: true,
          email: true
        },
        types: {
          vacation_request_submitted: true,
          vacation_request_approved: true,
          vacation_request_rejected: true,
          vacation_conflict_detected: true,
          pending_request_reminder: true,
          balance_warning: true,
          balance_expiring: true
        },
        soundEnabled: true,
        browserPermissionGranted: false
      };
    }
    
    return user.notificationPreferences as NotificationPreferences;
  }

  async updateUserNotificationPreferences(userId: string, preferences: UpdateNotificationPreferences): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        notificationPreferences: preferences.notificationPreferences,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserThemePreference(userId: string, themePreference: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        themePreference: themePreference as any,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Comprehensive Analytics Operations
  async getAnalyticsOverview(organizationId: string, dateRange?: { startDate: string; endDate: string }): Promise<AnalyticsOverview> {
    // Get team members
    const teamMembers = await this.getTeamMembers(organizationId);
    
    // Get vacation requests
    const allRequests = await db
      .select()
      .from(vacationRequests)
      .innerJoin(users, eq(vacationRequests.userId, users.id))
      .where(eq(vacationRequests.organizationId, organizationId));

    // Filter by date range if provided
    const filteredRequests = dateRange 
      ? allRequests.filter(r => {
          const req = r.vacation_requests;
          return req.startDate <= dateRange.endDate && req.endDate >= dateRange.startDate;
        })
      : allRequests;

    const approvedRequests = filteredRequests.filter(r => r.vacation_requests.status === "approved");
    const pendingRequests = filteredRequests.filter(r => r.vacation_requests.status === "pending");
    const rejectedRequests = filteredRequests.filter(r => r.vacation_requests.status === "rejected");

    // Calculate total vacation days using business days calculation
    let totalVacationDays = 0;
    for (const request of approvedRequests) {
      const req = request.vacation_requests;
      const holidayDates = await this.getHolidayDates(req.startDate, req.endDate);
      const businessDays = calculateBusinessDays(req.startDate, req.endDate, holidayDates);
      totalVacationDays += businessDays;
    }

    const averageDaysPerEmployee = teamMembers.length > 0 ? totalVacationDays / teamMembers.length : 0;
    
    // Calculate utilization rate (used days vs total allowance)
    const totalAllowance = teamMembers.reduce((sum, member) => sum + (member.annualAllowance || 25), 0);
    const utilizationRate = totalAllowance > 0 ? (totalVacationDays / totalAllowance) * 100 : 0;
    
    // Calculate approval rate
    const totalProcessedRequests = approvedRequests.length + rejectedRequests.length;
    const approvalRate = totalProcessedRequests > 0 ? (approvedRequests.length / totalProcessedRequests) * 100 : 0;

    // Calculate conflict rate
    const conflictRate = 0; // Set to 0 for now as conflict detection is complex

    // Department breakdown - calculate from filtered approved requests
    const departmentStats = new Map<string, { totalDays: number; employees: Set<string>; allowance: number }>();
    
    // Calculate vacation days per department from approved requests
    for (const request of approvedRequests) {
      const req = request.vacation_requests;
      const user = request.users;
      const dept = user.department || 'operations';
      
      if (!departmentStats.has(dept)) {
        departmentStats.set(dept, { totalDays: 0, employees: new Set(), allowance: 0 });
      }
      
      const stats = departmentStats.get(dept)!;
      const holidayDates = await this.getHolidayDates(req.startDate, req.endDate);
      const businessDays = calculateBusinessDays(req.startDate, req.endDate, holidayDates);
      stats.totalDays += businessDays;
      stats.employees.add(user.id);
    }
    
    // Add all team members to ensure all departments are represented
    teamMembers.forEach(member => {
      const dept = member.department || 'operations';
      if (!departmentStats.has(dept)) {
        departmentStats.set(dept, { totalDays: 0, employees: new Set(), allowance: 0 });
      }
      const stats = departmentStats.get(dept)!;
      stats.employees.add(member.id);
      stats.allowance += (member.annualAllowance || 25);
    });

    const departmentBreakdown = Array.from(departmentStats.entries()).map(([department, stats]) => {
      const employeeCount = stats.employees.size;
      const averageDays = employeeCount > 0 ? stats.totalDays / employeeCount : 0;
      const utilizationRate = stats.allowance > 0 ? (stats.totalDays / stats.allowance) * 100 : 0;
      
      return {
        department,
        totalDays: stats.totalDays,
        employees: employeeCount,
        averageDays,
        utilizationRate,
      };
    });

    return {
      totalEmployees: teamMembers.length,
      totalRequests: allRequests.length,
      approvedRequests: approvedRequests.length,
      pendingRequests: pendingRequests.length,
      rejectedRequests: rejectedRequests.length,
      totalVacationDays,
      averageDaysPerEmployee,
      utilizationRate,
      approvalRate,
      conflictRate,
      departmentBreakdown,
    };
  }

  async getTeamUsageAnalytics(organizationId: string, dateRange?: { startDate: string; endDate: string }): Promise<TeamUsageAnalytics> {
    const teamMembers = await this.getTeamMembers(organizationId);
    
    // If no date range is provided, use all approved vacations (show total used days)
    // If date range is provided, only count vacations within that range
    const usageByEmployee = await Promise.all(
      teamMembers.map(async (member) => {
        let usedDays = 0;
        
        // Get approved requests (filtered by date range if provided)
        const requestsQuery = db
          .select()
          .from(vacationRequests)
          .where(
            and(
              eq(vacationRequests.userId, member.id),
              eq(vacationRequests.status, "approved")
            )
          );
        
        const allApprovedRequests = await requestsQuery;
        
        // Filter by date range if provided
        const filteredRequests = dateRange 
          ? allApprovedRequests.filter(r => {
              // Include vacation if it overlaps with the date range
              return r.startDate <= dateRange.endDate && r.endDate >= dateRange.startDate;
            })
          : allApprovedRequests;
        
        // Calculate used days using business days calculation (excludes weekends and holidays)
        for (const request of filteredRequests) {
          const holidayDates = await this.getHolidayDates(request.startDate, request.endDate);
          const businessDays = calculateBusinessDays(request.startDate, request.endDate, holidayDates);
          usedDays += businessDays;
        }

        const totalDays = member.annualAllowance || 25;
        const remainingDays = totalDays - usedDays;
        const utilizationRate = totalDays > 0 ? (usedDays / totalDays) * 100 : 0;
        
        // Find last vacation date from all approved requests
        const lastRequest = allApprovedRequests
          .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];
        const lastVacationDate = lastRequest?.endDate;

        return {
          userId: member.id,
          name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email || 'Unknown',
          department: member.department || 'operations',
          totalDays,
          usedDays,
          remainingDays,
          utilizationRate,
          lastVacationDate,
        };
      })
    );

    // Calculate department summaries
    const departmentStats = new Map<string, { employees: number; allocatedDays: number; usedDays: number }>();
    
    usageByEmployee.forEach(employee => {
      if (!departmentStats.has(employee.department)) {
        departmentStats.set(employee.department, { employees: 0, allocatedDays: 0, usedDays: 0 });
      }
      
      const stats = departmentStats.get(employee.department)!;
      stats.employees += 1;
      stats.allocatedDays += employee.totalDays;
      stats.usedDays += employee.usedDays;
    });

    const departmentSummary = Array.from(departmentStats.entries()).map(([department, stats]) => ({
      department,
      totalEmployees: stats.employees,
      totalAllocatedDays: stats.allocatedDays,
      totalUsedDays: stats.usedDays,
      averageUtilization: stats.allocatedDays > 0 ? (stats.usedDays / stats.allocatedDays) * 100 : 0,
    }));

    return {
      usageByEmployee,
      departmentSummary,
    };
  }

  async getVacationTrends(organizationId: string, period: 'monthly' | 'quarterly' | 'yearly'): Promise<VacationTrends> {
    const currentDate = new Date();
    const startYear = currentDate.getFullYear() - 2; // Get 3 years of data
    
    // Get all vacation requests from the start period
    const allRequests = await db
      .select()
      .from(vacationRequests)
      .innerJoin(users, eq(vacationRequests.userId, users.id))
      .where(
        and(
          eq(vacationRequests.organizationId, organizationId),
          gte(vacationRequests.createdAt, new Date(`${startYear}-01-01`))
        )
      );

    // Build trends data based on period
    const trendsMap = new Map<string, { requests: any[]; totalDays: number; processedRequests: any[] }>();
    
    allRequests.forEach(request => {
      const requestDate = new Date(request.vacation_requests.createdAt);
      let periodKey: string;
      
      if (period === 'monthly') {
        periodKey = `${requestDate.getFullYear()}-${String(requestDate.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === 'quarterly') {
        const quarter = Math.floor(requestDate.getMonth() / 3) + 1;
        periodKey = `${requestDate.getFullYear()}-Q${quarter}`;
      } else {
        periodKey = `${requestDate.getFullYear()}`;
      }
      
      if (!trendsMap.has(periodKey)) {
        trendsMap.set(periodKey, { requests: [], totalDays: 0, processedRequests: [] });
      }
      
      const periodData = trendsMap.get(periodKey)!;
      periodData.requests.push(request);
      
      // Calculate days
      const start = new Date(request.vacation_requests.startDate);
      const end = new Date(request.vacation_requests.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      periodData.totalDays += days;
      
      // Track processed requests for approval rate calculation
      if (request.vacation_requests.status !== 'pending') {
        periodData.processedRequests.push(request);
      }
    });

    const trends = Array.from(trendsMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => {
        const approvedRequests = data.processedRequests.filter(r => r.vacation_requests.status === 'approved');
        const approvalRate = data.processedRequests.length > 0 ? (approvedRequests.length / data.processedRequests.length) * 100 : 0;
        
        // Calculate average processing time
        const processedWithTimes = data.processedRequests.filter(r => r.vacation_requests.reviewedAt);
        const avgProcessingTime = processedWithTimes.length > 0 
          ? processedWithTimes.reduce((sum, r) => {
              const created = new Date(r.vacation_requests.createdAt);
              const reviewed = new Date(r.vacation_requests.reviewedAt);
              return sum + (reviewed.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
            }, 0) / processedWithTimes.length
          : 0;

        return {
          period,
          requestCount: data.requests.length,
          totalDays: data.totalDays,
          approvalRate,
          averageProcessingTime: avgProcessingTime,
        };
      });

    // Seasonal patterns (monthly aggregation)
    const seasonalMap = new Map<number, { requests: number; days: number }>();
    allRequests.forEach(request => {
      const month = new Date(request.vacation_requests.startDate).getMonth() + 1;
      if (!seasonalMap.has(month)) {
        seasonalMap.set(month, { requests: 0, days: 0 });
      }
      
      const data = seasonalMap.get(month)!;
      data.requests += 1;
      
      const start = new Date(request.vacation_requests.startDate);
      const end = new Date(request.vacation_requests.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      data.days += days;
    });

    const maxRequests = Math.max(...Array.from(seasonalMap.values()).map(d => d.requests));
    const seasonalPatterns = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const data = seasonalMap.get(month) || { requests: 0, days: 0 };
      const popularityScore = maxRequests > 0 ? (data.requests / maxRequests) * 100 : 0;
      
      return {
        month,
        requestCount: data.requests,
        totalDays: data.days,
        popularityScore,
      };
    });

    // Year over year comparison
    const yearlyStats = new Map<number, { requests: number; days: number; utilization: number }>();
    const teamMembers = await this.getTeamMembers(organizationId);
    const totalAllowance = teamMembers.reduce((sum, m) => sum + (m.annualAllowance || 25), 0);
    
    allRequests.forEach(request => {
      const year = new Date(request.vacation_requests.startDate).getFullYear();
      if (!yearlyStats.has(year)) {
        yearlyStats.set(year, { requests: 0, days: 0, utilization: 0 });
      }
      
      const data = yearlyStats.get(year)!;
      data.requests += 1;
      
      if (request.vacation_requests.status === 'approved') {
        const start = new Date(request.vacation_requests.startDate);
        const end = new Date(request.vacation_requests.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        data.days += days;
      }
    });

    yearlyStats.forEach((data, year) => {
      data.utilization = totalAllowance > 0 ? (data.days / totalAllowance) * 100 : 0;
    });

    const yearOverYear = Array.from(yearlyStats.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, data]) => ({
        year,
        totalRequests: data.requests,
        totalDays: data.days,
        utilizationRate: data.utilization,
      }));

    return {
      period,
      trends,
      seasonalPatterns,
      yearOverYear,
    };
  }

  async getDepartmentComparison(organizationId: string, dateRange?: { startDate: string; endDate: string }): Promise<DepartmentComparison> {
    const currentYear = new Date().getFullYear();
    const startDate = dateRange?.startDate || `${currentYear}-01-01`;
    const endDate = dateRange?.endDate || `${currentYear}-12-31`;

    const teamMembers = await this.getTeamMembers(organizationId);
    const allRequests = await db
      .select()
      .from(vacationRequests)
      .innerJoin(users, eq(vacationRequests.userId, users.id))
      .where(
        and(
          eq(vacationRequests.organizationId, organizationId),
          gte(vacationRequests.startDate, startDate),
          lte(vacationRequests.endDate, endDate)
        )
      );

    // Group by department
    const departmentStats = new Map<string, {
      employees: Set<string>;
      totalRequests: number;
      approvedRequests: number;
      totalDays: number;
      processingTimes: number[];
    }>();

    allRequests.forEach(request => {
      const dept = request.users.department || 'operations';
      
      if (!departmentStats.has(dept)) {
        departmentStats.set(dept, {
          employees: new Set(),
          totalRequests: 0,
          approvedRequests: 0,
          totalDays: 0,
          processingTimes: [],
        });
      }
      
      const stats = departmentStats.get(dept)!;
      stats.employees.add(request.users.id);
      stats.totalRequests += 1;
      
      if (request.vacation_requests.status === 'approved') {
        stats.approvedRequests += 1;
        
        const start = new Date(request.vacation_requests.startDate);
        const end = new Date(request.vacation_requests.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        stats.totalDays += days;
      }
      
      // Calculate processing time if reviewed
      if (request.vacation_requests.reviewedAt) {
        const created = new Date(request.vacation_requests.createdAt);
        const reviewed = new Date(request.vacation_requests.reviewedAt);
        const hours = (reviewed.getTime() - created.getTime()) / (1000 * 60 * 60);
        stats.processingTimes.push(hours);
      }
    });

    const departments = Array.from(departmentStats.entries()).map(([department, stats]) => {
      const totalEmployees = stats.employees.size;
      const averageDaysPerEmployee = totalEmployees > 0 ? stats.totalDays / totalEmployees : 0;
      const utilizationRate = (() => {
        const deptAllowance = teamMembers
          .filter(m => (m.department || 'operations') === department)
          .reduce((sum, m) => sum + (m.annualAllowance || 25), 0);
        return deptAllowance > 0 ? (stats.totalDays / deptAllowance) * 100 : 0;
      })();
      const approvalRate = stats.totalRequests > 0 ? (stats.approvedRequests / stats.totalRequests) * 100 : 0;
      const averageProcessingTime = stats.processingTimes.length > 0 
        ? stats.processingTimes.reduce((a, b) => a + b, 0) / stats.processingTimes.length 
        : 0;

      return {
        department,
        totalEmployees,
        totalRequests: stats.totalRequests,
        approvedRequests: stats.approvedRequests,
        totalDays: stats.totalDays,
        averageDaysPerEmployee,
        utilizationRate,
        approvalRate,
        averageProcessingTime,
      };
    });

    // Calculate metrics
    const metrics = {
      mostActiveDepart: departments.reduce((max, dept) => 
        dept.totalRequests > max.totalRequests ? dept : max, departments[0] || { department: 'None', totalRequests: 0 }).department,
      leastActiveDepart: departments.reduce((min, dept) => 
        dept.totalRequests < min.totalRequests ? dept : min, departments[0] || { department: 'None', totalRequests: Infinity }).department,
      highestUtilization: departments.reduce((max, dept) => 
        dept.utilizationRate > max.utilizationRate ? dept : max, departments[0] || { department: 'None', utilizationRate: 0 }).department,
      lowestUtilization: departments.reduce((min, dept) => 
        dept.utilizationRate < min.utilizationRate ? dept : min, departments[0] || { department: 'None', utilizationRate: Infinity }).department,
      fastestApproval: departments.reduce((min, dept) => 
        dept.averageProcessingTime < min.averageProcessingTime ? dept : min, departments[0] || { department: 'None', averageProcessingTime: Infinity }).department,
      slowestApproval: departments.reduce((max, dept) => 
        dept.averageProcessingTime > max.averageProcessingTime ? dept : max, departments[0] || { department: 'None', averageProcessingTime: 0 }).department,
    };

    return {
      departments,
      metrics,
    };
  }

  async getEmployeeAnalytics(userId: string, dateRange?: { startDate: string; endDate: string }): Promise<EmployeeAnalytics> {
    const currentYear = new Date().getFullYear();
    const startDate = dateRange?.startDate || `${currentYear}-01-01`;
    const endDate = dateRange?.endDate || `${currentYear}-12-31`;

    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const employeeInfo = {
      userId: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown',
      department: user.department || 'operations',
      role: user.role || 'employee',
      hireDate: user.createdAt ? user.createdAt.toISOString().split('T')[0] : undefined,
    };

    const balance = await this.getUserBalance(userId);
    const vacationSummary = {
      totalAllowance: balance.annualAllowance,
      usedDays: balance.usedDays,
      remainingDays: balance.remainingDays,
      utilizationRate: balance.annualAllowance > 0 ? (balance.usedDays / balance.annualAllowance) * 100 : 0,
    };

    // Get request history
    const requests = await db
      .select()
      .from(vacationRequests)
      .where(
        and(
          eq(vacationRequests.userId, userId),
          gte(vacationRequests.startDate, startDate),
          lte(vacationRequests.endDate, endDate)
        )
      )
      .orderBy(desc(vacationRequests.createdAt));

    const requestHistory = requests.map(request => {
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      let processingTime: number | undefined;
      if (request.reviewedAt) {
        const created = new Date(request.createdAt);
        const reviewed = new Date(request.reviewedAt);
        processingTime = (reviewed.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
      }

      return {
        id: request.id,
        startDate: request.startDate,
        endDate: request.endDate,
        days,
        status: request.status,
        reason: request.reason || undefined,
        submittedDate: request.createdAt.toISOString().split('T')[0],
        processedDate: request.reviewedAt ? request.reviewedAt.toISOString().split('T')[0] : undefined,
        processingTime,
      };
    });

    // Analyze patterns
    const monthCounts = new Map<number, number>();
    const requestLengths: number[] = [];
    let totalAdvanceDays = 0;
    let advanceRequests = 0;

    requests.forEach(request => {
      const startMonth = new Date(request.startDate).getMonth() + 1;
      monthCounts.set(startMonth, (monthCounts.get(startMonth) || 0) + 1);
      
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      requestLengths.push(days);
      
      // Calculate advance planning
      const created = new Date(request.createdAt);
      const advanceDays = Math.ceil((start.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      if (advanceDays > 0) {
        totalAdvanceDays += advanceDays;
        advanceRequests += 1;
      }
    });

    const preferredMonths = Array.from(monthCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([month]) => month);

    const averageRequestLength = requestLengths.length > 0 
      ? requestLengths.reduce((a, b) => a + b, 0) / requestLengths.length 
      : 0;

    const averageAdvance = advanceRequests > 0 ? totalAdvanceDays / advanceRequests : 0;
    const planningSeason = averageAdvance > 60 ? 'early' : averageAdvance > 30 ? 'mid' : 'late';
    
    const patterns = {
      preferredMonths,
      averageRequestLength,
      planningSeason,
      vacationFrequency: requests.length,
    };

    return {
      employeeInfo,
      vacationSummary,
      requestHistory,
      patterns,
    };
  }

  async getUtilizationMetrics(organizationId: string, dateRange?: { startDate: string; endDate: string }): Promise<UtilizationMetrics> {
    const currentYear = new Date().getFullYear();
    const startDate = dateRange?.startDate || `${currentYear}-01-01`;
    const endDate = dateRange?.endDate || `${currentYear}-12-31`;

    const teamMembers = await this.getTeamMembers(organizationId);
    const totalAllowance = teamMembers.reduce((sum, member) => sum + (member.annualAllowance || 25), 0);
    
    // Get all approved requests in date range
    const approvedRequests = await db
      .select()
      .from(vacationRequests)
      .innerJoin(users, eq(vacationRequests.userId, users.id))
      .where(
        and(
          eq(vacationRequests.organizationId, organizationId),
          eq(vacationRequests.status, "approved"),
          gte(vacationRequests.startDate, startDate),
          lte(vacationRequests.endDate, endDate)
        )
      );

    const totalUsed = approvedRequests.reduce((sum, request) => {
      const start = new Date(request.vacation_requests.startDate);
      const end = new Date(request.vacation_requests.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return sum + days;
    }, 0);

    const overall = {
      totalAllowance,
      totalUsed,
      utilizationRate: totalAllowance > 0 ? (totalUsed / totalAllowance) * 100 : 0,
      unused_liability: totalAllowance - totalUsed,
    };

    // Monthly breakdown
    const monthlyData = new Map<number, { used: number; teamSize: number }>();
    
    // Initialize all months
    for (let month = 1; month <= 12; month++) {
      monthlyData.set(month, { used: 0, teamSize: teamMembers.length });
    }

    approvedRequests.forEach(request => {
      const start = new Date(request.vacation_requests.startDate);
      const end = new Date(request.vacation_requests.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Distribute days across months if vacation spans multiple months
      let currentDate = new Date(start);
      let remainingDays = days;
      
      while (remainingDays > 0 && currentDate <= end) {
        const month = currentDate.getMonth() + 1;
        const monthData = monthlyData.get(month)!;
        
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const periodEnd = new Date(Math.min(end.getTime(), monthEnd.getTime()));
        const daysInMonth = Math.ceil((periodEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        monthData.used += Math.min(daysInMonth, remainingDays);
        remainingDays -= daysInMonth;
        
        // Move to next month
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      }
    });

    const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
                       'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

    const byMonth = Array.from(monthlyData.entries()).map(([month, data]) => {
      const monthlyAllowance = (totalAllowance / 12); // Distribute annual allowance
      const utilizationRate = monthlyAllowance > 0 ? (data.used / monthlyAllowance) * 100 : 0;
      
      // Determine coverage level based on utilization
      let coverageLevel: "high" | "medium" | "low" | "critical";
      if (utilizationRate < 20) coverageLevel = "high";
      else if (utilizationRate < 40) coverageLevel = "medium"; 
      else if (utilizationRate < 60) coverageLevel = "low";
      else coverageLevel = "critical";

      return {
        month,
        monthName: monthNames[month - 1],
        daysUsed: data.used,
        utilizationRate,
        coverageLevel,
      };
    });

    // Risk metrics
    const employeeBalances = await this.getAllUsersBalance(organizationId);
    const underutilizers = employeeBalances.filter(emp => {
      const utilization = emp.annualAllowance > 0 ? (emp.usedDays / emp.annualAllowance) * 100 : 0;
      return utilization < 50;
    }).length;

    const overutilizers = employeeBalances.filter(emp => {
      const utilization = emp.annualAllowance > 0 ? (emp.usedDays / emp.annualAllowance) * 100 : 0;
      return utilization > 80;
    }).length;

    // Get all recent requests for last minute bookings analysis
    const allRequests = await db
      .select()
      .from(vacationRequests)
      .where(eq(vacationRequests.organizationId, organizationId));

    const lastMinuteBookings = allRequests.filter(request => {
      const created = new Date(request.createdAt);
      const start = new Date(request.startDate);
      const advanceDays = Math.ceil((start.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return advanceDays < 7;
    }).length;

    const conflictingRequests = await this.getConflictingRequests(organizationId, startDate, endDate);

    const riskMetrics = {
      underutilizers,
      overutilizers,
      lastMinuteBookings,
      conflictProne: conflictingRequests.length,
    };

    return {
      overall,
      byMonth,
      riskMetrics,
    };
  }

  async getVacationPatterns(organizationId: string): Promise<VacationPatterns> {
    const currentYear = new Date().getFullYear();
    
    // Get all vacation requests for pattern analysis
    const allRequests = await db
      .select()
      .from(vacationRequests)
      .innerJoin(users, eq(vacationRequests.userId, users.id))
      .where(eq(vacationRequests.organizationId, organizationId));

    // Identify peak periods by analyzing request density
    const dateRequestCounts = new Map<string, number>();
    const monthlyUtilization = new Map<number, { requests: number; days: number }>();
    const durationCounts = new Map<number, number>();
    const planningLeadTimes: number[] = [];

    allRequests.forEach(request => {
      const start = new Date(request.vacation_requests.startDate);
      const end = new Date(request.vacation_requests.endDate);
      const created = new Date(request.vacation_requests.createdAt);
      
      // Count requests by start date
      const dateKey = start.toISOString().split('T')[0];
      dateRequestCounts.set(dateKey, (dateRequestCounts.get(dateKey) || 0) + 1);
      
      // Monthly patterns
      const month = start.getMonth() + 1;
      if (!monthlyUtilization.has(month)) {
        monthlyUtilization.set(month, { requests: 0, days: 0 });
      }
      const monthData = monthlyUtilization.get(month)!;
      monthData.requests += 1;
      
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      monthData.days += days;
      
      // Duration patterns
      durationCounts.set(days, (durationCounts.get(days) || 0) + 1);
      
      // Planning lead time
      const leadTime = Math.ceil((start.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      if (leadTime > 0) {
        planningLeadTimes.push(leadTime);
      }
    });

    // Find peak periods (periods with high request density)
    const peakThreshold = Math.max(3, Math.ceil(allRequests.length * 0.1 / 365)); // At least 3 requests or 10% of yearly requests per day
    const peakPeriods: Array<{ startDate: string; endDate: string; requestCount: number; utilizationRate: number; severity: "low" | "medium" | "high" | "critical" }> = [];
    
    // Pre-fetch team size to avoid async issues in loop
    const teamMembers = await this.getTeamMembers(organizationId);
    const teamSize = teamMembers.length;
    
    // Group consecutive high-activity days
    const sortedDates = Array.from(dateRequestCounts.entries())
      .filter(([, count]) => count >= peakThreshold)
      .sort(([a], [b]) => a.localeCompare(b));

    let currentPeriod: { start: string; end: string; totalRequests: number } | null = null;
    
    sortedDates.forEach(([date, count]) => {
      if (!currentPeriod) {
        currentPeriod = { start: date, end: date, totalRequests: count };
      } else {
        const lastDate = new Date(currentPeriod.end);
        const currentDate = new Date(date);
        const daysDiff = Math.ceil((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 7) { // Extend period if within a week
          currentPeriod.end = date;
          currentPeriod.totalRequests += count;
        } else {
          // Close current period and start new one
          const utilizationRate = teamSize > 0 ? (currentPeriod.totalRequests / teamSize) * 100 : 0;
          const severity: "low" | "medium" | "high" | "critical" = 
            utilizationRate > 80 ? "critical" : 
            utilizationRate > 60 ? "high" : 
            utilizationRate > 40 ? "medium" : "low";
          
          peakPeriods.push({
            startDate: currentPeriod.start,
            endDate: currentPeriod.end,
            requestCount: currentPeriod.totalRequests,
            utilizationRate,
            severity,
          });
          
          currentPeriod = { start: date, end: date, totalRequests: count };
        }
      }
    });

    // Close final period
    if (currentPeriod) {
      const utilizationRate = teamSize > 0 ? (currentPeriod.totalRequests / teamSize) * 100 : 0;
      const severity: "low" | "medium" | "high" | "critical" = 
        utilizationRate > 80 ? "critical" : 
        utilizationRate > 60 ? "high" : 
        utilizationRate > 40 ? "medium" : "low";
      
      peakPeriods.push({
        startDate: currentPeriod.start,
        endDate: currentPeriod.end,
        requestCount: currentPeriod.totalRequests,
        utilizationRate,
        severity,
      });
    }

    // Seasonal analysis
    const totalRequests = allRequests.length;
    const seasonCounts = {
      spring: 0, // Mar, Apr, May
      summer: 0, // Jun, Jul, Aug
      fall: 0,   // Sep, Oct, Nov
      winter: 0, // Dec, Jan, Feb
    };

    monthlyUtilization.forEach((data, month) => {
      if ([3, 4, 5].includes(month)) seasonCounts.spring += data.requests;
      else if ([6, 7, 8].includes(month)) seasonCounts.summer += data.requests;
      else if ([9, 10, 11].includes(month)) seasonCounts.fall += data.requests;
      else seasonCounts.winter += data.requests;
    });

    const seasonalPercentages = {
      spring: totalRequests > 0 ? (seasonCounts.spring / totalRequests) * 100 : 0,
      summer: totalRequests > 0 ? (seasonCounts.summer / totalRequests) * 100 : 0,
      fall: totalRequests > 0 ? (seasonCounts.fall / totalRequests) * 100 : 0,
      winter: totalRequests > 0 ? (seasonCounts.winter / totalRequests) * 100 : 0,
    };

    const seasonalRanks = Object.entries(seasonalPercentages)
      .sort(([, a], [, b]) => b - a)
      .reduce((acc, [season], index) => {
        acc[season as keyof typeof seasonalPercentages] = index + 1;
        return acc;
      }, {} as Record<keyof typeof seasonalPercentages, number>);

    const seasonalityAnalysis = {
      summer: { percentage: seasonalPercentages.summer, rank: seasonalRanks.summer },
      winter: { percentage: seasonalPercentages.winter, rank: seasonalRanks.winter },
      spring: { percentage: seasonalPercentages.spring, rank: seasonalRanks.spring },
      fall: { percentage: seasonalPercentages.fall, rank: seasonalRanks.fall },
    };

    // Common durations
    const totalDurationRequests = Array.from(durationCounts.values()).reduce((a, b) => a + b, 0);
    const commonDurations = Array.from(durationCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) // Top 10 most common durations
      .map(([days, count]) => ({
        days,
        count,
        percentage: totalDurationRequests > 0 ? (count / totalDurationRequests) * 100 : 0,
      }));

    // Planning lead time analysis
    planningLeadTimes.sort((a, b) => a - b);
    const average = planningLeadTimes.length > 0 
      ? planningLeadTimes.reduce((a, b) => a + b, 0) / planningLeadTimes.length 
      : 0;
    const median = planningLeadTimes.length > 0 
      ? planningLeadTimes[Math.floor(planningLeadTimes.length / 2)] 
      : 0;

    const leadTimeRanges = [
      { range: "0-7 Tage", min: 0, max: 7 },
      { range: "1-2 Wochen", min: 8, max: 14 },
      { range: "3-4 Wochen", min: 15, max: 28 },
      { range: "1-2 Monate", min: 29, max: 60 },
      { range: "3+ Monate", min: 61, max: Infinity },
    ];

    const distribution = leadTimeRanges.map(range => {
      const count = planningLeadTimes.filter(days => days >= range.min && days <= range.max).length;
      const percentage = planningLeadTimes.length > 0 ? (count / planningLeadTimes.length) * 100 : 0;
      
      return {
        range: range.range,
        count,
        percentage,
      };
    });

    const planningLeadTime = {
      average,
      median,
      distribution,
    };

    return {
      peakPeriods,
      seasonalityAnalysis,
      commonDurations,
      planningLeadTime,
    };
  }

  async getProcessingMetrics(organizationId: string, dateRange?: { startDate: string; endDate: string }): Promise<ProcessingMetrics> {
    const currentYear = new Date().getFullYear();
    const startDate = dateRange?.startDate || `${currentYear}-01-01`;
    const endDate = dateRange?.endDate || `${currentYear}-12-31`;

    const allRequests = await db
      .select()
      .from(vacationRequests)
      .innerJoin(users, eq(vacationRequests.userId, users.id))
      .leftJoin(
        { reviewer: users }, 
        eq(vacationRequests.reviewedBy, sql`${users.id}`)
      )
      .where(
        and(
          eq(vacationRequests.organizationId, organizationId),
          gte(vacationRequests.createdAt, new Date(startDate)),
          lte(vacationRequests.createdAt, new Date(endDate))
        )
      );

    const processedRequests = allRequests.filter(r => r.vacation_requests.reviewedAt);
    const approvedRequests = processedRequests.filter(r => r.vacation_requests.status === 'approved');
    const rejectedRequests = processedRequests.filter(r => r.vacation_requests.status === 'rejected');

    // Calculate processing times
    const processingTimes = processedRequests.map(request => {
      const created = new Date(request.vacation_requests.createdAt);
      const reviewed = new Date(request.vacation_requests.reviewedAt!);
      return (reviewed.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
    });

    processingTimes.sort((a, b) => a - b);
    
    const averageProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
      : 0;
    const medianProcessingTime = processingTimes.length > 0 
      ? processingTimes[Math.floor(processingTimes.length / 2)] 
      : 0;

    const totalRequests = allRequests.length;
    const approvalRate = totalRequests > 0 ? (approvedRequests.length / totalRequests) * 100 : 0;
    const rejectionRate = totalRequests > 0 ? (rejectedRequests.length / totalRequests) * 100 : 0;

    const approvalMetrics = {
      averageProcessingTime,
      medianProcessingTime,
      approvalRate,
      rejectionRate,
    };

    // Time to approval distribution
    const timeRanges = [
      { range: "<24h", min: 0, max: 24 },
      { range: "1-3 Tage", min: 24, max: 72 },
      { range: "3-7 Tage", min: 72, max: 168 },
      { range: "1-2 Wochen", min: 168, max: 336 },
      { range: "2+ Wochen", min: 336, max: Infinity },
    ];

    const timeToApproval = timeRanges.map(range => {
      const count = processingTimes.filter(hours => hours >= range.min && hours < range.max).length;
      const percentage = processingTimes.length > 0 ? (count / processingTimes.length) * 100 : 0;
      
      return {
        timeRange: range.range,
        count,
        percentage,
      };
    });

    // Department bottlenecks
    const departmentMetrics = new Map<string, { totalRequests: number; processingTimes: number[]; pendingCount: number }>();
    
    allRequests.forEach(request => {
      const dept = request.users.department || 'operations';
      
      if (!departmentMetrics.has(dept)) {
        departmentMetrics.set(dept, { totalRequests: 0, processingTimes: [], pendingCount: 0 });
      }
      
      const metrics = departmentMetrics.get(dept)!;
      metrics.totalRequests += 1;
      
      if (request.vacation_requests.status === 'pending') {
        metrics.pendingCount += 1;
      } else if (request.vacation_requests.reviewedAt) {
        const created = new Date(request.vacation_requests.createdAt);
        const reviewed = new Date(request.vacation_requests.reviewedAt);
        const hours = (reviewed.getTime() - created.getTime()) / (1000 * 60 * 60);
        metrics.processingTimes.push(hours);
      }
    });

    const bottlenecks = Array.from(departmentMetrics.entries()).map(([department, metrics]) => {
      const averageDelay = metrics.processingTimes.length > 0 
        ? metrics.processingTimes.reduce((a, b) => a + b, 0) / metrics.processingTimes.length 
        : 0;
      
      const severity: "low" | "medium" | "high" = 
        averageDelay > 72 || metrics.pendingCount > 5 ? "high" :
        averageDelay > 48 || metrics.pendingCount > 3 ? "medium" : "low";

      return {
        department,
        averageDelay,
        pendingCount: metrics.pendingCount,
        severity,
      };
    });

    // Reviewer workload
    const reviewerMetrics = new Map<string, { name: string; requests: number; processingTimes: number[] }>();
    
    processedRequests.forEach(request => {
      if (request.vacation_requests.reviewedBy) {
        const reviewerId = request.vacation_requests.reviewedBy;
        
        if (!reviewerMetrics.has(reviewerId)) {
          const reviewerUser = request.reviewer || { firstName: 'Unknown', lastName: 'Reviewer' };
          const reviewerName = `${reviewerUser.firstName || ''} ${reviewerUser.lastName || ''}`.trim() || 'Unknown Reviewer';
          reviewerMetrics.set(reviewerId, { name: reviewerName, requests: 0, processingTimes: [] });
        }
        
        const metrics = reviewerMetrics.get(reviewerId)!;
        metrics.requests += 1;
        
        const created = new Date(request.vacation_requests.createdAt);
        const reviewed = new Date(request.vacation_requests.reviewedAt!);
        const hours = (reviewed.getTime() - created.getTime()) / (1000 * 60 * 60);
        metrics.processingTimes.push(hours);
      }
    });

    const maxRequests = Math.max(...Array.from(reviewerMetrics.values()).map(m => m.requests), 1);
    const reviewerWorkload = Array.from(reviewerMetrics.entries()).map(([reviewerId, metrics]) => {
      const averageProcessingTime = metrics.processingTimes.length > 0 
        ? metrics.processingTimes.reduce((a, b) => a + b, 0) / metrics.processingTimes.length 
        : 0;
      const workloadScore = (metrics.requests / maxRequests) * 100;

      return {
        reviewerId,
        reviewerName: metrics.name,
        requestsReviewed: metrics.requests,
        averageProcessingTime,
        workloadScore,
      };
    });

    return {
      approvalMetrics,
      timeToApproval,
      bottlenecks,
      reviewerWorkload,
    };
  }

  // Helper method for finding conflicting requests
  private async getConflictingRequests(organizationId: string, startDate: string, endDate: string): Promise<any[]> {
    const requests = await this.getVacationRequestsInDateRange(organizationId, startDate, endDate);
    const conflicts: any[] = [];
    
    for (let i = 0; i < requests.length; i++) {
      for (let j = i + 1; j < requests.length; j++) {
        const req1 = requests[i];
        const req2 = requests[j];
        
        if (req1.status === 'approved' && req2.status === 'approved' && 
            req1.userId !== req2.userId &&
            this.dateRangesOverlap(req1.startDate, req1.endDate, req2.startDate, req2.endDate)) {
          conflicts.push(req1, req2);
        }
      }
    }
    
    // Remove duplicates
    return Array.from(new Set(conflicts.map(r => r.id))).map(id => 
      conflicts.find(r => r.id === id)
    );
  }

  private dateRangesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = new Date(start1);
    const e1 = new Date(end1);
    const s2 = new Date(start2);
    const e2 = new Date(end2);
    
    return s1 <= e2 && s2 <= e1;
  }

  // Holiday operations
  async createHoliday(holiday: Omit<InsertHoliday, 'id' | 'createdAt'>): Promise<Holiday> {
    const [created] = await db.insert(holidays).values(holiday).returning();
    return created;
  }

  async getHolidays(startYear: number, endYear: number): Promise<Holiday[]> {
    const result = await db
      .select()
      .from(holidays)
      .where(and(
        gte(holidays.year, startYear),
        lte(holidays.year, endYear)
      ))
      .orderBy(asc(holidays.date));
    return result;
  }

  async getHolidayDates(startDate: string, endDate: string): Promise<string[]> {
    const result = await db
      .select({ date: holidays.date })
      .from(holidays)
      .where(and(
        gte(holidays.date, startDate),
        lte(holidays.date, endDate)
      ));
    return result.map(row => row.date);
  }

  async deleteAllHolidays(): Promise<void> {
    await db.delete(holidays);
  }
}

export const storage = new DatabaseStorage();
