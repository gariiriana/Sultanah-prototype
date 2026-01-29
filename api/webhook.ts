import midtransClient from 'midtrans-client';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const notificationJson = req.body;

        let snap = new midtransClient.Snap({
            isProduction: false,
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.VITE_MIDTRANS_CLIENT_KEY
        });

        const statusResponse = await snap.transaction.notification(notificationJson);

        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        console.log(`Transaction notification received. Order ID: ${orderId}. Status: ${transactionStatus}. Fraud: ${fraudStatus}`);

        // LOGIC: Update Firestore status here
        // Example:
        // if (transactionStatus == 'capture') {
        //   if (fraudStatus == 'challenge') { /* status challenge */ } 
        //   else if (fraudStatus == 'accept') { /* status success */ }
        // } else if (transactionStatus == 'settlement') { /* status success */ }
        // else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') { /* status failure */ }

        res.status(200).send('OK');
    } catch (error: any) {
        console.error('Webhook Error:', error);
        res.status(500).json({ error: error.message });
    }
}
