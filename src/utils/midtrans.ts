import { MIDTRANS_CLIENT_KEY, MIDTRANS_SERVER_KEY, MIDTRANS_API_URL } from '../config/midtrans';

/**
 * Midtrans Helper Functions
 */

// Generate unique order ID
export const generateOrderId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `ORDER-${timestamp}-${random}`;
};

// Create Midtrans Snap Token
export const createSnapToken = async (
  orderId: string,
  grossAmount: number,
  customerDetails: {
    first_name: string;
    email: string;
    phone?: string;
  },
  itemDetails: {
    id: string;
    price: number;
    quantity: number;
    name: string;
  }[]
): Promise<{ token: string; redirect_url: string }> => {
  const params = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
    customer_details: customerDetails,
    item_details: itemDetails,
    callbacks: {
      finish: `${window.location.origin}/payment/success`,
      error: `${window.location.origin}/payment/failed`,
      pending: `${window.location.origin}/payment/pending`,
    },
  };

  try {
    // Encode Server Key to Base64
    const authString = btoa(MIDTRANS_SERVER_KEY + ':');

    const response = await fetch(`${MIDTRANS_API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error_messages?.[0] || 'Failed to create payment');
    }

    const data = await response.json();
    return {
      token: data.token,
      redirect_url: data.redirect_url,
    };
  } catch (error: any) {
    console.error('Midtrans Error:', error);
    throw new Error(error.message || 'Failed to create payment');
  }
};

// Load Midtrans Snap Script
export const loadMidtransScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if script already loaded
    if (document.getElementById('midtrans-script')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'midtrans-script';
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Midtrans script'));
    document.head.appendChild(script);
  });
};

// Open Midtrans Snap Payment
export const openMidtransPayment = async (
  snapToken: string,
  onSuccess: (result: any) => void,
  onPending: (result: any) => void,
  onError: (result: any) => void,
  onClose: () => void
): Promise<void> => {
  try {
    await loadMidtransScript();

    // @ts-ignore - Midtrans Snap is loaded via external script
    if (window.snap) {
      // @ts-ignore
      window.snap.pay(snapToken, {
        onSuccess: onSuccess,
        onPending: onPending,
        onError: onError,
        onClose: onClose,
      });
    } else {
      throw new Error('Midtrans Snap not loaded');
    }
  } catch (error) {
    console.error('Payment Error:', error);
    throw error;
  }
};

// Check transaction status
export const checkTransactionStatus = async (orderId: string): Promise<any> => {
  try {
    const authString = btoa(MIDTRANS_SERVER_KEY + ':');

    const response = await fetch(`${MIDTRANS_API_URL}/${orderId}/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check transaction status');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Status Check Error:', error);
    throw new Error(error.message || 'Failed to check transaction status');
  }
};

// Declare window.snap for TypeScript
declare global {
  interface Window {
    snap: any;
  }
}
