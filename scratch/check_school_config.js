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

async function checkSchoolConfig() {
  const schoolId = 'PANNS290';
  const schoolRef = db.collection('schools').doc(schoolId);
  
  try {
      const docSnap = await schoolRef.get();
      if (docSnap.exists) {
          const data = docSnap.data();
          console.log('--- School Config ---');
          console.log(`Name: ${data.name}`);
          console.log(`Hubtel Client ID: ${data.hubtelSmsClientId ? 'SET' : 'MISSING'}`);
          console.log(`Hubtel Client Secret: ${data.hubtelSmsClientSecret ? 'SET' : 'MISSING'}`);
          console.log(`Hubtel Sender ID: ${data.hubtelSenderId || 'ZipSMA'}`);
          console.log(`Current Period ID: ${data.currentPeriodId || 'NONE'}`);
      } else {
          console.log('No school found for PANNS290');
      }
  } catch(err) {
      console.error(err);
  }
}

checkSchoolConfig();
