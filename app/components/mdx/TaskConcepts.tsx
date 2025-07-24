'use client'

import { Lightbulb } from 'lucide-react'
import styles from './TaskConcepts.module.css'

interface TaskConceptsProps {
  children: React.ReactNode
  title?: string
}

export function TaskConcepts({ children, title = "🧠 Ключевые концепции" }: TaskConceptsProps) {
  return (
    <div className={styles.taskConcepts}>
      <div className={styles.header}>
        <Lightbulb size={18} className={styles.headerIcon} />
        <h3 className={styles.title}>{title}</h3>
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
} 