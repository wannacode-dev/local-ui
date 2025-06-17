import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { chapterTranslations } from '@/app/chapter-translations'

// Функция для определения типа файла
function getFileType(filePath: string, content: string): 'html' | 'jsx' | 'html-with-react' {
  const ext = path.extname(filePath).toLowerCase()
  
  if (ext === '.jsx') {
    return 'jsx'
  }
  
  if (ext === '.html') {
    // Проверяем, содержит ли HTML файл подключения React или использует React API
    if (content.includes('react.development.js') || 
        content.includes('react.production.js') ||
        content.includes('React.') || 
        content.includes('ReactDOM.')) {
      return 'html-with-react'
    }
    return 'html'
  }
  
  return 'html'
}

// Функция для создания HTML документа для JSX файлов
function createJsxHtmlDocument(content: string, filePath: string): string {
  console.log('Creating JSX HTML document for file:', filePath);
  
  // Заменяем localhost:3000 на относительные пути для API
  let processedContent = content.replace(
    /http:\/\/localhost:3000\/api\//g,
    '/api/'
  );
  
  // Заменяем React Fragments на React.Fragment для совместимости с Babel standalone
  processedContent = processedContent.replace(
    /<>\s*/g,
    '<React.Fragment>'
  ).replace(
    /\s*<\/>/g,
    '</React.Fragment>'
  );
  
  // Заменяем optional chaining (?.) на логическое И (&&) для совместимости с Babel standalone
  processedContent = processedContent.replace(
    /(\w+)(\?\.)(\w+)/g,
    '$1 && $1.$3'
  );
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>React Task</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        #root {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            min-height: 200px;
        }
        .error-boundary {
            color: red;
            padding: 20px;
            border: 2px solid red;
            border-radius: 8px;
            background: #ffebee;
            margin: 10px 0;
        }
        .error-boundary h3 {
            margin-top: 0;
        }
        .error-boundary pre {
            background: rgba(0,0,0,0.1);
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    <script>
      // Глобальная обработка ошибок
      window.addEventListener('error', function(event) {
        console.error('Global error:', event.error);
        const root = document.getElementById('root');
        if (root && root.innerHTML.indexOf('error-boundary') === -1) {
          root.innerHTML = '<div class="error-boundary">' + 
            '<h3>Ошибка выполнения:</h3>' + 
            '<pre>' + event.error.message + '</pre>' + 
            '</div>';
        }
      });
      
      // Обработка ошибок в промисах
      window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled promise rejection:', event.reason);
        const root = document.getElementById('root');
        if (root && root.innerHTML.indexOf('error-boundary') === -1) {
          var message = event.reason && event.reason.message ? event.reason.message : event.reason;
          root.innerHTML = '<div class="error-boundary">' + 
            '<h3>Ошибка в промисе:</h3>' + 
            '<pre>' + message + '</pre>' + 
            '</div>';
        }
      });
    </script>
    
    <script type="text/babel">
      try {
        ${processedContent}
      } catch (error) {
        console.error('Sync error:', error);
        const root = document.getElementById('root');
        root.innerHTML = '<div class="error-boundary">' + 
          '<h3>Ошибка выполнения:</h3>' + 
          '<pre>' + error.message + '</pre>' + 
          '</div>';
      }
    </script>
</body>
</html>
`.trim();
}

// Функция для создания HTML документа для HTML файлов с React
function createHtmlWithReactDocument(content: string, filePath: string): string {
  console.log('Processing HTML with React document for file:', filePath);
  
  // Заменяем localhost:3000 на относительные пути для API
  let processedContent = content.replace(
    /http:\/\/localhost:3000\/api\//g,
    '/api/'
  );
  
  // Заменяем React Fragments на React.Fragment для совместимости с Babel standalone
  processedContent = processedContent.replace(
    /<>\s*/g,
    '<React.Fragment>'
  ).replace(
    /\s*<\/>/g,
    '</React.Fragment>'
  );
  
  // Заменяем optional chaining (?.) на логическое И (&&) для совместимости с Babel standalone
  processedContent = processedContent.replace(
    /(\w+)(\?\.)(\w+)/g,
    '$1 && $1.$3'
  );
  
  // Всегда добавляем скрипты React если их нет
  if (!processedContent.includes('react.development.js') && !processedContent.includes('react.production.js')) {
    // Ищем место для вставки скриптов - после title или перед закрывающим head
    if (processedContent.includes('</title>')) {
      processedContent = processedContent.replace(
        '</title>',
        `</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>`
      );
    } else {
      processedContent = processedContent.replace(
        '</head>',
        `    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
</head>`
      );
    }
  }
  
  // Добавляем type="text/babel" к скриптам, которые используют JSX или React
  processedContent = processedContent.replace(
    /<script(?![^>]*src=)([^>]*)>/g,
    function(match, attributes) {
      // Проверяем содержимое скрипта между тегами
      const scriptStart = processedContent.indexOf(match);
      const scriptEnd = processedContent.indexOf('</script>', scriptStart);
      const scriptContent = processedContent.substring(scriptStart + match.length, scriptEnd);
      
      // Если скрипт содержит JSX или React API, добавляем type="text/babel"
      if (scriptContent.includes('React.') || scriptContent.includes('ReactDOM.') || scriptContent.includes('<')) {
        if (!attributes.includes('type=')) {
          return '<script type="text/babel"' + attributes + '>';
        }
      }
      return match;
    }
  );
  
  return processedContent;
}

// Функция для создания обычного HTML документа
function createSimpleHtmlDocument(content: string, filePath: string): string {
  console.log('Processing simple HTML document for file:', filePath);
  
  // Проверяем, использует ли файл React
  const usesReact = content.includes('React.') || content.includes('ReactDOM.');
  
  if (usesReact) {
    // Обрабатываем как HTML с React
    return createHtmlWithReactDocument(content, filePath);
  }
  
  return content;
}

// Основная функция для создания HTML документа
function createHtmlDocument(content: string, filePath: string): string {
  const fileType = getFileType(filePath, content);
  
  console.log('File type detected:', fileType, 'for file:', filePath);
  
  switch (fileType) {
    case 'jsx':
      return createJsxHtmlDocument(content, filePath);
    case 'html-with-react':
      return createHtmlWithReactDocument(content, filePath);
    case 'html':
    default:
      return createSimpleHtmlDocument(content, filePath);
  }
}

// Функция для проверки существования файла
function findFile(baseDir: string, targetPath: string): string | null {
  console.log('Finding file:', { baseDir, targetPath });
  
  // Пробуем разные варианты путей
  const possiblePaths = [
    path.join(baseDir, targetPath),
    path.join(baseDir, 'src', targetPath),
    path.join(baseDir, targetPath.replace(/^src\//, '')),
    targetPath
  ];

  for (const filePath of possiblePaths) {
    console.log('Checking path:', filePath);
    if (fs.existsSync(filePath)) {
      console.log('Found file at:', filePath);
      return filePath;
    }
  }

  console.log('File not found in any location');
  return null;
}

// Функция для рекурсивного сканирования директории
function scanDirectory(dir: string): any[] {
  console.log('Scanning directory:', dir);
  
  if (!fs.existsSync(dir)) {
    console.log('Directory does not exist:', dir);
    return [];
  }

  const items = fs.readdirSync(dir);
  const tasks: any[] = [];

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      tasks.push(...scanDirectory(fullPath));
    } else if (item.includes('.problem.') || item.includes('.solution.')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const relativePath = path.relative(path.join(process.cwd(), '..', 'src'), fullPath);
        
        const pathParts = relativePath.split(path.sep);
        const chapter = pathParts[0];
        
        // Улучшенное извлечение названия задания
        let name = item;
        let description = '';
        
        // Для HTML файлов ищем в комментариях
        if (item.endsWith('.html')) {
          const htmlNameMatch = content.match(/<!--\s*Задание:\s*([^\n]*)/);
          const htmlDescMatch = content.match(/<!--\s*Задание:[\s\S]*?-->/);
          
          if (htmlNameMatch) {
            name = htmlNameMatch[1].trim();
          }
          if (htmlDescMatch) {
            description = htmlDescMatch[0];
          }
        }
        
        // Для JSX файлов ищем в комментариях JS
        if (item.endsWith('.jsx')) {
          const jsxNameMatch = content.match(/\/\*\s*Задание:\s*([^\n]*)/);
          const jsxDescMatch = content.match(/\/\*\s*Задание:[\s\S]*?\*\//);
          
          if (jsxNameMatch) {
            name = jsxNameMatch[1].trim();
          }
          if (jsxDescMatch) {
            description = jsxDescMatch[0];
          }
        }
        
        // Если название не найдено, используем название файла
        if (name === item) {
          name = item.replace(/\.(problem|solution)\.(html|jsx)$/, '').replace(/-/g, ' ');
        }

        tasks.push({
          name: name,
          description: description,
          file: relativePath.replace(/\\/g, '/'),
          chapter: chapter,
          type: item.endsWith('.jsx') ? 'jsx' : 'html'
        });
      } catch (error) {
        console.error(`Ошибка чтения файла в ${fullPath}:`, error);
      }
    }
  }

  return tasks;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const file = searchParams.get('file');

  if (file) {
    try {
      console.log('Requested file:', file);
      
      // Получаем базовую директорию проекта
      const baseDir = path.resolve(process.cwd(), '..');
      console.log('Base directory:', baseDir);
      
      // Ищем файл в разных местах
      const filePath = findFile(baseDir, file);
      
      if (!filePath) {
        console.error('File not found:', file);
        return NextResponse.json({ 
          error: 'File not found',
          searchedIn: baseDir,
          requestedFile: file
        }, { status: 404 });
      }

      // Читаем содержимое файла
      const content = fs.readFileSync(filePath, 'utf-8');
      console.log('File content length:', content.length);
      
      // Создаем HTML документ
      const htmlContent = createHtmlDocument(content, filePath);
      
      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-store, must-revalidate',
        },
      });
    } catch (error) {
      console.error('Error processing file:', error);
      return NextResponse.json({ 
        error: 'Error reading file',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, { status: 500 });
    }
  }

  try {
    const srcPath = path.join(process.cwd(), '..', 'src');
    console.log('Scanning source directory:', srcPath);
    
    if (!fs.existsSync(srcPath)) {
      console.log('Source directory not found:', srcPath);
      return NextResponse.json([]);
    }

    const allTasks = scanDirectory(srcPath);
    console.log('Found tasks:', allTasks.length);
    
    const chapters: { [key: string]: any } = {};
    allTasks.forEach(task => {
      if (!chapters[task.chapter]) {
        chapters[task.chapter] = {
          chapter: chapterTranslations[task.chapter] || task.chapter,
          originalChapter: task.chapter,
          tasks: []
        };
      }
      chapters[task.chapter].tasks.push({
        name: task.name,
        description: task.description,
        file: task.file
      });
    });

    const result = Object.values(chapters)
      .sort((a: any, b: any) => a.originalChapter.localeCompare(b.originalChapter));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error scanning tasks:', error);
    return NextResponse.json({ 
      error: 'Error scanning tasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 