import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/admin/extracted-questions', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const text = await page.evaluate(() => document.body.innerText);
  console.log('Page Text snippet:');
  console.log(text.slice(0, 800));

  await browser.close();
})();
