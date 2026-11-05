const puppeteer = require('puppeteer-core');

async function test() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER PAGE ERROR:', err.message));
  
  // Login first
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'vinaa-tester-101@gmail.com');
  await page.type('input[type="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });

  // Navigate to /syllabus
  console.log('Navigating to /syllabus...');
  await page.goto('http://localhost:3000/syllabus', { waitUntil: 'networkidle0' });
  
  const content = await page.evaluate(() => {
    return {
      title: document.querySelector('h1')?.innerText,
      unitsCount: document.querySelectorAll('.space-y-2 > div').length,
      unitNames: Array.from(document.querySelectorAll('.space-y-2 > div span.truncate')).map(s => s.innerText),
      firstUnitText: document.querySelector('.flex-1 h3')?.innerText,
      topicsCount: document.querySelectorAll('.space-y-2\\.5 > div').length,
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean)
    };
  });
  console.log('PAGE CONTENT:', JSON.stringify(content, null, 2));

  // Try clicking second unit
  console.log('Clicking second unit...');
  const units = await page.$$('.space-y-2 > div');
  if (units[1]) {
    await units[1].click();
    await new Promise(r => setTimeout(r, 600));
    const activeTitle = await page.$eval('.flex-1 h3', el => el.innerText);
    console.log('Active unit after click:', activeTitle);
  }

  // Try clicking a Practice Topic button
  console.log('Checking practice button navigation...');
  const practiceTopicBtn = await page.$('button[title*="Practice this topic"]');
  if (practiceTopicBtn) {
    console.log('Found practice topic button, clicking...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
      practiceTopicBtn.click()
    ]);
    console.log('Navigated to URL:', page.url());
  } else {
    console.log('No practice topic button found!');
  }

  await browser.close();
}

test().catch(console.error);
