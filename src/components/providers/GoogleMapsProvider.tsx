"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { loadGoogleMapsAPI, isGoogleMapsLoaded } from "@/lib/googleMaps";

interface GoogleMapsContextType {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  isLoading: false,
  error: null,
});

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error("useGoogleMaps must be used within a GoogleMapsProvider");
  }
  return context;
};

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({
  children,
}) => {
  const [isLoaded, setIsLoaded] = useState(() => {
    // Only check if we're on the client side
    if (typeof window !== "undefined") {
      return isGoogleMapsLoaded();
    }
    return false;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMaps = async () => {
      if (isGoogleMapsLoaded()) {
        setIsLoaded(true);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await loadGoogleMapsAPI();
        setIsLoaded(true);
      } catch (err) {
        console.error("Error loading Google Maps:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load Google Maps"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadMaps();
  }, []);

  const value: GoogleMapsContextType = {
    isLoaded,
    isLoading,
    error,
  };

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  );
};
