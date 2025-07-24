'use client'

import { AlertCircle } from 'lucide-react'
import styles from './TaskImportant.module.css'

interface TaskImportantProps {
  children: React.ReactNode
  title?: string
}

export function TaskImportant({ children, title = "Важное" }: TaskImportantProps) {
  return (
    <div className={styles.taskImportant}>
      <div className={styles.header}>
        <AlertCircle size={18} className={styles.headerIcon} />
        <h3 className={styles.title}>{title}</h3>
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
} 