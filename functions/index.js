const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * sendBroadcastPush
 * Admin-only callable function to send FCM notifications to all registered tokens.
 */
exports.sendBroadcastPush = functions.https.onCall(async (data, context) => {
    // 1. Authentication & Authorization Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    // Authorization: Only allow 'kukky@family.com'
    if (context.auth.token.email !== 'kukky@family.com') {
        throw new functions.https.HttpsError('permission-denied', 'Only kukky@family.com can send push notifications.');
    }

    let { title, body, link } = data;
    if (!title || !body) {
        throw new functions.https.HttpsError('invalid-argument', 'Title and Body are required.');
    }

    // Prepend App Name to title
    if (!title.startsWith('[Secret Garden]')) {
        title = `[Secret Garden] ${title}`;
    }

    const db = admin.firestore();

    try {
        // 2. Get all registered tokens
        const tokensSnap = await db.collection('fcm_tokens').get();
        if (tokensSnap.empty) {
            return { success: 0, message: 'No tokens found.' };
        }

        const tokens = tokensSnap.docs.map(doc => doc.data().token).filter(Boolean);

        if (tokens.length === 0) {
            return { success: 0, message: 'No valid tokens.' };
        }

        // 3. Construct Message (More robust structure for web)
        const message = {
            notification: {
                title: title,
                body: body,
            },
            data: {
                title: title,
                body: body,
                url: link || '/'
            },
            webpush: {
                notification: {
                    title: title,
                    body: body,
                    icon: 'assets/icons/icon-192.png',
                    tag: 'secret-garden-push',
                    renotify: true
                },
                fcm_options: {
                    link: link || '/'
                }
            },
            tokens: tokens,
        };

        // 4. Send using Admin SDK
        const response = await admin.messaging().sendEachForMulticast(message);

        // 5. Cleanup invalid tokens
        const tokensToDelete = [];
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                const error = resp.error;
                if (error.code === 'messaging/registration-token-not-registered' ||
                    error.code === 'messaging/invalid-registration-token') {
                    // Find the doc with this token and mark for deletion
                    tokensToDelete.push(tokensSnap.docs[idx].id);
                }
                console.error(`Token ${idx} failure:`, error.code);
            }
        });

        if (tokensToDelete.length > 0) {
            const batch = db.batch();
            tokensToDelete.forEach(id => {
                batch.delete(db.collection('fcm_tokens').doc(id));
            });
            await batch.commit();
            console.log(`Cleaned up ${tokensToDelete.length} invalid tokens.`);
        }

        // 6. Log the result
        await db.collection('push_logs').add({
            title,
            body,
            link,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            successCount: response.successCount,
            failureCount: response.failureCount
        });

        return {
            success: response.successCount,
            failure: response.failureCount
        };

    } catch (error) {
        console.error('Error sending broadcast push:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
