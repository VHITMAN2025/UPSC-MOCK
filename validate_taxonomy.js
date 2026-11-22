/**
 * TNPSC Taxonomy Validator
 * Validates CSV rows against the strict 91-entry taxonomy
 * Usage: node validate_taxonomy.js <csv_file_path>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES Module dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the taxonomy
import { TAXONOMY_V2 } from './src/data/taxonomyV2.js';

/**
 * Parse CSV line (handles quoted fields with commas)
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Validate a single row against taxonomy
 */
function validateRow(rowData, rowNumber) {
  // Expected CSV columns (29 total)
  const columns = [
    'question_id', 'content_hash', 'exam_tag', 'source_type', 'year',
    'subject_name', 'unit_code', 'unit_name', 'macro_topic', 'micro_topic',
    'sub_topic', 'difficulty_level', 'question_type', 'cognitive_skill',
    'ideal_time_seconds', 'en_question_text', 'en_option_a', 'en_option_b',
    'en_option_c', 'en_option_d', 'en_option_e', 'ta_question_text',
    'ta_option_a', 'ta_option_b', 'ta_option_c', 'ta_option_d', 'ta_option_e',
    'answer_key', 'en_explanation', 'ta_explanation'
  ];
  
  // Create object from row data
  const row = {};
  columns.forEach((col, index) => {
    row[col] = rowData[index] || '';
  });
  
  const examTag = row.exam_tag;
  const macroTopic = row.macro_topic;
  const microTopic = row.micro_topic;
  
  // Find matching taxonomy entry
  const match = TAXONOMY_V2.find(entry => 
    entry.exam_tag === examTag &&
    entry.macro_topic === macroTopic &&
    entry.micro_topic === microTopic
  );
  
  const result = {
    rowNumber,
    examTag,
    macroTopic,
    microTopic,
    unitCode: row.unit_code,
    unitName: row.unit_name,
    valid: !!match,
    matchedEntry: match || null
  };
  
  // If not valid, find close matches
  if (!match) {
    result.suggestions = findClosestMatches(examTag, macroTopic, microTopic);
  }
  
  return result;
}

/**
 * Find closest matching taxonomy entries
 */
function findClosestMatches(examTag, macroTopic, microTopic) {
  const suggestions = [];
  
  // Exact exam_tag matches
  const sameExam = TAXONOMY_V2.filter(entry => entry.exam_tag === examTag);
  
  // Same macro topic
  const sameMacro = sameExam.filter(entry => entry.macro_topic === macroTopic);
  if (sameMacro.length > 0) {
    suggestions.push({
      reason: 'Same macro topic in this exam group',
      entries: sameMacro.slice(0, 3)
    });
  }
  
  // Similar micro topic (contains some words)
  const microWords = microTopic.toLowerCase().split(/[\s,&]+/).filter(w => w.length > 3);
  const similar = sameExam.filter(entry => {
    const entryWords = entry.micro_topic.toLowerCase().split(/[\s,&]+/);
    return microWords.some(word => entryWords.includes(word));
  });
  
  if (similar.length > 0 && suggestions.length === 0) {
    suggestions.push({
      reason: 'Similar micro topics',
      entries: similar.slice(0, 3)
    });
  }
  
  // If no suggestions yet, show some from same exam
  if (suggestions.length === 0 && sameExam.length > 0) {
    suggestions.push({
      reason: 'Valid options for this exam group',
      entries: sameExam.slice(0, 5)
    });
  }
  
  return suggestions;
}

/**
 * Format validation result for display
 */
function formatResult(result) {
  const status = result.valid ? '✅ VALID' : '❌ INVALID';
  const lines = [
    `\n${'='.repeat(80)}`,
    `Row ${result.rowNumber}: ${status}`,
    `${'='.repeat(80)}`,
    `Exam Tag: ${result.examTag}`,
    `Unit Code: ${result.unitCode}`,
    `Unit Name: ${result.unitName}`,
    `Macro Topic: ${result.macroTopic}`,
    `Micro Topic: ${result.microTopic}`,
  ];
  
  if (result.valid) {
    lines.push(`\n✓ Matched Entry:`);
    lines.push(`  Topic ID: ${result.matchedEntry.unit_code}`);
    lines.push(`  Subject: ${result.matchedEntry.subject_name}`);
    lines.push(`  Unit: ${result.matchedEntry.unit_name}`);
  } else {
    lines.push(`\n✗ No exact match found!`);
    lines.push(`\nPossible issues:`);
    lines.push(`  • Check spelling and punctuation`);
    lines.push(`  • Verify "&" vs "and" usage`);
    lines.push(`  • Check for extra/missing spaces`);
    lines.push(`  • Verify Tamil Unicode characters`);
    
    if (result.suggestions && result.suggestions.length > 0) {
      lines.push(`\nSuggested corrections:`);
      result.suggestions.forEach(suggestion => {
        lines.push(`\n${suggestion.reason}:`);
        suggestion.entries.forEach(entry => {
          lines.push(`  • Macro: "${entry.macro_topic}"`);
          lines.push(`    Micro: "${entry.micro_topic}"`);
          lines.push(`    (${entry.unit_code} - ${entry.unit_name})`);
        });
      });
    }
  }
  
  return lines.join('\n');
}

/**
 * Main validation function
 */
function validateCSV(filePath) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TNPSC TAXONOMY VALIDATOR - 91 ENTRY STRICT VALIDATION`);
  console.log(`${'='.repeat(80)}\n`);
  console.log(`Reading file: ${filePath}\n`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    console.log(`Total rows to validate: ${dataLines.length}\n`);
    
    const results = [];
    let validCount = 0;
    let invalidCount = 0;
    
    dataLines.forEach((line, index) => {
      if (!line.trim()) return;
      
      const rowData = parseCSVLine(line);
      const result = validateRow(rowData, index + 2); // +2 because index 0 is row 2 (after header)
      
      results.push(result);
      
      if (result.valid) {
        validCount++;
      } else {
        invalidCount++;
      }
      
      // Print result
      console.log(formatResult(result));
    });
    
    // Summary
    console.log(`\n${'='.repeat(80)}`);
    console.log(`VALIDATION SUMMARY`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Total Rows: ${results.length}`);
    console.log(`✅ Valid: ${validCount} (${((validCount/results.length)*100).toFixed(1)}%)`);
    console.log(`❌ Invalid: ${invalidCount} (${((invalidCount/results.length)*100).toFixed(1)}%)`);
    console.log(`${'='.repeat(80)}\n`);
    
    // List invalid rows
    if (invalidCount > 0) {
      console.log(`Invalid rows: ${results.filter(r => !r.valid).map(r => r.rowNumber).join(', ')}`);
      console.log(`\nRecommendation: Fix invalid rows using the suggestions above.`);
      console.log(`Reference: APPROVED_TAXONOMY_REFERENCE.md or QUICK_TAXONOMY_REFERENCE.txt\n`);
    } else {
      console.log(`🎉 All rows passed validation! CSV is ready for import.\n`);
    }
    
    return {
      total: results.length,
      valid: validCount,
      invalid: invalidCount,
      results
    };
    
  } catch (error) {
    console.error(`\n❌ Error reading file: ${error.message}\n`);
    process.exit(1);
  }
}

/**
 * Interactive row validation (for testing individual rows)
 */
function validateSingleRow(examTag, macroTopic, microTopic) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`VALIDATING SINGLE ROW`);
  console.log(`${'='.repeat(80)}\n`);
  
  const match = TAXONOMY_V2.find(entry => 
    entry.exam_tag === examTag &&
    entry.macro_topic === macroTopic &&
    entry.micro_topic === microTopic
  );
  
  if (match) {
    console.log(`✅ VALID MATCH FOUND\n`);
    console.log(`Topic ID: ${match.unit_code}`);
    console.log(`Exam Tag: ${match.exam_tag}`);
    console.log(`Subject: ${match.subject_name}`);
    console.log(`Unit: ${match.unit_name}`);
    console.log(`Macro: ${match.macro_topic}`);
    console.log(`Micro: ${match.micro_topic}`);
    console.log(`Quota: ${match.unit_quota}`);
  } else {
    console.log(`❌ NO MATCH FOUND\n`);
    console.log(`Searched for:`);
    console.log(`  Exam Tag: "${examTag}"`);
    console.log(`  Macro Topic: "${macroTopic}"`);
    console.log(`  Micro Topic: "${microTopic}"`);
    
    const suggestions = findClosestMatches(examTag, macroTopic, microTopic);
    if (suggestions.length > 0) {
      console.log(`\nSuggestions:`);
      suggestions.forEach(suggestion => {
        console.log(`\n${suggestion.reason}:`);
        suggestion.entries.forEach(entry => {
          console.log(`  • "${entry.macro_topic}" → "${entry.micro_topic}"`);
        });
      });
    }
  }
  
  console.log(`\n${'='.repeat(80)}\n`);
}

/**
 * List all valid taxonomy entries for a specific exam group
 */
function listTaxonomyForExam(examTag) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`VALID TAXONOMY ENTRIES FOR ${examTag}`);
  console.log(`${'='.repeat(80)}\n`);
  
  const entries = TAXONOMY_V2.filter(entry => entry.exam_tag === examTag);
  
  if (entries.length === 0) {
    console.log(`No entries found for ${examTag}`);
    console.log(`Valid exam tags: TNPSC_GROUP_1, TNPSC_GROUP_2, TNPSC_GROUP_4\n`);
    return;
  }
  
  console.log(`Total entries: ${entries.length}\n`);
  
  // Group by unit
  const byUnit = {};
  entries.forEach(entry => {
    if (!byUnit[entry.unit_name]) {
      byUnit[entry.unit_name] = [];
    }
    byUnit[entry.unit_name].push(entry);
  });
  
  Object.keys(byUnit).forEach(unitName => {
    console.log(`\n${unitName}`);
    console.log(`${'-'.repeat(unitName.length)}`);
    byUnit[unitName].forEach(entry => {
      console.log(`  • ${entry.macro_topic} → ${entry.micro_topic}`);
    });
  });
  
  console.log(`\n${'='.repeat(80)}\n`);
}

// Command-line interface
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
TNPSC Taxonomy Validator - Usage:

1. Validate a CSV file:
   node validate_taxonomy.js <csv_file_path>
   Example: node validate_taxonomy.js sample_questions.csv

2. Validate a single row:
   node validate_taxonomy.js --row "<exam_tag>" "<macro_topic>" "<micro_topic>"
   Example: node validate_taxonomy.js --row "TNPSC_GROUP_4" "Physics" "Mechanics, Force, Pressure & Energy"

3. List all valid entries for an exam:
   node validate_taxonomy.js --list <exam_tag>
   Example: node validate_taxonomy.js --list TNPSC_GROUP_4

4. Show statistics:
   node validate_taxonomy.js --stats
  `);
  process.exit(0);
}

const command = args[0];

if (command === '--row' && args.length === 4) {
  validateSingleRow(args[1], args[2], args[3]);
} else if (command === '--list' && args.length === 2) {
  listTaxonomyForExam(args[1]);
} else if (command === '--stats') {
  console.log(`\nTaxonomy Statistics:`);
  console.log(`Total entries: ${TAXONOMY_V2.length}`);
  console.log(`GROUP_1 entries: ${TAXONOMY_V2.filter(e => e.exam_tag === 'TNPSC_GROUP_1').length}`);
  console.log(`GROUP_2 entries: ${TAXONOMY_V2.filter(e => e.exam_tag === 'TNPSC_GROUP_2').length}`);
  console.log(`GROUP_4 entries: ${TAXONOMY_V2.filter(e => e.exam_tag === 'TNPSC_GROUP_4').length}\n`);
} else {
  // Assume it's a file path
  const filePath = path.resolve(args[0]);
  validateCSV(filePath);
}

// Export for use as module
export {
  validateCSV,
  validateSingleRow,
  validateRow,
  listTaxonomyForExam,
  TAXONOMY_V2
};
