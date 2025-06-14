import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'

const execAsync = promisify(exec)

export async function POST(request: Request) {
  try {
    const { file } = await request.json()
    
    if (!file) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    // Используем команду code для открытия файла в VS Code
    await execAsync(`code "${file}"`)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error opening file in VS Code:', error)
    return NextResponse.json({ error: 'Failed to open file' }, { status: 500 })
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