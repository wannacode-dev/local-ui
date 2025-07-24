'use client'

import { Target, Sparkles } from 'lucide-react'
import styles from './TaskPreview.module.css'

interface TaskPreviewProps {
  title?: string
  children: React.ReactNode
}

export function TaskPreview({ title = "Ожидаемый результат", children }: TaskPreviewProps) {
  return (
    <div className={styles.taskPreview}>
      <div className={styles.header}>
        <div className={styles.icon}>
          <Target />
        </div>
        <div>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.subtitle}>Посмотрите, что должно получиться в итоге</p>
        </div>
      </div>
      
      <div className={styles.preview}>
          {children}
      </div>
    </div>
  )
} 