import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/index';
import { getFirebaseConfig } from '@/firebase/config';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

// Initialize Firebase using the project's standard configuration
const { db } = initializeFirebase(getFirebaseConfig());

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { schoolId, message, recipient, specificParent } = body;

        if (!schoolId || !message || !recipient) {
            return NextResponse.json({ error: 'Missing required parameters: schoolId, message, or recipient' }, { status: 400 });
        }

        // 1. Fetch Sendexa credentials from the specific school (e.g., Panns Education Centre)
        const schoolDocRef = doc(db, 'schools', schoolId);
        const schoolDoc = await getDoc(schoolDocRef);
        
        if (!schoolDoc.exists()) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 });
        }
        
        const schoolData = schoolDoc.data();
        const sendexaApiToken = schoolData?.sendexaApiToken;
        const sendexaSenderId = schoolData?.sendexaSenderId;

        if (!sendexaApiToken || !sendexaSenderId) {
            return NextResponse.json({ error: 'Missing Sendexa setup for this school. Please check SMS Gateway settings.' }, { status: 400 });
        }

        // 2. Fetch recipients (only parents of this specific school)
        let targetPhones = new Set<string>();

        if (recipient === 'all') {
            const studentsRef = collection(db, 'students');
            const q = query(studentsRef, where('schoolId', '==', schoolId.toUpperCase()));
            const studentsSnapshot = await getDocs(q);
            studentsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.parentPhone && data.parentPhone.trim() !== '') {
                    targetPhones.add(data.parentPhone.trim());
                }
            });
        } else if (recipient === 'specific' && specificParent) {
            // First check if specificParent is a studentId
            const studentDocRef = doc(db, 'students', specificParent);
            const studentDoc = await getDoc(studentDocRef);
            
            if (studentDoc.exists()) {
                const data = studentDoc.data();
                if (data.schoolId === schoolId.toUpperCase()) {
                    const parentPhone = data.parentPhone;
                    if (parentPhone) targetPhones.add(parentPhone.trim());
                }
            } else {
                 // Try to check if specificParent is a Parent ID grouping
                 const studentsRef = collection(db, 'students');
                 const q = query(studentsRef, 
                     where('schoolId', '==', schoolId.toUpperCase()), 
                     where('parentId', '==', specificParent)
                 );
                 const parentStudentsSnapshot = await getDocs(q);
                 parentStudentsSnapshot.forEach(doc => {
                     const data = doc.data();
                     if (data.parentPhone) targetPhones.add(data.parentPhone.trim());
                 });
            }
        }

        if (targetPhones.size === 0) {
            return NextResponse.json({ error: 'Could not find any valid parent phone numbers to send SMS to.' }, { status: 400 });
        }

        // 3. Send SMS to all valid phones via Sendexa
        let successfulSends = 0;
        let errors: string[] = [];

        for (const phone of targetPhones) {
            try {
                // Use the exact Sendexa v1 endpoint provided by the user
                const response = await fetch('https://api.sendexa.co/v1/sms/send', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Accept': 'application/json',
                        'Authorization': `Basic ${sendexaApiToken}`
                    },
                    body: JSON.stringify({ 
                        from: sendexaSenderId, 
                        to: phone, 
                        message: message 
                    }),
                });

                if (response.ok) {
                    successfulSends++;
                } else {
                    const errorText = await response.text();
                    errors.push(`Status ${response.status}: ${errorText}`);
                }
            } catch (err: any) {
                errors.push(`Network error: ${err.message}`);
            }
        }

        if (successfulSends > 0) {
            return NextResponse.json({ 
                success: true, 
                message: `Successfully sent SMS to ${successfulSends} recipient(s). ${errors.length > 0 ? `Failed: ${errors.length}` : ''}`
            });
        } else {
            return NextResponse.json({ 
                error: `SMS sending failed: ${errors[0] || 'Unknown error'}. Check Sendexa credentials/balance.` 
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('API /sms/send exception:', error);
        return NextResponse.json({ error: error.message || 'Internal server error while processing SMS.' }, { status: 500 });
    }
}
