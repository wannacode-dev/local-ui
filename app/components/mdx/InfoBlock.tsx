'use client'

import { 
  Info, 
  AlertTriangle, 
  Lightbulb, 
  CheckCircle2,
  ArrowRight,
  BookOpen
} from 'lucide-react'
import styles from './InfoBlock.module.css'

type InfoBlockType = 'info' | 'warning' | 'concept' | 'step' | 'success' | 'docs'

interface InfoBlockProps {
  type: InfoBlockType
  title?: string
  icon?: React.ReactNode
  children: React.ReactNode
}

const typeConfig = {
  info: {
    icon: Info,
    defaultTitle: '📖 Дополнительная информация',
    className: 'info'
  },
  warning: {
    icon: AlertTriangle,
    defaultTitle: '⚠️ Важно помнить',
    className: 'warning'
  },
  concept: {
    icon: Lightbulb,
    defaultTitle: '🧠 Ключевая концепция',
    className: 'concept'
  },
  step: {
    icon: ArrowRight,
    defaultTitle: '👉 Пошаговая инструкция',
    className: 'step'
  },
  success: {
    icon: CheckCircle2,
    defaultTitle: '✅ Готово',
    className: 'success'
  },
  docs: {
    icon: BookOpen,
    defaultTitle: '📚 Документация',
    className: 'docs'
  }
}

export function InfoBlock({ 
  type, 
  title, 
  icon, 
  children 
}: InfoBlockProps) {
  const config = typeConfig[type]
  const IconComponent = config.icon
  const displayTitle = title || config.defaultTitle

  return (
    <div className={`${styles.infoBlock} ${styles[config.className]}`}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          {icon || <IconComponent size={18} className={styles.icon} />}
        </div>
        <h4 className={styles.title}>{displayTitle}</h4>
      </div>
      
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
} 