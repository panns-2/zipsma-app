const fs = require('fs');
const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: 'zip-sma',
            clientEmail: 'firebase-adminsdk-fbsvc@zip-sma.iam.gserviceaccount.com',
            privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCkxrWTK0O0UvjN\noX5jFeChXuHkYJW/Cf6Kpo5g1Jp8OK70NBt2dwEgoze1TWDwR6SRBHDZXQ2n9Okl\nojB2SAUfNUvbTUQWGRht1pQARg/+O0AqFE74CzRvCkZ+oS21JY9CmTRdBYEefKhx\njVuKOc1jxsw9weqMNgWwOtF88mATglSXFsL2XKErER7ilqNtMpWdb/wcMAqU4EEe\n84xCptlXZuyjv+4XqiPbxDos4clbEHkIOdODhU6XNjLu3mJ0mKJfoc/LpBiEDRqq\nGqYkeY60Z0EDBdL0j9dVx8Oih+bGnOwnRMZ8LyPzJIOzVC+ggQ0oj1B0d2fcgQm7\nehBrUwyJAgMBAAECggEAEm6vaXmfAWvWAjwNBSzcK8u54uVntZmlcZbPztwpizjU\ntWOjfifc0UJWMn/9QT5lFdsp0TQ8GVbnwnp3XQaRxXEdqGK8eZOwFxANuU7Hw42W\n5WjP1qZ7jz+r2BwpSUjHfaXhZNXUoPeak4KXxAl9mio8YbIwuHjjP64CDi3sz8cI\nFXepU29M09OL+kDEORNIo88WNUXt6Jp+FzE/veMI6PissP1byZPYJ6K/G1ucvfn9\nKDLIXwhfy2VFpd7NZ5qEaDM1eHUS+B8kqt/X73JBOFxvAuEWwUyO/dAfwmx0/w06\nxR+h5hPUJnogSlMUGhVH0mi7eKrTSNiMGgah7NE86wKBgQDRdu2a3TCQ2KcL9kUk\nwAfEfiNksEkbvLw9AKceKPPV8VFKRFRaPLNhJlC9MGm3IU68ey8LLMTD7PlFFkTt\n5QB+aM5a0+FBKWwgoFPt/YjP9x5Id6rBYH3iz/sokMfAKoAot+x0j0AvA2v8P4/8\n94rdRw7rSGxQ4QzAEFqHB2mSPwKBgQDJYi3R3Iq0ItdPBUV4xNkjgWuuSXX/TUUI\nC9B37mgxoz4ugSCaC0sok0G/qr/9c4dYu6xbqhuZnNsQ4H4yakqc+z69pw+PzZpU\n+TlcT0z0oiotKa1FJAyjJEJtVziUOjO8J09GbgFMidzmZNxCiu3kI85IAxQMXFsM\ndrxj+1EfNwKBgDdAXqZ15+SdMVsHZ++ss5/SAfYCRhaJ70FMFcjv1nm9gMrNQU7Y\nKhzbJXrx9UC4CXPQLnWNJo3jyVC+8gmqWTn+3Ue6EfXFPl9QyzLAqMDql1NYNXNy\nx2H3qHFn1zjKPSoAcd/BFZYRGf/cqFd62GdL4hSP8vpWkq1q4uYxP1izAoGAM5SU\nC9ajKDRsVW8SNjalLzTs8b0bHgMalU8BXFaSFXSsbpjgUtRlscTV6FPBzRcUKaQY\nJ3pQi23jplT5vcv/xGmNzmHF2J1e1Djpej1NhrMqflrYaIctPXQCF6NpeH3X1m9z\nHKT8bDA7hj97MwgGmpKZOVSgg/H72BtpcWpjgs0CgYBXLVmiTWBdF3+xgM9IY4et\nZpPrFYM9chI0ntL0mzdjdYM0oBLrYwlONicN3WgIyTO7T6VfK38xvNSzGbjNxnCo\nOU69QCrV4728E6rVRLCDUM2saGzprP8ub96F/1b4iMSJt4zNJxmEYB8gKXxVs6Lu\nvOEIUUc7G1p4lKFjSJtH9w==\n-----END PRIVATE KEY-----\n'.replace(/\\n/g, '\n')
        })
    });
}
const db = admin.firestore();

// 1. Load Backup Data
const backupFile = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\8a40ee34-664b-4b49-94db-cb2307684728\\.system_generated\\steps\\33\\output.txt';
const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
const docs = backupData.documents || [];

// Extract feeding payments by student name
const feedingPaymentsByStudent = {};
docs.forEach(doc => {
    const fields = doc.fields || {};
    const schoolId = fields.schoolId ? fields.schoolId.stringValue : '';
    if (schoolId === 'PANNS290') {
        const name = (fields.name ? fields.name.stringValue : '').trim();
        const ledger = (fields.ledger && fields.ledger.arrayValue && fields.ledger.arrayValue.values) || [];
        ledger.forEach(val => {
            const t = val.mapValue ? val.mapValue.fields : {};
            const credit = parseFloat((t.credit && (t.credit.doubleValue || t.credit.integerValue)) || 0);
            const debit = parseFloat((t.debit && (t.debit.doubleValue || t.debit.integerValue)) || 0);
            const desc = t.description ? t.description.stringValue : '';
            const cat = t.category ? t.category.stringValue : '';
            const date = t.date ? t.date.stringValue : '';
            const rec = t.recordedBy ? t.recordedBy.stringValue : '7prS8z8iPJOAXWBaUjNWaCSM7d03';
            const tid = t.id ? t.id.stringValue : '';

            // Filter for feeding payments
            if (credit > 0 && (desc.toLowerCase().includes('feeding') || cat.toLowerCase().includes('feeding'))) {
                if (!feedingPaymentsByStudent[name]) {
                    feedingPaymentsByStudent[name] = [];
                }
                
                // Determine appropriate periodId based on date
                let periodId = '2025-2026-S6738'; // Default Second Term
                if (date >= '2026-04-27') {
                    periodId = '2025-2026-T6679'; // Third Term
                }

                feedingPaymentsByStudent[name].push({
                    id: tid,
                    date: date,
                    type: 'payment',
                    category: 'Feeding Fee',
                    categoryId: 'UWfEMOA4NjOv3uCevGg4',
                    description: desc || 'Feeding Payment',
                    debit: debit,
                    credit: credit,
                    recordedBy: rec,
                    periodId: periodId
                });
            }
        });
    }
});

console.log('Parsed feeding payments for students:');
Object.keys(feedingPaymentsByStudent).forEach(name => {
    console.log(`- ${name}: ${feedingPaymentsByStudent[name].length} payments`);
});

// 2. Perform restoration in Firestore
async function restore() {
    const studentSnapshot = await db.collection('students').where('schoolId', '==', 'PANNS290').get();
    let totalRestored = 0;
    
    for (const doc of studentSnapshot.docs) {
        const studentData = doc.data();
        const studentName = studentData.name.trim();
        const paymentsToRestore = feedingPaymentsByStudent[studentName];
        
        if (paymentsToRestore && paymentsToRestore.length > 0) {
            const currentLedger = studentData.ledger || [];
            const existingIds = new Set(currentLedger.map(t => t.id).filter(Boolean));
            
            const toAdd = [];
            paymentsToRestore.forEach(p => {
                if (!existingIds.has(p.id)) {
                    toAdd.push(p);
                }
            });
            
            if (toAdd.length > 0) {
                const updatedLedger = [...currentLedger, ...toAdd];
                // Keep ledger sorted by date
                updatedLedger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                
                console.log(`Restoring ${toAdd.length} payments for ${studentName}...`);
                await doc.ref.update({ ledger: updatedLedger });
                totalRestored += toAdd.length;
            } else {
                console.log(`All payments already present for ${studentName}.`);
            }
        }
    }
    
    console.log(`Restoration complete. Total transactions added: ${totalRestored}`);
}

restore().catch(console.error);
