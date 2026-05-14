import { getAdminMessaging, getAdminDb } from './firebase-admin';

export interface NotificationPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
}

/**
 * Sends a push notification to all devices registered for a specific user ID.
 */
export async function sendNotificationToUser(userId: string, payload: NotificationPayload) {
    try {
        const db = getAdminDb();
        const messaging = getAdminMessaging();
        
        const tokenDoc = await db.collection('fcm_tokens').doc(userId).get();
        
        if (!tokenDoc.exists) {
            console.log(`No FCM tokens found for user: ${userId}`);
            return { success: false, reason: 'no_tokens' };
        }

        const data = tokenDoc.data();
        const tokens: string[] = data?.tokens || [];

        if (tokens.length === 0) {
            return { success: false, reason: 'empty_tokens' };
        }

        const message = {
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data || {},
            tokens: tokens,
            android: {
                notification: {
                    sound: 'default',
                    priority: 'high' as const,
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                    },
                },
            },
        };

        const response = await messaging.sendEachForMulticast(message);
        
        // Clean up invalid tokens
        if (response.failureCount > 0) {
            const validTokens = tokens.filter((_, idx) => response.responses[idx].success);
            if (validTokens.length !== tokens.length) {
                await db.collection('fcm_tokens').doc(userId).update({
                    tokens: validTokens
                });
            }
        }

        return { success: true, sentCount: response.successCount };
    } catch (error) {
        console.error('Error sending notification:', error);
        return { success: false, error };
    }
}

/**
 * Sends a notification to all parents of a school.
 */
export async function sendNotificationToAllParents(schoolId: string, payload: NotificationPayload) {
    try {
        const db = getAdminDb();
        const tokensSnapshot = await db.collection('fcm_tokens')
            .where('schoolId', '==', schoolId.toUpperCase())
            .get();

        if (tokensSnapshot.empty) {
            return { success: false, reason: 'no_tokens_in_school' };
        }

        let allTokens: string[] = [];
        tokensSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.tokens) allTokens.push(...data.tokens);
        });

        if (allTokens.length === 0) return { success: false };

        const messaging = getAdminMessaging();
        
        // Messaging.sendEachForMulticast has a limit of 500 tokens per call
        const chunks: string[][] = [];
        for (let i = 0; i < allTokens.length; i += 500) {
            chunks.push(allTokens.slice(i, i + 500));
        }

        let totalSent = 0;
        for (const chunk of chunks) {
            const response = await messaging.sendEachForMulticast({
                notification: {
                    title: payload.title,
                    body: payload.body,
                },
                data: payload.data || {},
                tokens: chunk,
                android: {
                    notification: {
                        sound: 'default',
                        priority: 'high' as const,
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                        },
                    },
                },
            });
            totalSent += response.successCount;
        }

        return { success: true, sentCount: totalSent };
    } catch (error) {
        console.error('Error sending school-wide notification:', error);
        return { success: false, error };
    }
}
