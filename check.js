require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const studentsCol = collection(db, 'students');
  const q = query(studentsCol, where('schoolId', '==', 'PANNS290'));
  
  try {
      const snap = await getDocs(q);
      console.log(`Found ${snap.docs.length} students for PANNS290`);
      snap.docs.forEach(d => {
          const data = d.data();
          console.log(`- ${d.id}: parentId=${data.parentId}`);
      });
  } catch(err) {
      console.error(err);
  }
}

check();
