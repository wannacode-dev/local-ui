export interface CourseConfig {
  title: string;
  description: string;
  chapterTranslations: {
    [key: string]: string;
  };
} 