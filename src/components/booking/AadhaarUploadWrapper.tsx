"use client";

import { useEffect, useRef } from "react";
import { createApp, App as VueApp } from "vue";
import AadhaarUpload from "@/components/vue/AadhaarUpload";

interface AadhaarVerificationData {
  fileUrl: string;
  verified: boolean;
  verificationData: {
    documentId: string;
    userId: string;
    verificationStatus: "pending" | "verified" | "rejected";
    verificationDate: string;
    verificationMethod: string;
    confidence: number;
    issues: string[];
    extractedData: {
      aadhaarNumber?: string;
      name?: string;
      dateOfBirth?: string;
      gender?: string;
      address?: string;
    };
  };
}

interface AadhaarUploadWrapperProps {
  onVerificationComplete: (data: AadhaarVerificationData) => void;
  disabled?: boolean;
  className?: string;
}

export default function AadhaarUploadWrapper({
  onVerificationComplete,
  disabled = false,
  className = "",
}: AadhaarUploadWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const vueAppRef = useRef<VueApp | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create Vue app instance
    const app = createApp(AadhaarUpload, {
      onVerificationComplete,
      disabled,
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
  }, [onVerificationComplete, disabled]);

  return (
    <div ref={containerRef} className={`aadhaar-upload-wrapper ${className}`} />
  );
}
