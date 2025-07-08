'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion, easeInOut } from 'framer-motion'
import { ChevronRight, Folder, FolderOpen } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './TaskSidebar.module.css'

interface Task {
  name: string
  file: string
}

interface Chapter {
  chapter: string
  tasks: Task[]
}

interface TaskSidebarProps {
  tasks: Chapter[]
  onTaskSelect: (taskFile: string) => void
  selectedTask: string | null
}

export default function TaskSidebar({ tasks, onTaskSelect, selectedTask }: TaskSidebarProps) {
  const [openChapter, setOpenChapter] = useState<number | null>(0)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Функция для красивого форматирования названий тем
  const formatChapterName = (chapterName: string): string => {
    // Убираем номер в начале (например, "01-")
    const withoutNumber = chapterName.replace(/^\d+-/, '')
    
    // Заменяем дефисы на пробелы и делаем первую букву каждого слова заглавной
    return withoutNumber
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const updateURL = (chapterIndex: number | null) => {
    const url = new URL(window.location.href)
    
    if (chapterIndex !== null) {
      url.searchParams.set('chapter', chapterIndex.toString())
    } else {
      url.searchParams.delete('chapter')
    }
    
    router.push(url.pathname + url.search, { scroll: false })
  }

  // Инициализация состояния из URL
  useEffect(() => {
    const chapter = searchParams.get('chapter')
    
    if (chapter) {
      setOpenChapter(parseInt(chapter))
    }
  }, [searchParams])

  const toggleChapter = (chapterIndex: number) => {
    const newOpenChapter = openChapter === chapterIndex ? null : chapterIndex
    setOpenChapter(newOpenChapter)
    updateURL(newOpenChapter)
  }

  const handleTaskSelect = (taskFile: string) => {
    onTaskSelect(taskFile)
  }

  // Функция для проверки, является ли задание выбранным (учитывает problem/solution)
  const isTaskSelected = (taskFile: string) => {
    if (!selectedTask) return false
    
    // Нормализуем пути для сравнения (убираем .problem/.проблема)
    const normalizeTaskFile = (file: string) => {
      return file.replace(/\.(problem|проблема)\./, '.PLACEHOLDER.')
    }
    
    return normalizeTaskFile(selectedTask) === normalizeTaskFile(taskFile)
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <p className={styles.headerText}>
          Всего глав: {tasks.length}
        </p>
      </div>
      
      <div className={styles.chaptersContainer}>
        {tasks.map((chapter, chapterIndex) => (
          <div 
            key={chapterIndex} 
            className={styles.chapterItem}
          >
            <motion.button
              className={styles.chapterButton}
              onClick={() => toggleChapter(chapterIndex)}
              whileTap={{ scale: 0.98 }}
            >
              <span className={styles.chapterContent}>
                <motion.span
                  className={styles.chapterIcon}
                  animate={{ rotate: openChapter === chapterIndex ? 90 : 0 }}
                  transition={{ duration: 0.2, ease: easeInOut }}
                >
                  <ChevronRight size={16} />
                </motion.span>
                <span className={styles.chapterTitle}>{formatChapterName(chapter.chapter)}</span>
              </span>
              <motion.span
                className={styles.folderIcon}
                animate={{
                  rotate: openChapter === chapterIndex ? 5 : 0,
                  scale: openChapter === chapterIndex ? 1.05 : 1,
                }}
                transition={{ duration: 0.2, ease: easeInOut }}
              >
                {openChapter === chapterIndex ? <FolderOpen size={16} /> : <Folder size={16} />}
              </motion.span>
            </motion.button>
            
            <AnimatePresence initial={false}>
              {openChapter === chapterIndex && (
                <motion.div
                  className={styles.tasksContainer}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: easeInOut }}
                >
                  {chapter.tasks.map((task, taskIndex) => (
                    <motion.button
                      key={taskIndex}
                      className={`${styles.taskButton} ${isTaskSelected(task.file) ? styles.selected : ''}`}
                      onClick={() => handleTaskSelect(task.file)}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ 
                        duration: 0.2,
                        delay: taskIndex * 0.03,
                        ease: easeInOut
                      }}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className={styles.taskNumber}>{taskIndex + 1}</span>
                      <span className={styles.taskName}>{task.name}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
} 