'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFirebase } from '@/firebase/client-provider';
import { getToken, onMessage } from 'firebase/messaging';
import { useToast } from './use-toast';

export function useFCM(userId: string | null, schoolId: string | null) {
    const { messaging } = useFirebase();
    const { toast } = useToast();
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = useCallback(async () => {
        if (!messaging || !userId || typeof window === 'undefined') return false;

        try {
            const status = await Notification.requestPermission();
            setPermission(status);
            
            if (status === 'granted') {
                console.log('Notification permission granted.');
                const token = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
                });

                if (token) {
                    setFcmToken(token);
                    await fetch('/api/notifications/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId, token, schoolId }),
                    });
                    return true;
                }
            } else if (status === 'denied') {
                console.warn('Notification permission denied');
                toast({
                    title: "Notifications Blocked",
                    description: "Please enable notifications in your browser settings to receive alerts.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('An error occurred while retrieving token:', error);
        }
        return false;
    }, [messaging, userId, schoolId, toast]);

    useEffect(() => {
        if (!messaging || !userId || typeof window === 'undefined') return;

        // Auto-initialize if already granted
        if (Notification.permission === 'granted') {
            requestPermission();
        }

        // Handle foreground messages
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);
            
            // 1. Show the toast (in-app)
            toast({
                title: payload.notification?.title || 'New Message',
                description: payload.notification?.body || '',
            });
            
            // 2. Play sound
            try {
                const audio = new Audio('/notification-sound.mp3');
                audio.play().catch(e => console.log('Audio autoplay blocked', e));
            } catch (e) {
                console.log('Audio playback failed', e);
            }

            // 3. Show a native system notification if app is in foreground but user wants system tray visibility
            if (Notification.permission === 'granted') {
                new Notification(payload.notification?.title || 'New Message', {
                    body: payload.notification?.body || '',
                    icon: '/logo.png', // Adjust as needed
                });
            }
        });

        return () => unsubscribe();
    }, [messaging, userId, schoolId, toast, requestPermission]);

    return { fcmToken, permission, requestPermission };
}
