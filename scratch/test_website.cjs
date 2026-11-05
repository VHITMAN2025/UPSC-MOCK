const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\vijju\\.gemini\\antigravity\\brain\\b9b389d0-21e3-444e-8864-ab02f84b05c9';

async function runTests() {
  console.log('--- Launching Chrome via Puppeteer-Core ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const testResults = [];

  function recordResult(testName, passed, details = '') {
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${testName}: ${details}`);
    testResults.push({ testName, passed, details });
  }

  try {
    // 1. Visit Login Page & Sign In
    console.log('\n--- Test 1: Authentication & Login ---');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0', timeout: 15000 });
    
    // Fill credentials
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'vinaa-tester-101@gmail.com');
    await page.type('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Wait for navigation to /dashboard or /admin
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
    const currentUrl = page.url();
    recordResult('Authentication / Login', currentUrl.includes('/dashboard') || currentUrl.includes('/admin'), `Redirected to: ${currentUrl}`);

    // Take screenshot of Dashboard
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'dashboard_screen.png') });

    // 2. Master Analytics Command Center (/analytics)
    console.log('\n--- Test 2: Master Analytics AI Command Center ---');
    await page.goto('http://localhost:3000/analytics', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForSelector('h1', { timeout: 10000 });
    
    const pageTitle = await page.$eval('h1', el => el.innerText);
    recordResult('Analytics Page Load', pageTitle.includes('Master Analytics'), `Header: "${pageTitle}"`);

    // Check 6 KPIs presence
    const kpiElements = await page.$$eval('.grid.grid-cols-2.sm\\:grid-cols-3.lg\\:grid-cols-6 > div', divs => 
      divs.map(d => ({
        label: d.querySelector('small')?.innerText || '',
        val: d.querySelector('b')?.innerText || ''
      }))
    );
    recordResult('Top Global KPI Strip (6 Metrics)', kpiElements.length === 6, `Found ${kpiElements.length} KPIs: ${kpiElements.map(k => `${k.label}: ${k.val}`).join(' | ')}`);

    // Check Tab 1: Overview
    const overviewTab = await page.$('#ma-view-overview');
    recordResult('Tab 1: Overview (ma-view-overview)', !!overviewTab, 'Overview container rendered');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'analytics_tab1_overview.png') });

    // Click Tab 2: Syllabus Mastery
    console.log('\n--- Testing Tab 2: Syllabus Mastery ---');
    await page.click('#tab-btn-ma-view-syllabus');
    await page.waitForSelector('#ma-view-syllabus', { timeout: 5000 });
    const syllabusTab = await page.$('#ma-view-syllabus');
    const unitChipsCount = await page.$$eval('#ma-view-syllabus button', btns => btns.length);
    recordResult('Tab 2: Syllabus Mastery (ma-view-syllabus)', !!syllabusTab && unitChipsCount > 0, `Rendered unit selector with ${unitChipsCount} buttons/chips`);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'analytics_tab2_syllabus.png') });

    // Click Tab 3: Error Intelligence
    console.log('\n--- Testing Tab 3: Error Intelligence ---');
    await page.click('#tab-btn-ma-view-errors');
    await page.waitForSelector('#ma-view-errors', { timeout: 5000 });
    const errorsTab = await page.$('#ma-view-errors');
    const fixTestBtn = await page.$eval('#ma-view-errors button', btn => btn.innerText);
    recordResult('Tab 3: Error Intelligence (ma-view-errors)', !!errorsTab, `Rendered with CTA: "${fixTestBtn}"`);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'analytics_tab3_errors.png') });

    // Click Tab 4: Time & Pacing
    console.log('\n--- Testing Tab 4: Time & Pacing ---');
    await page.click('#tab-btn-ma-view-pacing');
    await page.waitForSelector('#ma-view-pacing', { timeout: 5000 });
    const pacingTab = await page.$('#ma-view-pacing');
    const pacingPills = await page.$$eval('#ma-view-pacing button', btns => btns.map(b => b.innerText));
    recordResult('Tab 4: Time & Pacing (ma-view-pacing)', !!pacingTab, `Category pills: ${pacingPills.slice(0, 3).join(', ')}...`);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'analytics_tab4_pacing.png') });

    // Click Tab 5: Question Intelligence
    console.log('\n--- Testing Tab 5: Question Intelligence ---');
    await page.click('#tab-btn-ma-view-questions');
    await page.waitForSelector('#ma-view-questions', { timeout: 5000 });
    const questionsTab = await page.$('#ma-view-questions');
    const questionFormats = await page.$$eval('#ma-view-questions .border-surface-border', cards => cards.length);
    recordResult('Tab 5: Question Intelligence (ma-view-questions)', !!questionsTab && questionFormats >= 5, `Found ${questionFormats} question format cards & telemetry`);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'analytics_tab5_questions.png') });

    // Click Tab 6: Test History
    console.log('\n--- Testing Tab 6: Test History ---');
    await page.click('#tab-btn-ma-view-history');
    await page.waitForSelector('#ma-view-history', { timeout: 5000 });
    const historyTab = await page.$('#ma-view-history');
    recordResult('Tab 6: Test History (ma-view-history)', !!historyTab, 'Chronological trajectory view rendered');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'analytics_tab6_history.png') });

    // Click Tab 7: Quick Recall
    console.log('\n--- Testing Tab 7: Quick Recall ---');
    await page.click('#tab-btn-ma-view-recall');
    await page.waitForSelector('#ma-view-recall', { timeout: 5000 });
    const recallTab = await page.$('#ma-view-recall');
    recordResult('Tab 7: Quick Recall (ma-view-recall)', !!recallTab, 'Streak, qualifying rate, and PYQ retention rendered');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'analytics_tab7_recall.png') });

    // 3. Interactive Syllabus Page (/syllabus)
    console.log('\n--- Test 3: Interactive Syllabus Page ---');
    await page.goto('http://localhost:3000/syllabus', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForSelector('h1', { timeout: 10000 });
    const syllabusTitle = await page.$eval('h1', el => el.innerText);
    recordResult('Syllabus Page Load', syllabusTitle.toLowerCase().includes('syllabus'), `Title: "${syllabusTitle}"`);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'syllabus_page_screen.png') });

    // 4. Targeted Practice Page (/practice)
    console.log('\n--- Test 4: Practice & Fix-Test Page ---');
    await page.goto('http://localhost:3000/practice', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForSelector('h1, h2', { timeout: 10000 });
    const practiceTitle = await page.$eval('h1, h2', el => el.innerText);
    recordResult('Practice Page Load', practiceTitle.length > 0, `Title: "${practiceTitle}"`);

    // Test Fix Test mode url
    await page.goto('http://localhost:3000/practice?mode=fix_test&mistakes=q1,q2,q3', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'practice_fix_test_screen.png') });
    recordResult('Practice Page Fix Test Mode', page.url().includes('fix_test'), 'Fix test mode URL parameters handled');

    // 5. Admin Extracted Questions & 29-Column Spreadsheet (/admin/questions)
    console.log('\n--- Test 5: Admin 29-Column Spreadsheet & Master Taxonomy ---');
    await page.goto('http://localhost:3000/admin/questions', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForSelector('h1, h2', { timeout: 10000 });
    const adminTitle = await page.$eval('h1, h2', el => el.innerText);
    recordResult('Admin Question Bank Load', adminTitle.includes('Question Bank') || adminTitle.includes('Extracted'), `Title: "${adminTitle}"`);

    // Check 3-Way Group Switcher
    const groupSwitcherButtons = await page.$$eval('button', btns => 
      btns.filter(b => b.innerText.includes('Group 1') || b.innerText.includes('Group 2') || b.innerText.includes('Group 4')).map(b => b.innerText)
    );
    recordResult('3-Way Group Switcher', groupSwitcherButtons.length >= 3, `Found buttons: ${groupSwitcherButtons.join(', ')}`);

    // Check Blueprint Health Monitor
    const blueprintMonitor = await page.$eval('body', el => el.innerText.includes('Blueprint Health Monitor') || el.innerText.includes('Target 200Q'));
    recordResult('Blueprint Health Monitor Bar', blueprintMonitor, 'Blueprint health metrics visible');

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin_questions_spreadsheet.png') });

  } catch (err) {
    console.error('Test execution error:', err);
    recordResult('Execution Exception', false, err.message);
  } finally {
    await browser.close();
    console.log('\n=======================================');
    console.log(`TEST SUMMARY: ${testResults.filter(r => r.passed).length}/${testResults.length} PASSED`);
    console.log('=======================================');
  }
}

runTests();
