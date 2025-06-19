import { CourseConfig } from '../types/course';

// Получаем конфигурацию из переменных окружения
const courseConfig: CourseConfig = {
  title: process.env.NEXT_PUBLIC_COURSE_TITLE || 'Курс',
  description: process.env.NEXT_PUBLIC_COURSE_DESCRIPTION || 'Описание курса',
  chapterTranslations: process.env.NEXT_PUBLIC_CHAPTER_TRANSLATIONS 
    ? JSON.parse(process.env.NEXT_PUBLIC_CHAPTER_TRANSLATIONS)
    : {}
};

export default courseConfig; 