import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const taskFile = searchParams.get('task')
    
    if (!taskFile) {
      return NextResponse.json({ error: 'Task file parameter is required' }, { status: 400 })
    }

    // Извлекаем путь к папке задания
    const taskPath = taskFile.replace(/\/[^/]+$/, '') // убираем имя файла, оставляем путь к папке
    const readmePath = path.join(process.cwd(), 'src', taskPath, 'README.md')
    
    // Проверяем существование файла
    if (!fs.existsSync(readmePath)) {
      return NextResponse.json({ error: 'README.md не найден для этого задания' }, { status: 404 })
    }
    
    // Читаем содержимое файла
    const content = fs.readFileSync(readmePath, 'utf-8')
    
    // Возвращаем содержимое как текст
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      },
    })
  } catch (error) {
    console.error('Error reading README.md:', error)
    return NextResponse.json({ error: 'Ошибка чтения README.md' }, { status: 500 })
  }
} 