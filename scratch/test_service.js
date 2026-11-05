import { syllabusAnalyticsService } from '../src/services/syllabusAnalyticsService.js';

async function run() {
  try {
    const res = await syllabusAnalyticsService.getSyllabusWithAnalytics(null, 'TNPSC Group 4');
    console.log('Result units count:', res.units.length);
    console.log('Units:', res.units.map(u => ({
      num: u.unit_number,
      name: u.unit_name,
      macros: u.macro_topics.length,
      micros: u.macro_topics.reduce((s, m) => s + m.micro_topics.length, 0),
      accuracy: u.accuracy_percentage
    })));
  } catch (e) {
    console.error('Error running getSyllabusWithAnalytics:', e);
  }
}

run();
