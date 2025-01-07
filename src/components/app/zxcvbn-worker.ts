import zxcvbn from 'zxcvbn';

self.onmessage = (e: MessageEvent<string>) => {
  const password = e.data;
  const result = zxcvbn(password);
  self.postMessage(result);
};
export {};
