"use client";

import { useEffect, useRef } from "react";
// @ts-ignore
import { createApp, App as VueApp } from "vue/dist/vue.esm-bundler.js";
import BookingForm from "@/components/vue/BookingForm";
// Styles might be handled by Vue loader or global CSS, but importing just in case if separate


interface Room {
  _id: string;
  title: string;
  monthlyRent: number;
  location: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  ownerId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

interface BookingFormWrapperProps {
  room: Room;
  onBookingComplete: (booking: { _id: string }) => void;
  onCancel: () => void;
  className?: string;
}

export default function BookingFormWrapper({
  room,
  onBookingComplete,
  onCancel,
  className = "",
}: BookingFormWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const vueAppRef = useRef<VueApp | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let app: VueApp | null = null;

    const mountVueApp = async () => {
      try {
        console.log("Mounting BookingForm Vue app...");

        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!containerRef.current) return;

        // Create Vue app instance
        app = createApp(BookingForm, {
          room,
          onBookingComplete,
          onCancel,
        });

        // Mount the Vue app
        app.mount(containerRef.current);
        vueAppRef.current = app;
        console.log("BookingForm mounted successfully");
      } catch (err) {
        console.error("Failed to mount BookingForm:", err);
      }
    };

    mountVueApp();

    // Cleanup function
    return () => {
      if (vueAppRef.current) {
        vueAppRef.current.unmount();
        vueAppRef.current = null;
      }
    };
  }, [room, onBookingComplete, onCancel]);

  return (
    <div
      ref={containerRef}
      className={`booking-form-wrapper ${className}`}
      style={{ minHeight: '100px' }}
    />
  );
}


