#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Цвета для консоли
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// URL template репозитория
const TEMPLATE_REPO = 'https://github.com/wannacode-dev/local-ui.git';

// Файлы и папки которые нужно обновить из template
const FILES_TO_UPDATE = [
  'app/',
  'package.json',
  'next.config.js',
  'tsconfig.json',
  'next-env.d.ts',
  '.gitignore'
];

// Файлы которые НЕ нужно трогать (задания курса)
const PRESERVE_FILES = [
  'src/',
  'README.md',
  '.git/',
  'node_modules/'
];

async function updateCourse() {
  log('🚀 Обновляем курс из template репозитория...', 'blue');
  
  // Проверяем что мы в корректной директории
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ Файл package.json не найден. Убедитесь что вы в корневой папке проекта.', 'red');
    process.exit(1);
  }

  // Создаем временную папку
  const tempDir = path.join(process.cwd(), '.temp-update');
  
  try {
    log('📡 Клонируем template репозиторий...', 'blue');
    
    // Удаляем временную папку если она существует
    if (fs.existsSync(tempDir)) {
      fs.removeSync(tempDir);
    }
    
    // Клонируем template
    execSync(`git clone --depth 1 "${TEMPLATE_REPO}" "${tempDir}"`, { 
      stdio: 'pipe' 
    });
    
    log('💾 Сохраняем файлы курса...', 'blue');
    
    // Создаем backup папку
    const backupDir = path.join(tempDir, 'backup');
    fs.ensureDirSync(backupDir);
    
    // Сохраняем файлы которые не должны перезаписываться
    for (const preserveFile of PRESERVE_FILES) {
      const srcPath = path.join(process.cwd(), preserveFile);
      const backupPath = path.join(backupDir, preserveFile);
      
      if (fs.existsSync(srcPath)) {
        log(`  💾 Сохраняем ${preserveFile}`, 'yellow');
        fs.copySync(srcPath, backupPath);
      }
    }
    
    log('🔄 Обновляем файлы платформы...', 'blue');
    
    // Копируем обновленные файлы из template
    for (const fileToUpdate of FILES_TO_UPDATE) {
      const srcPath = path.join(tempDir, fileToUpdate);
      const destPath = path.join(process.cwd(), fileToUpdate);
      
      if (fs.existsSync(srcPath)) {
        log(`  ✅ Обновляем ${fileToUpdate}`, 'green');
        
        // Удаляем старую версию если это папка
        if (fileToUpdate.endsWith('/') && fs.existsSync(destPath)) {
          fs.removeSync(destPath);
        }
        
        fs.copySync(srcPath, destPath);
      } else {
        log(`  ⚠️  Файл ${fileToUpdate} не найден в template`, 'yellow');
      }
    }
    
    log('🔄 Восстанавливаем файлы курса...', 'blue');
    
    // Восстанавливаем сохраненные файлы
    for (const preserveFile of PRESERVE_FILES) {
      const backupPath = path.join(backupDir, preserveFile);
      const destPath = path.join(process.cwd(), preserveFile);
      
      if (fs.existsSync(backupPath)) {
        log(`  ✅ Восстанавливаем ${preserveFile}`, 'green');
        fs.copySync(backupPath, destPath);
      }
    }
    
    log('📦 Устанавливаем зависимости...', 'blue');
    
    // Устанавливаем зависимости
    execSync('npm install', { stdio: 'inherit' });
    
    log('🎉 Курс успешно обновлен!', 'bold');
    log('\nРекомендуется:', 'blue');
    log('  1. Проверить работу: npm run dev', 'yellow');
    log('  2. Протестировать задания', 'yellow');
    log('  3. Закоммитить изменения:', 'yellow');
    log('     git add .', 'yellow');
    log('     git commit -m "Update platform from template"', 'yellow');
    
  } catch (error) {
    log(`❌ Ошибка обновления: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    // Очищаем временную папку
    if (fs.existsSync(tempDir)) {
      try {
        fs.removeSync(tempDir);
        log('🧹 Временные файлы очищены', 'blue');
      } catch (error) {
        log('⚠️  Не удалось очистить временные файлы', 'yellow');
      }
    }
  }
}

// Проверяем доступность git
try {
  execSync('git --version', { stdio: 'pipe' });
} catch (error) {
  log('❌ Git не найден. Установите Git для работы скрипта.', 'red');
  process.exit(1);
}

// Запускаем обновление
updateCourse(); 