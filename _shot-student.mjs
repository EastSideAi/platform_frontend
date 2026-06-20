// Скриншот-проверка верха дашборда ученика (#/student), обе темы.
// Запуск: node _shot-student.mjs  (нужен http.server на :5180)
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const SHOTS = '_shots';
try { mkdirSync(SHOTS, { recursive: true }); } catch (e) {}
const shots = [
  { name: 'student-light', theme: 'light' },
  { name: 'student-dark', theme: 'dark' },
];

const browser = await chromium.launch();
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 }, deviceScaleFactor: 2 });
  await page.addInitScript((t) => { try { localStorage.setItem('es-theme', t); } catch (e) {} }, s.theme);
  await page.goto('http://localhost:5180/index.html#/student', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOTS}/${s.name}.png`, fullPage: false });
  console.log('shot:', s.name);
  await page.close();
}
await browser.close();
console.log('done');
