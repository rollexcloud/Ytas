import { ProxyAgent } from 'undici-proxy-agent';

export async function filterWorkingProxies(list: string[], timeout = 8000): Promise<string[]> {
  const checks = list.map(async (proxy) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      await fetch('https://www.google.com', {
        dispatcher: new ProxyAgent(proxy),
        signal: controller.signal,
        // lightweight HEAD request
        method: 'HEAD',
      });
      clearTimeout(timer);
      return proxy; // success
    } catch {
      clearTimeout(timer);
      return undefined;
    }
  });

  const results = await Promise.all(checks);
  return results.filter((p): p is string => Boolean(p));
}
