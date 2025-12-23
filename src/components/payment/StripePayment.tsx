"use client";

import { useEffect, useState, useRef } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";

interface StripePaymentProps {
    bookingId: string;
    amount: number;
    onSuccess: () => void;
    onError: (error: string) => void;
}

const CheckoutForm = ({
    bookingId,
    onSuccess,
    onError,
}: {
    bookingId: string;
    onSuccess: () => void;
    onError: (error: string) => void;
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/rooms/payment/success?bookingId=${bookingId}`,
            },
            redirect: "if_required",
        });

        if (error) {
            setErrorMessage(error.message || "An unknown error occurred");
            onError(error.message || "Payment failed");
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            onSuccess();
        } else {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
            <PaymentElement />
            {errorMessage && (
                <div className="text-red-500 mt-2 text-sm">{errorMessage}</div>
            )}
            <button
                disabled={!stripe || isProcessing}
                className="mt-4 w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                type="submit"
            >
                {isProcessing ? "Processing..." : "Pay Now"}
            </button>
        </form>
    );
};

export default function StripePayment({
    bookingId,
    amount,
    onSuccess,
    onError,
}: StripePaymentProps) {
    const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
    const [clientSecret, setClientSecret] = useState<string>("");

    // Use ref to keep track of execution to prevent double calls in Strict Mode
    const initializedRef = useRef(false);

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        const initialize = async () => {
            try {
                const res = await fetch("/api/payments/create-intent", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ bookingId }),
                });

                const data = await res.json();

                if (data.success && data.data.publishableKey) {
                    setClientSecret(data.data.clientSecret);
                    setStripePromise(loadStripe(data.data.publishableKey));
                } else {
                    onError(data.error?.message || "Failed to initialize payment");
                }
            } catch (err) {
                onError("Network error initializing payment");
            }
        };

        initialize();
    }, [bookingId]); // Removed onError to prevent loops if prop is unstable

    if (!clientSecret || !stripePromise) {
        return (
            <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm
                bookingId={bookingId}
                onSuccess={onSuccess}
                onError={onError}
            />
        </Elements>
    );
}
