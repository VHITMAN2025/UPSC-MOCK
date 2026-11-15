import React from 'react'
import { AdminExtractedQuestionsPage } from './AdminExtractedQuestionsPage'

// Quick Recall is one common pool for every exam group. It uses the same
// 29-column grid, filters, inline editing and bulk CSV upload as the question
// bank, in "recall" mode (no group tabs, no unit deficit cards, no papers).
export function AdminRecallPage() {
  return <AdminExtractedQuestionsPage mode="recall" />
}
