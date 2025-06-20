import fetch from 'node-fetch';
import ProxyAgent from 'proxy-agent';

export async function filterWorkingProxies(list: string[], timeout = 8000): Promise<string[]> {
  const checks = list.map(async (proxy) => {
        try {
      await fetch('https://www.google.com', {
        agent: new ProxyAgent(proxy),
        // lightweight HEAD request
        method: 'HEAD',
        timeout,
      });
      return proxy;
    } catch {
      return undefined;
    }
  });

    const results = await Promise.all(checks);
  return results.filter((p): p is string => Boolean(p));
}
