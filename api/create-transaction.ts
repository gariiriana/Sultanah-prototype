import midtransClient from 'midtrans-client';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { orderId, grossAmount, customerDetails } = req.body;

        // Check if environment variables are present
        if (!process.env.MIDTRANS_SERVER_KEY || !process.env.VITE_MIDTRANS_CLIENT_KEY) {
            console.error('Missing Midtrans API Keys in Environment Variables');
            return res.status(500).json({
                error: 'Konfigurasi Server Salah',
                details: 'API Keys Midtrans belum diset di Vercel.'
            });
        }

        // Initialize Midtrans Snap client
        let snap = new midtransClient.Snap({
            isProduction: false,
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

        console.log('Creating transaction for:', { orderId, grossAmount });

        const transaction = await snap.createTransaction(parameter);

        console.log('Midtrans Response:', transaction);
        res.status(200).json(transaction);
    } catch (error: any) {
        console.error('Midtrans Error Detail:', {
            message: error.message,
            stack: error.stack,
            rawError: error
        });
        res.status(500).json({
            error: 'Gagal menghubungi Midtrans',
            details: error.message
        });
    }
}
