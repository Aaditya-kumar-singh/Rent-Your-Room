"use client";

import { useEffect, useRef } from "react";
import { createApp, App as VueApp } from "vue";
import BookingForm from "@/components/vue/BookingForm";


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

    // Create Vue app instance
    const app = createApp(BookingForm, {
      room,
      onBookingComplete,
      onCancel,
    });

    // Mount the Vue app
    app.mount(containerRef.current);
    vueAppRef.current = app;

    // Cleanup function
    return () => {
      if (vueAppRef.current) {
        vueAppRef.current.unmount();
        vueAppRef.current = null;
      }
    };
  }, [room, onBookingComplete, onCancel]);

  return (
    <div ref={containerRef} className={`booking-form-wrapper ${className}`} />
  );
}
