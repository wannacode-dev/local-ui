import { promises as fs } from 'fs'
import path from 'path'
import { CourseConfig } from '../types/course'

let cachedServerConfig: CourseConfig | null = null

// Функция для очистки кэша (для отладки)
export function clearServerConfigCache() {
  console.log('Clearing server config cache')
  cachedServerConfig = null
}

export async function loadServerConfig(): Promise<CourseConfig> {
  if (cachedServerConfig) {
    console.log('Returning cached config:', cachedServerConfig.title)
    return cachedServerConfig
  }

  try {
    // Пытаемся найти конфигурационный файл в родительском проекте
    const configPaths = [
      path.join(process.cwd(), '..', 'course.config.js'),
      path.join(process.cwd(), '..', 'course.config.json'),
    ]
    
    for (const configPath of configPaths) {
      try {
        await fs.access(configPath)
        
        if (configPath.endsWith('.js')) {
          // Динамически импортируем JS файл
          const config = await import(configPath)
          cachedServerConfig = config.default || config
          return cachedServerConfig!
        } else if (configPath.endsWith('.json')) {
          // Читаем JSON файл
          const content = await fs.readFile(configPath, 'utf-8')
          cachedServerConfig = JSON.parse(content)
          return cachedServerConfig!
        }
      } catch (error) {
        // Файл не найден, пробуем следующий
        continue
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки серверной конфигурации:', error)
  }
  // Если ни один конфигурационный файл не найден, возвращаем дефолтную конфигурацию
  const defaultConfig: CourseConfig = {
    title: "Курс",
    description: "Описание курса",
    chapterTranslations: {}
  }
  
  cachedServerConfig = defaultConfig
  return defaultConfig
} 