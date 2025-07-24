'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Eye, CheckCircle, Copy, Check } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import styles from './Solution.module.css'

interface SolutionProps {
  title?: string
  code?: string
  language?: string
  explanation?: string
  children?: React.ReactNode
}

export function Solution({ 
  title = "🔍 Показать решение", 
  code, 
  language = 'javascript',
  explanation,
  children 
}: SolutionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Ошибка копирования:', err)
    }
  }

  return (
    <div className={styles.solution}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className={styles.triggerContent}>
          <Eye size={18} className={styles.eyeIcon} />
          <span className={styles.triggerText}>{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <ChevronDown size={18} className={styles.chevronIcon} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className={styles.content}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.contentInner}>
              <div className={styles.successBadge}>
                <CheckCircle size={16} />
                <span>Решение</span>
              </div>

              {code && (
                <div className={styles.codeBlock}>
                  <div className={styles.codeHeader}>
                    <span className={styles.language}>{language}</span>
                    <button
                      className={styles.copyButton}
                      onClick={handleCopy}
                      title="Копировать код решения"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Скопировано!' : 'Копировать'}
                    </button>
                  </div>
                  
                  <SyntaxHighlighter
                    language={language}
                    style={tomorrow}
                    customStyle={{
                      margin: 0,
                      borderRadius: '0 0 8px 8px',
                      fontSize: '14px',
                      lineHeight: '1.5',
                    }}
                    showLineNumbers={false}
                    wrapLongLines={true}
                  >
                    {code}
                  </SyntaxHighlighter>
                </div>
              )}

              {explanation && (
                <div className={styles.explanation}>
                  <h5 className={styles.explanationTitle}>📝 Объяснение решения:</h5>
                  <div className={styles.explanationText}>
                    {explanation}
                  </div>
                </div>
              )}

              {children && (
                <div className={styles.customContent}>
                  {children}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 