import midtransClient from 'midtrans-client';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { orderId, grossAmount, customerDetails } = req.body;

        // Initialize Midtrans Snap client
        let snap = new midtransClient.Snap({
            isProduction: false, // Set to true for Production
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.VITE_MIDTRANS_CLIENT_KEY
        });

        let parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: grossAmount
            },
            customer_details: {
                first_name: customerDetails.name,
                email: customerDetails.email,
                phone: customerDetails.phone
            },
            credit_card: {
                secure: true
            }
        };

        const transaction = await snap.createTransaction(parameter);

        res.status(200).json(transaction);
    } catch (error: any) {
        console.error('Midtrans Error:', error);
        res.status(500).json({ error: error.message });
    }
}
