'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Lightbulb, Eye } from 'lucide-react'
import styles from './TaskHints.module.css'

interface HintItem {
  title: string
  content: React.ReactNode
}

interface TaskHintsProps {
  hints: HintItem[]
  title?: string
}

export function TaskHints({ hints, title = "💡 Подсказки" }: TaskHintsProps) {
  const [openHints, setOpenHints] = useState<Set<number>>(new Set())

  const toggleHint = (index: number) => {
    const newOpenHints = new Set(openHints)
    if (newOpenHints.has(index)) {
      newOpenHints.delete(index)
    } else {
      newOpenHints.add(index)
    }
    setOpenHints(newOpenHints)
  }

  return (
    <div className={styles.taskHints}>
      <div className={styles.header}>
        <Lightbulb size={18} className={styles.headerIcon} />
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.badge}>
          {openHints.size}/{hints.length}
        </div>
      </div>

      <div className={styles.hintsContainer}>
        {hints.map((hint, index) => (
          <div key={index} className={styles.hintItem}>
            <button
              className={styles.hintTrigger}
              onClick={() => toggleHint(index)}
              aria-expanded={openHints.has(index)}
            >
              <div className={styles.hintTriggerContent}>
                <Eye size={16} className={styles.hintIcon} />
                <span className={styles.hintTitle}>{hint.title}</span>
              </div>
              <motion.div
                animate={{ rotate: openHints.has(index) ? 180 : 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <ChevronDown size={16} className={styles.chevronIcon} />
              </motion.div>
            </button>

            <AnimatePresence>
              {openHints.has(index) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className={styles.hintContent}
                  style={{ overflow: 'hidden' }}
                >
                  <div className={styles.hintContentInner}>
                    {hint.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
} 