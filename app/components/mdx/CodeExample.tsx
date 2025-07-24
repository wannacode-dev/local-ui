'use client'

import { useState } from 'react'
import { Copy, Check, Code } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import styles from './CodeExample.module.css'

interface CodeExampleProps {
  title?: string
  language?: string
  code: string
  description?: string
  children?: React.ReactNode
}

export function CodeExample({ 
  title, 
  language = 'javascript', 
  code, 
  description,
  children 
}: CodeExampleProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Ошибка копирования:', err)
    }
  }

  return (
    <div className={styles.codeExample}>
      {title && (
        <div className={styles.header}>
          <Code size={18} className={styles.icon} />
          <h4 className={styles.title}>{title}</h4>
        </div>
      )}
      
      {description && (
        <div className={styles.description}>
          {description}
        </div>
      )}

      {children && (
        <div className={styles.content}>
          {children}
        </div>
      )}

      <div className={styles.codeBlock}>
        <div className={styles.codeHeader}>
          <span className={styles.language}>{language}</span>
          <button
            className={styles.copyButton}
            onClick={handleCopy}
            title="Копировать код"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Скопировано!' : 'Копировать'}
          </button>
        </div>
        
        <SyntaxHighlighter
          language={language}
          style={tomorrow}
          customStyle={{
            margin: 0,
            borderRadius: '0 0 12px 12px',
            fontSize: '14px',
            lineHeight: '1.5',
          }}
          showLineNumbers={false}
          wrapLongLines={true}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
} 