'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion, easeInOut } from 'framer-motion'
import { ChevronRight, Folder, FolderOpen } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

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
    
    // Нормализуем пути для сравнения (убираем .problem/.solution)
    const normalizeTaskFile = (file: string) => {
      return file.replace(/\.(problem|solution)\./, '.PLACEHOLDER.')
    }
    
    return normalizeTaskFile(selectedTask) === normalizeTaskFile(taskFile)
  }

  return (
    <div className="sidebar">
      <style jsx global>{`
        .sidebar {
          width: 320px;
          background: var(--brand-dark);
          border-right: 1px solid rgba(30, 41, 59, 0.5);
          height: 100vh;
          overflow-y: auto;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .sidebar::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar::-webkit-scrollbar-track {
          background: var(--brand-dark);
        }

        .sidebar::-webkit-scrollbar-thumb {
          background: var(--quasar-blue);
          border-radius: 2px;
        }

        .sidebar-header {
          padding: 20px 16px;
          background: linear-gradient(to bottom, 
            rgba(11, 17, 32, 0.95),
            rgba(11, 17, 32, 0.8)
          );
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 10;
          border-bottom: 1px solid rgba(14, 165, 233, 0.1);
        }

        .sidebar-title {
          font-size: 20px;
          font-weight: 600;
          background: linear-gradient(135deg, var(--quasar-blue), var(--quasar-purple));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 4px;
        }

        .sidebar-subtitle {
          color: var(--ocean-300);
          font-size: 13px;
          opacity: 0.8;
        }

        .chapters-container {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .chapter-accordion {
          background: rgba(14, 165, 233, 0.03);
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(14, 165, 233, 0.1);
          transition: all 0.2s ease;
        }

        .chapter-accordion:hover {
          background: rgba(14, 165, 233, 0.05);
          border-color: rgba(14, 165, 233, 0.2);
          box-shadow: 0 4px 20px rgba(14, 165, 233, 0.05);
        }

        .chapter-header {
          width: 100%;
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .chapter-header::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to right,
            rgba(14, 165, 233, 0.0),
            rgba(14, 165, 233, 0.05)
          );
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .chapter-header:hover::before {
          opacity: 1;
        }

        .chapter-header.active {
          background: linear-gradient(to right,
            rgba(14, 165, 233, 0.1),
            rgba(168, 85, 247, 0.05)
          );
        }

        .chapter-title-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
          color: var(--ocean-50);
          font-weight: 500;
        }

        .chapter-icon {
          display: flex;
          color: var(--quasar-blue);
          width: 18px;
          height: 18px;
          filter: drop-shadow(0 0 4px rgba(14, 165, 233, 0.3));
        }

        .chapter-folder {
          color: var(--quasar-blue);
          width: 18px;
          height: 18px;
          filter: drop-shadow(0 0 4px rgba(14, 165, 233, 0.3));
        }

        .chapter-content {
          overflow: hidden;
          padding: 6px 0 8px 28px;
          background: rgba(11, 17, 32, 0.4);
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: relative;
        }

        .chapter-content::before {
          content: '';
          position: absolute;
          left: 20px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom,
            rgba(14, 165, 233, 0.2),
            rgba(14, 165, 233, 0.05)
          );
        }

        .task-button {
          width: 100%;
          text-align: left;
          padding: 10px 14px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--ocean-200);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          position: relative;
          margin-right: 12px;
        }

        .task-button::before {
          content: '';
          position: absolute;
          left: -8px;
          top: 50%;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--ocean-700);
          opacity: 0.5;
          transform: translateY(-50%);
          transition: all 0.2s ease;
        }

        .task-button:hover {
          background: rgba(14, 165, 233, 0.08);
          color: var(--ocean-50);
          transform: translateX(4px);
        }

        .task-button:hover::before {
          background: var(--quasar-blue);
          opacity: 1;
          box-shadow: 0 0 8px rgba(14, 165, 233, 0.4);
        }

        .task-button.selected {
          background: linear-gradient(135deg,
            rgba(14, 165, 233, 0.15),
            rgba(168, 85, 247, 0.1)
          );
          color: var(--ocean-50);
        }

        .task-button.selected::before {
          background: var(--quasar-blue);
          opacity: 1;
          box-shadow: 0 0 12px rgba(14, 165, 233, 0.5);
        }

        .task-number {
          min-width: 24px;
          height: 24px;
          background: rgba(14, 165, 233, 0.1);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
          color: var(--quasar-blue);
          border: 1px solid rgba(14, 165, 233, 0.2);
          transition: all 0.2s ease;
        }

        .task-button:hover .task-number {
          background: rgba(14, 165, 233, 0.15);
          border-color: rgba(14, 165, 233, 0.3);
          color: var(--ocean-50);
        }

        .task-name {
          flex: 1;
          opacity: 0.9;
          font-weight: 500;
          line-height: 1.4;
        }
      `}</style>

      <div className="sidebar-header">
        <h2 className="sidebar-title">
          Задания по React
        </h2>
        <p className="sidebar-subtitle">
          Всего глав: {tasks.length}
        </p>
      </div>
      
      <div className="chapters-container">
        {tasks.map((chapter, chapterIndex) => (
          <div 
            key={chapterIndex} 
            className="chapter-accordion"
          >
            <motion.button
              className={`chapter-header ${openChapter === chapterIndex ? 'active' : ''}`}
              onClick={() => toggleChapter(chapterIndex)}
              whileTap={{ scale: 0.98 }}
            >
              <span className="chapter-title-wrapper">
                <motion.span
                  className="chapter-icon"
                  animate={{ rotate: openChapter === chapterIndex ? 90 : 0 }}
                  transition={{ duration: 0.2, ease: easeInOut }}
                >
                  <ChevronRight size={16} />
                </motion.span>
                <span className="chapter-name">{formatChapterName(chapter.chapter)}</span>
              </span>
              <motion.span
                className="chapter-folder"
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
                  className="chapter-content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: easeInOut }}
                >
                  {chapter.tasks.map((task, taskIndex) => (
                    <motion.button
                      key={taskIndex}
                      className={`task-button ${isTaskSelected(task.file) ? 'selected' : ''}`}
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
                      <span className="task-number">{taskIndex + 1}</span>
                      <span className="task-name">{task.name}</span>
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