
const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: 'zip-sma',
            clientEmail: 'firebase-adminsdk-fbsvc@zip-sma.iam.gserviceaccount.com',
            privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCkxrWTK0O0UvjN\noX5jFeChXuHkYJW/Cf6Kpo5g1Jp8OK70NBt2dwEgoze1TWDwR6SRBHDZXQ2n9Okl\nojB2SAUfNUvbTUQWGRht1pQARg/+O0AqFE74CzRvCkZ+oS21JY9CmTRdBYEefKhx\njVuKOc1jxsw9weqMNgWwOtF88mATglSXFsL2XKErER7ilqNtMpWdb/wcMAqU4EEe\n84xCptlXZuyjv+4XqiPbxDos4clbEHkIOdODhU6XNjLu3mJ0mKJfoc/LpBiEDRqq\nGqYkeY60Z0EDBdL0j9dVx8Oih+bGnOwnRMZ8LyPzJIOzVC+ggQ0oj1B0d2fcgQm7\nehBrUwyJAgMBAAECggEAEm6vaXmfAWvWAjwNBSzcK8u54uVntZmlcZbPztwpizjU\ntWOjfifc0UJWMn/9QT5lFdsp0TQ8GVbnwnp3XQaRxXEdqGK8eZOwFxANuU7Hw42W\n5WjP1qZ7jz+r2BwpSUjHfaXhZNXUoPeak4KXxAl9mio8YbIwuHjjP64CDi3sz8cI\nFXepU29M09OL+kDEORNIo88WNUXt6Jp+FzE/veMI6PissP1byZPYJ6K/G1ucvfn9\nKDLIXwhfy2VFpd7NZ5qEaDM1eHUS+B8kqt/X73JBOFxvAuEWwUyO/dAfwmx0/w06\nxR+h5hPUJnogSlMUGhVH0mi7eKrTSNiMGgah7NE86wKBgQDRdu2a3TCQ2KcL9kUk\nwAfEfiNksEkbvLw9AKceKPPV8VFKRFRaPLNhJlC9MGm3IU68ey8LLMTD7PlFFkTt\n5QB+aM5a0+FBKWwgoFPt/YjP9x5Id6rBYH3iz/sokMfAKoAot+x0j0AvA2v8P4/8\n94rdRw7rSGxQ4QzAEFqHB2mSPwKBgQDJYi3R3Iq0ItdPBUV4xNkjgWuuSXX/TUUI\nC9B37mgxoz4ugSCaC0sok0G/qr/9c4dYu6xbqhuZnNsQ4H4yakqc+z69pw+PzZpU\n+TlcT0z0oiotKa1FJAyjJEJtVziUOjO8J09GbgFMidzmZNxCiu3kI85IAxQMXFsM\ndrxj+1EfNwKBgDdAXqZ15+SdMVsHZ++ss5/SAfYCRhaJ70FMFcjv1nm9gMrNQU7Y\nKhzbJXrx9UC4CXPQLnWNJo3jyVC+8gmqWTn+3Ue6EfXFPl9QyzLAqMDql1NYNXNy\nx2H3qHFn1zjKPSoAcd/BFZYRGf/cqFd62GdL4hSP8vpWkq1q4uYxP1izAoGAM5SU\nC9ajKDRsVW8SNjalLzTs8b0bHgMalU8BXFaSFXSsbpjgUtRlscTV6FPBzRcUKaQY\nJ3pQi23jplT5vcv/xGmNzmHF2J1e1Djpej1NhrMqflrYaIctPXQCF6NpeH3X1m9z\nHKT8bDA7hj97MwgGmpKZOVSgg/H72BtpcWpjgs0CgYBXLVmiTWBdF3+xgM9IY4et\nZpPrFYM9chI0ntL0mzdjdYM0oBLrYwlONicN3WgIyTO7T6VfK38xvNSzGbjNxnCo\ OU69QCrV4728E6rVRLCDUM2saGzprP8ub96F/1b4iMSJt4zNJxmEYB8gKXxVs6Lu\nvOEIUUc7G1p4lKFjSJtH9w==\n-----END PRIVATE KEY-----\n'.replace(/\\n/g, '\n')
        })
    });
}

const db = admin.firestore();

async function checkRecentLogs() {
    console.log('Checking recent cron logs...');
    const snapshot = await db.collection('cron_logs').orderBy('timestamp', 'desc').limit(5).get();
    if (snapshot.empty) {
        console.log('No logs found.');
        return;
    }
    snapshot.forEach(doc => {
        console.log(`Log ID: ${doc.id}`);
        console.log(`Data: ${JSON.stringify(doc.data(), null, 2)}`);
    });
}

checkRecentLogs().catch(console.error);
