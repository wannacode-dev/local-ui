import { NextResponse } from 'next/server'
import { platform } from 'os'
import path from 'path'

export async function POST(request: Request) {
  try {
    const { file } = await request.json()
    
    if (!file) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    // Декодируем URI-компоненты в пути, если они есть
    const decodedFile = decodeURIComponent(file)
    
    // Нормализуем путь в соответствии с текущей ОС
    const normalizedPath = path.normalize(decodedFile)
    
    // Создаем URL для протокола vscode://
    // Используем file:// для абсолютного пути к файлу
    const fileUrl = `file://${normalizedPath}`
    const vsCodeUrl = `vscode://file${fileUrl}`

    // Возвращаем URL для открытия в браузере
    return NextResponse.json({ 
      success: true,
      url: vsCodeUrl
    })
  } catch (error) {
    console.error('Error generating VS Code URL:', error)
    return NextResponse.json({ 
      error: 'Failed to generate VS Code URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Функция для определения является ли файл заданием
function isTaskFile(filename: string): boolean {
  return filename.includes('.problem.') && 
         (filename.endsWith('.html') || filename.endsWith('.js') || filename.endsWith('.jsx'))
}

// Функция для извлечения информации о задании
function extractTaskInfo(filePath: string, content: string) {
  const nameMatch = content.match(/Задание:\s*([^\n]*)/);
  const name = nameMatch ? nameMatch[1].trim() : path.basename(filePath);

  const descMatch = content.match(/\/\*\s*Задание:[\s\S]*?\*\//) ||
                    content.match(/<!--\s*Задание:[\s\S]*?-->/) ||
                    [null, ''];

  return {
    name,
    description: descMatch[0] || ''
  }
}