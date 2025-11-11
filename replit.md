# Overview

This is a full-stack TypeScript team vacation management application. It enables teams to manage vacation requests, view schedules, and track approvals via a web interface. Key features include role-based access control (admin/employee), organization-based multi-tenancy, and vacation conflict detection. The project aims to provide an intuitive and visually appealing solution for efficient team vacation planning.

# User Preferences

Preferred communication style: Simple, everyday language.

## UI/UX Design Preferences
- **Visual Style**: Modern, eye-catching design with emphasis on visual appeal
- **Gradients**: Prefer gradient backgrounds for buttons and UI elements
- **Animations**: Use smooth transitions and hover effects throughout the interface
- **Shadows**: Implement depth with shadows on interactive elements
- **Button Design**: 
  - Gradient backgrounds with shimmer effects on hover
  - Scale animations (hover: scale-105, active: scale-95)
  - White text on gradient backgrounds for contrast
  - Shadow depth from lg to xl on hover
- **Card Components**: 
  - Enhanced shadows (md to xl on hover)
  - Lift effect on hover (-translate-y-1)
  - Scale animation on hover (1.02)
- **Form Elements**: Glow effects and gradient borders on focus
- **Overall Philosophy**: "Pure eye candy" - maximize visual polish and interactivity

## Documentation Maintenance
- **README.md Updates**: Always update the README.md file when making relevant changes to the application, including:
  - New features or functionality
  - Changes to the technology stack or dependencies
  - Modified API endpoints or database schema
  - Updated installation or setup procedures
  - New development workflows or guidelines
  - Security updates or architectural changes
- Keep the README.md comprehensive and accurate for external developers

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript (Vite)
- **UI Components**: Shadcn/ui (based on Radix UI)
- **Styling**: Tailwind CSS with custom CSS variables
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod validation
- **UI/UX Decisions**: Emphasis on modern design, gradients, animations, shadows, and interactive elements ("Pure eye candy"). Dark mode optimization for various components.

## Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database ORM**: Drizzle ORM (PostgreSQL dialect)
- **Authentication**: Replit's OpenID Connect (OIDC)
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful endpoints with TypeScript interfaces
- **Database Flexibility**: Automatic database detection for Neon PostgreSQL (serverless) or standard PostgreSQL.

## Database Design
- **Multi-tenant Architecture**: Organization-based data separation.
- **Core Tables**: Users (role-based), Organizations, Vacation requests (with approval workflows), Sessions, Holidays.
- **Holiday System**: Integration of German public holidays, including movable ones, with automatic exclusion from vacation day calculations. Custom holidays (Dec 24th, 31st) are also included.
- **Feature Flags**: Organizations have `showVacationBalance` flag (default: false), Users have `showVacationBalance` flag (default: false). Both must be true for vacation balance card to appear on dashboard (two-stage gating).

## Authentication & Authorization
- **Identity Provider**: Replit OIDC.
- **Session Strategy**: Server-side sessions in PostgreSQL.
- **Authorization**: Role-based access control (RBAC) with Admin, Organization Admin, and Employee roles. Specific restrictions on vacation request creation, approval, deletion, and cancellation based on role.
- **Multi-tenancy**: Organization-scoped data access.
- **Data Access**: All authenticated users can read their organization's settings (read-only for employees) to support features like optional vacation balance tracking.

## API Structure
RESTful endpoints categorized by feature:
- `/api/auth/*`
- `/api/organizations/*`
- `/api/vacation-requests/*`
- `/api/team/*`
- `/api/calendar/*`
- `/api/stats/*`
- `/api/holidays`
- Export functions for iCal (individual requests) and CSV (all requests).

## Development Workflow
- **Build System**: Vite (frontend), esbuild (backend).
- **Type Safety**: Shared TypeScript schemas.
- **Database Migrations**: Drizzle Kit.
- **Deployment**: `DEPLOYMENT.md` provides Debian server installation instructions, `systemd` service file, and Nginx reverse proxy configuration.

# External Dependencies

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database.
- **@neondatabase/serverless**: For optimized database connections and connection pooling.
- **pg**: Standard Node.js client for PostgreSQL.

## Authentication Services
- **Replit Identity**: OpenID Connect provider.
- **Passport.js**: Authentication middleware.

## UI Framework
- **Radix UI**: Accessible UI primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide Icons**: Icon library.
- **Shadcn/ui**: Component library built on Radix UI.

## Development Tools
- **Vite**: Frontend build tool.
- **Drizzle Kit**: Database schema management.
- **TypeScript**: Static type checking.

## Runtime Dependencies
- **Express.js**: Node.js web framework.
- **TanStack Query**: Data fetching and caching.
- **Date-fns**: Date manipulation library.
- **Zod**: Schema validation library.