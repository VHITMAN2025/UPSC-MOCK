const puppeteer = require('puppeteer-core');

async function checkNetwork() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('response', async res => {
    if (res.status() >= 400) {
      console.log(`[HTTP ${res.status()}] ${res.url()}`);
      try {
        const text = await res.text();
        console.log('   Response Body:', text.slice(0, 300));
      } catch (e) {
        console.log('   Could not read body:', e.message);
      }
    }
  });

  // Login
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'vinaa-tester-101@gmail.com');
  await page.type('input[type="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });

  console.log('\n--- Navigating to /syllabus ---');
  await page.goto('http://localhost:3000/syllabus', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  await browser.close();
}

checkNetwork().catch(console.error);
