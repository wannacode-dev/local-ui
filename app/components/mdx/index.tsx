// Экспорт всех MDX компонентов для удобного импорта
export { TaskLayout } from './TaskLayout'
export { TaskObjective } from './TaskObjective'
export { TaskImportant } from './TaskImportant'
export { TaskConcepts } from './TaskConcepts'
export { TaskHints } from './TaskHints'
export { TaskLinks } from './TaskLinks'
export { TaskPreview } from './TaskPreview'
export { CodeExample } from './CodeExample'
export { Solution } from './Solution'
export { InfoBlock } from './InfoBlock'

// Создание удобных алиасов для разных типов InfoBlock
import { InfoBlock } from './InfoBlock'

export const Info = ({ title, children, ...props }: { title?: string, children: React.ReactNode }) => (
  <InfoBlock type="info" title={title} {...props}>
    {children}
  </InfoBlock>
)

export const Warning = ({ title, children, ...props }: { title?: string, children: React.ReactNode }) => (
  <InfoBlock type="warning" title={title} {...props}>
    {children}
  </InfoBlock>
)

export const Concept = ({ title, children, ...props }: { title?: string, children: React.ReactNode }) => (
  <InfoBlock type="concept" title={title} {...props}>
    {children}
  </InfoBlock>
)

export const Step = ({ title, children, ...props }: { title?: string, children: React.ReactNode }) => (
  <InfoBlock type="step" title={title} {...props}>
    {children}
  </InfoBlock>
)

export const Success = ({ title, children, ...props }: { title?: string, children: React.ReactNode }) => (
  <InfoBlock type="success" title={title} {...props}>
    {children}
  </InfoBlock>
)

export const DocsExample = ({ title, children, ...props }: { title?: string, children: React.ReactNode }) => (
  <InfoBlock type="docs" title={title} {...props}>
    {children}
  </InfoBlock>
) 