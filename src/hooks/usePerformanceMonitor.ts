import { useEffect, useRef } from "react";

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  timestamp: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const mountTime = useRef<number>(0);
  const isInitialized = useRef<boolean>(false);

  useEffect(() => {
    if (!isInitialized.current) {
      renderStartTime.current = performance.now();
      mountTime.current = performance.now();
      isInitialized.current = true;
    }

    return () => {
      const unmountTime = performance.now();
      const totalLifetime = unmountTime - mountTime.current;

      if (process.env.NODE_ENV === "development") {
        console.log(
          `Component ${componentName} lifetime: ${totalLifetime.toFixed(2)}ms`
        );
      }
    };
  }, [componentName]);

  useEffect(() => {
    if (!isInitialized.current) return;

    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime.current;

    const metrics: PerformanceMetrics = {
      componentName,
      renderTime,
      timestamp: Date.now(),
    };

    // Log slow renders in development
    if (process.env.NODE_ENV === "development" && renderTime > 16) {
      console.warn(
        `Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`
      );
    }

    // Store metrics for potential analytics
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const existingMetrics = JSON.parse(
          localStorage.getItem("performance-metrics") || "[]"
        );
        existingMetrics.push(metrics);

        // Keep only last 100 metrics
        if (existingMetrics.length > 100) {
          existingMetrics.splice(0, existingMetrics.length - 100);
        }

        localStorage.setItem(
          "performance-metrics",
          JSON.stringify(existingMetrics)
        );
      } catch {
        // Silently fail if localStorage is not available
      }
    }

    renderStartTime.current = performance.now();
  });

  return {
    markRenderStart: () => {
      renderStartTime.current = performance.now();
    },
    getMetrics: (): PerformanceMetrics[] => {
      if (typeof window === "undefined") return [];

      try {
        return JSON.parse(localStorage.getItem("performance-metrics") || "[]");
      } catch {
        return [];
      }
    },
    clearMetrics: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("performance-metrics");
      }
    },
  };
};
