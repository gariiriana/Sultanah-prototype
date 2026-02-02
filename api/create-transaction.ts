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

        // ✅ SWITCH: Use CoreApi instead of Snap
        let core = new midtransClient.CoreApi({
            isProduction: false,
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.VITE_MIDTRANS_CLIENT_KEY
        });

        // ✅ CONSTRUCT PARAMETERS BASED ON PAYMENT TYPE
        let parameter: any = {
            payment_type: paymentType || 'bank_transfer',
            transaction_details: {
                order_id: orderId,
                gross_amount: grossAmount
            },
            customer_details: {
                first_name: customerDetails.name,
                email: customerDetails.email,
                phone: customerDetails.phone
            }
        };

        // Add specific parameters based on payment type
        if (paymentType === 'bank_transfer') {
            if (bank === 'permata') {
                parameter.payment_type = 'permata'; // Midtrans specific for Permata
            } else if (bank === 'mandiri') {
                parameter.payment_type = 'echannel'; // Midtrans specific for Mandiri Bill
                parameter.echannel = {
                    bill_info1: "Payment For:",
                    bill_info2: "Umroh Package"
                };
            } else {
                // BCA, BNI, BRI
                parameter.bank_transfer = {
                    bank: bank
                };
            }
        } else if (paymentType === 'gopay') {
            parameter.payment_type = 'gopay';
        } else if (paymentType === 'qris') {
            parameter.payment_type = 'qris';
            parameter.qris = { acquirer: 'gopay' };
        }

        console.log('Creating Core API transaction:', JSON.stringify(parameter, null, 2));

        // ✅ CHARGE TRANSACTION
        const chargeResponse = await core.charge(parameter);

        console.log('Midtrans Core Response:', chargeResponse);
        res.status(200).json(chargeResponse);

    } catch (error: any) {
        console.error('Midtrans Error:', error.message);
        res.status(500).json({
            error: 'Gagal memproses pembayaran',
            details: error.message
        });
    }
}
