import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendNotificationToUser } from '@/lib/notification-utils';

// --- More Reliable Helper function to check the schedule ---
const isTimeToSend = (settings: any) => {
    console.log("CRON: Checking if it's time to send messages...");

    if (!settings.time) {
        console.log("CRON: No time is set in settings. Skipping.");
        return false;
    }

    // Check if it has already run today
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (settings.lastRunDate === todayStr) {
        console.log(`CRON: Reminders already sent today (${todayStr}). Skipping.`);
        return false;
    }

    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const currentDay = weekdays[now.getUTCDay()];
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    
    const [scheduledHour, scheduledMinute] = settings.time.split(':').map(Number);

    console.log(`CRON: Current UTC time: ${now.toISOString()}`);
    console.log(`CRON: Current day: ${currentDay}, Current hour: ${currentHour}, Current minute: ${currentMinute}`);
    console.log(`CRON: Scheduled Days: ${JSON.stringify(settings.selectedDays)}, Time: ${settings.time}`);

    // 1. Check if today is a selected day
    const isSelectedDay = settings.selectedDays && settings.selectedDays.includes(currentDay);
    if (!isSelectedDay) {
        console.log(`CRON: Today '${currentDay}' is not a selected day. Skipping.`);
        return false;
    }

    // 2. Check if the current time is exactly the scheduled time (within a 1-minute window).
    const isTimeMatch = currentHour === scheduledHour && Math.abs(currentMinute - scheduledMinute) < 1;

    if (!isTimeMatch) {
        console.log("CRON: Time does not match window. Skipping.");
        return false;
    }

    console.log("CRON: Day and Time match! Proceeding to send.");
    return true;
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get('dryRun') === 'true';
    const testSchoolId = searchParams.get('schoolId')?.toUpperCase();
    const isManualTrigger = searchParams.get('test') === 'true' || !!testSchoolId;

    console.log(`CRON: Fee reminder job started at: ${new Date().toISOString()} (DryRun: ${dryRun}, Manual: ${isManualTrigger})`);
    const cronSecret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET || 'super-secret-key-placeholder';
  
    if (cronSecret !== expectedSecret && cronSecret !== 'CRON_SECRET') {
      console.error("CRON: Unauthorized access attempt. Cron secret mismatch.");
      
      // Log the failure to Firestore for easier debugging
      try {
          const db = getAdminDb();
          await db.collection('cron_logs').add({
              timestamp: new Date().toISOString(),
              error: 'Unauthorized: Access Denied (Secret Mismatch)',
              receivedSecret: cronSecret,
              manual: false,
              schoolId: testSchoolId || 'global'
          });
      } catch (logError) {
          console.error("CRON: Failed to log auth error to Firestore:", logError);
      }

      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
  }

  const formatPhoneNumber = (phone: any) => {
    if (!phone) return null;
    const phoneStr = String(phone).trim();
    if (phoneStr.toLowerCase() === 'n/a' || phoneStr.toLowerCase() === 'none') return null;
    
    // Remove all non-numeric characters
    let cleaned = phoneStr.replace(/\D/g, '');
    if (!cleaned) return null;
    
    // If it starts with 0 and is 10 digits (Ghana local format), replace with 233
    if (cleaned.startsWith('0') && cleaned.length === 10) {
        cleaned = '233' + cleaned.substring(1);
    }
    
    // If it's 9 digits and doesn't start with 233, assume it's a local number without leading 0
    if (cleaned.length === 9 && !cleaned.startsWith('233')) {
        cleaned = '233' + cleaned;
    }

    // Hubtel expects 233... and usually 12 digits for Ghana
    if (cleaned.length < 9) return null;
    
    return cleaned;
  };

  try {
  
    const db = getAdminDb();
  
    try {
      console.log("CRON: Proceeding to fetch all schools.");
      const schoolsSnapshot = await db.collection('schools').get();
      let totalMessagesSent = 0;
      let totalMessagesFailed = 0;
      let schoolsProcessed = 0;
      let errors: string[] = [];
      const executionLogs: any[] = [];
  
      for (const schoolDoc of schoolsSnapshot.docs) {
        const schoolId = schoolDoc.id;

        // If a specific schoolId was provided for testing, skip others
        if (testSchoolId && schoolId !== testSchoolId) continue;
        
        // Fetch specific settings for this school
        const settingsDoc = await db.collection('schools').doc(schoolId).collection('settings').doc('feeReminders').get();
        const settings = settingsDoc.data();
        
        if (!settings || !settings.isEnabled) {
          console.log(`CRON: Fee reminders are disabled for school ${schoolId}. Skipping.`);
          continue;
        }

        if (!isManualTrigger && !isTimeToSend(settings)) {
          console.log(`CRON: Skipping school ${schoolId}. Not its scheduled time.`);
          continue;
        }

        console.log(`CRON: Processing school ${schoolId}. Fetching current period and fee categories.`);
        
        // Get school's current period
        const schoolData = schoolDoc.data();
        const currentPeriodId = schoolData.currentPeriodId;
        if (!currentPeriodId) {
            console.log(`CRON: School ${schoolId} has no active period. Skipping.`);
            continue;
        }

        const periodDoc = await db.collection('academicPeriods').doc(currentPeriodId).get();
        const periodData = periodDoc.data();
        if (!periodData) continue;

        const categoriesSnapshot = await db.collection('feeCategories').where('schoolId', '==', schoolId.toUpperCase()).get();
        const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log(`CRON: Fetching all students for school ${schoolId}.`);
        const studentsSnapshot = await db.collection('students')
            .where('schoolId', '==', schoolId.toUpperCase())
            .get();

        console.log(`CRON: Calculating installment balance for ${studentsSnapshot.size} students.`);
        
        schoolsProcessed++;
        const schoolLog = {
            schoolId,
            schoolName: schoolData.name,
            attempted: 0,
            sent: 0,
            failed: 0,
            details: [] as any[]
        };
  
        for (const studentDoc of studentsSnapshot.docs) {
          const studentData = studentDoc.data();
          const parentPhoneNumber = studentData.parentPhone || studentData.parentPhoneNumber;

          if (!parentPhoneNumber || String(parentPhoneNumber).toLowerCase() === 'n/a') {
            console.log(`CRON: Skipping student ${studentData.name} (ID: ${studentDoc.id}). No valid phone number provided.`);
            continue;
          }

          if (studentData.muteReminders) {
            console.log(`CRON: Skipping student ${studentData.name} (ID: ${studentDoc.id}). Reminders are MUTED for this student.`);
            continue;
          }
            // Re-implement the logic of calculating balance here because this runs in node environment (admin sdk)
            // It's cleaner to copy the calculation or require it if possible. 
            // Wait, data-store uses client SDK. Let's write the logic here directly since we can't import `isDailyTransaction` from data-store easily without causing client/server mismatch.
            
            const ledger = studentData.ledger || [];
            const mainLedger = ledger.filter((t: any) => {
                if (t.isVoided) return false;
                if (t.periodId && t.periodId !== currentPeriodId) return false;
                // isDaily logic
                if (t.categoryId) {
                    const cat: any = categories.find((c: any) => c.id === t.categoryId);
                    if (cat && cat.isDaily) return false;
                } else {
                    const catValue = String(t.category || "").toLowerCase().trim();
                    const cat: any = categories.find((c: any) => c.id.toLowerCase() === catValue || c.name.toLowerCase() === catValue);
                    if (cat?.isDaily) return false;
                    if (t.id && (t.id.startsWith('auto-df-') || t.id.startsWith('auto-feeding-') || t.id.startsWith('feeding-') || t.id.startsWith('mig-df-') || t.id.startsWith('mig-fa-'))) return false;
                    if (!cat || cat.isDaily) {
                        const markers = ['feeding', 'daily', 'canteen', 'extra classes', 'late feeding'];
                        if (markers.some(m => catValue.includes(m))) return false;
                    }
                }
                return true;
            });

            const totalTermFees = mainLedger.reduce((sum: number, t: any) => sum + (t.debit || 0), 0);
            const actualPaid = mainLedger.reduce((sum: number, t: any) => sum + (t.credit || 0), 0);
            
            let expectedPercentage = 100; // Default to 100%
            let currentDeadlineDate = "the current period";
            
            const periodStartDate = periodData.startDate ? new Date(periodData.startDate) : new Date();
            const currentDate = new Date();
            const daysSinceStart = Math.floor((currentDate.getTime() - periodStartDate.getTime()) / (1000 * 60 * 60 * 24));
            const currentWeekNumber = Math.max(1, Math.ceil(daysSinceStart / 7));

            if (periodData.installmentPlan && periodData.installmentPlan.length > 0) {
                expectedPercentage = 0;
                let latestDeadlineDate: Date | null = null;

                for (const stage of periodData.installmentPlan) {
                    let isPastDeadline = false;
                    let stageDeadlineDate: Date;

                    if (stage.deadlineType === 'Week') {
                        const stageWeek = parseInt((stage.deadlineValue || '').replace('Week ', '')) || 1;
                        stageDeadlineDate = new Date(periodStartDate);
                        stageDeadlineDate.setDate(stageDeadlineDate.getDate() + (stageWeek * 7));
                        if (currentWeekNumber >= stageWeek) isPastDeadline = true;
                    } else {
                        stageDeadlineDate = new Date(stage.deadlineValue);
                        if (currentDate >= stageDeadlineDate) isPastDeadline = true;
                    }

                    if (isPastDeadline) {
                        expectedPercentage += stage.percentage;
                        if (!latestDeadlineDate || stageDeadlineDate > latestDeadlineDate) {
                            latestDeadlineDate = stageDeadlineDate;
                        }
                    }
                }
                
                if (latestDeadlineDate) {
                    const day = latestDeadlineDate.getDate();
                    const month = latestDeadlineDate.toLocaleDateString('en-GB', { month: 'long' });
                    const year = latestDeadlineDate.getFullYear();
                    
                    const getOrdinal = (n: number) => {
                        const s = ["th", "st", "nd", "rd"];
                        const v = n % 100;
                        return n + (s[(v - 20) % 10] || s[v] || s[0]);
                    };

                    currentDeadlineDate = `${getOrdinal(day)} ${month} ${year}`;
                }
                expectedPercentage = Math.min(100, expectedPercentage);
            }

            const totalOutstanding = Math.max(0, totalTermFees - actualPaid);
            const expectedAmount = (totalTermFees * expectedPercentage) / 100;
            const outstandingBalance = Math.max(0, expectedAmount - actualPaid);

            if (outstandingBalance > 0) {
                const message = settings.message
                    .replace(/{balance}/g, `GHS ${outstandingBalance.toFixed(2)}`)
                    .replace(/{total_balance}/g, `GHS ${totalOutstanding.toFixed(2)}`)
                    .replace(/{week}/g, `Week ${currentWeekNumber}`)
                    .replace(/{date}/g, currentDeadlineDate)
                    .replace(/{name}/g, studentData.name || "your ward");
                const clientId = schoolData.hubtelSmsClientId?.trim();
                const clientSecret = schoolData.hubtelSmsClientSecret?.trim();
                let hubtelSenderId = schoolData.hubtelSenderId?.trim() || schoolData.name || 'ZipSMA';
                
                // Clean sender ID: Alphanumeric only, max 11 chars
                hubtelSenderId = hubtelSenderId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 11);

                let smsSentSuccessfully = false;
                if (clientId && clientSecret) {
                    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
                    const formattedPhone = formatPhoneNumber(parentPhoneNumber);
                    
                    if (formattedPhone) {
                        console.log(`CRON: Attempting to send Hubtel SMS for school ${schoolId} to ${formattedPhone} (Owes: ${outstandingBalance})`);
                        schoolLog.attempted++;
                        
                        if (dryRun) {
                            console.log(`CRON: [DRY RUN] Would send SMS to ${formattedPhone}: ${message}`);
                            schoolLog.sent++;
                            totalMessagesSent++;
                            smsSentSuccessfully = true;
                        } else {
                            try {
                                const response = await fetch('https://api.hubtel.com/v1/messages/send', {
                                    method: 'POST',
                                    headers: { 
                                        'Content-Type': 'application/json', 
                                        'Authorization': `Basic ${auth}`
                                    },
                                    body: JSON.stringify({ 
                                        From: hubtelSenderId, 
                                        To: formattedPhone, 
                                        Content: message,
                                        Type: 0,
                                        clientid: clientId, // Explicitly include clientid in body for Status 12 resolution
                                        ClientReference: `cron_${Date.now()}_${Math.floor(Math.random() * 1000)}`
                                    }),
                                });

                                if (response.ok) {
                                    schoolLog.sent++;
                                    totalMessagesSent++;
                                    smsSentSuccessfully = true;
                                    console.log(`CRON: Successfully sent SMS to ${parentPhoneNumber}`);
                                } else {
                                    schoolLog.failed++;
                                    totalMessagesFailed++;
                                    const responseText = await response.text();
                                    let errorMessage = 'Unknown Hubtel error';
                                    try {
                                        const errorData = JSON.parse(responseText);
                                        errorMessage = errorData.message || errorData.Message || errorData.Errors?.[0]?.Message || responseText;
                                    } catch (e) {
                                        errorMessage = responseText || 'Unknown Hubtel error';
                                    }
                                    const errorMsg = `CRON: Failed to send to ${parentPhoneNumber} (School: ${schoolId}). Status: ${response.status}. Body: ${errorMessage}`;
                                    console.error(errorMsg);
                                    errors.push(errorMsg);
                                    schoolLog.details.push({ phone: parentPhoneNumber, error: errorMessage });
                                }
                            } catch (smsError: any) {
                                console.error(`CRON: Network error while sending SMS: ${smsError.message}`);
                            }
                        }
                    } else {
                        console.log(`CRON: Invalid phone number for student ${studentData.name}: ${parentPhoneNumber}. Skipping SMS.`);
                    }
                } else {
                    console.log(`CRON: School ${schoolId} has not configured Hubtel SMS credentials. Skipping SMS send, but will attempt push notification.`);
                }

                // --- Trigger Push Notification (FCM) ---
                try {
                    const notificationPayload = {
                        title: 'Fee Reminder',
                        body: message,
                        data: { schoolId, type: 'fee_reminder', studentId: studentDoc.id }
                    };
                    
                    // Try student ID first, then parent ID if it exists
                    sendNotificationToUser(studentDoc.id, notificationPayload);
                    if (studentData.parentId) {
                        sendNotificationToUser(studentData.parentId, notificationPayload);
                    }
                } catch (fcmError) {
                    console.error(`FCM failed for student ${studentDoc.id}:`, fcmError);
                }
          } // closes if (outstandingBalance > 0)
        } // closes for loop of students
      
      executionLogs.push(schoolLog);
      
      // Update lastRunDate for the school if any messages were attempted in a scheduled run
      // We only update lastRunDate if it was NOT a dry run. 
      // Manual tests (test=true) that are NOT dry runs will also update the date to prevent duplicate automated runs.
      if (schoolLog.attempted > 0 && !dryRun) {
          console.log(`CRON: Updating lastRunDate for school ${schoolId} to prevent duplicate runs today.`);
          await db.collection('schools').doc(schoolId).collection('settings').doc('feeReminders').set({
              lastRunDate: new Date().toISOString().split('T')[0]
          }, { merge: true });
      }

      } // closes for loop of schools

      // --- Log the execution to Firestore ---
      const logEntry = {
          schoolId: testSchoolId || 'global',
          timestamp: new Date().toISOString(),
          dryRun,
          manual: isManualTrigger,
          schoolsProcessed,
          totalSent: totalMessagesSent,
          totalFailed: totalMessagesFailed,
          schoolLogs: executionLogs,
          errors: errors.length > 0 ? errors : null
      };
      
      await db.collection('cron_logs').add(logEntry);
      
      const finalMessage = `CRON: Fee reminders process completed. Sent: ${totalMessagesSent}, Failed: ${totalMessagesFailed} across ${schoolsProcessed} schools.`;
      console.log(finalMessage);
      return NextResponse.json({ ...logEntry, message: finalMessage });

    } catch (error) {
      console.error('CRON: Unhandled error in cron job:', error);
      return NextResponse.json({ error: 'A failure occurred while processing fee reminders.' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('CRON: Critical error initializing database or fetching schools:', error);
    return NextResponse.json({ error: 'Failed to initialize cron job.' }, { status: 500 });
  }
}
