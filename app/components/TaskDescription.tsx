'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, PanelRightClose, Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import styles from './TaskDescription.module.css'

interface TaskDescriptionProps {
  taskFile: string
  isHidden: boolean
  onToggleHidden: () => void
}

interface CodeBlockProps {
  children: string
  className?: string
}

// Компонент для блока кода с кнопкой копирования
function CodeBlock({ children, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : 'javascript'
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Ошибка копирования:', err)
    }
  }

  return (
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
          borderRadius: '0 0 8px 8px',
          fontSize: '15px',
          lineHeight: '1.5',
          background: '#2d3748',
          color: '#e2e8f0'
        }}
        showLineNumbers={false}
        wrapLongLines={true}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}

export default function TaskDescription({ taskFile, isHidden, onToggleHidden }: TaskDescriptionProps) {
  const [description, setDescription] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadDescription = async () => {
    if (!taskFile) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/readme?task=${encodeURIComponent(taskFile)}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('README.md не найден для этого задания')
        }
        throw new Error(`Ошибка загрузки: ${response.statusText}`)
      }
      
      const content = await response.text()
      setDescription(content)
    } catch (error) {
      console.error('Error loading task description:', error)
      setError(error instanceof Error ? error.message : 'Ошибка загрузки описания')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDescription()
  }, [taskFile])

  return (
    <div className={`${styles.sidebar} ${isHidden ? styles.sidebarHidden : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <BookOpen size={20} className={styles.headerIcon} />
          <span className={styles.headerTitle}>Описание задания</span>
        </div>
        
        <motion.button
          className={styles.toggleButton}
          onClick={onToggleHidden}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Скрыть описание"
        >
          <PanelRightClose size={16} />
        </motion.button>
      </div>

      <AnimatePresence>
        {!isHidden && (
          <motion.div
            className={styles.content}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {isLoading && (
              <div className={styles.loading}>
                <div className={styles.skeleton}>
                  <div className={`${styles.skeletonLine} ${styles.title}`}></div>
                  <div className={`${styles.skeletonLine} ${styles.subtitle}`}></div>
                  <div className={`${styles.skeletonLine} ${styles.long}`}></div>
                  <div className={`${styles.skeletonLine} ${styles.medium}`}></div>
                  <div className={`${styles.skeletonLine} ${styles.short}`}></div>
                  <div className={`${styles.skeletonLine} ${styles.long}`}></div>
                  <div className={`${styles.skeletonLine} ${styles.medium}`}></div>
                  <div className={`${styles.skeletonLine} ${styles.title}`}></div>
                  <div className={`${styles.skeletonLine} ${styles.short}`}></div>
                  <div className={`${styles.skeletonLine} ${styles.long}`}></div>
                </div>
              </div>
            )}

            {error && (
              <div className={styles.error}>
                <BookOpen size={24} className={styles.errorIcon} />
                <span>{error}</span>
              </div>
            )}

            {description && !isLoading && (
              <motion.div 
                className={styles.description}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, className, children, ...props }) {
                      const isInline = !className || !className.startsWith('language-')
                      
                      if (isInline) {
                        return (
                          <code className={styles.inlineCode} {...props}>
                            {children}
                          </code>
                        )
                      }
                      return (
                        <CodeBlock className={className}>
                          {String(children).replace(/\n$/, '')}
                        </CodeBlock>
                      )
                    }
                  }}
                >
                  {description}
                </ReactMarkdown>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 