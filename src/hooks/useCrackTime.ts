import { useEffect, useMemo, useState } from 'react';
import zxcvbn from 'zxcvbn';

export const useCrackTime = (password: string) => {
  const [crackTime, setCrackTime] = useState<zxcvbn.ZXCVBNResult | null>(null);
  const [loading, setLoading] = useState(false);
  console.log('loading', loading);
  const delay = password.length > 40 ? 100 : 5;

  // Memoize the worker to ensure it's created only once
  const worker = useMemo(() => {
    const w = new Worker(new URL('./zxcvbn-worker.ts', import.meta.url), {
      type: 'module',
    });
    return w;
  }, []);

  useEffect(() => {
    const handleMessage = (e: MessageEvent<zxcvbn.ZXCVBNResult>) => {
      setCrackTime(e.data);
      setLoading(false);
    };

    worker.addEventListener('message', handleMessage);

    return () => {
      worker.removeEventListener('message', handleMessage);
    };
  }, [worker]);

  useEffect(() => {
    if (!password) {
      setCrackTime(null);
      return;
    }
    if (loading) {
      return;
    }

    const handler = setTimeout(() => {
      worker.postMessage(password);
      setLoading(true);
    }, delay);

    return () => {
      clearTimeout(handler); // Clear the timeout if the password changes before the delay
    };
  }, [password, delay, worker]);

  useEffect(() => {
    return () => {
      worker.terminate(); // Cleanup the worker on component unmount
    };
  }, [worker]);

  return {
    crackTime,
    loading,
  };
};
