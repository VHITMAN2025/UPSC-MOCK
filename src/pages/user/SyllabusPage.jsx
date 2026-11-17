import React from 'react'
import { useApp } from '../../contexts/AppContext'
import { InteractiveSyllabusTree } from '../../components/tnpsc/InteractiveSyllabusNew'

export function SyllabusPage() {
  const { selectedExam } = useApp()

  return (
    <div className="animate-fade-in">
      <InteractiveSyllabusTree key={selectedExam} />
    </div>
  )
}
