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

  console.log('Loading server config from disk...')

  try {
    // Пытаемся найти конфигурационный файл в родительском проекте
    const configPaths = [
      path.join(process.cwd(), '..', 'course.config.js'),
      path.join(process.cwd(), '..', 'course.config.json'),
    ]
    
    console.log('Looking for config files in:', configPaths)
    
    for (const configPath of configPaths) {
      console.log('Checking config path:', configPath)
      try {
        await fs.access(configPath)
        console.log('Found config file:', configPath)
        
        if (configPath.endsWith('.js')) {
          // Динамически импортируем JS файл
          console.log('Loading JS config...')
          const config = await import(configPath)
          cachedServerConfig = config.default || config
          console.log('Loaded JS config:', cachedServerConfig?.title)
          return cachedServerConfig!
        } else if (configPath.endsWith('.json')) {
          // Читаем JSON файл
          console.log('Loading JSON config...')
          const content = await fs.readFile(configPath, 'utf-8')
          cachedServerConfig = JSON.parse(content)
          console.log('Loaded JSON config:', cachedServerConfig?.title)
          return cachedServerConfig!
        }
      } catch (error) {
        console.log('Config file not found:', configPath, (error as Error).message)
        // Файл не найден, пробуем следующий
        continue
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки серверной конфигурации:', error)
  }

  console.log('No config file found, using default config')
  // Если ни один конфигурационный файл не найден, возвращаем дефолтную конфигурацию
  const defaultConfig: CourseConfig = {
    title: "Курс",
    description: "Описание курса",
    chapterTranslations: {}
  }
  
  cachedServerConfig = defaultConfig
  return defaultConfig
} 