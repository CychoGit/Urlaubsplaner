import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Notification, NotificationPreferences } from '@shared/schema';

interface NotificationMessage {
  type: 'notification' | 'notification_count' | 'error';
  data: any;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  preferences: NotificationPreferences | null;
}

export function useNotifications() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    isConnected: false,
    isLoading: false,
    preferences: null,
  });

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      // Update user preferences with browser permission status
      if (user?.id) {
        await updatePreferences({
          notificationPreferences: {
            ...state.preferences!,
            browserPermissionGranted: granted,
          }
        });
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [user?.id, state.preferences]);

  // Show browser notification
  const showBrowserNotification = useCallback((notification: Notification) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const options: NotificationOptions = {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id,
      data: {
        notificationId: notification.id,
        relatedEntityId: notification.relatedEntityId,
        relatedEntityType: notification.relatedEntityType,
      },
      requireInteraction: notification.type.includes('request') || notification.type.includes('conflict'),
    };

    const browserNotification = new Notification(notification.title, options);

    // Handle notification click
    browserNotification.onclick = () => {
      window.focus();
      
      // Navigate to relevant page based on notification type
      if (notification.relatedEntityType === 'vacation_request') {
        window.location.href = '/requests';
      } else {
        window.location.href = '/dashboard';
      }
      
      // Mark notification as read
      markAsRead(notification.id);
      browserNotification.close();
    };

    // Auto-close notification after 10 seconds unless it requires interaction
    if (!options.requireInteraction) {
      setTimeout(() => {
        browserNotification.close();
      }, 10000);
    }
  }, []);

  // WebSocket connection management
  const connect = useCallback(() => {
    if (!isAuthenticated || !user?.id || ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/notifications/ws`;

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected to notification service');
        setState(prev => ({ ...prev, isConnected: true }));
        setReconnectAttempts(0);

        // SECURITY FIX: Authentication now happens automatically via cookies
        // No need to send client-controlled identity information
        console.log('WebSocket authentication will be handled server-side via session cookies');
      };

      ws.current.onmessage = (event) => {
        try {
          const message: NotificationMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'notification':
              if (message.data.notifications) {
                // Bulk notification update
                setState(prev => ({
                  ...prev,
                  notifications: message.data.notifications
                }));
              } else if (message.data.id) {
                // Single notification
                const notification = message.data as Notification;
                setState(prev => ({
                  ...prev,
                  notifications: [notification, ...prev.notifications.slice(0, 49)] // Keep last 50
                }));

                // Show browser notification and toast
                if (state.preferences?.channels?.browser) {
                  showBrowserNotification(notification);
                }
                
                toast({
                  title: notification.title,
                  description: notification.message,
                  duration: 5000,
                });
              }
              break;

            case 'notification_count':
              setState(prev => ({
                ...prev,
                unreadCount: message.data.unreadCount
              }));
              break;

            case 'error':
              console.error('WebSocket notification error:', message.data.error);
              toast({
                title: 'Benachrichtigungsfehler',
                description: message.data.error,
                variant: 'destructive',
              });
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket connection closed');
        setState(prev => ({ ...prev, isConnected: false }));
        
        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }, [isAuthenticated, user, reconnectAttempts, state.preferences, showBrowserNotification, toast]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    
    setState(prev => ({ ...prev, isConnected: false }));
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (limit = 20, offset = 0) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await fetch(`/api/notifications?limit=${limit}&offset=${offset}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const notifications = await response.json();
      setState(prev => ({
        ...prev,
        notifications: offset === 0 ? notifications : [...prev.notifications, ...notifications],
        isLoading: false
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/count', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }
      
      const { unreadCount } = await response.json();
      setState(prev => ({ ...prev, unreadCount }));
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => 
          n.id === notificationId ? { ...n, status: 'read' as const } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Fetch user notification preferences
  const fetchPreferences = useCallback(async () => {
    try {
      const response = await fetch('/api/user/notification-preferences', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notification preferences');
      }
      
      const preferences = await response.json();
      setState(prev => ({ ...prev, preferences }));
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  }, []);

  // Update notification preferences
  const updatePreferences = useCallback(async (preferences: { notificationPreferences: NotificationPreferences }) => {
    try {
      const response = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }
      
      const updatedUser = await response.json();
      setState(prev => ({ ...prev, preferences: preferences.notificationPreferences }));
      
      toast({
        title: 'Einstellungen gespeichert',
        description: 'Ihre Benachrichtigungseinstellungen wurden aktualisiert.',
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast({
        title: 'Fehler beim Speichern',
        description: 'Die Einstellungen konnten nicht gespeichert werden.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Effects
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      connect();
      fetchNotifications();
      fetchUnreadCount();
      fetchPreferences();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, user?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    fetchPreferences,
    updatePreferences,
    requestNotificationPermission,
  };
}