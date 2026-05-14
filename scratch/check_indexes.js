
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkQuery(collectionName, queryFn, label) {
    console.log(`Checking ${label}...`);
    try {
        await queryFn(db.collection(collectionName)).get();
        console.log(`  OK: ${label}`);
    } catch (error) {
        console.log(`  ERROR: ${label}`);
        console.log(error.message);
    }
}

async function run() {
    const schoolId = 'PANNS290'; // Use a representative schoolId

    await checkQuery('students', c => c.where('schoolId', '==', schoolId).where('className', '==', 'Kg 1'), 'Students by Class');
    await checkQuery('students', c => c.where('schoolId', 'in', [schoolId, schoolId.toUpperCase()]).where('studentId', '==', 'S001'), 'Resolve Student (In)');
    await checkQuery('expenditures', c => c.where('schoolId', '==', schoolId).where('periodId', '==', 'some-period'), 'Expenditures by Period');
    await checkQuery('debts', c => c.where('schoolId', '==', schoolId).where('periodId', '==', 'some-period'), 'Debts by Period');
    await checkQuery('studentReports', c => c.where('schoolId', '==', schoolId).where('periodId', '==', 'some-period').where('className', '==', 'Kg 1'), 'Reports by Class');

    process.exit(0);
}

run();
