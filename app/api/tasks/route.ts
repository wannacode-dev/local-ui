import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { loadServerConfig, clearServerConfigCache } from '@/app/lib/config-loader'

export const dynamic = 'force-dynamic'

// Моковые данные для заданий
const MOCK_DATA: Record<string, unknown> = {
  books: [
    { id: 1, name: "React в действии" },
    { id: 2, name: "JavaScript: Подробное руководство" },
    { id: 3, name: "CSS для профи" }
  ],
  'books/1': { id: 1, name: "React в действии", author: "Марк Тилен Томас", price: "2500 руб." },
  'books/2': { id: 2, name: "JavaScript: Подробное руководство", author: "Дэвид Флэнаган", price: "3200 руб." },
  'books/3': { id: 3, name: "CSS для профи", author: "Кит Грант", price: "1800 руб." }
}

// Функция для рекурсивного сканирования директории
async function scanDirectory(dir: string): Promise<any[]> {
  try {
    await fs.access(dir)
  } catch {
    return []
  }

  const items = await fs.readdir(dir)
  const tasks: any[] = []

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = await fs.stat(fullPath)

    if (stat.isDirectory()) {
      // Рекурсивно проверяем все поддиректории
      tasks.push(...await scanDirectory(fullPath))
    } else if (item.includes('.problem.') && 
              (item.endsWith('.html') || item.endsWith('.js') || item.endsWith('.jsx'))) {
      // Нашли файл задания
      try {
        const content = await fs.readFile(fullPath, 'utf-8')
        const projectRoot = path.join(process.cwd(), '..') // Переходим в родительскую директорию
        const srcPath = path.join(projectRoot, 'src')
        const relativePath = path.relative(srcPath, fullPath)
        
        // Получаем имя темы (родительская директория)
        const pathParts = relativePath.split(path.sep)
        const chapter = pathParts[0]
        
        // Извлекаем название задания (первая строка после "Задание:")
        const nameMatch = content.match(/Задание:\s*([^\n]*)/);
        let name = nameMatch ? nameMatch[1].trim() : item;
        
        // Если название не найдено в комментарии, форматируем имя файла
        if (!nameMatch) {
          // Убираем номер, расширение и .problem/.solution
          name = item
            .replace(/^\d+-/, '') // убираем номер в начале
            .replace(/\.(problem|solution)\..*$/, '') // убираем .problem/.solution и расширение
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        }
        
        // Извлекаем полное описание задания
        const descMatch = content.match(/\/\*\s*Задание:[\s\S]*?\*\//) ||
                        content.match(/<!--\s*Задание:[\s\S]*?-->/) ||
                        [null, ''];

        tasks.push({
          name: name,
          description: descMatch[0] || '',
          file: relativePath.replace(/\\/g, '/'),
          chapter: chapter
        });
      } catch (error) {
        console.error(`⚠️   Ошибка чтения файла: ${path.basename(fullPath)}`);
      }
    }
  }

  return tasks
}

function extractContent(content: string): string {
  // Удаляем комментарии с заданием
  content = content.replace(/\/\*\s*Задание:[\s\S]*?\*\//, '')
  content = content.replace(/<!--\s*Задание:[\s\S]*?-->/, '')

  // Если это HTML файл
  if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
    // Проверяем, использует ли файл React
    const usesReact = content.includes('React.') || content.includes('ReactDOM.') || content.includes('text/babel') || content.includes('className=')
    
    if (usesReact) {
      // Добавляем React библиотеки и Babel в head, если их нет
      const scripts = `
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>`
      
      // Вставляем скрипты перед закрывающим тегом </head>
      if (!content.includes('react@18') || !content.includes('@babel/standalone')) {
        content = content.replace('</head>', `${scripts}
</head>`)
      }

      // Если есть обычный script без type="text/babel", добавляем его
      content = content.replace(/<script>(\s*const\s+\w+\s*=\s*<[^>]*>)/g, '<script type="text/babel">$1')
    }
    
    return content
  }

  // Для JS/JSX файлов создаем HTML обертку
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React Task</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body {
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        button {
            padding: 8px 16px;
            font-size: 14px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            cursor: pointer;
            margin: 4px;
        }
        button:hover {
            background: #f1f5f9;
        }
        
        ul {
            padding-left: 20px;
        }
        
        li {
            margin: 8px 0;
        }

        .task-error {
            padding: 16px;
            margin: 16px 0;
            border-radius: 8px;
            background: #fee2e2;
            color: #ef4444;
            border: 1px solid #fca5a5;
        }
        .task-warning {
            padding: 16px;
            margin: 16px 0;
            border-radius: 8px;
            background: #fef3c7;
            color: #d97706;
            border: 1px solid #fcd34d;
        }
        .task-success {
            padding: 16px;
            margin: 16px 0;
            border-radius: 8px;
            background: #dcfce7;
            color: #15803d;
            border: 1px solid #86efac;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    <script>
        // Мок для fetch API
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            // Проверяем запрос к списку книг
            if (url === 'http://localhost:3000/api/books') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(${JSON.stringify(MOCK_DATA.books)})
                });
            }
            
            // Проверяем запрос к конкретной книге
            const bookMatch = url.match(/http:\/\/localhost:3000\/api\/books\/(\d+)$/);
            if (bookMatch) {
                const bookId = bookMatch[1];
                const bookData = ${JSON.stringify(MOCK_DATA)}['books/' + bookId];
                if (bookData) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(bookData)
                    });
                }
                return Promise.resolve({
                    ok: false,
                    status: 404,
                    statusText: 'Book not found'
                });
            }
            
            return originalFetch(url, options);
        };

        // Обработка ошибок React
        window.addEventListener('error', function(event) {
            const root = document.getElementById('root');
            root.innerHTML = '<div class="task-error"><strong>Ошибка:</strong><br/>' + event.error?.message + '</div>';
        });
    </script>
    <script type="text/babel">
        ${content}
    </script>
</body>
</html>`
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const file = searchParams.get('file')
    
    // Красивый вывод информации о запросе
    console.log('\n🚀 ═══ API REQUEST ═══')
    console.log(`📄  Файл: ${file || 'список заданий'}`)
    if (file) {
      const decodedFile = decodeURIComponent(file)
      console.log(`🎯  Decoded: ${decodedFile}`)
    }
    
    if (!file) {
      // Если файл не указан, возвращаем список заданий (как в старой версии)
      try {
        const projectRoot = path.join(process.cwd(), '..') // Переходим в родительскую директорию
        const srcPath = path.join(projectRoot, 'src')
        
        console.log(`📁  Сканируем директорию: ${srcPath}`)
        
        // Получаем все задания
        const allTasks = await scanDirectory(srcPath)
        console.log(`✅  Найдено заданий: ${allTasks.length}`)
        
        // Группируем задания по темам
        const chapters: { [key: string]: any } = {}
        
        // Очищаем кэш для отладки
        clearServerConfigCache()
        const config = await loadServerConfig()
        
        console.log(`⚙️   Конфигурация загружена: ${config.title}`)
        
        allTasks.forEach(task => {
          if (!chapters[task.chapter]) {
            const translatedChapter = config.chapterTranslations[task.chapter] || task.chapter
            console.log(`🔄  Глава: ${translatedChapter}`)
            chapters[task.chapter] = {
              chapter: translatedChapter,
              originalChapter: task.chapter,
              tasks: []
            }
          }
          chapters[task.chapter].tasks.push({
            name: task.name,
            description: task.description,
            file: task.file
          })
        })

        // Преобразуем объект в массив и сортируем темы по оригинальным названиям
        const result = Object.values(chapters)
          .sort((a: any, b: any) => a.originalChapter.localeCompare(b.originalChapter))

        console.log(`📚  Всего тем: ${result.length}`)
        console.log('════════════════════════\n')
        return NextResponse.json(result)
      } catch (error) {
        console.error(`💥  Ошибка при сканировании заданий: ${error}`)
        console.error('════════════════════════\n')
        return NextResponse.json({ error: 'Ошибка при сканировании заданий' }, { status: 500 })
      }
    }

    // Проверяем, не запрашивается ли API
    if (file.includes('/api/')) {
      const endpoint = file.split('/api/')[1].replace(/\/$/, '') // Убираем trailing slash

      // Проверяем запрос к конкретной книге
      const booksMatch = endpoint.match(/^books\/(\d+)$/)
      if (booksMatch) {
        const bookId = booksMatch[1]
        const bookData = MOCK_DATA[`books/${bookId}`]
        if (bookData) {
          return NextResponse.json(bookData)
        }
        return new NextResponse('Book not found', { status: 404 })
      }

      // Проверяем запрос к списку книг
      if (endpoint === 'books') {
        return NextResponse.json(MOCK_DATA.books)
      }
      
      // Проверяем другие API endpoints
      if (endpoint in MOCK_DATA) {
        return NextResponse.json(MOCK_DATA[endpoint])
      }
      return new NextResponse('API endpoint not found', { status: 404 })
    }

    console.log(`\n📖 ═══ ЗАГРУЗКА ФАЙЛА ═══`)
    console.log(`📄  Запрошенный файл: ${decodeURIComponent(file)}`)

    // Получаем абсолютный путь к файлу с учетом структуры сабмодуля
    const projectRoot = path.join(process.cwd(), '..') // Переходим в родительскую директорию
    const filePath = path.join(projectRoot, file)
    console.log(`🗂️   Полный путь: ${filePath}`)

    try {
      // Проверяем существование файла
      await fs.access(filePath)
    } catch (error) {
      console.error(`❌  Файл не найден: ${decodeURIComponent(file)}`)
      console.error('════════════════════════\n')
      return new NextResponse('File not found', { status: 404 })
    }

    // Читаем содержимое файла
    const content = await fs.readFile(filePath, 'utf-8')

    // Обрабатываем контент
    const processedContent = extractContent(content)
    console.log(`✅  Файл успешно обработан`)
    console.log('════════════════════════\n')

    // Устанавливаем заголовки для предотвращения кэширования
    const headers = {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '-1',
      'X-File-Path': encodeURIComponent(filePath), // Кодируем путь для HTTP заголовка
      'X-Content-Length': processedContent.length.toString()
    }

    return new NextResponse(processedContent, { headers })
  } catch (error: any) {
    console.error(`\n💥 ═══ ОШИБКА ═══`)
    console.error(`❌  Ошибка обработки запроса: ${error?.message || 'Неизвестная ошибка'}`)
    console.error('════════════════════════\n')
    return new NextResponse(`Error reading file: ${error?.message || 'Unknown error'}`, { status: 500 })
  }
} 