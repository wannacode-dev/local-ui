'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, Files, Lightbulb, ExternalLink, Code, RotateCcw, BookOpen, Menu, X, RotateCw as RotateCwClockwise } from 'lucide-react'
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
  onMobileMenuToggle?: () => void
  sidebarHidden?: boolean
  isDescriptionHidden?: boolean
  onToggleDescription?: () => void
}

export default function TaskViewer({ taskFile, viewMode, onViewModeChange, allTasks, onTaskSelect, onMobileMenuToggle, sidebarHidden = false, isDescriptionHidden = false, onToggleDescription }: TaskViewerProps) {
  const [content, setContent] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasSolution, setHasSolution] = useState(false)
  const [taskFiles, setTaskFiles] = useState<TaskFile[]>([])
  const [showFilesDropdown, setShowFilesDropdown] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
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
      console.log('Loading task files for:', taskFile)
      const response = await fetch(`/api/task-files?task=${encodeURIComponent(taskFile)}`)
      console.log('Response status:', response.status)
      if (response.ok) {
        const files = await response.json()
        console.log('Loaded files:', files)
        setTaskFiles(files)
      } else {
        console.error('Failed to load task files:', response.status, response.statusText)
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
    }
  }

  // Сброс файла к исходному состоянию
  const handleReset = async () => {
    if (!taskFile) return

    // Запрашиваем подтверждение у пользователя
    if (!confirm('Вы уверены, что хотите сбросить файл к исходному состоянию? Все внесенные изменения будут потеряны.')) {
      return
    }

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
  }, [autoRefresh, taskFile, viewMode])

  useEffect(() => {
    if (taskFile) {
      handleRefresh()
      checkSolutionExists(taskFile).then(setHasSolution)
      loadTaskFiles()
      // Закрываем выпадающее меню при смене задания
      setShowFilesDropdown(false)
    }
  }, [taskFile, viewMode])

  return (
          <div className={styles.container}>

      {/* Мобильная кнопка меню */}
      <motion.button
        className={styles.mobileMenuButton}
        onClick={onMobileMenuToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Открыть меню"
      >
        <Menu size={20} />
      </motion.button>

      {/* Область результата */}
      <div className={styles.content}>
        <div className={styles.browserContainer}>
          {/* Браузерная панель */}
          <div className={styles.browserHeader}>
            {/* Кнопки браузера - скрываем на мобильных при открытом меню */}
            <div className={`${styles.browserButtons} ${(!isDescriptionHidden || !sidebarHidden) ? styles.browserButtonsHidden : ''}`}>
              <div className={styles.browserDot} style={{ background: '#ff5f57' }}></div>
              <div className={styles.browserDot} style={{ background: '#ffbd2e' }}></div>
              <div className={styles.browserDot} style={{ background: '#28ca42' }}></div>
            </div>
            
            {/* Адресная строка с информацией - теперь адаптивная */}
            <div className={`${styles.addressBar} ${(!isDescriptionHidden || !sidebarHidden) ? styles.addressBarCompact : ''}`}>
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
            
            {/* Кнопки управления - адаптируем для разных экранов */}
            <div className={`${styles.browserControls} ${(!isDescriptionHidden || !sidebarHidden) ? styles.browserControlsCompact : ''}`}>
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
              >
                <RotateCwClockwise size={16} className={autoRefresh ? styles.spinning : ''} />
                <span>{autoRefresh ? 'Авто ВКЛ' : 'Авто ВЫКЛ'}</span>
              </motion.button>

              {/* Разделитель - скрываем на средних экранах при открытом описании */}
              <div className={styles.browserSeparator}></div>

              {/* Посмотреть решение */}
              {hasSolution && (
                <motion.button
                  className={`${styles.browserAction} ${styles.solutionAction} ${viewMode === 'solution' ? styles.solutionActiveAction : ''}`}
                  onClick={() => onViewModeChange(viewMode === 'problem' ? 'solution' : 'problem')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Lightbulb size={16} />
                  <span>Решение</span>
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

              {/* Показать/скрыть описание - всегда видна для управления */}
              <motion.button
                className={`${styles.browserAction} ${styles.descriptionAction} ${!isDescriptionHidden ? styles.descriptionActiveAction : ''}`}
                onClick={onToggleDescription}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <BookOpen size={16} />
                <span>{isDescriptionHidden ? 'Показать' : 'Скрыть'} описание</span>
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
          {/* Левая группа: навигация + файлы */}
          <div className={styles.leftControls}>
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

            {/* Кнопка файлов */}
            <div className={styles.filesButtonContainer}>
              <motion.button
                className={styles.footerActionButton}
                onClick={() => {
                  console.log('Files button clicked, current state:', showFilesDropdown)
                  console.log('Task files count:', taskFiles.length)
                  setShowFilesDropdown(!showFilesDropdown)
                }}
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className={styles.dropdownHeader}>
                      <Files size={16} />
                      Файлы задания ({taskFiles.length})
                    </div>
                    <div className={styles.dropdownContent}>
                      {taskFiles.length > 0 ? (
                        taskFiles.map((file, index) => (
                          <div
                            key={index}
                            className={styles.dropdownItem}
                            onClick={() => {
                              if (file.canOpenInVSCode) {
                                handleOpenInVSCode(`playground/${file.path}`)
                              }
                              setShowFilesDropdown(false)
                            }}
                            title={`${file.canOpenInVSCode ? 'Нажмите, чтобы открыть в VS Code' : 'Недоступно для редактирования'}`}
                          >
                            <Code size={16} />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <span style={{ fontWeight: '600' }}>{file.name}</span>
                              <span style={{ fontSize: '12px', opacity: 0.7, marginTop: '2px' }}>
                                {file.type === 'problem' ? 'Задание' : file.type === 'solution' ? 'Решение' : 'Файл'} • .{file.extension}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className={styles.emptyDropdown}>
                          Файлы не найдены
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Кнопка сброса справа */}
          <motion.button
            className={`${styles.footerActionButton} ${styles.resetAction}`}
            onClick={handleReset}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <X size={16} />
            Сбросить
          </motion.button>


        </div>
      </div>
      
    </div>
  )
} 