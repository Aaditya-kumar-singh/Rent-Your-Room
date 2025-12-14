// Google Maps API loader utility
let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

export const loadGoogleMapsAPI = (): Promise<void> => {
  // Return existing promise if already loading
  if (loadPromise) {
    return loadPromise;
  }

  // Return resolved promise if already loaded
  if (isLoaded || window.google?.maps) {
    return Promise.resolve();
  }

  // Prevent multiple simultaneous loads
  if (isLoading) {
    return new Promise((resolve) => {
      const checkLoaded = () => {
        if (isLoaded || window.google?.maps) {
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    });
  }

  isLoading = true;

  loadPromise = new Promise<void>((resolve, reject) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      isLoading = false;
      loadPromise = null;
      reject(new Error("Google Maps API key is not configured"));
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );
    if (existingScript) {
      // Script exists, wait for it to load
      if (window.google?.maps) {
        isLoaded = true;
        isLoading = false;
        resolve();
        return;
      }

      // Wait for existing script to load
      existingScript.addEventListener("load", () => {
        isLoaded = true;
        isLoading = false;
        resolve();
      });

      existingScript.addEventListener("error", () => {
        isLoading = false;
        loadPromise = null;
        reject(new Error("Failed to load Google Maps"));
      });

      return;
    }

    // Create new script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
    };

    script.onerror = () => {
      isLoading = false;
      loadPromise = null;
      // Remove failed script
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      reject(new Error("Failed to load Google Maps"));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};

export const isGoogleMapsLoaded = (): boolean => {
  return isLoaded || !!window.google?.maps;
};

// Reset function for testing or cleanup
export const resetGoogleMapsLoader = () => {
  isLoading = false;
  isLoaded = false;
  loadPromise = null;
};
