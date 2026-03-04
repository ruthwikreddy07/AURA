import { useState, useEffect } from "react"

export default function usePageLoad() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 250); // Fast micro-loading
    return () => clearTimeout(t);
  }, []);
  return loading;
}