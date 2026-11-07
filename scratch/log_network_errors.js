import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  page.on('response', async resp => {
    if (resp.status() >= 400) {
      console.log('HTTP', resp.status(), resp.url());
      try {
        const text = await resp.text();
        console.log('  Body:', text);
      } catch {}
    }
  });
  await page.goto('http://localhost:3000/admin/extracted-questions', { waitUntil: 'networkidle2' });
  await browser.close();
})();
