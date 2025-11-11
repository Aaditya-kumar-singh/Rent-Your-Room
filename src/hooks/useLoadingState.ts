import { useState, useCallback, useRef, useEffect } from "react";

export interface LoadingState<T = unknown> {
  isLoading: boolean;
  error: string | null;
  data: T | null;
}

export interface UseLoadingStateReturn<T> {
  isLoading: boolean;
  error: string | null;
  data: T | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setData: (data: T | null) => void;
  clearError: () => void;
  reset: () => void;
  execute: <R = T>(
    asyncFn: () => Promise<R>,
    options?: {
      onSuccess?: (data: R) => void;
      onError?: (error: unknown) => void;
      resetOnStart?: boolean;
    }
  ) => Promise<R | null>;
}

export const useLoadingState = <T = unknown>(
  initialData: T | null = null
): UseLoadingStateReturn<T> => {
  const [state, setState] = useState<LoadingState<T>>({
    isLoading: false,
    error: null,
    data: initialData,
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    if (!mountedRef.current) return;
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    if (!mountedRef.current) return;
    setState((prev) => ({ ...prev, error, isLoading: false }));
  }, []);

  const setData = useCallback((data: T | null) => {
    if (!mountedRef.current) return;
    setState((prev) => ({ ...prev, data, error: null, isLoading: false }));
  }, []);

  const clearError = useCallback(() => {
    if (!mountedRef.current) return;
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    if (!mountedRef.current) return;
    setState({
      isLoading: false,
      error: null,
      data: initialData,
    });
  }, [initialData]);

  const execute = useCallback(
    async <R = T>(
      asyncFn: () => Promise<R>,
      options?: {
        onSuccess?: (data: R) => void;
        onError?: (error: unknown) => void;
        resetOnStart?: boolean;
      }
    ): Promise<R | null> => {
      if (!mountedRef.current) return null;

      try {
        if (options?.resetOnStart) {
          setState({
            isLoading: true,
            error: null,
            data: initialData,
          });
        } else {
          setState((prev) => ({ ...prev, isLoading: true, error: null }));
        }

        const result = await asyncFn();

        if (!mountedRef.current) return null;

        setState((prev) => ({
          ...prev,
          isLoading: false,
          data: result as unknown as T | null,
          error: null,
        }));

        options?.onSuccess?.(result);
        return result;
      } catch (error) {
        if (!mountedRef.current) return null;

        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        options?.onError?.(error);
        return null;
      }
    },
    [initialData]
  );

  return {
    isLoading: state.isLoading,
    error: state.error,
    data: state.data,
    setLoading,
    setError,
    setData,
    clearError,
    reset,
    execute,
  };
};

// Hook for managing multiple loading states
export const useMultipleLoadingStates = () => {
  const [states, setStates] = useState<Record<string, LoadingState>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], isLoading: loading },
    }));
  }, []);

  const setError = useCallback((key: string, error: string | null) => {
    setStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], error, isLoading: false },
    }));
  }, []);

  const setData = useCallback((key: string, data: unknown) => {
    setStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], data, error: null, isLoading: false },
    }));
  }, []);

  const clearError = useCallback((key: string) => {
    setStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], error: null },
    }));
  }, []);

  const reset = useCallback((key: string) => {
    setStates((prev) => ({
      ...prev,
      [key]: { isLoading: false, error: null, data: null },
    }));
  }, []);

  const resetAll = useCallback(() => {
    setStates({});
  }, []);

  const getState = useCallback(
    (key: string): LoadingState => {
      return states[key] || { isLoading: false, error: null, data: null };
    },
    [states]
  );

  const isAnyLoading = useCallback(() => {
    return Object.values(states).some((state) => state.isLoading);
  }, [states]);

  const hasAnyError = useCallback(() => {
    return Object.values(states).some((state) => state.error);
  }, [states]);

  const getAllErrors = useCallback(() => {
    return Object.entries(states)
      .filter(([, state]) => state.error)
      .map(([key, state]) => ({ key, error: state.error! }));
  }, [states]);

  return {
    states,
    setLoading,
    setError,
    setData,
    clearError,
    reset,
    resetAll,
    getState,
    isAnyLoading,
    hasAnyError,
    getAllErrors,
  };
};

// Hook for debounced loading states (useful for search, etc.)
export const useDebouncedLoadingState = <T = unknown>(
  debounceMs: number = 300,
  initialData: T | null = null
) => {
  const loadingState = useLoadingState<T>(initialData);
  const [debouncedIsLoading, setDebouncedIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (loadingState.isLoading) {
      // Start loading immediately
      setDebouncedIsLoading(true);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    } else {
      // Debounce the end of loading
      timeoutRef.current = setTimeout(() => {
        setDebouncedIsLoading(false);
      }, debounceMs);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loadingState.isLoading, debounceMs]);

  return {
    ...loadingState,
    isLoading: debouncedIsLoading,
  };
};

// Hook for retry functionality
export const useRetryableLoadingState = <T = unknown>(
  maxRetries: number = 3,
  retryDelay: number = 1000,
  initialData: T | null = null
) => {
  const loadingState = useLoadingState<T>(initialData);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const executeWithRetry = useCallback(
    async <R = T>(
      asyncFn: () => Promise<R>,
      options?: {
        onSuccess?: (data: R) => void;
        onError?: (error: unknown) => void;
        resetOnStart?: boolean;
      }
    ): Promise<R | null> => {
      let currentRetry = 0;

      const attemptExecution = async (): Promise<R | null> => {
        try {
          const result = await loadingState.execute(asyncFn, {
            ...options,
            onError: undefined, // Handle errors ourselves
          });

          if (result !== null) {
            setRetryCount(0);
            setIsRetrying(false);
            options?.onSuccess?.(result);
            return result;
          }

          throw new Error("Execution returned null");
        } catch (error) {
          currentRetry++;

          if (currentRetry <= maxRetries) {
            setRetryCount(currentRetry);
            setIsRetrying(true);

            // Wait before retrying
            await new Promise((resolve) =>
              setTimeout(resolve, retryDelay * currentRetry)
            );

            return attemptExecution();
          } else {
            setIsRetrying(false);
            options?.onError?.(error);
            throw error;
          }
        }
      };

      return attemptExecution();
    },
    [loadingState, maxRetries, retryDelay]
  );

  const retry = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    ...loadingState,
    retryCount,
    isRetrying,
    maxRetries,
    executeWithRetry,
    retry,
    canRetry: retryCount < maxRetries,
  };
};
