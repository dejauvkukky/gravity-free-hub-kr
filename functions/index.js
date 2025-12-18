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

    // Authorization: Only allow 'kukky' or admin UID
    // In this project, 'kukky' is checked by email prefix or name. 
    // Here we can use email or a specific UID if known.
    if (context.auth.token.email !== 'kukky@example.com' && !context.auth.token.email.startsWith('kukky')) {
        throw new functions.https.HttpsError('permission-denied', 'Only kukky can send push notifications.');
    }

    const { title, body, link } = data;
    if (!title || !body) {
        throw new functions.https.HttpsError('invalid-argument', 'Title and Body are required.');
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

        // 3. Construct Message
        const message = {
            notification: {
                title: title,
                body: body,
            },
            data: {
                url: link || '/'
            },
            tokens: tokens,
        };

        // 4. Send using Admin SDK (sendMulticast is efficient for many tokens)
        const response = await admin.messaging().sendMulticast(message);

        // 5. Log the result
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
