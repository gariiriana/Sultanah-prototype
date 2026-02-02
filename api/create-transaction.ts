import midtransClient from 'midtrans-client';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // ✅ NEW: Receive paymentType and bank from frontend
        const { orderId, grossAmount, customerDetails, paymentType, bank } = req.body;

        if (!process.env.MIDTRANS_SERVER_KEY || !process.env.VITE_MIDTRANS_CLIENT_KEY) {
            console.error('Missing Midtrans API Keys');
            return res.status(500).json({ error: 'Server Config Error' });
        }

        // ✅ SWITCH: Use Snap API for Popup
        let snap = new midtransClient.Snap({
            isProduction: false,
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.VITE_MIDTRANS_CLIENT_KEY
        });

        // ✅ CONSTRUCT PARAMETERS (Simplified for Snap)
        let parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: grossAmount
            },
            credit_card: {
                secure: true
            },
            customer_details: {
                first_name: customerDetails.name,
                email: customerDetails.email,
                phone: customerDetails.phone
            }
        };

        console.log('Creating Snap transaction:', JSON.stringify(parameter, null, 2));

        // ✅ CREATE SNAP TRANSACTION
        const transaction = await snap.createTransaction(parameter);

        // transaction token & redirect_url
        console.log('Midtrans Snap Response:', transaction);
        res.status(200).json(transaction);

    } catch (error: any) {
        console.error('Midtrans Error:', error.message);
        res.status(500).json({
            error: 'Gagal memproses pembayaran',
            details: error.message
        });
    }
}
