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

async function listAllLogs() {
  try {
      const logsRef = db.collection('cron_logs')
        .orderBy('timestamp', 'desc')
        .limit(50);
      
      const logsSnap = await logsRef.get();
      console.log('--- Last 50 Logs ---');
      logsSnap.forEach(doc => {
          const data = doc.data();
          console.log(`${data.timestamp} | Manual: ${data.manual} | Sent: ${data.totalSent} | Error: ${data.error || 'None'} | School: ${data.schoolId}`);
      });
  } catch(err) {
      console.error(err);
  }
}

listAllLogs();
