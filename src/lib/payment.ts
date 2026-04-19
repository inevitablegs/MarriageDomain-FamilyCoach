/**
 * Razorpay Payment Integration Utility
 */

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  handler: (response: any) => void;
  prefill: {
    name: string;
    email: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const initializePayment = async ({
  amount,
  tierName,
  userProfile,
  onSuccess,
  onCancel,
}: {
  amount: number;
  tierName: string;
  userProfile: { full_name: string; email: string };
  onSuccess: (response: any) => void;
  onCancel?: () => void;
}) => {
  const isLoaded = await loadRazorpay();

  if (!isLoaded) {
    alert('Failed to load payment gateway. Please check your connection.');
    return;
  }

  const options: RazorpayOptions = {
    key: import.meta.env.VITE_TEST_KEY_ID, // Razorpay Test Key ID
    amount: amount * 100, // Razorpay expects amount in paise (1 INR = 100 paise)
    currency: 'INR',
    name: 'MarriageWise',
    description: `Subscription: ${tierName} Plan`,
    image: 'https://cdn.lucide.dev/icons/heart.svg', // Placeholder logo
    handler: (response: any) => {
      // In production, you would send response.razorpay_payment_id to your backend
      // for verification before updating the subscription status.
      console.log('Payment Successful:', response);
      onSuccess(response);
    },
    prefill: {
      name: userProfile.full_name,
      email: userProfile.email,
    },
    notes: {
      plan: tierName,
    },
    theme: {
      color: '#f43f5e', // rose-500
    },
    modal: {
      ondismiss: () => {
        console.log('Payment Modal Dismissed');
        if (onCancel) onCancel();
      },
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};
