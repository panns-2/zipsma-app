import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendNotificationToUser } from '@/lib/notification-utils';

/**
 * Hubtel Status Check API
 * This endpoint allows the app to manually verify a transaction's status.
 * GET /api/hubtel/status?clientReference=REF&schoolId=SCH&studentId=STU&periodId=PER
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const clientReference = searchParams.get('clientReference');
    const transactionIdParam = searchParams.get('transactionId');
    const schoolId = searchParams.get('schoolId');
    const studentId = searchParams.get('studentId');
    const periodId = searchParams.get('periodId') || 'LEGACY_MIGRATION';

    if ((!clientReference && !transactionIdParam) || !schoolId || !studentId) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    try {
        const db = getAdminDb();
        
        let targetStudentId = studentId;
        let targetSchoolId = schoolId;
        let targetPeriodId = periodId;

        let originalAmount = null;

        // 0. If we have a reference starting with PAY-, we resolve the student/school first
        const incomingRef = clientReference || transactionIdParam;
        if (incomingRef && incomingRef.startsWith('PAY-')) {
            console.log(`Manual Verify: Resolving ${incomingRef} from pending_payments`);
            const pendingDoc = await db.collection('pending_payments').doc(incomingRef).get();
            if (pendingDoc.exists) {
                const pData = pendingDoc.data();
                targetStudentId = pData?.studentId || targetStudentId;
                targetSchoolId = pData?.schoolId || targetSchoolId;
                targetPeriodId = pData?.periodId || targetPeriodId;
                originalAmount = pData?.amount;
            }
        }

        if (!targetSchoolId || !targetStudentId) {
            return NextResponse.json({ error: 'Could not resolve school or student for this reference' }, { status: 400 });
        }

        const schoolDoc = await db.collection('schools').doc(targetSchoolId.toUpperCase()).get();

        if (!schoolDoc.exists) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 });
        }

        const schoolData = schoolDoc.data();
        const { hubtelPaymentClientId, hubtelPaymentClientSecret, hubtelMerchantNumber } = schoolData || {};

        if (!hubtelPaymentClientId || !hubtelPaymentClientSecret || !hubtelMerchantNumber) {
            return NextResponse.json({ error: 'Hubtel Payment Gateway is not configured for this school' }, { status: 400 });
        }

        // 1. Fetch status from Hubtel
        const authHeader = Buffer.from(`${hubtelPaymentClientId}:${hubtelPaymentClientSecret}`).toString('base64');
        
        // We prefer checking by transactionId if available, otherwise clientReference
        let hubtelUrl = `https://api.hubtel.com/v1/merchantaccount/merchants/${hubtelMerchantNumber}/transactions/status`;
        if (transactionIdParam) {
            hubtelUrl += `?transactionId=${transactionIdParam}`;
        } else {
            hubtelUrl += `?clientReference=${clientReference}`;
        }

        console.log(`Checking Hubtel status at ${hubtelUrl}`);
        
        const response = await fetch(hubtelUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${authHeader}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: `Hubtel Error: ${response.status}`, details: errorText }, { status: response.status });
        }

        const result = await response.json();
        
        // Handle different Hubtel response formats
        let transaction = null;
        if (Array.isArray(result.Data) && result.Data.length > 0) {
            transaction = result.Data[0];
        } else if (result.Data && !Array.isArray(result.Data)) {
            transaction = result.Data;
        } else if (result.ResponseCode === '0000' || result.status === 'Success') {
            transaction = result;
        }

        if (!transaction) {
            return NextResponse.json({ status: 'not_found', message: 'No transaction found on Hubtel' });
        }

        const status = (transaction as any).Status || (transaction as any).transactionStatus || (transaction as any).status;
        const actualTxId = (transaction as any).TransactionId || (transaction as any).hubtelTransactionId || (transaction as any).transactionId || transactionIdParam;
        const amount = (transaction as any).Amount || (transaction as any).amount || (transaction as any).totalAmount;
        let description = (transaction as any).Description || (transaction as any).description || 'Online Payment (Manual Verification)';

        // Prioritize our stored description which has itemized details
        if (incomingRef && incomingRef.startsWith('PAY-')) {
            const pendingDoc = await db.collection('pending_payments').doc(incomingRef).get();
            if (pendingDoc.exists) {
                const pData = pendingDoc.data();
                if (pData?.description) {
                    description = pData.description;
                }
            }
        }

        const isSuccess = status === 'Success' || status === 'Successful' || result.ResponseCode === '0000' || (transaction as any).ResponseCode === '0000';

        if (isSuccess) {
            // 2. Update the student ledger if successful
            const compositeId = `${schoolId.toUpperCase()}_${studentId.trim().toUpperCase()}`;
            const studentRef = db.collection('students').doc(compositeId);
            const studentDoc = await studentRef.get();

            if (!studentDoc.exists) {
                return NextResponse.json({ error: 'Student not found in database' }, { status: 404 });
            }

            const studentData = studentDoc.data();
            const ledger = studentData?.ledger || [];

            // Check if transaction already exists in ledger to prevent duplicates
            const exists = ledger.some((entry: any) => 
                (actualTxId && entry.reference === actualTxId) || 
                (clientReference && entry.reference === clientReference) || 
                (actualTxId && entry.id === `hubtel_${actualTxId}`)
            );

            if (exists) {
                return NextResponse.json({ 
                    status: 'success', 
                    message: 'Payment was already recorded in your ledger.',
                    transactionId: actualTxId,
                    amount
                });
            }

            const ledgerEntry = {
                id: `hubtel_${actualTxId || Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                description: description,
                type: 'payment',
                category: 'general',
                debit: 0,
                credit: Number(originalAmount || amount) || 0,
                periodId: periodId,
                recordedBy: 'system_hubtel_verify',
                reference: actualTxId || clientReference,
                timestamp: new Date().toISOString()
            };

            await studentRef.update({
                ledger: FieldValue.arrayUnion(ledgerEntry)
            });

            // 3. Trigger Push Notification to Parent
            try {
                const schoolName = schoolData?.name || 'School';
                await sendNotificationToUser(studentId, {
                    title: 'Payment Successful',
                    body: `GH¢${originalAmount || amount} has been received for ${studentData?.firstName || 'your student'}. Thank you!`,
                    data: {
                        type: 'payment_success',
                        studentId: studentId,
                        schoolId: schoolId
                    }
                });
            } catch (notifyError) {
                console.error('Failed to send payment notification:', notifyError);
            }

            return NextResponse.json({ 
                status: 'success', 
                message: 'Payment verified! Your ledger has been updated.',
                transactionId: actualTxId,
                amount
            });
        }

        return NextResponse.json({ 
            status: 'pending_or_failed', 
            hubtelStatus: status,
            message: `Transaction is ${status || 'Pending'}. Please wait a moment and try again.` 
        });

    } catch (error: any) {
        console.error('Status Check Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
