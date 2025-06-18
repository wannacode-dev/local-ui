'use client'

import { useEffect, useRef, useState } from 'react'
import TaskControls from './TaskControls'

interface TaskViewerProps {
  taskFile: string
  viewMode: 'problem' | 'solution'
  onViewModeChange: (mode: 'problem' | 'solution') => void
}

export default function TaskViewer({ taskFile, viewMode, onViewModeChange }: TaskViewerProps) {
  const [content, setContent] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleOpenInVSCode = async (file: string) => {
    try {
      // Подготавливаем путь к файлу
      let filePath = file
      if (viewMode === 'solution') {
        filePath = filePath.replace('.problem.', '.solution.')
      }
      
      // Убираем лишний префикс src/, если он уже есть в пути
      filePath = filePath.replace(/^src\//, '')
      const normalizedPath = `src/${filePath}`

      const response = await fetch('/api/vscode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file: normalizedPath }),
      })

      if (!response.ok) {
        throw new Error('Failed to open file')
      }
    } catch (error) {
      console.error('Error opening file in VS Code:', error)
    }
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
        filePath = filePath.replace('.problem.', '.solution.')
      }
      
      // Убираем лишний префикс src/, если он уже есть в пути
      filePath = filePath.replace(/^src\//, '')
      const normalizedPath = `src/${filePath}`
      
      console.log('Loading content:', { filePath, viewMode, normalizedPath })
      
      const timestamp = new Date().getTime()
      const url = `/api/tasks?file=${encodeURIComponent(normalizedPath)}&t=${timestamp}`
      
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

  useEffect(() => {
    console.log('TaskViewer effect triggered:', { taskFile, viewMode })
    if (taskFile) {
      handleRefresh()
    }
  }, [taskFile, viewMode])

  return (
    <div className={`task-viewer${isFullscreen ? ' fullscreen' : ''}`}>
      {isFullscreen && (
        <button
          className="fullscreen-exit-btn"
          onClick={() => setIsFullscreen(false)}
        >
          Выйти из полноэкранного режима
        </button>
      )}
      <TaskControls
        taskFile={taskFile}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        onRefresh={handleRefresh}
        onOpenInVSCode={handleOpenInVSCode}
        isRefreshing={isRefreshing}
        error={error}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(f => !f)}
      />
      
      {content ? (
        <iframe
          ref={iframeRef}
          srcDoc={content}
          className="task-frame"
          sandbox="allow-scripts allow-same-origin"
          style={{
            width: '100%',
            height: isFullscreen ? '100vh' : 'calc(100vh - 200px)',
            border: '1px solid rgba(14, 165, 233, 0.2)',
            borderRadius: isFullscreen ? 0 : '12px',
            backgroundColor: '#fff',
            position: isFullscreen ? 'fixed' : 'static',
            top: 0,
            left: 0,
            zIndex: isFullscreen ? 9999 : 'auto',
          }}
        />
      ) : (
        <div className="task-empty">
          {error ? (
            <div className="task-error">
              {error}
            </div>
          ) : (
            <div className="task-loading">
              Загрузка задания...
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .task-viewer {
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: 100%;
          padding: 20px;
        }

        .task-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          background: rgba(14, 165, 233, 0.02);
          border: 1px solid rgba(14, 165, 233, 0.1);
          border-radius: 12px;
          color: var(--ocean-300);
          font-size: 15px;
        }

        .task-error {
          color: #ef4444;
          padding: 16px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 8px;
          max-width: 80%;
          text-align: center;
        }

        .task-loading {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--ocean-300);
        }

        :global(.task-frame) {
          box-shadow: 0 4px 20px rgba(14, 165, 233, 0.05);
        }

        .task-viewer.fullscreen {
          position: fixed;
          inset: 0;
          background: #fff;
          z-index: 9999;
          padding: 0;
          margin: 0;
          border-radius: 0;
        }

        .fullscreen-exit-btn {
          position: fixed;
          top: 24px;
          right: 32px;
          z-index: 10000;
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 14px 28px;
          font-size: 18px;
          font-weight: 600;
          box-shadow: 0 4px 16px rgba(37,99,235,0.15);
          cursor: pointer;
          transition: background 0.2s;
        }
        .fullscreen-exit-btn:hover {
          background: #1d4ed8;
        }
      `}</style>
    </div>
  )
} 