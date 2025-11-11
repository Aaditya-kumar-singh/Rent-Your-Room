import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export interface PaymentOrderData {
  amount: number; // Amount in paise (smallest currency unit)
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface PaymentVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Create a payment order with Razorpay
 */
export async function createPaymentOrder(orderData: PaymentOrderData) {
  try {
    const order = await razorpay.orders.create({
      amount: orderData.amount,
      currency: orderData.currency,
      receipt: orderData.receipt,
      notes: orderData.notes,
    });

    return {
      success: true,
      order,
    };
  } catch (error) {
    console.error("Error creating payment order:", error);
    return {
      success: false,
      error: "Failed to create payment order",
    };
  }
}

/**
 * Verify payment signature from Razorpay
 */
export function verifyPaymentSignature(
  verificationData: PaymentVerificationData
): boolean {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      verificationData;

    // Create signature string
    const signatureString = `${razorpay_order_id}|${razorpay_payment_id}`;

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(signatureString)
      .digest("hex");

    return expectedSignature === razorpay_signature;
  } catch (error) {
    console.error("Error verifying payment signature:", error);
    return false;
  }
}

/**
 * Fetch payment details from Razorpay
 */
export async function getPaymentDetails(paymentId: string) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      success: true,
      payment,
    };
  } catch (error) {
    console.error("Error fetching payment details:", error);
    return {
      success: false,
      error: "Failed to fetch payment details",
    };
  }
}

/**
 * Create a refund for a payment
 */
export async function createRefund(paymentId: string, amount?: number) {
  try {
    const refundData: { amount?: number } = {};
    if (amount) {
      refundData.amount = amount;
    }

    const refund = await razorpay.payments.refund(paymentId, refundData);
    return {
      success: true,
      refund,
    };
  } catch (error) {
    console.error("Error creating refund:", error);
    return {
      success: false,
      error: "Failed to create refund",
    };
  }
}

/**
 * Generate receipt ID for payment order
 */
export function generateReceiptId(bookingId: string): string {
  const timestamp = Date.now();
  return `booking_${bookingId}_${timestamp}`;
}

/**
 * Convert amount from rupees to paise
 */
export function convertToPaise(amountInRupees: number): number {
  return Math.round(amountInRupees * 100);
}

/**
 * Convert amount from paise to rupees
 */
export function convertToRupees(amountInPaise: number): number {
  return amountInPaise / 100;
}
