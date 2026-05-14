import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendNotificationToUser } from '@/lib/notification-utils';

// Hubtel Webhook Secret (Optional but recommended for security)
// You can set this in your Hubtel Merchant Portal
const HUBTEL_WEBHOOK_SECRET = process.env.HUBTEL_WEBHOOK_SECRET;

/**
 * Hubtel Callback Handler
 * Hubtel sends a POST request to this endpoint when a transaction status changes.
 */
async function handler(req: Request) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Hubtel Webhook POST received`);
    
    try {
        const bodyText = await req.text();
        console.log(`[${timestamp}] Raw Body:`, bodyText);
        
        let data: any;
        try {
            data = JSON.parse(bodyText);
        } catch (e) {
            console.error(`[${timestamp}] Failed to parse JSON body:`, e);
            return NextResponse.json({ status: 'error', message: 'Invalid JSON' }, { status: 400 });
        }

        // Hubtel sends 'Data' object containing transaction details or flat fields depending on API version
        const { ResponseCode, Data, Status } = data;
        const transaction = Data || data;
        
        // Normalize fields (handle both camelCase and PascalCase)
        const clientReference = transaction.ClientReference || transaction.clientReference;
        const amount = transaction.Amount || transaction.amount || transaction.TotalAmount || transaction.totalAmount;
        const transactionId = transaction.TransactionId || transaction.transactionId || transaction.HubtelTransactionId;
        let description = transaction.Description || transaction.description || 'Online Payment (Hubtel)';
        
        const isSuccess = ResponseCode === "0000" || Status === 'Success' || transaction.Status === 'Success';

        if (isSuccess) {
            const url = new URL(req.url);
            let payRef = url.searchParams.get('payRef');
            let studentId = url.searchParams.get('studentId');
            let schoolId = url.searchParams.get('schoolId');
            let periodId = url.searchParams.get('periodId') || 'U';
            let originalAmount = Number(amount); // Default to Hubtel's amount

            const db = getAdminDb();

            // 1. If we have a payRef (the new system), look up the context
            const actualRef = payRef || clientReference;
            if (actualRef && actualRef.startsWith('PAY-')) {
                console.log(`[${timestamp}] Hubtel Sync: Looking up pending payment ${actualRef}`);
                const pendingDoc = await db.collection('pending_payments').doc(actualRef).get();
                if (pendingDoc.exists) {
                    const pendingData = pendingDoc.data();
                    studentId = pendingData?.studentId;
                    schoolId = pendingData?.schoolId;
                    periodId = pendingData?.periodId || periodId;
                    
                    // Prioritize our stored description which has itemized details
                    if (pendingData?.description) {
                        description = pendingData.description;
                    }

                    // CRITICAL: Use the amount we originally requested, NOT the total including fees
                    if (pendingData?.amount) {
                        console.log(`[${timestamp}] Hubtel Sync: Overriding amount ${amount} with original fee amount ${pendingData.amount}`);
                        originalAmount = pendingData.amount;
                    }
                    
                    console.log(`[${timestamp}] Hubtel Sync: Found context for ${actualRef} -> Student: ${studentId}, School: ${schoolId}`);
                }
            }

            // Fallback parsing for legacy studentId from ClientReference if still missing
            if (!studentId && clientReference) {
                let ref = clientReference;
                if (ref.startsWith('REF-')) ref = ref.substring(4);
                
                if (ref.includes('|')) {
                    const parts = ref.split('|');
                    if (parts.length >= 2) studentId = parts[1];
                } else if (ref.includes('-')) {
                    const lastHyphenIndex = ref.lastIndexOf('-');
                    if (lastHyphenIndex > 0) {
                        studentId = ref.substring(0, lastHyphenIndex);
                    }
                }
            }

            if (!studentId || !schoolId) {
                console.error(`[${timestamp}] Hubtel Sync Error: Could not resolve studentId (${studentId}) or schoolId (${schoolId}) for ref ${actualRef}`);
                return NextResponse.json({ status: 'ignored', message: 'Could not resolve student context' });
            }
            const compositeId = `${schoolId.toUpperCase()}_${studentId.trim().toUpperCase()}`;
            const studentRef = db.collection('students').doc(compositeId);
            const studentDoc = await studentRef.get();

            const ledgerEntry = {
                id: `hubtel_${transactionId || Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                description: description,
                type: 'payment',
                category: 'general',
                debit: 0,
                credit: Number(originalAmount) || 0,
                periodId: periodId,
                recordedBy: 'system_hubtel',
                reference: transactionId || clientReference,
                timestamp: new Date().toISOString()
            };

            if (!studentDoc.exists) {
                // Fallback for old records without schoolId prefix (for migration)
                const fallbackRef = db.collection('students').doc(studentId.trim().toUpperCase());
                const fallbackDoc = await fallbackRef.get();
                
                if (fallbackDoc.exists && fallbackDoc.data()?.schoolId === schoolId.toUpperCase()) {
                    console.log(`[${timestamp}] Hubtel Sync: Using legacy fallback for student ${studentId}`);
                    
                    const ledger = fallbackDoc.data()?.ledger || [];
                    const exists = ledger.some((entry: any) => 
                        (transactionId && (entry.reference === transactionId || entry.id === `hubtel_${transactionId}`)) || 
                        (clientReference && entry.reference === clientReference)
                    );

                    if (exists) {
                        console.log(`[${timestamp}] Hubtel Sync: Transaction ${transactionId || clientReference} already exists in legacy ledger.`);
                        return NextResponse.json({ status: 'success', message: 'Already recorded' });
                    }

                    await fallbackRef.update({
                        ledger: FieldValue.arrayUnion(ledgerEntry)
                    });
                } else {
                    console.error(`[${timestamp}] Hubtel Sync Error: Student ${studentId} not found with composite ID ${compositeId} or legacy ID`);
                    return NextResponse.json({ status: 'error', message: 'Student not found' }, { status: 404 });
                }
            } else {
                const ledger = studentDoc.data()?.ledger || [];
                const exists = ledger.some((entry: any) => 
                    (transactionId && (entry.reference === transactionId || entry.id === `hubtel_${transactionId}`)) || 
                    (clientReference && entry.reference === clientReference)
                );

                if (exists) {
                    console.log(`[${timestamp}] Hubtel Sync: Transaction ${transactionId || clientReference} already exists in ledger.`);
                    return NextResponse.json({ status: 'success', message: 'Already recorded' });
                }

                await studentRef.update({
                    ledger: FieldValue.arrayUnion(ledgerEntry)
                });

                // Trigger Push Notification
                try {
                    await sendNotificationToUser(studentId, {
                        title: 'Payment Received',
                        body: `GH¢${originalAmount} has been credited to the account. Thank you!`,
                        data: {
                            type: 'payment_success',
                            studentId: studentId,
                            schoolId: schoolId
                        }
                    });
                } catch (notifyError) {
                    console.error('Failed to send webhook payment notification:', notifyError);
                }
            }

            console.log(`[${timestamp}] Hubtel Sync Success: Updated ledger for Student: ${studentId}, Amount: GH¢${amount}, Period: ${periodId}, TxId: ${transactionId}`);
            return NextResponse.json({ status: 'success' });
        } else {
            console.log(`[${timestamp}] Hubtel Callback Ignored: Transaction not successful. ResponseCode: ${ResponseCode}, Status: ${Status}, Data.Status: ${Data?.Status}`);
            return NextResponse.json({ status: 'ignored', message: 'Not a success notification' });
        }
    } catch (error: any) {
        console.error(`[${timestamp}] Hubtel Webhook Critical Error:`, error);
        // We still return 200 to Hubtel in most cases to acknowledge receipt, 
        // but 500 for real server errors to trigger retry if Hubtel supports it.
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export { handler as POST };
