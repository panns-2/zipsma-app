
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function getAdmin() {
    const doc = await db.collection('schools').doc('PANNS290').get();
    if (doc.exists) {
        console.log('Admin UID for PANNS290:', doc.data().adminUid);
    } else {
        console.log('School PANNS290 not found');
    }
}

getAdmin();
