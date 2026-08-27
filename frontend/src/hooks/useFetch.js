import { useState, useEffect, useRef, useCallback } from "react";

export function useData(fetchFn, deps = [], opts = {}) {
  const { autoRefreshInterval = null, enabled = true } = opts;
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);
  const fetchIdRef = useRef(0);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const load = useCallback(async (isRefresh = false) => {
    if (!enabledRef.current) { setLoading(false); return; }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const id = ++fetchIdRef.current;
    try {
      const result = await fetchFnRef.current();
      if (id === fetchIdRef.current && mountedRef.current) {
        setD(result);
        setLoading(false);
        setRefreshing(false);
      }
    } catch (err) {
      if (id === fetchIdRef.current && mountedRef.current) {
        setError(err.message || "Failed to load data");
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load(false);
    return () => { mountedRef.current = false; };
  }, deps);

  useEffect(() => {
    if (!autoRefreshInterval) return;
    const id = setInterval(() => load(true), autoRefreshInterval * 1000);
    return () => clearInterval(id);
  }, [autoRefreshInterval]);

  return { d, loading, error, refreshing, reload: () => load(true) };
}
