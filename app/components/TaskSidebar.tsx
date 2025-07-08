'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion, easeInOut } from 'framer-motion'
import { ChevronRight, Folder, FolderOpen, X, PanelLeftClose, Menu, ChevronsRight, Code2, BookOpen } from 'lucide-react'
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
  viewMode: 'problem' | 'solution'
  isHidden: boolean
  onToggleHidden: () => void
}

export default function TaskSidebar({ tasks, onTaskSelect, selectedTask, viewMode, isHidden, onToggleHidden }: TaskSidebarProps) {
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
    
    // Нормализуем пути для сравнения (убираем все суффиксы типов заданий)
    const normalizeTaskFile = (file: string) => {
      return file.replace(/\.(problem|solution|проблема|решение)\./, '.PLACEHOLDER.')
    }
    
    return normalizeTaskFile(selectedTask) === normalizeTaskFile(taskFile)
  }

  return (
    <div className={styles.sidebar}>
      <div className={`${styles.header} ${isHidden ? styles.headerCollapsed : ''}`}>
        {!isHidden && (
          <div className={styles.headerContent}>
            <div className={styles.logo}>
              <Code2 size={20} className={styles.logoIcon} />
              <span className={styles.logoText}>
                {(() => {
                  // Находим название текущего задания
                  if (!selectedTask) return 'Курс'
                  
                  for (const chapter of tasks) {
                    const task = chapter.tasks.find(t => isTaskSelected(t.file))
                    if (task) return task.name
                  }
                  return 'Курс'
                })()}
              </span>
            </div>
            <div className={styles.taskCount}>
              {tasks.reduce((total, chapter) => total + chapter.tasks.length, 0)} заданий
            </div>
          </div>
        )}
        
        <motion.button
          className={`${styles.toggleButton} ${isHidden ? styles.toggleButtonCollapsed : ''}`}
          onClick={onToggleHidden}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={isHidden ? "Развернуть боковое меню" : "Свернуть боковое меню"}
        >
          {isHidden ? (
            <ChevronsRight size={20} />
          ) : (
            <PanelLeftClose size={16} />
          )}
        </motion.button>
      </div>
      
      <div className={`${styles.chaptersContainer} ${isHidden ? styles.chaptersCollapsed : ''}`}>
        {tasks.map((chapter, chapterIndex) => (
          <div 
            key={chapterIndex} 
            className={styles.chapterItem}
          >
            <motion.button
              className={`${styles.chapterButton} ${isHidden ? styles.chapterButtonCollapsed : ''}`}
              onClick={() => {
                if (!isHidden) {
                  toggleChapter(chapterIndex)
                }
              }}
              whileTap={{ scale: 0.98 }}
              title={isHidden ? formatChapterName(chapter.chapter) : undefined}
            >
              {isHidden ? (
                // Свернутый вид - только иконка
                <motion.span
                  className={styles.folderIconCollapsed}
                  animate={{
                    scale: openChapter === chapterIndex ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.2, ease: easeInOut }}
                >
                  {openChapter === chapterIndex ? <FolderOpen size={20} /> : <Folder size={20} />}
                </motion.span>
              ) : (
                // Развернутый вид - полный интерфейс
                <>
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
                </>
              )}
            </motion.button>
            
            <AnimatePresence initial={false}>
              {openChapter === chapterIndex && !isHidden && (
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
                      <div className={styles.taskContent}>
                        <span className={styles.taskName}>{task.name}</span>
                        {isTaskSelected(task.file) && (
                          <span className={`${styles.viewModeIndicator} ${viewMode === 'solution' ? styles.solutionMode : styles.problemMode}`}>
                            {viewMode === 'solution' ? 'Решение' : 'Задание'}
                          </span>
                        )}
                      </div>
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