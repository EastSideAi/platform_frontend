// Кроп hero-области для детальной проверки выравнивания и контраста.
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 }, deviceScaleFactor: 2 });
await page.addInitScript(() => { try { localStorage.setItem('es-theme', 'light'); } catch (e) {} });
await page.goto('http://localhost:5180/index.html#/student', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
// кроп верхней трети — hero + первая строка карточек
const el = await page.$('.ec-wrap');
const box = await el.boundingBox();
await page.screenshot({ path: '_shots/zoom-hero.png', clip: { x: box.x, y: box.y, width: Math.min(1100, box.width), height: 520 } });
console.log('hero crop done', box);
await browser.close();
