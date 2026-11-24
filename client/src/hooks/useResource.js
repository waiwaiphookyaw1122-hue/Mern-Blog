import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { errorMessage } from '../lib/utils';

export function useResource(endpoint) {
  const [state, setState] = useState({
    path: null,
    data: null,
    loading: true,
    error: '',
  });
  const [tick, setTick] = useState(0);

  const triggerRetry = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!endpoint) return;
    const ctrl = new AbortController();
    let mounted = true;

    api
      .get(endpoint, { signal: ctrl.signal })
      .then(({ data }) => {
        if (mounted) {
          setState({ path: endpoint, data, loading: false, error: '' });
        }
      })
      .catch((err) => {
        if (mounted && err.code !== 'ERR_CANCELED') {
          setState({
            path: endpoint,
            data: null,
            loading: false,
            error: errorMessage(err),
          });
        }
      });

    return () => {
      mounted = false;
      ctrl.abort();
    };
  }, [endpoint, tick]);

  return {
    ...state,
    loading: Boolean(endpoint) && (state.path !== endpoint || state.loading),
    retry: () => {
      setState({ path: endpoint, data: null, loading: true, error: '' });
      triggerRetry();
    },
  };
}