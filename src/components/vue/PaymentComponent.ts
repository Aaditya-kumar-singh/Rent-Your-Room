import { defineComponent, ref, onMounted } from "vue";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
  handler: (response: any) => void;
  modal: {
    ondismiss: () => void;
  };
}

export default defineComponent({
  name: "PaymentComponent",
  props: {
    bookingId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    onSuccess: {
      type: Function,
      required: true,
    },
    onError: {
      type: Function,
      required: true,
    },
  },
  setup(props) {
    const isLoading = ref(false);
    const error = ref("");
    const paymentStatus = ref<"idle" | "processing" | "success" | "failed">(
      "idle"
    );

    const loadRazorpayScript = (): Promise<boolean> => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          resolve(true);
          return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    const createPaymentOrder = async () => {
      try {
        const response = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId: props.bookingId,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(
            result.error?.message || "Failed to create payment order"
          );
        }

        return result.data;
      } catch (err) {
        console.error("Error creating payment order:", err);
        throw err;
      }
    };

    const verifyPayment = async (paymentData: any) => {
      try {
        const response = await fetch("/api/payments/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentData),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(
            result.error?.message || "Payment verification failed"
          );
        }

        return result.data;
      } catch (err) {
        console.error("Error verifying payment:", err);
        throw err;
      }
    };

    const initiatePayment = async () => {
      try {
        isLoading.value = true;
        error.value = "";
        paymentStatus.value = "processing";

        // Load Razorpay script
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error("Failed to load payment gateway");
        }

        // Create payment order
        const orderData = await createPaymentOrder();

        // Configure Razorpay options
        const options: PaymentOptions = {
          key: orderData.key,
          amount: orderData.amount,
          currency: orderData.currency,
          name: orderData.name,
          description: orderData.description,
          order_id: orderData.orderId,
          prefill: orderData.prefill,
          theme: orderData.theme,
          handler: async (response: any) => {
            try {
              // Verify payment on server
              const verificationResult = await verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              paymentStatus.value = "success";
              props.onSuccess(verificationResult);
            } catch (err: any) {
              paymentStatus.value = "failed";
              error.value = err.message;
              props.onError(err.message);
            }
          },
          modal: {
            ondismiss: () => {
              if (paymentStatus.value === "processing") {
                paymentStatus.value = "failed";
                error.value = "Payment cancelled by user";
                props.onError("Payment cancelled by user");
              }
            },
          },
        };

        // Open Razorpay checkout
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } catch (err: any) {
        paymentStatus.value = "failed";
        error.value = err.message;
        props.onError(err.message);
      } finally {
        isLoading.value = false;
      }
    };

    const retryPayment = () => {
      paymentStatus.value = "idle";
      error.value = "";
      initiatePayment();
    };

    return {
      isLoading,
      error,
      paymentStatus,
      initiatePayment,
      retryPayment,
    };
  },
  template: `
    <div class="payment-component">
      <div v-if="paymentStatus === 'idle'" class="payment-idle">
        <div class="payment-summary">
          <h3 class="text-lg font-semibold mb-4">Payment Summary</h3>
          <div class="bg-gray-50 p-4 rounded-lg mb-6">
            <div class="flex justify-between items-center">
              <span class="text-gray-600">Amount to Pay:</span>
              <span class="text-xl font-bold text-green-600">₹{{ amount.toLocaleString() }}</span>
            </div>
          </div>
          <button
            @click="initiatePayment"
            :disabled="isLoading"
            class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="isLoading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
            <span v-else>Pay Now</span>
          </button>
        </div>
      </div>

      <div v-else-if="paymentStatus === 'processing'" class="payment-processing">
        <div class="text-center py-8">
          <div class="animate-spin mx-auto h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
          <h3 class="text-lg font-semibold mb-2">Processing Payment</h3>
          <p class="text-gray-600">Please complete the payment in the popup window</p>
        </div>
      </div>

      <div v-else-if="paymentStatus === 'success'" class="payment-success">
        <div class="text-center py-8">
          <div class="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-green-600 mb-2">Payment Successful!</h3>
          <p class="text-gray-600">Your booking has been confirmed</p>
        </div>
      </div>

      <div v-else-if="paymentStatus === 'failed'" class="payment-failed">
        <div class="text-center py-8">
          <div class="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-red-600 mb-2">Payment Failed</h3>
          <p class="text-gray-600 mb-4">{{ error }}</p>
          <button
            @click="retryPayment"
            class="bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Retry Payment
          </button>
        </div>
      </div>
    </div>
  `,
});
