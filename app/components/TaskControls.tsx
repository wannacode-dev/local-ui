'use client'

import { RefreshCw, Code, Lightbulb } from 'lucide-react'
import { motion } from 'framer-motion'

interface TaskControlsProps {
  taskFile: string
  viewMode: 'problem' | 'solution'
  onViewModeChange: (mode: 'problem' | 'solution') => void
  onRefresh: () => void
  onOpenInVSCode: (file: string) => void
  isRefreshing: boolean
  error: string | null
  isFullscreen: boolean
  onToggleFullscreen: () => void
}

export default function TaskControls({
  taskFile,
  viewMode,
  onViewModeChange,
  onRefresh,
  onOpenInVSCode,
  isRefreshing,
  error,
  isFullscreen,
  onToggleFullscreen
}: TaskControlsProps) {
  return (
    <div className="task-controls">
      <style jsx global>{`
        .task-controls {
          margin-bottom: 20px;
          background: linear-gradient(to bottom, #1a1a1a, #1f1f1f);
          border-radius: 16px;
          border: 1px solid #333;
          padding: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .task-controls-header {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        .task-status {
          background: rgba(16, 185, 129, 0.05);
          padding: 12px;
          border-radius: 12px;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .task-status-label {
          font-size: 13px;
          color: #888;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
        }

        .task-status-value {
          font-size: 15px;
          color: #10b981;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }

        .task-status-value.solution {
          color: #60a5fa;
        }

        .task-controls-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .task-control-button {
          background: rgba(96, 165, 250, 0.05);
          border: 1px solid rgba(96, 165, 250, 0.2);
          border-radius: 12px;
          padding: 12px 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #60a5fa;
          transition: all 0.2s ease;
          font-size: 14px;
          height: 48px;
          font-weight: 500;
        }

        .task-control-button:hover {
          border-color: #60a5fa;
          background: rgba(96, 165, 250, 0.1);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(96, 165, 250, 0.2);
        }

        .task-control-button.solution {
          color: #10b981;
          background: rgba(16, 185, 129, 0.05);
          border-color: rgba(16, 185, 129, 0.2);
        }

        .task-control-button.solution:hover {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.1);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .task-error {
          margin-top: 16px;
          padding: 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          color: #ef4444;
          font-size: 14px;
          font-weight: 500;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div className="task-controls-header">
        <div className="task-status">
          <div className="task-status-label">Текущий режим</div>
          <div className={`task-status-value ${viewMode === 'solution' ? 'solution' : ''}`}>
            <Lightbulb size={18} />
            {viewMode === 'problem' ? 'Выполнение задания' : 'Просмотр решения'}
          </div>
        </div>
        
        <div className="task-controls-buttons">
          {isFullscreen ? (
            <motion.button
              className="task-control-button"
              style={{ fontSize: 18, height: 60, width: '100%' }}
              onClick={onToggleFullscreen}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Вернуться к заданиям
            </motion.button>
          ) : (
            <>
              <motion.button
                className="task-control-button"
                onClick={() => onOpenInVSCode(taskFile)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Code size={20} />
                Открыть код
              </motion.button>

              <motion.button
                className="task-control-button"
                onClick={onRefresh}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw 
                  size={20}
                  style={{
                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                  }}
                />
                Обновить
              </motion.button>

              <motion.button
                className={`task-control-button ${viewMode === 'solution' ? '' : 'solution'}`}
                onClick={() => {
                  const newMode = viewMode === 'problem' ? 'solution' : 'problem'
                  onViewModeChange(newMode)
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Lightbulb size={20} />
                {viewMode === 'problem' ? 'Показать решение' : 'Вернуться к заданию'}
              </motion.button>

              <motion.button
                className="task-control-button"
                onClick={onToggleFullscreen}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Во весь экран
              </motion.button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="task-error">
          {error}
        </div>
      )}
    </div>
  )
} 