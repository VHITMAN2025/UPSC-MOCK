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

  // Switch to Group 4 tab to see Group 4 questions
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await (await b.getProperty('textContent')).jsonValue();
    if (text.includes('Group 4')) {
      console.log('Clicking button:', text.trim());
      await b.click();
      await new Promise(r => setTimeout(r, 1000));
      break;
    }
  }

  // Get table row texts
  const rows = await page.evaluate(() => {
    const trs = Array.from(document.querySelectorAll('tbody tr'));
    return trs.slice(0, 5).map(tr => {
      const tds = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
      return {
        id: tds[0],
        source: tds[1],
        enStem: tds[9],
        enOptA: tds[10],
        taStem: tds[15],
        taOptA: tds[16]
      };
    });
  });

  console.log('Sample rows on Group 4 tab:');
  console.log(JSON.stringify(rows, null, 2));

  await page.screenshot({ path: 'scratch/admin_group4_extracted_live.png' });
  await browser.close();
})();
