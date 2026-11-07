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

  const pageData = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
    const trs = Array.from(document.querySelectorAll('tbody tr')).length;
    const bodyText = document.body.innerText;
    return { btns, trCount: trs, bodySnippet: bodyText.slice(0, 500) };
  });

  console.log('Buttons:', pageData.btns);
  console.log('Row count initially:', pageData.trCount);
  console.log('Body snippet:', pageData.bodySnippet);

  await browser.close();
})();
