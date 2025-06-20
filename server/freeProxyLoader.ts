
// Fetches a list of free HTTP proxies from a public API
export async function fetchFreeProxies(): Promise<string[]> {
  try {
    // This API returns proxies as ip:port, one per line
    const res = await fetch('https://www.proxy-list.download/api/v1/get?type=http');
    if (!res.ok) throw new Error('Failed to fetch proxy list');
    const text = await res.text();
    return text
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line && line.includes(':'))
      .map((line: string) => `http://${line}`); // Format as URL
  } catch (err) {
    console.error('Error fetching free proxies:', err);
    return [];
  }
}
