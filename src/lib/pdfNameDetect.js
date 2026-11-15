/**
 * Reads what a PDF's file name says about it.
 *
 * The pages of an exam paper usually carry no group, year or source: a scan of
 * questions 101 to 200 has only a booklet code and page numbers. The file name
 * is the one signal that is normally there, for example
 * "TNPSC-Group-4-2014-General-Studies.pdf".
 *
 * Returns { examTag, year, source }, each null when the name does not say.
 * These are suggestions for the admin to confirm, not facts.
 */
export function detectFromFileName(fileName, now = new Date()) {
  const text = String(fileName || '')
    .replace(/\.pdf$/i, '')
    .replace(/[_\-.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

  // Group IV must be tested before Group I, and Group II before Group I, because
  // "i" is the start of "ii" and "iv".
  let examTag = null
  if (/\b(?:group|grp)\s*(?:4|iv|four)\b/.test(text)) examTag = 'TNPSC_GROUP_4'
  else if (/\b(?:group|grp)\s*(?:2a?|iia?|two)\b/.test(text)) examTag = 'TNPSC_GROUP_2'
  else if (/\b(?:group|grp)\s*(?:1|i|one)\b/.test(text)) examTag = 'TNPSC_GROUP_1'

  // The first plausible year in the name, never one in the future
  const thisYear = now.getFullYear()
  const years = (text.match(/\b(20\d{2})\b/g) || []).map(Number).filter(y => y >= 2000 && y <= thisYear)
  const year = years.length ? years[0] : null

  // Words like "mock" or "practice" say the questions are not an official paper;
  // otherwise a year in the name suggests one.
  let source = null
  if (/\b(?:mock|model|practice|sample|vina)\b/.test(text)) source = 'VINA'
  else if (year) source = 'PYQ'

  return { examTag, year, source }
}
