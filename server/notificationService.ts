import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import { type Notification, type InsertNotification, type NotificationPreferences } from '@shared/schema';
import connectPg from 'connect-pg-simple';
import session from 'express-session';
import { parse } from 'cookie';
import { getSession } from './replitAuth';

// WebSocket client interface with authentication info
interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  organizationId?: string;
  isAuthenticated?: boolean;
  sessionId?: string;
}

// Session validation interface
interface SessionData {
  passport?: {
    user?: {
      claims?: {
        sub: string;
        email?: string;
      };
    };
  };
}

// Notification message interface for WebSocket communication
interface NotificationMessage {
  type: 'notification' | 'notification_count' | 'error';
  data: any;
}

export class NotificationService {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();
  private sessionStore: any;

  constructor(server: Server) {
    // Initialize session store for WebSocket authentication
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
    const pgStore = connectPg(session);
    this.sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    });

    // Create WebSocket server on the same HTTP server
    this.wss = new WebSocketServer({ 
      server,
      path: '/api/notifications/ws',
      verifyClient: (info: { origin: string; secure: boolean; req: any }) => {
        // Basic security checks
        const allowedOrigins = process.env.REPLIT_DOMAINS?.split(',') || [];
        const origin = info.req.headers.origin;
        
        // Allow same-origin connections and configured domains
        if (!origin || allowedOrigins.some(domain => origin.includes(domain))) {
          return true;
        }
        
        console.warn('WebSocket connection rejected from unauthorized origin:', origin);
        return false;
      }
    });

    this.setupWebSocketHandlers();
    this.startCleanupInterval();
  }

  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
      console.log('New WebSocket connection established');

      // Authenticate connection immediately using cookies
      this.authenticateConnectionFromCookies(ws, req).then(() => {
        console.log(`WebSocket authenticated for user: ${ws.userId}`);
      }).catch((error) => {
        console.error('WebSocket authentication failed:', error);
        ws.close(1008, 'Authentication failed');
        return;
      });

      // Handle messages from authenticated clients only
      ws.on('message', async (message) => {
        try {
          if (!ws.isAuthenticated || !ws.userId) {
            this.sendError(ws, 'Authentication required');
            return;
          }

          const data = JSON.parse(message.toString());
          await this.handleAuthenticatedMessage(ws, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.removeClient(ws);
        console.log('WebSocket connection closed');
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.removeClient(ws);
      });

      // Send initial ping to test connection
      this.sendMessage(ws, {
        type: 'notification',
        data: { message: 'Connected to notification service' }
      });
    });
  }

  // SECURITY FIX: Authenticate WebSocket connection using server-side session validation
  private async authenticateConnectionFromCookies(ws: AuthenticatedWebSocket, req: any): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Extract session cookie from request headers
        const cookieHeader = req.headers.cookie;
        if (!cookieHeader) {
          reject(new Error('No session cookie found'));
          return;
        }

        // Parse session cookie
        const cookies = parse(cookieHeader);
        const sessionCookieName = 'connect.sid'; // Express-session default
        const sessionCookie = cookies[sessionCookieName];
        
        if (!sessionCookie) {
          reject(new Error('No session cookie found'));
          return;
        }

        // Decode session ID from signed cookie
        const sessionSecret = process.env.SESSION_SECRET!;
        let sessionId: string;
        
        if (sessionCookie.startsWith('s:')) {
          // Signed cookie - verify signature
          const signature = require('cookie-signature');
          const unsigned = signature.unsign(sessionCookie.slice(2), sessionSecret);
          if (unsigned === false) {
            reject(new Error('Invalid session signature'));
            return;
          }
          sessionId = unsigned;
        } else {
          sessionId = sessionCookie;
        }

        // Validate session with session store
        this.sessionStore.get(sessionId, async (err: any, sessionData: SessionData) => {
          if (err) {
            console.error('Session store error:', err);
            reject(new Error('Session validation failed'));
            return;
          }

          if (!sessionData || !sessionData.passport?.user?.claims?.sub) {
            reject(new Error('Invalid or expired session'));
            return;
          }

          // Extract user ID from authenticated session
          const userId = sessionData.passport.user.claims.sub;
          
          try {
            // Get user data from database to verify and get organization
            const user = await storage.getUser(userId);
            if (!user || !user.organizationId) {
              reject(new Error('User not found or not assigned to organization'));
              return;
            }

            // SECURITY: Server-side derived identity only
            ws.userId = user.id;
            ws.organizationId = user.organizationId;
            ws.sessionId = sessionId;
            ws.isAuthenticated = true;
            
            // Add client to authenticated clients map
            this.clients.set(user.id, ws);
            
            // Send success notification and unread count
            this.sendMessage(ws, {
              type: 'notification',
              data: { message: 'Successfully authenticated' }
            });
            
            const unreadCount = await storage.getUnreadNotificationCount(user.id);
            this.sendMessage(ws, {
              type: 'notification_count',
              data: { unreadCount }
            });
            
            resolve();
          } catch (dbError) {
            console.error('Database error during WebSocket auth:', dbError);
            reject(new Error('User validation failed'));
          }
        });
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        reject(error);
      }
    });
  }

  // SECURITY FIX: Handle authenticated messages with proper authorization
  private async handleAuthenticatedMessage(ws: AuthenticatedWebSocket, data: any): Promise<void> {
    // SECURITY: All operations now use server-derived identity only
    if (!ws.userId || !ws.organizationId || !ws.isAuthenticated) {
      this.sendError(ws, 'Authentication required');
      return;
    }

    switch (data.type) {
      case 'mark_read':
        if (data.notificationId) {
          await this.markNotificationAsReadSecure(data.notificationId, ws.userId);
        } else {
          this.sendError(ws, 'Missing notificationId');
        }
        break;
      
      case 'get_notifications':
        await this.sendUserNotifications(ws, ws.userId, data.limit || 20, data.offset || 0);
        break;
        
      case 'ping':
        // Health check
        this.sendMessage(ws, {
          type: 'notification',
          data: { message: 'pong' }
        });
        break;
        
      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  private removeClient(ws: AuthenticatedWebSocket): void {
    if (ws.userId) {
      this.clients.delete(ws.userId);
    }
  }

  private sendMessage(ws: WebSocket, message: NotificationMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string): void {
    this.sendMessage(ws, {
      type: 'error',
      data: { error }
    });
  }

  // Public methods for sending notifications
  public async createAndSendNotification(notificationData: InsertNotification & { userId: string; organizationId: string }): Promise<Notification> {
    try {
      // Create notification in database
      const notification = await storage.createNotification(notificationData);
      
      // Send real-time notification to user if connected
      await this.sendNotificationToUser(notification.userId, notification);
      
      // Update unread count
      await this.sendUnreadCountToUser(notification.userId);
      
      return notification;
    } catch (error) {
      console.error('Error creating and sending notification:', error);
      throw error;
    }
  }

  public async sendNotificationToUser(userId: string, notification: Notification): Promise<void> {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      this.sendMessage(ws, {
        type: 'notification',
        data: notification
      });
      
      // Mark as delivered via browser
      await storage.markNotificationAsDelivered(notification.id, 'browser');
    }
  }

  public async sendUnreadCountToUser(userId: string): Promise<void> {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      const unreadCount = await storage.getUnreadNotificationCount(userId);
      this.sendMessage(ws, {
        type: 'notification_count',
        data: { unreadCount }
      });
    }
  }

  // SECURITY FIX: Secure version with proper authorization checks
  public async sendUserNotifications(ws: AuthenticatedWebSocket, userId: string, limit: number = 20, offset: number = 0): Promise<void> {
    try {
      // SECURITY: Verify WebSocket user matches requested user
      if (ws.userId !== userId) {
        this.sendError(ws, 'Unauthorized: Cannot access other users notifications');
        return;
      }
      
      const notifications = await storage.getNotificationsByUser(userId, limit, offset);
      this.sendMessage(ws, {
        type: 'notification',
        data: { notifications, limit, offset }
      });
    } catch (error) {
      console.error('Error sending user notifications:', error);
      this.sendError(ws, 'Failed to fetch notifications');
    }
  }

  // SECURITY FIX: Secure version with authorization check
  public async markNotificationAsReadSecure(notificationId: string, userId: string): Promise<void> {
    try {
      // SECURITY: Verify user owns this notification before marking as read
      const notification = await storage.getNotification(notificationId);
      if (!notification) {
        throw new Error('Notification not found');
      }
      
      if (notification.userId !== userId) {
        throw new Error('Unauthorized: User does not own this notification');
      }
      
      await storage.markNotificationAsRead(notificationId);
      await this.sendUnreadCountToUser(userId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Keep original method for backward compatibility but add authorization
  public async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    return this.markNotificationAsReadSecure(notificationId, userId);
  }

  // SECURITY FIX: Secure broadcast with server-derived organization check
  public async broadcastToOrganization(organizationId: string, notification: Notification): Promise<void> {
    // SECURITY: Only send to authenticated clients with server-verified organization membership
    for (const [userId, ws] of Array.from(this.clients.entries())) {
      if (ws.isAuthenticated && 
          ws.organizationId === organizationId && 
          ws.readyState === WebSocket.OPEN) {
        
        // Double-check user still belongs to organization (in case of role changes)
        try {
          const user = await storage.getUser(userId);
          if (user && user.organizationId === organizationId) {
            this.sendMessage(ws, {
              type: 'notification',
              data: notification
            });
            
            // Mark as delivered
            await storage.markNotificationAsDelivered(notification.id, 'browser');
          } else {
            // User no longer in organization - remove from clients
            console.log(`Removing user ${userId} from WebSocket clients - organization mismatch`);
            this.clients.delete(userId);
            ws.close(1008, 'Organization membership changed');
          }
        } catch (error) {
          console.error(`Error verifying user ${userId} organization membership:`, error);
        }
      }
    }
  }

  // Cleanup disconnected clients
  private startCleanupInterval(): void {
    setInterval(() => {
      for (const [userId, ws] of Array.from(this.clients.entries())) {
        if (ws.readyState !== WebSocket.OPEN) {
          this.clients.delete(userId);
        }
      }
    }, 30000); // Cleanup every 30 seconds
  }

  // Helper method to create different types of notifications
  public async sendVacationRequestNotification(
    type: 'vacation_request_submitted' | 'vacation_request_approved' | 'vacation_request_rejected',
    userId: string,
    organizationId: string,
    requestId: string,
    requestTitle: string,
    requesterName?: string
  ): Promise<void> {
    const messages = {
      vacation_request_submitted: {
        title: 'Neuer Urlaubsantrag',
        message: `${requesterName} hat einen neuen Urlaubsantrag eingereicht: ${requestTitle}`
      },
      vacation_request_approved: {
        title: 'Urlaubsantrag genehmigt',
        message: `Ihr Urlaubsantrag "${requestTitle}" wurde genehmigt.`
      },
      vacation_request_rejected: {
        title: 'Urlaubsantrag abgelehnt',
        message: `Ihr Urlaubsantrag "${requestTitle}" wurde abgelehnt.`
      }
    };

    const messageData = messages[type];
    
    await this.createAndSendNotification({
      userId,
      organizationId,
      type,
      title: messageData.title,
      message: messageData.message,
      relatedEntityId: requestId,
      relatedEntityType: 'vacation_request',
      deliveryChannels: ['browser'],
      metadata: { requestId, requestTitle }
    });
  }

  public getConnectedClients(): number {
    return this.clients.size;
  }

  public getUserConnection(userId: string): AuthenticatedWebSocket | undefined {
    return this.clients.get(userId);
  }
}

// Singleton instance
let notificationService: NotificationService | null = null;

export function createNotificationService(server: Server): NotificationService {
  if (!notificationService) {
    notificationService = new NotificationService(server);
  }
  return notificationService;
}

export function getNotificationService(): NotificationService {
  if (!notificationService) {
    throw new Error('Notification service not initialized');
  }
  return notificationService;
}