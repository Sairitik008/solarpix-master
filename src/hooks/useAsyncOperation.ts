import { useState, useCallback } from 'react';

export interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsyncOperation<T>(asyncFunction: (...args: any[]) => Promise<T>) {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]) => {
      setState({ data: null, loading: true, error: null });
      try {
        const result = await asyncFunction(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const errorInstance = err instanceof Error ? err : new Error(String(err));
        setState({ data: null, loading: false, error: errorInstance });
        throw errorInstance;
      }
    },
    [asyncFunction]
  );

  return { ...state, execute };
}
