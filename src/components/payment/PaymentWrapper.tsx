"use client";

import { useEffect, useRef } from "react";
import { createApp } from "vue";
import PaymentComponent from "@/components/vue/PaymentComponent";

interface PaymentWrapperProps {
  bookingId: string;
  amount: number;
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
}

export default function PaymentWrapper({
  bookingId,
  amount,
  onSuccess,
  onError,
}: PaymentWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const vueAppRef = useRef<any>(null);

  useEffect(() => {
    if (containerRef.current && !vueAppRef.current) {
      // Create Vue app instance
      vueAppRef.current = createApp(PaymentComponent, {
        bookingId,
        amount,
        onSuccess,
        onError,
      });

      // Mount the Vue component
      vueAppRef.current.mount(containerRef.current);
    }

    // Cleanup function
    return () => {
      if (vueAppRef.current) {
        vueAppRef.current.unmount();
        vueAppRef.current = null;
      }
    };
  }, [bookingId, amount, onSuccess, onError]);

  return <div ref={containerRef} className="payment-wrapper" />;
}
