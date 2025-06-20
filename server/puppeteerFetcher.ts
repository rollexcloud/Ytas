import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { getNextProxy } from './proxyPool';

puppeteer.use(StealthPlugin());

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
  // Add more if desired
];

function randomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


export async function fetchWithPuppeteer(url: string) {
  const proxy = await getNextProxy();
  const launchOpts: any = { headless: true };
  if (proxy) {
    console.log(`[puppeteer] Using proxy: ${proxy}`);
    launchOpts.args = [`--proxy-server=${proxy}`];
  } else {
    console.log('[puppeteer] No proxy available, launching without proxy');
  }
    const browser = await puppeteer.launch(launchOpts);
  try {
    const page = await browser.newPage();
    await page.setUserAgent(randomUserAgent());
    await page.goto(url, { waitUntil: 'networkidle2' });
    // Simulate human-like behavior
    await delay(randomInt(1500, 3500));
    // Random scroll
    await page.evaluate(() => {
      window.scrollBy(0, Math.floor(Math.random() * 400));
    });
    // Random mouse movement
    const box = await page.$('body');
    if (box) {
      const { x, y, width, height } = await box.boundingBox() || { x: 0, y: 0, width: 100, height: 100 };
      await page.mouse.move(
        x + Math.random() * width,
        y + Math.random() * height
      );
    }
    await delay(randomInt(500, 1500));
    const html = await page.content();
    return html;
  } finally {
    await browser.close();
  }
}
