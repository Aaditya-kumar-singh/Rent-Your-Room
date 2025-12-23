import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

function getStripeInstance(): Stripe {
    if (stripeInstance) {
        return stripeInstance;
    }

    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Stripe secret key is missing in environment variables");
    }

    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2024-12-18.acacia" as any, // Bypass strict type check for now
        typescript: true,
    });

    return stripeInstance;
}

export async function createPaymentIntent(
    amountInRupees: number,
    currency: string = "inr",
    metadata: Record<string, string> = {}
) {
    try {
        const stripe = getStripeInstance();
        // Stripe expects amount in smallest currency unit (paise for INR)
        const amountInPaise = Math.round(amountInRupees * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInPaise,
            currency: currency.toLowerCase(),
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: metadata,
        });

        return {
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        };
    } catch (error) {
        console.error("Error creating payment intent:", error);
        return {
            success: false,
            error: "Failed to create payment intent",
        };
    }
}

export async function retrievePaymentIntent(paymentIntentId: string) {
    try {
        const stripe = getStripeInstance();
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        return {
            success: true,
            paymentIntent,
        };
    } catch (error) {
        console.error("Error retrieving payment intent:", error);
        return {
            success: false,
            error: "Failed to retrieve payment details",
        };
    }
}
