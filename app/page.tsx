'use client'

import { useState, useEffect } from 'react'
import TaskSidebar from './components/TaskSidebar'
import TaskViewer from './components/TaskViewer'
import { useSearchParams, useRouter } from 'next/navigation'
import { loadCourseConfig } from './config/course'
import { CourseConfig } from './types/course'

export default function Home() {
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'problem' | 'solution'>('problem')
  const [tasks, setTasks] = useState<any[]>([])
  const [courseConfig, setCourseConfig] = useState<CourseConfig>({
    title: 'Загрузка...',
    description: 'Загрузка курса...',
    chapterTranslations: {}
  })
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    loadTasks()
    loadConfig()
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

  const loadConfig = async () => {
    try {
      const config = await loadCourseConfig()
      setCourseConfig(config)
    } catch (error) {
      console.error('Ошибка загрузки конфигурации:', error)
    }
  }

  const handleTaskSelect = (taskFile: string) => {
    console.log('Task selected:', { taskFile })
    const url = new URL(window.location.href)
    url.searchParams.set('task', taskFile)
    router.push(url.pathname + url.search)
  }

  const handleViewModeChange = (mode: 'problem' | 'solution') => {
    console.log('View mode changed:', { mode })
    setViewMode(mode)
    const url = new URL(window.location.href)
    const currentTask = url.searchParams.get('task')
    if (currentTask) {
      const newTask = mode === 'solution' 
        ? currentTask.replace('.problem.', '.solution.')
        : currentTask.replace('.solution.', '.problem.')
      url.searchParams.set('task', newTask)
      router.push(url.pathname + url.search, { scroll: false })
    }
  }

  return (
    <div className="container">
      <TaskSidebar 
        tasks={tasks} 
        onTaskSelect={handleTaskSelect}
        selectedTask={selectedTask}
      />
      <div className="main-content">
        <div className="header">
          <h1>{courseConfig.title}</h1>
          <p>{courseConfig.description}</p>
        </div>
        <div className="content">
          {selectedTask ? (
            <TaskViewer 
              taskFile={selectedTask} 
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />
          ) : (
            <div className="loading">
              Выберите задание из бокового меню
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 