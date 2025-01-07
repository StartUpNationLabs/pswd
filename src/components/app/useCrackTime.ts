import { useEffect, useMemo, useState } from 'react';
import zxcvbn from 'zxcvbn';

export const useCrackTime = (password: string) => {
  const [crackTime, setCrackTime] = useState<zxcvbn.ZXCVBNResult | null>(null);

  const delay = password.length > 55 ? 30 : 5; // Delay is proportional to the password length

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

    const handler = setTimeout(() => {
      worker.postMessage(password);
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

  return crackTime;
};
