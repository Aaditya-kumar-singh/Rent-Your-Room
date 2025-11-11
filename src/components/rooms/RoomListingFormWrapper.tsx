"use client";

import { useEffect, useRef } from "react";
import { createApp, App as VueApp } from "vue";
import { RoomFormData, RoomData } from "@/types/room";

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

    // Import the full Vue component
    import("../vue/RoomListingForm")
      .then((module) => {
        const RoomListingFormComponent = module.default;

        // Create Vue app instance with the full component
        const app = createApp(RoomListingFormComponent, {
          initialData,
          isEditing,
          onSubmit,
          onCancel,
        });

        // Mount the Vue app
        app.mount(containerRef.current!);
        vueAppRef.current = app;
      })
      .catch((error) => {
        console.error("Failed to load Vue component:", error);
        // Fallback to a simple error message
        if (containerRef.current) {
          containerRef.current.innerHTML = `
          <div class="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div class="text-center">
              <h2 class="text-2xl font-bold text-red-600 mb-4">Component Loading Error</h2>
              <p class="text-gray-600">Failed to load the room listing form. Please refresh the page.</p>
            </div>
          </div>
        `;
        }
      });

    // Cleanup function
    return () => {
      if (vueAppRef.current) {
        vueAppRef.current.unmount();
        vueAppRef.current = null;
      }
    };
  }, [initialData, isEditing, onSubmit, onCancel]);

  return <div ref={containerRef} />;
}
