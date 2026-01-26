export type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
  shouldRetry?: (err: unknown, attempt: number) => boolean;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) return true;

  if (err && typeof err === 'object' && 'message' in err) {
    const msg = String((err as any).message ?? '');
    // Common browser/network failures
    if (/failed to fetch/i.test(msg)) return true;
    if (/networkerror/i.test(msg)) return true;
    if (/load failed/i.test(msg)) return true;
    if (/network request failed/i.test(msg)) return true;
  }

  return false;
}

export async function retry<T>(fn: () => PromiseLike<T>, opts: RetryOptions = {}): Promise<T> {
  const {
    retries = 2,
    baseDelayMs = 300,
    maxDelayMs = 2500,
    jitter = true,
    shouldRetry = (err) => isNetworkError(err),
  } = opts;

  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const canRetry = attempt < retries && shouldRetry(err, attempt);
      if (!canRetry) break;

      const expDelay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
      const delay = jitter ? Math.round(expDelay * (0.8 + Math.random() * 0.4)) : expDelay;
      await sleep(delay);
    }
  }

  throw lastErr;
}
