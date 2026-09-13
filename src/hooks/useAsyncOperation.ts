import { useState, useCallback } from 'react';
import { ServiceResult, ServiceError } from '../types';
import { getVendorErrorMessage } from '../utils';

export interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: ServiceError | null;
}

export function useAsyncOperation<T, Args extends any[] = any[]>(
  asyncFunction: (...args: Args) => Promise<ServiceResult<T> | T>
) {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args): Promise<ServiceResult<T>> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const result = await asyncFunction(...args);

        // Check if response matches ServiceResult structure
        if (result && typeof result === 'object' && 'success' in result) {
          const serviceRes = result as ServiceResult<T>;
          if (serviceRes.success) {
            setState({ data: serviceRes.data, loading: false, error: null });
            return serviceRes;
          } else {
            setState({ data: null, loading: false, error: serviceRes.error });
            return serviceRes;
          }
        }

        // Direct value return fallback
        const successResult: ServiceResult<T> = { success: true, data: result as T };
        setState({ data: result as T, loading: false, error: null });
        return successResult;
      } catch (err: any) {
        const errorObj: ServiceError = {
          code: 'UNKNOWN_ERROR',
          message: err?.message || String(err),
          userFacingMessage: getVendorErrorMessage('UNKNOWN_ERROR'),
        };
        const failResult: ServiceResult<T> = { success: false, error: errorObj };
        setState({ data: null, loading: false, error: errorObj });
        return failResult;
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
