import { useThemeStore } from '../../stores/useThemeStore';
import { EDITOR_THEMES } from './themes';

/**
 * Circular colour-swatch buttons to pick the theme, plus a toggle for whether the
 * theme applies to the whole page or just the code editor. Selection is persisted.
 */
export function ThemeSwitcher() {
  const editorTheme = useThemeStore((s) => s.editorTheme);
  const setEditorTheme = useThemeStore((s) => s.setEditorTheme);
  const scope = useThemeStore((s) => s.scope);
  const toggleScope = useThemeStore((s) => s.toggleScope);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5" role="group" aria-label="Theme">
        {EDITOR_THEMES.map((t) => {
          const active = editorTheme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setEditorTheme(t.id)}
              aria-pressed={active}
              title={t.label}
              aria-label={t.label}
              style={{ backgroundColor: t.swatch }}
              className={`h-5 w-5 rounded-full border transition-transform hover:scale-110 ${
                active
                  ? 'border-blue-400 ring-2 ring-blue-400 ring-offset-1 ring-offset-zinc-900'
                  : 'border-zinc-600'
              }`}
            />
          );
        })}
      </div>
      <button
        type="button"
        onClick={toggleScope}
        title="Toggle whether the theme applies to the whole page or only the editor"
        className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
      >
        {scope === 'page' ? 'Whole page' : 'Editor only'}
      </button>
    </div>
  );
}
