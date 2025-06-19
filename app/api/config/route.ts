import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
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
          return NextResponse.json(config.default || config)
        } else if (configPath.endsWith('.json')) {
          // Читаем JSON файл
          const content = await fs.readFile(configPath, 'utf-8')
          return NextResponse.json(JSON.parse(content))
        }
      } catch (error) {
        // Файл не найден, пробуем следующий
        continue
      }
    }
    
    // Если ни один конфигурационный файл не найден, возвращаем дефолтную конфигурацию
    return NextResponse.json({
      title: "Курс",
      description: "Описание курса",
      chapterTranslations: {}
    })
  } catch (error) {
    console.error('Ошибка загрузки конфигурации:', error)
    return NextResponse.json({ error: 'Ошибка загрузки конфигурации' }, { status: 500 })
  }
} 