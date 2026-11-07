import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/admin/extracted-questions', { waitUntil: 'networkidle2' });
  const title = await page.title();
  const url = page.url();
  const storage = await page.evaluate(() => {
    return { ...localStorage };
  });
  console.log('Page Title:', title);
  console.log('Page URL:', url);
  console.log('LocalStorage keys:', Object.keys(storage));
  if (storage['sb-placeholder-auth-token'] || Object.keys(storage).some(k => k.includes('auth-token'))) {
    console.log('Found Supabase auth token in localStorage!');
  }
  await browser.close();
})();
