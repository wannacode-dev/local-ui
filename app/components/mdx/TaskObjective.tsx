'use client'

import { Target } from 'lucide-react'
import styles from './TaskObjective.module.css'

interface TaskObjectiveProps {
  children: React.ReactNode
}

export function TaskObjective({ children }: TaskObjectiveProps) {
  return (
    <div className={styles.taskObjective}>
      <div className={styles.header}>
        <Target size={18} className={styles.headerIcon} />
        <h2 className={styles.title}>Задание</h2>
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
} 