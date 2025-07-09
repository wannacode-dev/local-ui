'use client'

import { useState, useEffect } from 'react'
import TaskSidebar from './components/TaskSidebar'
import TaskViewer from './components/TaskViewer'
import { useSearchParams, useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function Home() {
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'problem' | 'solution'>('problem')
  const [tasks, setTasks] = useState<any[]>([])
  const [sidebarHidden, setSidebarHidden] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    loadTasks()
  }, [])

  useEffect(() => {
    const task = searchParams.get('task')
    
    if (task) {
      setSelectedTask(task)
      // Определяем режим просмотра на основе имени файла
      setViewMode(task.includes('.solution.') ? 'solution' : 'problem')
    }
  }, [searchParams])

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error('Ошибка загрузки заданий:', error)
    }
  }

  const handleTaskSelect = (taskFile: string) => {
    console.log('Task selected:', { taskFile })
    const url = new URL(window.location.href)
    url.searchParams.set('task', taskFile)
    router.push(url.pathname + url.search)
  }

  const handleViewModeChange = async (mode: 'problem' | 'solution') => {
    console.log('View mode changed:', { mode })
    const url = new URL(window.location.href)
    const currentTask = url.searchParams.get('task')
    
    if (currentTask) {
      let newTask = currentTask
      
      if (mode === 'solution') {
        // Переключаемся на решение - проверяем существование файлов решений
        const solutionVariants = []
        
        if (currentTask.includes('.problem.')) {
          solutionVariants.push(currentTask.replace('.problem.', '.solution.'))
          solutionVariants.push(currentTask.replace('.problem.', '.решение.'))
        } else if (currentTask.includes('.проблема.')) {
          solutionVariants.push(currentTask.replace('.проблема.', '.решение.'))
          solutionVariants.push(currentTask.replace('.проблема.', '.solution.'))
        }
        
        // Проверяем, какой файл решения существует
        for (const variant of solutionVariants) {
          try {
            const testPath = `src/${variant.replace(/^src\//, '')}`
            const testResponse = await fetch(`/api/playground?file=${encodeURIComponent(testPath)}`, { method: 'HEAD' })
            if (testResponse.ok) {
              newTask = variant
              break
            }
          } catch {
            // Продолжаем поиск
          }
        }
        
        // Если не нашли файл решения, остаемся на задании
        if (newTask === currentTask) {
          console.warn('Solution file not found, staying on problem')
          return
        }
      } else {
        // Переключаемся на задание
        if (currentTask.includes('.solution.')) {
          newTask = currentTask.replace('.solution.', '.problem.')
        } else if (currentTask.includes('.решение.')) {
          newTask = currentTask.replace('.решение.', '.problem.')
        }
      }
      
      setViewMode(mode)
      url.searchParams.set('task', newTask)
      router.push(url.pathname + url.search, { scroll: false })
    }
  }

  return (
    <div className={styles.container} style={{ '--sidebar-hidden': sidebarHidden ? '1' : '0' } as any}>
      <div className={`${styles.sidebar} ${sidebarHidden ? styles.hidden : ''}`}>
        <TaskSidebar 
          tasks={tasks} 
          onTaskSelect={handleTaskSelect}
          selectedTask={selectedTask}
          viewMode={viewMode}
          isHidden={sidebarHidden}
          onToggleHidden={() => setSidebarHidden(!sidebarHidden)}
        />
      </div>
      <div className={styles.mainContent}>
        {selectedTask ? (
          <TaskViewer 
            taskFile={selectedTask} 
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            allTasks={tasks}
            onTaskSelect={handleTaskSelect}
          />
        ) : (
          <div className="emptyState">
            Выберите задание из бокового меню
          </div>
        )}
      </div>
    </div>
  )
} 