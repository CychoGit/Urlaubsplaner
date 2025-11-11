import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  date,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Organizations/Teams table for multi-tenancy
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }).unique(),
  customName: varchar("custom_name", { length: 255 }), // Custom display name for branding
  logoUrl: varchar("logo_url", { length: 500 }), // Logo URL for branding
  defaultVacationDays: integer("default_vacation_days").default(30).notNull(), // Default vacation days for all employees
  vacationTrackingEnabled: boolean("vacation_tracking_enabled").default(false).notNull(), // Enable/disable vacation balance tracking for organization
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["tenant_admin", "admin", "employee"]);

// User status enum for approval workflow
export const userStatusEnum = pgEnum("user_status", ["pending", "approved", "suspended"]);

// Department enum for team organization
export const departmentEnum = pgEnum("department", ["engineering", "sales", "marketing", "hr", "finance", "operations", "support"]);

// Skill level enum
export const skillLevelEnum = pgEnum("skill_level", ["beginner", "intermediate", "advanced", "expert"]);

// Priority level for workload
export const priorityLevelEnum = pgEnum("priority_level", ["low", "medium", "high", "critical"]);

// Notification enums
export const notificationTypeEnum = pgEnum("notification_type", [
  "vacation_request_submitted",
  "vacation_request_approved", 
  "vacation_request_rejected",
  "vacation_conflict_detected",
  "pending_request_reminder",
  "balance_warning",
  "balance_expiring"
]);

export const notificationChannelEnum = pgEnum("notification_channel", ["browser", "email", "both"]);
export const notificationStatusEnum = pgEnum("notification_status", ["unread", "read", "delivered", "failed"]);

// Theme preference enum for user personalization
export const themePreferenceEnum = pgEnum("theme_preference", ["modern", "elegant", "vibrant"]);

// User storage table (enhanced with email/password auth and approval workflow)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  password: varchar("password"), // Bcrypt hashed password
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  organizationId: varchar("organization_id").references(() => organizations.id),
  role: userRoleEnum("role").default("employee"),
  status: userStatusEnum("status").default("pending"),
  approvedBy: varchar("approved_by").references(() => users.id, { onDelete: 'set null' }),
  approvedAt: timestamp("approved_at"),
  // UI personalization
  themePreference: themePreferenceEnum("theme_preference").default("modern"),
  // Team and coverage fields
  department: departmentEnum("department").default("operations"),
  jobTitle: varchar("job_title"),
  skills: text("skills").array().default(sql`ARRAY[]::text[]`), // Array of skill names
  currentWorkload: integer("current_workload").default(50), // Percentage 0-100
  isAvailableForCoverage: text("is_available_for_coverage").default("true"), // "true", "false", or "limited"
  // Vacation balance fields
  customVacationDays: integer("custom_vacation_days"), // Individual vacation days override (NULL = use organization default)
  usedDays: integer("used_days").default(0).notNull(), // Days used from approved requests
  vacationTrackingEnabled: boolean("vacation_tracking_enabled").default(false).notNull(), // Enable/disable vacation balance tracking for user
  // Notification preferences
  notificationPreferences: jsonb("notification_preferences").default(sql`'{
    "channels": {
      "browser": true,
      "email": true
    },
    "types": {
      "vacation_request_submitted": true,
      "vacation_request_approved": true,
      "vacation_request_rejected": true,
      "vacation_conflict_detected": true,
      "pending_request_reminder": true,
      "balance_warning": true,
      "balance_expiring": true
    },
    "soundEnabled": true,
    "browserPermissionGranted": false
  }'::jsonb`),
  // Soft delete support
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vacation request status enum
export const requestStatusEnum = pgEnum("request_status", ["pending", "approved", "rejected"]);

// Vacation requests table
export const vacationRequests = pgTable("vacation_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
  status: requestStatusEnum("status").default("pending"),
  reviewedBy: varchar("reviewed_by").references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp("reviewed_at"),
  // Coverage analysis fields
  coverageRequired: text("coverage_required").array().default(sql`ARRAY[]::text[]`), // Skills/roles needed for coverage
  priority: priorityLevelEnum("priority").default("medium"),
  workloadImpact: integer("workload_impact").default(50), // 0-100 percentage of workload impact
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: notificationStatusEnum("status").default("unread"),
  // Related entity references (for context)
  relatedEntityId: varchar("related_entity_id"), // Could be vacation request ID, user ID, etc.
  relatedEntityType: varchar("related_entity_type"), // "vacation_request", "user", etc.
  // Delivery tracking
  deliveryChannels: notificationChannelEnum("delivery_channels").array().default(sql`ARRAY[]::notification_channel[]`),
  browserDelivered: timestamp("browser_delivered"),
  emailDelivered: timestamp("email_delivered"),
  // Action tracking
  actionTaken: varchar("action_taken"), // "clicked", "dismissed", "acted_upon"
  actionTakenAt: timestamp("action_taken_at"),
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`), // Additional context data
  expiresAt: timestamp("expires_at"), // For time-sensitive notifications
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_notifications_user_status").on(table.userId, table.status),
  index("idx_notifications_organization").on(table.organizationId),
  index("idx_notifications_type").on(table.type),
  index("idx_notifications_created_at").on(table.createdAt),
]);

// Holidays table for German public holidays
export const holidays = pgTable("holidays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  date: date("date").notNull(),
  year: integer("year").notNull(),
  isNational: text("is_national").default("true").notNull(), // "true" for nationwide, "false" for regional
  state: varchar("state", { length: 50 }), // For regional holidays (e.g., "BY" for Bavaria)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_holidays_date").on(table.date),
  index("idx_holidays_year").on(table.year),
]);

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  vacationRequests: many(vacationRequests),
  notifications: many(notifications),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  vacationRequests: many(vacationRequests),
  reviewedRequests: many(vacationRequests, {
    relationName: "reviewer",
  }),
  notifications: many(notifications),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [notifications.organizationId],
    references: [organizations.id],
  }),
}));

export const vacationRequestsRelations = relations(vacationRequests, ({ one }) => ({
  user: one(users, {
    fields: [vacationRequests.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [vacationRequests.organizationId],
    references: [organizations.id],
  }),
  reviewer: one(users, {
    fields: [vacationRequests.reviewedBy],
    references: [users.id],
    relationName: "reviewer",
  }),
}));

// Insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVacationRequestSchema = createInsertSchema(vacationRequests).omit({
  id: true,
  organizationId: true,
  status: true,
  reviewedBy: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const updateVacationRequestStatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export const updateUserBalanceSchema = z.object({
  customVacationDays: z.number().int().min(0).max(365).nullable(),
});

export const updateOrganizationSettingsSchema = z.object({
  defaultVacationDays: z.number().int().min(1).max(365).optional(),
  customName: z.string().max(255).optional(),
  logoUrl: z.string().max(500).optional(),
  vacationTrackingEnabled: z.boolean().optional(),
});

// Notification schemas
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const updateNotificationStatusSchema = z.object({
  status: z.enum(["read", "delivered", "failed"]),
  actionTaken: z.enum(["clicked", "dismissed", "acted_upon"]).optional(),
});

export const notificationPreferencesSchema = z.object({
  channels: z.object({
    browser: z.boolean(),
    email: z.boolean(),
  }),
  types: z.object({
    vacation_request_submitted: z.boolean(),
    vacation_request_approved: z.boolean(),
    vacation_request_rejected: z.boolean(),
    vacation_conflict_detected: z.boolean(),
    pending_request_reminder: z.boolean(),
    balance_warning: z.boolean(),
    balance_expiring: z.boolean(),
  }),
  soundEnabled: z.boolean(),
  browserPermissionGranted: z.boolean(),
});

export const updateNotificationPreferencesSchema = z.object({
  notificationPreferences: notificationPreferencesSchema,
});

// Holiday schemas
export const insertHolidaySchema = createInsertSchema(holidays).omit({
  id: true,
  createdAt: true,
});

export const vacationBalanceSchema = z.object({
  totalDays: z.number().int(), // customVacationDays ?? organization.defaultVacationDays
  usedDays: z.number().int(),
  remainingDays: z.number().int(),
});

// Coverage analysis schemas
export const coverageSuggestionSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  score: z.number().min(0).max(100), // Coverage quality score
  reason: z.string(),
  availability: z.enum(["available", "limited", "unavailable"]),
  skillMatch: z.number().min(0).max(100), // Skill compatibility percentage
  workloadImpact: z.number().min(0).max(100), // Impact on current workload
});

export const conflictAnalysisSchema = z.object({
  conflictId: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  affectedUsers: z.array(z.string()),
  conflictDays: z.number().int(),
  coverageGap: z.number().min(0).max(100), // Percentage of coverage missing
  impactMetrics: z.object({
    totalAffectedDays: z.number().int(),
    departmentsAffected: z.array(z.string()),
    criticalRolesAffected: z.array(z.string()),
  }),
  suggestions: z.array(coverageSuggestionSchema),
});

export const teamCoverageAnalysisSchema = z.object({
  dateRange: z.object({
    startDate: z.string(),
    endDate: z.string(),
  }),
  overallCoverage: z.number().min(0).max(100),
  dailyCoverage: z.array(z.object({
    date: z.string(),
    coveragePercentage: z.number().min(0).max(100),
    availableUsers: z.number().int(),
    onVacationUsers: z.number().int(),
    gaps: z.array(z.string()), // Skills/roles with gaps
  })),
  recommendations: z.array(z.string()),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type VacationRequest = typeof vacationRequests.$inferSelect;
export type InsertVacationRequest = z.infer<typeof insertVacationRequestSchema>;
export type UpdateVacationRequestStatus = z.infer<typeof updateVacationRequestStatusSchema>;
export type UpdateUserBalance = z.infer<typeof updateUserBalanceSchema>;
export type VacationBalance = z.infer<typeof vacationBalanceSchema>;

// Notification types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type UpdateNotificationStatus = z.infer<typeof updateNotificationStatusSchema>;
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export type UpdateNotificationPreferences = z.infer<typeof updateNotificationPreferencesSchema>;
export type Holiday = typeof holidays.$inferSelect;
export type InsertHoliday = z.infer<typeof insertHolidaySchema>;

// Coverage analysis types
export type CoverageSuggestion = z.infer<typeof coverageSuggestionSchema>;
export type ConflictAnalysis = z.infer<typeof conflictAnalysisSchema>;
export type TeamCoverageAnalysis = z.infer<typeof teamCoverageAnalysisSchema>;

// Analytics schemas
export const analyticsOverviewSchema = z.object({
  totalEmployees: z.number().int(),
  totalRequests: z.number().int(),
  approvedRequests: z.number().int(),
  pendingRequests: z.number().int(),
  rejectedRequests: z.number().int(),
  totalVacationDays: z.number().int(),
  averageDaysPerEmployee: z.number(),
  utilizationRate: z.number().min(0).max(100),
  approvalRate: z.number().min(0).max(100),
  conflictRate: z.number().min(0).max(100),
  departmentBreakdown: z.array(z.object({
    department: z.string(),
    totalDays: z.number().int(),
    employees: z.number().int(),
    averageDays: z.number(),
    utilizationRate: z.number().min(0).max(100),
  })),
});

export const teamUsageAnalyticsSchema = z.object({
  usageByEmployee: z.array(z.object({
    userId: z.string(),
    name: z.string(),
    department: z.string(),
    totalDays: z.number().int(),
    usedDays: z.number().int(),
    remainingDays: z.number().int(),
    utilizationRate: z.number().min(0).max(100),
    lastVacationDate: z.string().optional(),
  })),
  departmentSummary: z.array(z.object({
    department: z.string(),
    totalEmployees: z.number().int(),
    totalAllocatedDays: z.number().int(),
    totalUsedDays: z.number().int(),
    averageUtilization: z.number().min(0).max(100),
  })),
});

export const vacationTrendsSchema = z.object({
  period: z.enum(["monthly", "quarterly", "yearly"]),
  trends: z.array(z.object({
    period: z.string(),
    requestCount: z.number().int(),
    totalDays: z.number().int(),
    approvalRate: z.number().min(0).max(100),
    averageProcessingTime: z.number(), // in hours
  })),
  seasonalPatterns: z.array(z.object({
    month: z.number().int().min(1).max(12),
    requestCount: z.number().int(),
    totalDays: z.number().int(),
    popularityScore: z.number().min(0).max(100),
  })),
  yearOverYear: z.array(z.object({
    year: z.number().int(),
    totalRequests: z.number().int(),
    totalDays: z.number().int(),
    utilizationRate: z.number().min(0).max(100),
  })),
});

export const departmentComparisonSchema = z.object({
  departments: z.array(z.object({
    department: z.string(),
    totalEmployees: z.number().int(),
    totalRequests: z.number().int(),
    approvedRequests: z.number().int(),
    totalDays: z.number().int(),
    averageDaysPerEmployee: z.number(),
    utilizationRate: z.number().min(0).max(100),
    approvalRate: z.number().min(0).max(100),
    averageProcessingTime: z.number(), // in hours
  })),
  metrics: z.object({
    mostActiveDepart: z.string(),
    leastActiveDepart: z.string(),
    highestUtilization: z.string(),
    lowestUtilization: z.string(),
    fastestApproval: z.string(),
    slowestApproval: z.string(),
  }),
});

export const employeeAnalyticsSchema = z.object({
  employeeInfo: z.object({
    userId: z.string(),
    name: z.string(),
    department: z.string(),
    role: z.string(),
    hireDate: z.string().optional(),
  }),
  vacationSummary: z.object({
    totalAllowance: z.number().int(),
    usedDays: z.number().int(),
    remainingDays: z.number().int(),
    utilizationRate: z.number().min(0).max(100),
  }),
  requestHistory: z.array(z.object({
    id: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    days: z.number().int(),
    status: z.enum(["pending", "approved", "rejected"]),
    reason: z.string().optional(),
    submittedDate: z.string(),
    processedDate: z.string().optional(),
    processingTime: z.number().optional(), // in hours
  })),
  patterns: z.object({
    preferredMonths: z.array(z.number().int().min(1).max(12)),
    averageRequestLength: z.number(),
    planningSeason: z.string(), // "early", "mid", "late"
    vacationFrequency: z.number(), // requests per year
  }),
});

export const utilizationMetricsSchema = z.object({
  overall: z.object({
    totalAllowance: z.number().int(),
    totalUsed: z.number().int(),
    utilizationRate: z.number().min(0).max(100),
    unused_liability: z.number().int(),
  }),
  byMonth: z.array(z.object({
    month: z.number().int().min(1).max(12),
    monthName: z.string(),
    daysUsed: z.number().int(),
    utilizationRate: z.number().min(0).max(100),
    coverageLevel: z.enum(["high", "medium", "low", "critical"]),
  })),
  riskMetrics: z.object({
    underutilizers: z.number().int(), // employees using < 50% allowance
    overutilizers: z.number().int(), // employees approaching 100%
    lastMinuteBookings: z.number().int(), // requests made < 7 days in advance
    conflictProne: z.number().int(), // requests causing conflicts
  }),
});

export const vacationPatternsSchema = z.object({
  peakPeriods: z.array(z.object({
    startDate: z.string(),
    endDate: z.string(),
    requestCount: z.number().int(),
    utilizationRate: z.number().min(0).max(100),
    severity: z.enum(["low", "medium", "high", "critical"]),
  })),
  seasonalityAnalysis: z.object({
    summer: z.object({ percentage: z.number(), rank: z.number() }),
    winter: z.object({ percentage: z.number(), rank: z.number() }),
    spring: z.object({ percentage: z.number(), rank: z.number() }),
    fall: z.object({ percentage: z.number(), rank: z.number() }),
  }),
  commonDurations: z.array(z.object({
    days: z.number().int(),
    count: z.number().int(),
    percentage: z.number().min(0).max(100),
  })),
  planningLeadTime: z.object({
    average: z.number(), // days in advance
    median: z.number(),
    distribution: z.array(z.object({
      range: z.string(), // "0-7 days", "1-2 weeks", etc.
      count: z.number().int(),
      percentage: z.number().min(0).max(100),
    })),
  }),
});

export const processingMetricsSchema = z.object({
  approvalMetrics: z.object({
    averageProcessingTime: z.number(), // in hours
    medianProcessingTime: z.number(),
    approvalRate: z.number().min(0).max(100),
    rejectionRate: z.number().min(0).max(100),
  }),
  timeToApproval: z.array(z.object({
    timeRange: z.string(), // "<24h", "1-3 days", etc.
    count: z.number().int(),
    percentage: z.number().min(0).max(100),
  })),
  bottlenecks: z.array(z.object({
    department: z.string(),
    averageDelay: z.number(), // in hours
    pendingCount: z.number().int(),
    severity: z.enum(["low", "medium", "high"]),
  })),
  reviewerWorkload: z.array(z.object({
    reviewerId: z.string(),
    reviewerName: z.string(),
    requestsReviewed: z.number().int(),
    averageProcessingTime: z.number(),
    workloadScore: z.number().min(0).max(100),
  })),
});

// Extended types with relations
export type UserWithOrganization = User & {
  organization?: Organization;
};

export type VacationRequestWithUser = VacationRequest & {
  user: User | null;
  reviewer?: User;
};

export type VacationRequestWithConflictAnalysis = VacationRequestWithUser & {
  conflictAnalysis?: ConflictAnalysis;
  coverageSuggestions?: CoverageSuggestion[];
};

// Analytics types
export type AnalyticsOverview = z.infer<typeof analyticsOverviewSchema>;
export type TeamUsageAnalytics = z.infer<typeof teamUsageAnalyticsSchema>;
export type VacationTrends = z.infer<typeof vacationTrendsSchema>;
export type DepartmentComparison = z.infer<typeof departmentComparisonSchema>;
export type EmployeeAnalytics = z.infer<typeof employeeAnalyticsSchema>;
export type UtilizationMetrics = z.infer<typeof utilizationMetricsSchema>;
export type VacationPatterns = z.infer<typeof vacationPatternsSchema>;
export type ProcessingMetrics = z.infer<typeof processingMetricsSchema>;

// Theme preference schema
export const updateThemePreferenceSchema = z.object({
  themePreference: z.enum(["modern", "elegant", "vibrant"]),
});

export type UpdateThemePreference = z.infer<typeof updateThemePreferenceSchema>;

// Authentication schemas
export const registerUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  organizationName: z.string().min(1, "Organization name is required").max(255),
  organizationId: z.string().optional(),
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const approveUserSchema = z.object({
  userId: z.string(),
  role: z.enum(["admin", "employee"]).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["tenant_admin", "admin", "employee"]),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["pending", "approved", "suspended"]),
});

// Authentication types
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type ApproveUser = z.infer<typeof approveUserSchema>;
export type UpdateUserRole = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserStatus = z.infer<typeof updateUserStatusSchema>;
