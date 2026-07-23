import { useThemeStore } from '../../stores/useThemeStore';
import { CUSTOM_THEME_ID, MODES } from './themes';

/**
 * Theme picker: Day / Night base-mode buttons plus a colour swatch for a fully custom
 * palette, and a toggle for whether the theme applies to the whole page or just the code
 * editor. Selection is persisted.
 */
export function ThemeSwitcher() {
  const editorTheme = useThemeStore((s) => s.editorTheme);
  const setEditorTheme = useThemeStore((s) => s.setEditorTheme);
  const customColor = useThemeStore((s) => s.customColor);
  const setCustomColor = useThemeStore((s) => s.setCustomColor);
  const scope = useThemeStore((s) => s.scope);
  const toggleScope = useThemeStore((s) => s.toggleScope);

  const customActive = editorTheme === CUSTOM_THEME_ID;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1" role="group" aria-label="Theme">
        {MODES.map((m) => {
          const active = editorTheme === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setEditorTheme(m.id)}
              aria-pressed={active}
              className={`rounded-md px-2.5 py-1 text-xs ${
                active
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'bg-zinc-900 text-zinc-300 hover:text-zinc-100'
              }`}
            >
              {m.label}
            </button>
          );
        })}

        {/* Native colour input doubles as the "Custom" swatch and picker. */}
        <label
          title="Custom colour"
          className={`relative inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border ${
            customActive
              ? 'border-blue-400 ring-2 ring-blue-400 ring-offset-1 ring-offset-zinc-900'
              : 'border-zinc-600'
          }`}
          style={{ backgroundColor: customColor }}
        >
          <input
            type="color"
            value={customColor}
            aria-label="Pick a custom theme colour"
            onChange={(e) => {
              setCustomColor(e.target.value);
              setEditorTheme(CUSTOM_THEME_ID);
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
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
