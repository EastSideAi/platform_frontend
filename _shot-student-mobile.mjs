// Скриншот-проверка мобильного вида (375px) — проверка адаптива верха.
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const SHOTS = '_shots';
try { mkdirSync(SHOTS, { recursive: true }); } catch (e) {}

const browser = await chromium.launch();
for (const s of [{ name: 'student-mobile', theme: 'dark' }]) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  await page.addInitScript((t) => { try { localStorage.setItem('es-theme', t); } catch (e) {} }, s.theme);
  await page.goto('http://localhost:5180/index.html#/student', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOTS}/${s.name}.png`, fullPage: false });
  console.log('shot:', s.name);
  await page.close();
}
await browser.close();
console.log('done');
