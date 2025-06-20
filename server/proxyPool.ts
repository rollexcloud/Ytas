// Proxy pool utility for rotating proxies
import { fetchFreeProxies } from './freeProxyLoader';

let proxies: string[] = (process.env.PROXY_LIST || '').split(',').map(p => p.trim()).filter(Boolean);
if (proxies.length) {
  console.log(`[proxyPool] Loaded ${proxies.length} proxies from PROXY_LIST env`);
}
let lastIdx = 0;
let freeProxiesLoaded = false;

async function loadProxiesIfNeeded() {
  if (proxies.length === 0 && !freeProxiesLoaded) {
    proxies = await fetchFreeProxies();
    freeProxiesLoaded = true;
    if (proxies.length === 0) {
      console.warn('No free proxies loaded, proxy pool is empty.');
    } else {
      console.log(`Loaded ${proxies.length} free proxies.`);
    }
  }
}

export async function getNextProxy() {
  const before = proxies.length;
  await loadProxiesIfNeeded();
  if (proxies.length === 0) {
    console.warn('[proxyPool] Proxy pool empty. No proxy returned.');
    return undefined;
  }
  lastIdx = (lastIdx + 1) % proxies.length;
  return proxies[lastIdx];
}
