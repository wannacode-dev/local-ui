'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, Files, Lightbulb, ExternalLink, Code, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './TaskViewer.module.css'

interface TaskFile {
  name: string
  path: string
  type: 'problem' | 'solution' | 'other'
  extension: string
  canOpenInVSCode: boolean
}

interface Task {
  name: string
  file: string
}

interface Chapter {
  chapter: string
  tasks: Task[]
}

interface TaskViewerProps {
  taskFile: string
  viewMode: 'problem' | 'solution'
  onViewModeChange: (mode: 'problem' | 'solution') => void
  allTasks: Chapter[]
  onTaskSelect: (taskFile: string) => void
}

export default function TaskViewer({ taskFile, viewMode, onViewModeChange, allTasks, onTaskSelect }: TaskViewerProps) {
  const [content, setContent] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasSolution, setHasSolution] = useState(false)
  const [taskFiles, setTaskFiles] = useState<TaskFile[]>([])
  const [showFilesDropdown, setShowFilesDropdown] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [solutionStatus, setSolutionStatus] = useState<'original' | 'modified' | 'notfound'>('original')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Извлекаем информацию о пути задания
  const getTaskInfo = (taskFile: string) => {
    const parts = taskFile.split('/')
    let topic = ''
    let task = ''
    
    if (parts.length >= 2) {
      topic = parts[0]
      
      if (parts.length > 2) {
        // Есть подпапка с заданием
        task = parts[1]
      } else {
        // Извлекаем название задания из имени файла
        const fileName = parts[parts.length - 1]
        // Убираем расширение и суффиксы .problem/.solution/.проблема/.решение
        let cleanName = fileName.replace(/\.(problem|solution|проблема|решение)\.(js|jsx|html|ts|tsx|css)$/, '')
        // Если не нашли суффикс, просто убираем расширение
        if (cleanName === fileName) {
          cleanName = fileName.replace(/\.[^.]+$/, '')
        }
        task = cleanName
      }
    }
    
    return { topic, task }
  }

  const formatBreadcrumbName = (name: string) => {
    return name
      .replace(/^\d+-/, '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const { topic, task } = getTaskInfo(taskFile)

  // Получаем плоский список всех заданий для навигации
  const getAllTasksFlat = () => {
    const flat: Task[] = []
    allTasks.forEach(chapter => {
      chapter.tasks.forEach(task => {
        flat.push(task)
      })
    })
    return flat
  }

  const flatTasks = getAllTasksFlat()
  const currentTaskIndex = flatTasks.findIndex(t => t.file === taskFile)
  const hasPreviousTask = currentTaskIndex > 0
  const hasNextTask = currentTaskIndex < flatTasks.length - 1

  const handlePreviousTask = () => {
    if (hasPreviousTask) {
      const previousTask = flatTasks[currentTaskIndex - 1]
      // Находим индекс главы для нового задания
      const chapterIndex = allTasks.findIndex(chapter => 
        chapter.tasks.some(task => task.file === previousTask.file)
      )
      
      // Обновляем URL с нужными параметрами
      const url = new URL(window.location.href)
      url.searchParams.set('task', previousTask.file)
      if (chapterIndex >= 0) {
        url.searchParams.set('chapter', chapterIndex.toString())
      }
      window.history.pushState({}, '', url.pathname + url.search)
      
      onTaskSelect(previousTask.file)
    }
  }

  const handleNextTask = () => {
    if (hasNextTask) {
      const nextTask = flatTasks[currentTaskIndex + 1]
      // Находим индекс главы для нового задания
      const chapterIndex = allTasks.findIndex(chapter => 
        chapter.tasks.some(task => task.file === nextTask.file)
      )
      
      // Обновляем URL с нужными параметрами
      const url = new URL(window.location.href)
      url.searchParams.set('task', nextTask.file)
      if (chapterIndex >= 0) {
        url.searchParams.set('chapter', chapterIndex.toString())
      }
      window.history.pushState({}, '', url.pathname + url.search)
      
      onTaskSelect(nextTask.file)
    }
  }

  // Загружаем список файлов задания
  const loadTaskFiles = async () => {
    try {
      const response = await fetch(`/api/task-files?task=${encodeURIComponent(taskFile)}`)
      if (response.ok) {
        const files = await response.json()
        setTaskFiles(files)
      }
    } catch (error) {
      console.error('Error loading task files:', error)
    }
  }

  // Проверяем существование файла решения
  const checkSolutionExists = async (taskFile: string) => {
    // Получаем базовое имя файла без суффиксов problem/solution
    let baseName = taskFile
    
    // Убираем все возможные суффиксы
    baseName = baseName.replace(/\.(problem|solution|проблема|решение)\./, '.')
    
    // Создаем варианты файлов решений на основе базового имени
    const solutionVariants = []
    const extension = baseName.split('.').pop() || 'js'
    const nameWithoutExt = baseName.replace(/\.[^.]+$/, '')
    
    solutionVariants.push(`${nameWithoutExt}.solution.${extension}`)
    solutionVariants.push(`${nameWithoutExt}.решение.${extension}`)
    
    for (const solutionFile of solutionVariants) {
      try {
        const normalizedPath = `src/${solutionFile.replace(/^src\//, '')}`
        const response = await fetch(`/api/playground?file=${encodeURIComponent(normalizedPath)}`)
        if (response.ok) {
          return true
        }
      } catch {
        // Продолжаем проверку следующего варианта
      }
    }
    
    return false
  }

  const handleOpenInVSCode = async (file: string) => {
    try {
      let filePath = file
      
      // Если файл из playground, сначала убедимся что он скопирован из src
      if (file.startsWith('playground/')) {
        const cleanFile = file.replace(/^playground\//, '')
        const srcFile = `src/${cleanFile}`
        
        // Копируем файл из src в playground если его там нет
        await fetch('/api/playground', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ file: srcFile }),
        })
        
        filePath = file // оставляем playground путь
      } else if (!file.startsWith('src/')) {
        // Если это не playground и не src, добавляем src/ префикс
        filePath = `src/${file}`
      }

      console.log('Opening in VS Code:', filePath)

      const response = await fetch('/api/vscode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file: filePath }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to open file: ${errorText}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.url) {
        // Пытаемся открыть через vscode:// протокол
        window.location.href = result.url
        console.log('Successfully opened file in VS Code')
      } else {
        throw new Error('Failed to get VS Code URL')
      }
    } catch (error) {
      console.error('Error opening file in VS Code:', error)
      alert('Ошибка открытия файла в VS Code: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  const handleOpenInNewWindow = async () => {
    let filePath = taskFile
    
    if (viewMode === 'solution') {
      // Попробуем разные варианты решений
      const solutionVariants = []
      
      if (filePath.includes('.problem.')) {
        solutionVariants.push(filePath.replace('.problem.', '.solution.'))
        solutionVariants.push(filePath.replace('.problem.', '.решение.'))
      } else if (filePath.includes('.проблема.')) {
        solutionVariants.push(filePath.replace('.проблема.', '.решение.'))
        solutionVariants.push(filePath.replace('.проблема.', '.solution.'))
      }
      
      // Найдем первый существующий файл решения
      for (const variant of solutionVariants) {
        try {
          const testPath = `src/${variant.replace(/^src\//, '')}`
          const testResponse = await fetch(`/api/playground?file=${encodeURIComponent(testPath)}`, { method: 'HEAD' })
          if (testResponse.ok) {
            filePath = variant
            break
          }
        } catch {
          // Продолжаем поиск
        }
      }
    }
    
    const url = `/api/preview?file=${encodeURIComponent(filePath)}&live=true`
    window.open(url, '_blank')
  }

  const handleRefresh = async () => {
    if (!taskFile) {
      console.warn('No task file provided')
      return
    }

    setIsRefreshing(true)
    try {
      let filePath = taskFile
      
      if (viewMode === 'solution') {
        // Попробуем разные варианты решений
        const solutionVariants = []
        
        if (filePath.includes('.problem.')) {
          solutionVariants.push(filePath.replace('.problem.', '.solution.'))
          solutionVariants.push(filePath.replace('.problem.', '.решение.'))
        } else if (filePath.includes('.проблема.')) {
          solutionVariants.push(filePath.replace('.проблема.', '.решение.'))
          solutionVariants.push(filePath.replace('.проблема.', '.solution.'))
        }
        
        // Найдем первый существующий файл решения
        let foundSolution = false
        for (const variant of solutionVariants) {
          try {
            const testPath = `src/${variant.replace(/^src\//, '')}`
            const testResponse = await fetch(`/api/playground?file=${encodeURIComponent(testPath)}`, { method: 'HEAD' })
            if (testResponse.ok) {
              filePath = variant
              foundSolution = true
              break
            }
          } catch {
            // Продолжаем поиск
          }
        }
        
        // Если не нашли файл решения, показываем ошибку
        if (!foundSolution) {
          throw new Error('Файл решения не найден')
        }
      }
      
      filePath = filePath.replace(/^src\//, '')
      const normalizedPath = `src/${filePath}`
      
      const timestamp = new Date().getTime()
      const url = `/api/playground?file=${encodeURIComponent(normalizedPath)}&t=${timestamp}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch task: ${response.statusText}`)
      }
      
      const data = await response.text()
      if (!data.trim()) {
        throw new Error('Received empty content')
      }
      
      setContent(data)
      setError(null)
    } catch (error) {
      console.error('Error loading task:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Тихое автообновление без лишних логов
  const silentRefresh = async () => {
    if (!taskFile) return

    try {
      let filePath = taskFile
      
      if (viewMode === 'solution') {
        // Для файлов решений сначала проверяем, не изменил ли их пользователь
        const cleanPath = filePath.replace(/^src\//, '')
        
        try {
          const playgroundResponse = await fetch(`/api/playground?file=${encodeURIComponent(`src/${cleanPath}`)}&check=playground`, { method: 'HEAD' })
          if (playgroundResponse.ok) {
            // Файл существует в playground, значит пользователь его изменил
            // НЕ ОБНОВЛЯЕМ такие файлы
            setSolutionStatus('modified')
            return
          }
        } catch {
          // Файл не существует в playground, продолжаем
        }
        
        // Попробуем разные варианты решений
        const solutionVariants = []
        
        if (filePath.includes('.problem.')) {
          solutionVariants.push(filePath.replace('.problem.', '.solution.'))
          solutionVariants.push(filePath.replace('.problem.', '.решение.'))
        } else if (filePath.includes('.проблема.')) {
          solutionVariants.push(filePath.replace('.проблема.', '.решение.'))
          solutionVariants.push(filePath.replace('.проблема.', '.solution.'))
        }
        
        // Найдем первый существующий файл решения
        let foundSolution = false
        for (const variant of solutionVariants) {
          try {
            const testPath = `src/${variant.replace(/^src\//, '')}`
            const testResponse = await fetch(`/api/playground?file=${encodeURIComponent(testPath)}`, { method: 'HEAD' })
            if (testResponse.ok) {
              filePath = variant
              foundSolution = true
              break
            }
          } catch {
            // Продолжаем поиск
          }
        }
        
        // Если не нашли файл решения, не обновляем
        if (!foundSolution) {
          console.warn('Solution file not found for auto-refresh')
          setSolutionStatus('notfound')
          return
        }
        
        setSolutionStatus('original')
      }
      
      filePath = filePath.replace(/^src\//, '')
      const normalizedPath = `src/${filePath}`
      
      const timestamp = new Date().getTime()
      const url = `/api/playground?file=${encodeURIComponent(normalizedPath)}&t=${timestamp}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.text()
        if (data.trim()) {
          setContent(data)
          setError(null)
        }
      }
    } catch (error) {
      // Тихо игнорируем ошибки при автообновлении
      console.warn('Silent refresh error:', error)
    }
  }

  // Сброс файла к исходному состоянию
  const handleReset = async () => {
    if (!taskFile) return

    try {
      let filePath = taskFile
      
      if (viewMode === 'solution') {
        // Попробуем разные варианты решений
        const solutionVariants = []
        
        if (filePath.includes('.problem.')) {
          solutionVariants.push(filePath.replace('.problem.', '.solution.'))
          solutionVariants.push(filePath.replace('.problem.', '.решение.'))
        } else if (filePath.includes('.проблема.')) {
          solutionVariants.push(filePath.replace('.проблема.', '.решение.'))
          solutionVariants.push(filePath.replace('.проблема.', '.solution.'))
        }
        
        // Найдем первый существующий файл решения
        let foundSolution = false
        for (const variant of solutionVariants) {
          try {
            const testPath = `src/${variant.replace(/^src\//, '')}`
            const testResponse = await fetch(`/api/playground?file=${encodeURIComponent(testPath)}`, { method: 'HEAD' })
            if (testResponse.ok) {
              filePath = variant
              foundSolution = true
              break
            }
          } catch {
            // Продолжаем поиск
          }
        }
        
        // Если не нашли файл решения, показываем ошибку
        if (!foundSolution) {
          alert('Файл решения не найден')
          return
        }
      }
      
      filePath = filePath.replace(/^src\//, '')
      const normalizedPath = `src/${filePath}`
      
      // Сбрасываем файл через DELETE API
      const response = await fetch(`/api/playground?file=${encodeURIComponent(normalizedPath)}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Обновляем содержимое
        await handleRefresh()
        alert('Файл сброшен к исходному состоянию')
      } else {
        throw new Error('Ошибка сброса файла')
      }
    } catch (error) {
      console.error('Error resetting file:', error)
      alert('Ошибка сброса файла: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  // Управление автообновлением
  useEffect(() => {
    if (autoRefresh && taskFile) {
      intervalRef.current = setInterval(() => {
        silentRefresh()
      }, 5000) // Обновляем каждые 5 секунд
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, taskFile])

  useEffect(() => {
    if (taskFile) {
      // Сбрасываем статус решения при смене задания
      setSolutionStatus('original')
      handleRefresh()
      checkSolutionExists(taskFile).then(setHasSolution)
      loadTaskFiles()
      // Закрываем выпадающее меню при смене задания
      setShowFilesDropdown(false)
    }
  }, [taskFile, viewMode])

  return (
    <div className={styles.container}>


      {/* Область результата */}
      <div className={styles.content}>
        <div className={styles.browserContainer}>
          {/* Браузерная панель */}
          <div className={styles.browserHeader}>
            {/* Кнопки браузера */}
            <div className={styles.browserButtons}>
              <div className={styles.browserDot} style={{ background: '#ff5f57' }}></div>
              <div className={styles.browserDot} style={{ background: '#ffbd2e' }}></div>
              <div className={styles.browserDot} style={{ background: '#28ca42' }}></div>
            </div>
            
            {/* Адресная строка с информацией */}
            <div className={styles.addressBar}>
              <div className={styles.addressContent}>
                <span className={styles.addressTopic}>
                  {formatBreadcrumbName(topic)}
                </span>
                <span className={styles.addressSeparator}>/</span>
                <span className={styles.addressTask}>
                  {formatBreadcrumbName(task)}
                </span>
                <span className={styles.addressMode}>
                  {viewMode === 'solution' ? ' (Решение)' : ' (Задание)'}
                </span>
              </div>
            </div>
            
            {/* Кнопки управления */}
            <div className={styles.browserControls}>
              {/* Обновить - скрываем при автообновлении */}
              {!autoRefresh && (
                <motion.button
                  className={`${styles.browserAction} ${styles.refreshAction}`}
                  onClick={handleRefresh}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RefreshCw size={16} className={isRefreshing ? styles.spinning : ''} />
                  <span>Обновить</span>
                </motion.button>
              )}

              {/* Автообновление */}
              <motion.button
                className={`${styles.browserAction} ${autoRefresh ? styles.autoActiveAction : styles.autoAction}`}
                onClick={() => setAutoRefresh(!autoRefresh)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={
                  viewMode === 'solution' 
                    ? solutionStatus === 'modified' 
                      ? 'Автообновление отключено - файл изменен'
                      : solutionStatus === 'notfound'
                      ? 'Файл решения не найден'
                      : 'Автообновление для исходного решения'
                    : 'Переключить автообновление'
                }
              >
                <RotateCcw size={16} className={autoRefresh ? styles.spinning : ''} />
                <span>
                  {autoRefresh ? (
                    viewMode === 'solution' ? (
                      solutionStatus === 'modified' ? 'Авто (изменено)' :
                      solutionStatus === 'notfound' ? 'Авто (не найдено)' :
                      'Авто (решение)'
                    ) : 'Авто ВКЛ'
                  ) : 'Авто ВЫКЛ'}
                </span>
              </motion.button>

              {/* Сбросить */}
              <motion.button
                className={`${styles.browserAction} ${styles.resetAction}`}
                onClick={handleReset}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RotateCcw size={16} />
                <span>Сбросить</span>
              </motion.button>

              {/* Разделитель */}
              <div className={styles.browserSeparator}></div>

              {/* Посмотреть решение */}
              {hasSolution && (
                <motion.button
                  className={`${styles.browserAction} ${styles.solutionAction}`}
                  onClick={() => onViewModeChange(viewMode === 'problem' ? 'solution' : 'problem')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Lightbulb size={16} />
                  <span>{viewMode === 'problem' ? 'Решение' : 'Задание'}</span>
                </motion.button>
              )}

              {/* Открыть в новом окне */}
              <motion.button
                className={`${styles.browserAction} ${styles.newWindowAction}`}
                onClick={handleOpenInNewWindow}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ExternalLink size={16} />
                <span>Новое окно</span>
              </motion.button>
            </div>
          </div>
          
          {/* Область контента браузера */}
          <div className={styles.browserContent}>
            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            {content ? (
              <iframe
                ref={iframeRef}
                srcDoc={content}
                className={styles.iframe}
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className={styles.loading}>
                {error ? 'Ошибка загрузки' : 'Загрузка задания...'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer с навигацией и файлами */}
      <div className={styles.footer}>
        <div className={styles.footerControls}>
          {/* Навигация */}
          <div className={styles.navigationControls}>
            <motion.button 
              className={styles.footerNavButton}
              onClick={handlePreviousTask}
              disabled={!hasPreviousTask}
              whileHover={{ scale: hasPreviousTask ? 1.02 : 1 }}
              whileTap={{ scale: hasPreviousTask ? 0.98 : 1 }}
            >
              <ChevronLeft size={16} />
              Предыдущее
            </motion.button>
            <motion.button 
              className={styles.footerNavButton}
              onClick={handleNextTask}
              disabled={!hasNextTask}
              whileHover={{ scale: hasNextTask ? 1.02 : 1 }}
              whileTap={{ scale: hasNextTask ? 0.98 : 1 }}
            >
              Следующее
              <ChevronRight size={16} />
            </motion.button>
          </div>

          {/* Файлы */}
          <div style={{ position: 'relative' }}>
            <motion.button
              className={styles.footerActionButton}
              onClick={() => setShowFilesDropdown(!showFilesDropdown)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Files size={16} />
              Файлы
            </motion.button>

            <AnimatePresence>
              {showFilesDropdown && (
                <motion.div
                  className={styles.dropdown}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{ bottom: '100%', top: 'auto' }}
                >
                  {taskFiles.map((file, index) => (
                    <div
                      key={index}
                      className={styles.dropdownItem}
                      onClick={() => {
                        if (file.canOpenInVSCode) {
                          handleOpenInVSCode(`playground/${file.path}`)
                        }
                        setShowFilesDropdown(false)
                      }}
                    >
                      <Code size={14} />
                      {file.name}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
} 