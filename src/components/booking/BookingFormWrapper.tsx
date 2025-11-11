"use client";

import { useEffect, useRef } from "react";
import { createApp, App as VueApp } from "vue";
import BookingForm from "@/components/vue/BookingForm";
import AadhaarUpload from "@/components/vue/AadhaarUpload";

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

    // Register AadhaarUpload component globally for use in BookingForm
    app.component("AadhaarUpload", AadhaarUpload);

    // Mount the Vue app
    app.mount(containerRef.current);
    vueAppRef.current = app;

    // After mounting, we need to handle the Aadhaar upload component integration
    setTimeout(() => {
      const placeholder = containerRef.current?.querySelector(
        "#aadhaar-upload-placeholder"
      );
      if (placeholder) {
        // Create a separate Vue app for the Aadhaar upload component
        const aadhaarApp = createApp(AadhaarUpload, {
          onVerificationComplete: (data: {
            fileUrl: string;
            verified: boolean;
            verificationData: unknown;
          }) => {
            // This will be handled by the BookingForm component directly
            console.log("Aadhaar verification completed:", data);
          },
          disabled: false,
        });

        aadhaarApp.mount(placeholder);
      }
    }, 100);

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
