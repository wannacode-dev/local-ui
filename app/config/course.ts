import { CourseConfig } from '../types/course';

let cachedConfig: CourseConfig | null = null;

// Функция для загрузки конфигурации
export async function loadCourseConfig(): Promise<CourseConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      cachedConfig = await response.json();
      return cachedConfig!;
    }
  } catch (error) {
    console.error('Ошибка загрузки конфигурации:', error);
  }

  // Возвращаем дефолтную конфигурацию в случае ошибки
  const defaultConfig: CourseConfig = {
    title: 'Курс',
    description: 'Описание курса',
    chapterTranslations: {}
  };
  
  cachedConfig = defaultConfig;
  return defaultConfig;
}

// Синхронная функция для получения конфигурации (для серверных компонентов)
export function getCourseConfigSync(): CourseConfig {
  // Для серверных компонентов используем переменные окружения как fallback
  return {
    title: process.env.NEXT_PUBLIC_COURSE_TITLE || 'Курс',
    description: process.env.NEXT_PUBLIC_COURSE_DESCRIPTION || 'Описание курса',
    chapterTranslations: process.env.NEXT_PUBLIC_CHAPTER_TRANSLATIONS 
      ? JSON.parse(process.env.NEXT_PUBLIC_CHAPTER_TRANSLATIONS)
      : {}
  };
}

// Экспорт по умолчанию для обратной совместимости
const courseConfig = getCourseConfigSync();
export default courseConfig; 