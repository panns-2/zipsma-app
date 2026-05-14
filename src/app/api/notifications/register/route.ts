import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
    try {
        const { userId, token, schoolId } = await request.json();

        if (!userId || !token) {
            return NextResponse.json({ error: 'Missing userId or token' }, { status: 400 });
        }

        const db = getAdminDb();
        const tokenRef = db.collection('fcm_tokens').doc(userId);

        await tokenRef.set({
            tokens: FieldValue.arrayUnion(token),
            lastUpdated: FieldValue.serverTimestamp(),
            schoolId: schoolId || 'unknown'
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('FCM Registration Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
