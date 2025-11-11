import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedInitialTenantAdmin, seedTestOrganization, seedHolidays } from "./seed";

const app = express();

// Trust proxy - required for secure cookies behind nginx
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Seed initial tenant admin
  await seedInitialTenantAdmin();
  
  // Seed test organization with users (both dev and production)
  await seedTestOrganization();
  
  // Seed German holidays for 2025-2030 (both dev and production)
  await seedHolidays();
  
  // Initialize file storage service (supports both Object Storage and local filesystem)
  const { fileStorageService } = await import("./fileStorage");
  await fileStorageService.initialize();
  
  // Register object storage route BEFORE other routes to prevent Vite from catching it
  const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
  const { getObjectAclPolicy } = await import("./objectAcl");
  const { ObjectPermission } = await import("./objectAcl");
  
  // Serve uploaded logos from local filesystem (for production servers without Object Storage)
  app.use('/uploads', express.static('uploads'));
  
  app.get("/objects/*", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      // Check if the object has a public ACL policy
      const aclPolicy = await getObjectAclPolicy(objectFile);
      
      // If it's public, allow access without authentication
      if (aclPolicy?.visibility === "public") {
        return objectStorageService.downloadObject(objectFile, res);
      }
      
      // For private objects, require authentication
      const authReq = req as any;
      if (!authReq.user || !authReq.user.id) {
        return res.sendStatus(401);
      }
      
      const userId = authReq.user.id;
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        return res.sendStatus(401);
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
