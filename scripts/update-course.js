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

// Функция для сравнения версий
function compareVersions(current, required) {
  const currentParts = current.split('.').map(Number);
  const requiredParts = required.split('.').map(Number);
  
  for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const requiredPart = requiredParts[i] || 0;
    
    if (currentPart > requiredPart) return 1;
    if (currentPart < requiredPart) return -1;
  }
  return 0;
}

// Проверка версий Node.js и npm
function checkVersions() {
  try {
    // Проверяем Node.js
    const nodeVersion = process.version.replace('v', '');
    if (compareVersions(nodeVersion, REQUIREMENTS.node) < 0) {
      log(`❌ Требуется Node.js ${REQUIREMENTS.node}+, установлена ${nodeVersion}`, 'red');
      return false;
    }
    log(`✅ Node.js ${nodeVersion} - OK`, 'green');

    // Проверяем npm
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    if (compareVersions(npmVersion, REQUIREMENTS.npm) < 0) {
      log(`❌ Требуется npm ${REQUIREMENTS.npm}+, установлена ${npmVersion}`, 'red');
      return false;
    }
    log(`✅ npm ${npmVersion} - OK`, 'green');

    return true;
  } catch (error) {
    log(`❌ Ошибка проверки версий: ${error.message}`, 'red');
    return false;
  }
}

// Создание полного бэкапа проекта
async function createFullBackup() {
  const backupDir = path.join(process.cwd(), '.backup-' + Date.now());
  
  try {
    log('💾 Создаем полный бэкап проекта...', 'blue');
    
    // Копируем все кроме node_modules и .git
    const itemsToBackup = fs.readdirSync(process.cwd()).filter(item => 
      !['node_modules', '.git', '.next', '.backup-*'].some(exclude => 
        item.startsWith(exclude.replace('*', ''))
      )
    );
    
    fs.ensureDirSync(backupDir);
    
    for (const item of itemsToBackup) {
      const srcPath = path.join(process.cwd(), item);
      const destPath = path.join(backupDir, item);
      fs.copySync(srcPath, destPath);
    }
    
    log(`💾 Бэкап создан: ${path.basename(backupDir)}`, 'green');
    return backupDir;
  } catch (error) {
    log(`❌ Ошибка создания бэкапа: ${error.message}`, 'red');
    throw error;
  }
}

// Откат изменений из бэкапа
async function rollbackFromBackup(backupDir) {
  try {
    log('🔄 Откатываем изменения из бэкапа...', 'yellow');
    
    if (!fs.existsSync(backupDir)) {
      throw new Error('Папка бэкапа не найдена');
    }
    
    // Восстанавливаем файлы из бэкапа
    const itemsToRestore = fs.readdirSync(backupDir);
    
    for (const item of itemsToRestore) {
      const srcPath = path.join(backupDir, item);
      const destPath = path.join(process.cwd(), item);
      
      // Удаляем текущую версию
      if (fs.existsSync(destPath)) {
        fs.removeSync(destPath);
      }
      
      // Восстанавливаем из бэкапа
      fs.copySync(srcPath, destPath);
    }
    
    log('✅ Откат выполнен успешно', 'green');
    return true;
  } catch (error) {
    log(`❌ Ошибка отката: ${error.message}`, 'red');
    return false;
  }
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

// Минимальные требования к версиям
const REQUIREMENTS = {
  node: '16.0.0',
  npm: '8.0.0'
};

async function updateCourse() {
  log('🚀 Обновляем курс из template репозитория...', 'blue');
  
  // Проверяем что мы в корректной директории
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ Файл package.json не найден. Убедитесь что вы в корневой папке проекта.', 'red');
    process.exit(1);
  }

  // Проверяем версии Node.js и npm
  log('🔍 Проверяем версии...', 'blue');
  if (!checkVersions()) {
    log('❌ Обновите Node.js и npm до требуемых версий', 'red');
    process.exit(1);
  }

  // Создаем полный бэкап перед началом
  let backupDir;
  try {
    backupDir = await createFullBackup();
  } catch (error) {
    log('❌ Не удалось создать бэкап. Обновление прервано.', 'red');
    process.exit(1);
  }

  // Удаляем кэш Next.js если он есть
  const nextCacheDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextCacheDir)) {
    log('🧹 Очищаем кэш Next.js...', 'blue');
    try {
      fs.removeSync(nextCacheDir);
      log('✅ Кэш Next.js очищен', 'green');
    } catch (error) {
      log('⚠️  Не удалось очистить кэш Next.js (не критично)', 'yellow');
    }
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
    try {
      execSync('npm install', { stdio: 'inherit' });
      log('✅ Зависимости установлены', 'green');
    } catch (error) {
      throw new Error(`Ошибка установки зависимостей: ${error.message}`);
    }

    // Проверяем что проект запускается
    log('🧪 Проверяем работоспособность...', 'blue');
    try {
      execSync('npm run lint --silent', { stdio: 'pipe' });
      log('✅ Линтер прошел успешно', 'green');
    } catch (error) {
      log('⚠️  Предупреждения линтера (не критично)', 'yellow');
    }
    
    log('🎉 Курс успешно обновлен!', 'bold');
    log('\nРекомендуется:', 'blue');
    log('  1. Проверить работу: npm run dev', 'yellow');
    log('  2. Протестировать задания', 'yellow');
    log('  3. Закоммитить изменения:', 'yellow');
    log('     git add .', 'yellow');
    log('     git commit -m "Update platform from template"', 'yellow');
    
    // Очищаем бэкап если все прошло успешно
    if (backupDir && fs.existsSync(backupDir)) {
      try {
        fs.removeSync(backupDir);
        log('🧹 Бэкап очищен (обновление прошло успешно)', 'blue');
      } catch (error) {
        log(`⚠️  Не удалось удалить бэкап: ${path.basename(backupDir)}`, 'yellow');
      }
    }
    
  } catch (error) {
    log(`❌ Критическая ошибка обновления: ${error.message}`, 'red');
    
    // Пытаемся откатить изменения
    if (backupDir) {
      log('🔄 Пытаемся откатить изменения...', 'yellow');
      const rollbackSuccess = await rollbackFromBackup(backupDir);
      
      if (rollbackSuccess) {
        log('✅ Изменения откачены, проект в исходном состоянии', 'green');
        log(`💾 Бэкап сохранен: ${path.basename(backupDir)}`, 'blue');
      } else {
        log('❌ Откат не удался! Восстановите проект вручную из бэкапа:', 'red');
        log(`📁 Бэкап: ${backupDir}`, 'yellow');
      }
    } else {
      log('❌ Бэкап не создан! Проверьте состояние проекта.', 'red');
    }
    
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