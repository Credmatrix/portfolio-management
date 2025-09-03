"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    Bell,
    CheckCircle,
    AlertTriangle,
    Info,
    X,
    Settings,
    Volume2,
    VolumeX,
    Smartphone
} from "lucide-react";

interface NotificationPreferences {
    browser_notifications: boolean;
    email_notifications: boolean;
    sms_notifications: boolean;
    sound_enabled: boolean;
    notification_types: {
        processing_complete: boolean;
        processing_failed: boolean;
        retry_started: boolean;
        queue_position_update: boolean;
        system_alerts: boolean;
    };
    quiet_hours: {
        enabled: boolean;
        start_time: string;
        end_time: string;
    };
}

interface ProcessingNotification {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    request_id?: string;
    company_name?: string;
    timestamp: string;
    read: boolean;
    actions?: Array<{
        label: string;
        action: string;
        variant?: 'primary' | 'secondary';
    }>;
}

interface NotificationSystemProps {
    requestId?: string;
    onNotificationAction?: (action: string, notificationId: string) => void;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
    browser_notifications: true,
    email_notifications: false,
    sms_notifications: false,
    sound_enabled: true,
    notification_types: {
        processing_complete: true,
        processing_failed: true,
        retry_started: true,
        queue_position_update: false,
        system_alerts: true
    },
    quiet_hours: {
        enabled: false,
        start_time: '22:00',
        end_time: '08:00'
    }
};

export function NotificationSystem({
    requestId,
    onNotificationAction
}: NotificationSystemProps) {
    const [notifications, setNotifications] = useState<ProcessingNotification[]>([]);
    const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
    const [showSettings, setShowSettings] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        loadPreferences();
        checkNotificationPermission();
        setupWebSocketConnection();
        loadNotifications();

        // Create audio element for notification sounds
        audioRef.current = new Audio('/sounds/notification.mp3');
        audioRef.current.volume = 0.5;

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    useEffect(() => {
        const unread = notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
    }, [notifications]);

    const loadPreferences = async () => {
        try {
            const response = await fetch('/api/user/notification-preferences');
            if (response.ok) {
                const prefs = await response.json();
                setPreferences({ ...DEFAULT_PREFERENCES, ...prefs });
            }
        } catch (error) {
            console.error('Failed to load notification preferences:', error);
        }
    };

    const savePreferences = async (newPreferences: NotificationPreferences) => {
        try {
            const response = await fetch('/api/user/notification-preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newPreferences)
            });

            if (response.ok) {
                setPreferences(newPreferences);
            }
        } catch (error) {
            console.error('Failed to save notification preferences:', error);
        }
    };

    const checkNotificationPermission = () => {
        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
        }
    };

    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);

            if (permission === 'granted') {
                setPreferences(prev => ({
                    ...prev,
                    browser_notifications: true
                }));
            }
        }
    };

    const setupWebSocketConnection = () => {
        try {
            const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws/notifications${requestId ? `?request_id=${requestId}` : ''}`;
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                setIsConnected(true);
            };

            wsRef.current.onmessage = (event) => {
                const notification = JSON.parse(event.data);
                handleNewNotification(notification);
            };

            wsRef.current.onclose = () => {
                setIsConnected(false);
                // Attempt to reconnect after 5 seconds
                setTimeout(setupWebSocketConnection, 5000);
            };

            wsRef.current.onerror = () => {
                setIsConnected(false);
            };
        } catch (error) {
            console.error('Failed to setup WebSocket connection:', error);
        }
    };

    const loadNotifications = async () => {
        try {
            const url = requestId
                ? `/api/notifications?request_id=${requestId}`
                : '/api/notifications';

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    };

    const handleNewNotification = (notification: ProcessingNotification) => {
        setNotifications(prev => [notification, ...prev]);

        // Check if we should show this notification type
        const shouldShow = preferences.notification_types[
            notification.type as keyof typeof preferences.notification_types
        ];

        if (!shouldShow) return;

        // Check quiet hours
        if (preferences.quiet_hours.enabled && isInQuietHours()) {
            return;
        }

        // Show browser notification
        if (preferences.browser_notifications && permissionStatus === 'granted') {
            showBrowserNotification(notification);
        }

        // Play sound
        if (preferences.sound_enabled && audioRef.current) {
            audioRef.current.play().catch(() => {
                // Ignore audio play errors (user interaction required)
            });
        }
    };

    const isInQuietHours = (): boolean => {
        if (!preferences.quiet_hours.enabled) return false;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const [startHour, startMin] = preferences.quiet_hours.start_time.split(':').map(Number);
        const [endHour, endMin] = preferences.quiet_hours.end_time.split(':').map(Number);

        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        if (startTime <= endTime) {
            return currentTime >= startTime && currentTime <= endTime;
        } else {
            // Quiet hours span midnight
            return currentTime >= startTime || currentTime <= endTime;
        }
    };

    const showBrowserNotification = (notification: ProcessingNotification) => {
        const browserNotification = new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id,
            requireInteraction: notification.type === 'error'
        });

        browserNotification.onclick = () => {
            window.focus();
            markAsRead(notification.id);

            if (notification.request_id) {
                window.open(`/portfolio/${notification.request_id}`, '_blank');
            }
        };

        // Auto-close after 5 seconds for non-error notifications
        if (notification.type !== 'error') {
            setTimeout(() => {
                browserNotification.close();
            }, 5000);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT'
            });

            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications/read-all', {
                method: 'PUT'
            });

            setNotifications(prev =>
                prev.map(n => ({ ...n, read: true }))
            );
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const dismissNotification = (notificationId: string) => {
        setNotifications(prev =>
            prev.filter(n => n.id !== notificationId)
        );
    };

    const handleNotificationAction = (action: string, notificationId: string) => {
        onNotificationAction?.(action, notificationId);

        if (action === 'dismiss') {
            dismissNotification(notificationId);
        } else if (action === 'mark_read') {
            markAsRead(notificationId);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-4 h-4 text-fluent-success" />;
            case 'error':
                return <AlertTriangle className="w-4 h-4 text-fluent-error" />;
            case 'warning':
                return <AlertTriangle className="w-4 h-4 text-fluent-warning" />;
            default:
                return <Info className="w-4 h-4 text-fluent-blue" />;
        }
    };

    const formatTimestamp = (timestamp: string): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-4">
            {/* Notification Header */}
            <Card className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Bell className="w-5 h-5 text-neutral-60" />
                            {unreadCount > 0 && (
                                <Badge
                                    variant="error"
                                    className="absolute -top-2 -right-2 min-w-[1.25rem] h-5 text-xs flex items-center justify-center"
                                >
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Badge>
                            )}
                        </div>

                        <div>
                            <h3 className="font-medium text-neutral-90">
                                Notifications
                            </h3>
                            <p className="text-xs text-neutral-60">
                                {isConnected ? 'Real-time updates enabled' : 'Connecting...'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {permissionStatus === 'default' && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={requestNotificationPermission}
                            >
                                Enable Notifications
                            </Button>
                        )}

                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllAsRead}
                            >
                                Mark All Read
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSettings(!showSettings)}
                        >
                            <Settings className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Notification Settings */}
            {showSettings && (
                <Card className="p-4">
                    <h4 className="font-medium text-neutral-90 mb-4">
                        Notification Settings
                    </h4>

                    <div className="space-y-4">
                        {/* Notification Channels */}
                        <div>
                            <h5 className="text-sm font-medium text-neutral-70 mb-2">
                                Notification Channels
                            </h5>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={preferences.browser_notifications}
                                        onChange={(e) => setPreferences(prev => ({
                                            ...prev,
                                            browser_notifications: e.target.checked
                                        }))}
                                        disabled={permissionStatus !== 'granted'}
                                    />
                                    <Smartphone className="w-4 h-4" />
                                    <span className="text-sm">Browser Notifications</span>
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={preferences.sound_enabled}
                                        onChange={(e) => setPreferences(prev => ({
                                            ...prev,
                                            sound_enabled: e.target.checked
                                        }))}
                                    />
                                    {preferences.sound_enabled ? (
                                        <Volume2 className="w-4 h-4" />
                                    ) : (
                                        <VolumeX className="w-4 h-4" />
                                    )}
                                    <span className="text-sm">Sound Notifications</span>
                                </label>
                            </div>
                        </div>

                        {/* Notification Types */}
                        <div>
                            <h5 className="text-sm font-medium text-neutral-70 mb-2">
                                Notification Types
                            </h5>
                            <div className="space-y-2">
                                {Object.entries(preferences.notification_types).map(([key, enabled]) => (
                                    <label key={key} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={enabled}
                                            onChange={(e) => setPreferences(prev => ({
                                                ...prev,
                                                notification_types: {
                                                    ...prev.notification_types,
                                                    [key]: e.target.checked
                                                }
                                            }))}
                                        />
                                        <span className="text-sm capitalize">
                                            {key.replace(/_/g, ' ')}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-neutral-20">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                    savePreferences(preferences);
                                    setShowSettings(false);
                                }}
                            >
                                Save Settings
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowSettings(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Notifications List */}
            <Card className="p-4">
                {notifications.length === 0 ? (
                    <div className="text-center py-8">
                        <Bell className="w-12 h-12 text-neutral-30 mx-auto mb-4" />
                        <p className="text-neutral-60">No notifications yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.slice(0, 10).map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-3 border rounded-lg transition-colors ${notification.read
                                    ? 'border-neutral-20 bg-neutral-5'
                                    : 'border-fluent-blue/20 bg-fluent-blue/5'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                            <h4 className="text-sm font-medium text-neutral-90">
                                                {notification.title}
                                            </h4>
                                            <div className="flex items-center gap-1 ml-2">
                                                <span className="text-xs text-neutral-50">
                                                    {formatTimestamp(notification.timestamp)}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => dismissNotification(notification.id)}
                                                    className="p-1 h-auto"
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>

                                        <p className="text-sm text-neutral-70 mb-2">
                                            {notification.message}
                                        </p>

                                        {notification.company_name && (
                                            <p className="text-xs text-neutral-50 mb-2">
                                                Company: {notification.company_name}
                                            </p>
                                        )}

                                        {notification.actions && notification.actions.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                {notification.actions.map((action, index) => (
                                                    <Button
                                                        key={index}
                                                        variant={action.variant || 'secondary'}
                                                        size="sm"
                                                        onClick={() => handleNotificationAction(action.action, notification.id)}
                                                    >
                                                        {action.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {notifications.length > 10 && (
                            <div className="text-center pt-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open('/notifications', '_blank')}
                                >
                                    View All Notifications
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
}