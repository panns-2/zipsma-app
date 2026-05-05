import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

// --- More Reliable Helper function to check the schedule ---
const isTimeToSend = (settings: any) => {
    console.log("CRON: Checking if it's time to send messages...");

    if (!settings.time) {
        console.log("CRON: No time is set in settings. Sending immediately.");
        return true; // If no time is set, send for backward compatibility.
    }

    // Vercel serverless functions run in UTC. Accra time (GMT) is equivalent to UTC.
    const now = new Date();
    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const currentDay = weekdays[now.getUTCDay()];
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    
    const [scheduledHour, scheduledMinute] = settings.time.split(':').map(Number);

    console.log(`CRON: Current UTC time: ${now.toISOString()}`);
    console.log(`CRON: Current day: ${currentDay}, Current hour: ${currentHour}, Current minute: ${currentMinute}`);
    console.log(`CRON: Scheduled frequency: ${settings.frequency}, Day: ${settings.day}, Time: ${settings.time}`);

    // Check if the current time is within a 5-minute window of the scheduled time to account for minor delays.
    const isTimeMatch = currentHour === scheduledHour && Math.abs(currentMinute - scheduledMinute) < 5;

    if (!isTimeMatch) {
        console.log("CRON: Time does not match. Skipping.");
        return false;
    }

    if (settings.frequency === 'daily') {
        console.log("CRON: Frequency is daily and time matches. Proceeding to send.");
        return true;
    }

    if (settings.frequency === 'weekly') {
        if (currentDay === settings.day) {
            console.log("CRON: Frequency is weekly, day and time match. Proceeding to send.");
            return true;
        } else {
            console.log(`CRON: Frequency is weekly, but current day '${currentDay}' does not match scheduled day '${settings.day}'. Skipping.`);
            return false;
        }
    }
    
    console.log("CRON: No valid frequency matched. Skipping.");
    return false;
};

export async function GET(request: Request) {
    console.log("CRON: Fee reminder job started at:", new Date().toISOString());
    const cronSecret = request.headers.get('x-cron-secret');
  
    if (cronSecret !== process.env.CRON_SECRET) {
      console.error("CRON: Unauthorized access attempt. Cron secret mismatch.");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    const apiToken = process.env.SENDEXA_API_TOKEN;
    const senderId = process.env.SENDEXA_SENDER_ID;
  
    if (!apiToken || !senderId) {
      console.error("CRON: Sendexa credentials are not configured in .env.local");
      return NextResponse.json({ error: 'Sendexa credentials are not configured' }, { status: 500 });
    }
  
    const db = getAdminDb();
  
    try {
      console.log("CRON: Proceeding to fetch all schools.");
      const schoolsSnapshot = await db.collection('schools').get();
      let messagesSent = 0;
      let errors: string[] = [];
  
      for (const schoolDoc of schoolsSnapshot.docs) {
        const schoolId = schoolDoc.id;
        
        // Fetch specific settings for this school
        const settingsDoc = await db.collection('schools').doc(schoolId).collection('settings').doc('feeReminders').get();
        const settings = settingsDoc.data();
        
        if (!settings || !settings.isEnabled) {
          console.log(`CRON: Fee reminders are disabled for school ${schoolId}. Skipping.`);
          continue;
        }

        if (!isTimeToSend(settings)) {
          console.log(`CRON: Skipping school ${schoolId}. Not its scheduled time.`);
          continue;
        }

        console.log(`CRON: Processing school ${schoolId}. Fetching students with balance.`);
        // Note: data-store.ts uses root 'students' collection filtered by schoolId
        const studentsSnapshot = await db.collection('students')
            .where('schoolId', '==', schoolId.toUpperCase())
            .where('balance', '>', 0)
            .get();

        console.log(`CRON: Found ${studentsSnapshot.size} students with outstanding balances for school ${schoolId}.`);
  
        for (const studentDoc of studentsSnapshot.docs) {
          const studentData = studentDoc.data();
          const parentPhoneNumber = studentData.parentPhone || studentData.parentPhoneNumber;
  
          if (parentPhoneNumber) {
            const message = settings.message.replace('{balance}', studentData.balance);
            console.log(`CRON: Attempting to send SMS for school ${schoolId} to ${parentPhoneNumber}`);
  
            const response = await fetch('https://api.sendexa.co/v1/sms/send', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json', 
                'Accept': 'application/json',
                'Authorization': `Basic ${apiToken}`
              },
              body: JSON.stringify({ from: senderId, to: parentPhoneNumber, message: message }),
            });

            if (response.ok) {
                 messagesSent++;
                 console.log(`CRON: Successfully sent SMS to ${parentPhoneNumber}`);
            } else {
                 const errorResult = await response.text();
                 const errorMsg = `CRON: Failed to send to ${parentPhoneNumber} (School: ${schoolId}). Status: ${response.status}. Body: ${errorResult}`;
                 console.error(errorMsg);
                 errors.push(errorMsg);
            }
          }
        }
      }
      
      const finalMessage = `CRON: Fee reminders process completed. Attempted to send ${messagesSent} messages.`;
      console.log(finalMessage);
      return NextResponse.json({ message: finalMessage, errors: errors });

    } catch (error) {
      console.error('CRON: Unhandled error in cron job:', error);
      return NextResponse.json({ error: 'A failure occurred while processing fee reminders.' }, { status: 500 });
    }
}
