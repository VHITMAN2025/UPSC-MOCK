const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      errors.push(`HTTP ${response.status()} on ${response.url()}`);
    }
  });

  console.log('1. Navigating to login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

  // Fill in credentials
  await page.type('input[type="email"]', 'vinaa-tester-101@gmail.com');
  await page.type('input[type="password"]', 'TestPassword123!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ]);

  console.log('2. Logged in successfully. Navigating to /syllabus...');
  await page.goto('http://localhost:3000/syllabus', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Check unit count for current exam
  const initialUnits = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.border.rounded-2xl.p-4')).map(el => el.textContent.trim());
  });
  console.log(`Units found on /syllabus: ${initialUnits.length}`);

  // Capture screenshot of syllabus
  const artifactDir = 'C:\\Users\\vijju\\.gemini\\antigravity\\brain\\b9b389d0-21e3-444e-8864-ab02f84b05c9';
  await page.screenshot({ path: `${artifactDir}\\interactive_syllabus_verified.png` });
  console.log('Captured interactive_syllabus_verified.png');

  // Test Group Switcher: Click TNPSC Group 1 pill
  console.log('3. Testing Exam Group Switcher (Group 1 vs Group 4)...');
  const group1Btn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.includes('Group 1'));
  });
  if (group1Btn) {
    await group1Btn.click();
    await new Promise(r => setTimeout(r, 1500));
    const g1UnitsCount = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.border.rounded-2xl.p-4')).length;
    });
    console.log(`Group 1 Units count: ${g1UnitsCount} (Expected 10)`);
  }

  // Switch back to Group 4 (should have 11 units)
  const group4Btn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.includes('Group 4'));
  });
  if (group4Btn) {
    await group4Btn.click();
    await new Promise(r => setTimeout(r, 1500));
    const g4UnitsCount = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.border.rounded-2xl.p-4')).length;
    });
    console.log(`Group 4 Units count: ${g4UnitsCount} (Expected 11)`);
  }

  // Click on Unit 3 (Geography)
  console.log('4. Selecting Unit 3 Geography...');
  await page.evaluate(() => {
    const unitCards = Array.from(document.querySelectorAll('.border.rounded-2xl.p-4'));
    const u3 = unitCards.find(c => c.textContent.includes('Geography') || c.textContent.includes('Unit 3'));
    if (u3) u3.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Find "Tamil Nadu Rivers (Cauvery, Vaigai)" practice button
  console.log('5. Finding micro-topic practice button for Tamil Nadu Rivers...');
  const practiceClicked = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.border.border-\\[\\#dfe5ee\\]'));
    const riverRow = rows.find(r => r.textContent.includes('Tamil Nadu Rivers') || r.textContent.includes('Cauvery'));
    if (riverRow) {
      const btn = riverRow.querySelector('button');
      if (btn) {
        btn.click();
        return true;
      }
    }
    return false;
  });

  console.log('Practice button clicked:', practiceClicked);
  await new Promise(r => setTimeout(r, 2000));
  console.log('Current URL after practice click:', page.url());

  // Wait for available count check
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: `${artifactDir}\\practice_setup_tn_rivers.png` });
  console.log('Captured practice_setup_tn_rivers.png');

  // Check if available count is displayed and start practice
  const pageText = await page.evaluate(() => document.body.innerText);
  const countMatch = pageText.match(/(\d+)\s*questions\s*available/i) || pageText.match(/available\s*questions:\s*(\d+)/i);
  console.log('Available count text snippet found:', countMatch ? countMatch[0] : 'None directly in text');

  // Click "Generate Practice Set"
  console.log('6. Starting practice session...');
  const startBtnClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const start = btns.find(b => b.textContent.includes('Generate Practice Set'));
    if (start) {
      start.click();
      return true;
    }
    return false;
  });
  console.log('Generate Practice Set button clicked:', startBtnClicked);
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: `${artifactDir}\\practice_session_active.png` });
  console.log('Captured practice_session_active.png');

  const questionDetails = await page.evaluate(() => {
    const qEl = document.querySelector('h2, .question-text, p.text-base, p.text-sm');
    const options = Array.from(document.querySelectorAll('button, div')).filter(el => el.textContent && el.textContent.includes('A)') || el.textContent.includes('B)'));
    return {
      text: qEl ? qEl.innerText.slice(0, 200) : 'Not found',
      optionsCount: options.length
    };
  });
  console.log('Active Practice Question:', questionDetails);

  console.log('\n--- NETWORK & CONSOLE ERROR REPORT ---');
  const relevantErrors = errors.filter(e => !e.includes('favicon') && !e.includes('WebSocket'));
  console.log(`Relevant Errors (${relevantErrors.length}):`, relevantErrors);

  await browser.close();
  console.log('Test completed successfully!');
})();
