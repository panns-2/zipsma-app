const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'zip-sma',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function checkSettings() {
  const schoolId = 'PANNS290';
  const settingsRef = db.collection('schools').doc(schoolId).collection('settings').doc('feeReminders');
  
  try {
      const docSnap = await settingsRef.get();
      if (docSnap.exists) {
          console.log('--- Fee Reminder Settings ---');
          console.log(JSON.stringify(docSnap.data(), null, 2));
          
          const now = new Date();
          console.log('\n--- Current System Time ---');
          console.log(`ISO: ${now.toISOString()}`);
          console.log(`UTC Hour: ${now.getUTCHours()}`);
          console.log(`UTC Minute: ${now.getUTCMinutes()}`);
          console.log(`UTC Day: ${now.getUTCDay()}`);
          
          // Check for most recent logs too
          const logsRef = db.collection('cron_logs')
            .where('schoolId', 'in', ['global', schoolId])
            .orderBy('timestamp', 'desc')
            .limit(5);
          
          const logsSnap = await logsRef.get();
          console.log('\n--- Recent Logs ---');
          logsSnap.forEach(doc => {
              const data = doc.data();
              console.log(`${data.timestamp} | Manual: ${data.manual} | Sent: ${data.totalSent} | Error: ${data.error || 'None'}`);
          });

      } else {
          console.log('No settings found for PANNS290');
      }
  } catch(err) {
      console.error(err);
  }
}

checkSettings();
