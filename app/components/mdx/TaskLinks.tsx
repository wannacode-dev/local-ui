'use client'

import { ExternalLink, Link as LinkIcon, BookOpen } from 'lucide-react'
import styles from './TaskLinks.module.css'

interface LinkItem {
  title: string
  url: string
  description?: string
}

interface TaskLinksProps {
  links: LinkItem[]
  title?: string
}

export function TaskLinks({ links, title = "🔗 Полезные ссылки" }: TaskLinksProps) {
  return (
    <div className={styles.taskLinks}>
      <div className={styles.header}>
        <LinkIcon size={18} className={styles.headerIcon} />
        <h3 className={styles.title}>{title}</h3>
      </div>

      <div className={styles.linksContainer}>
        {links.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.linkItem}
          >
            <div className={styles.linkContent}>
              <div className={styles.linkHeader}>
                <BookOpen size={16} className={styles.linkIcon} />
                <span className={styles.linkTitle}>{link.title}</span>
              </div>
              {link.description && (
                <p className={styles.linkDescription}>{link.description}</p>
              )}
            </div>
            <ExternalLink size={16} className={styles.externalIcon} />
          </a>
        ))}
      </div>
    </div>
  )
} 