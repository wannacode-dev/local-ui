'use client'

import { Target, BookOpen } from 'lucide-react'
import styles from './TaskLayout.module.css'

interface TaskLayoutProps {
  title: string
  description: string
  children: React.ReactNode
}

export function TaskLayout({ title, description, children }: TaskLayoutProps) {
  return (
    <div className={styles.taskLayout}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div className={styles.titleWrapper}>
            <Target size={20} className={styles.titleIcon} />
            <h1 className={styles.title}>{title}</h1>
          </div>
          <p className={styles.description}>{description}</p>
        </div>
      </div>

      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
} 