import { Eraser } from 'lucide-react'
import { type ReactNode } from 'react'

type ToolbarAction = {
  key: string
  label: string
  icon: ReactNode
  onClick: () => void
}

type Props = {
  actions: ToolbarAction[]
  buttonClassName?: string
  isActionActive: (key: string) => boolean
  onClearFormatting: () => void
}

const EditorToolbarButtons = ({
  actions,
  buttonClassName = 'rounded-md p-2',
  isActionActive,
  onClearFormatting,
}: Props) => {
  return (
    <div className="flex flex-wrap gap-1">
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={action.onClick}
          title={action.label}
          className={`${buttonClassName} transition-all duration-150 hover:-translate-y-0.5 ${
            isActionActive(action.key)
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          {action.icon}
        </button>
      ))}
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onClearFormatting}
        title="Clear formatting"
        className={`${buttonClassName} text-slate-500 transition-all duration-150 hover:-translate-y-0.5 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white`}
      >
        <Eraser className="h-4 w-4" />
      </button>
    </div>
  )
}

export default EditorToolbarButtons
