"use client";

import { useEffect, useRef } from "react";
// @ts-ignore
import { createApp, App as VueApp } from "vue/dist/vue.esm-bundler.js";
import { RoomFormData, RoomData } from "@/types/room";
import RoomListingForm from "@/components/vue/RoomListingForm";

interface RoomListingFormWrapperProps {
  initialData?: RoomData;
  isEditing?: boolean;
  onSubmit: (data: RoomFormData) => void;
  onCancel: () => void;
}

export default function RoomListingFormWrapper({
  initialData,
  isEditing = false,
  onSubmit,
  onCancel,
}: RoomListingFormWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const vueAppRef = useRef<VueApp | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create Vue app instance
    const app = createApp(RoomListingForm, {
      initialData,
      isEditing,
      onSubmit,
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
  }, [initialData, isEditing, onCancel, onSubmit]);

  return <div ref={containerRef} />;
}
