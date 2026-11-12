from pathlib import Path
import shutil

files = [
    "src/App.tsx",
    "src/App.css",
    "src/i18n/types.ts",
    "src/i18n/en.ts",
    "src/i18n/km.ts",
    "src/components/MenuGlyph.tsx",
]

for f in files:
    p = Path(f)
    if not p.exists():
        raise SystemExit(f"Missing file: {f}")
    backup = Path(f + ".bak-theme")
    if not backup.exists():
        shutil.copy2(p, backup)

def replace_once(file, old, new):
    p = Path(file)
    s = p.read_text(encoding="utf-8")
    count = s.count(old)
    if count != 1:
        raise SystemExit(
            f"STOP: expected exactly one match in {file}, found {count}"
        )
    p.write_text(s.replace(old, new, 1), encoding="utf-8")

# 1. Theme state and persistence
replace_once(
    "src/App.tsx",
    '  const [language, setLanguage] = useState<LanguageCode>(() => loadLanguage());',
    '''  const [language, setLanguage] = useState<LanguageCode>(() => loadLanguage());
  const [theme, setTheme] = useState<"day" | "night">(() => {
    try {
      return localStorage.getItem("khoem-ai:theme") === "day" ? "day" : "night";
    } catch {
      return "night";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("khoem-ai:theme", theme);
    } catch {
      // Storage may be disabled.
    }
  }, [theme]);'''
)

# 2. Apply theme state to the app
replace_once(
    "src/App.tsx",
    '<div className="app">',
    '<div className="app" data-theme={theme}>'
)

# 3. Add the theme button in Other section, before Language
replace_once(
    "src/App.tsx",
    '''                <button className="app__sidebar-item" onClick={() => setShowLanguage((v) => !v)}>
                  <MenuGlyph name="language" /> {t.navLanguage} · {language === "en" ? t.languageEnglish : t.languageKhmer}
                </button>''',
    '''                <button
                  className="app__sidebar-item app__theme-toggle"
                  onClick={() => setTheme((current) => current === "night" ? "day" : "night")}
                  aria-label={theme === "day" ? t.themeDay : t.themeNight}
                  aria-pressed={theme === "day"}
                >
                  <MenuGlyph name={theme === "day" ? "sun" : "moon"} />
                  <span>{theme === "day" ? t.themeDay : t.themeNight}</span>
                  <span className="app__theme-indicator">
                    {theme === "day" ? "DAY" : "NIGHT"}
                  </span>
                </button>

                <button className="app__sidebar-item" onClick={() => setShowLanguage((v) => !v)}>
                  <MenuGlyph name="language" /> {t.navLanguage} · {language === "en" ? t.languageEnglish : t.languageKhmer}
                </button>'''
)

# 4. Translation types
replace_once(
    "src/i18n/types.ts",
    "  languageKhmer: string;",
    "  languageKhmer: string;\\n  themeDay: string;\\n  themeNight: string;"
)

# 5. English and Khmer translations
replace_once(
    "src/i18n/en.ts",
    '  languageKhmer: "Khmer",',
    '  languageKhmer: "Khmer",\\n  themeDay: "Day mode",\\n  themeNight: "Night mode",'
)
replace_once(
    "src/i18n/km.ts",
    '  languageKhmer: "ខ្មែរ",',
    '  languageKhmer: "ខ្មែរ",\\n  themeDay: "របៀបថ្ងៃ",\\n  themeNight: "របៀបយប់",'
)

# 6. Custom SVG icons
replace_once(
    "src/components/MenuGlyph.tsx",
    '  | "honorific" | "language" | "clear";',
    '  | "honorific" | "language" | "clear" | "sun" | "moon";'
)
replace_once(
    "src/components/MenuGlyph.tsx",
    '  clear: "M4 7h16 M10 11v6 M14 11v6 M6 7l1 14h10l1-14 M9 7V4h6v3",',
    '''  clear: "M4 7h16 M10 11v6 M14 11v6 M6 7l1 14h10l1-14 M9 7V4h6v3",
  sun: "M12 3v2 M12 19v2 M3 12h2 M19 12h2 M5.64 5.64l1.42 1.42 M16.94 16.94l1.42 1.42 M18.36 5.64l-1.42 1.42 M7.06 16.94l-1.42 1.42 M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10",
  moon: "M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2z M17 3v3 M15.5 4.5h3",'''
)

# 7. Theme styling
css = r'''

/* ==========================================
   KHOEM-AI DAY / NIGHT THEME
   ========================================== */

.app__theme-toggle {
  position: relative;
}

.app__theme-toggle .app__menu-glyph {
  width: 23px;
  height: 23px;
  flex-basis: 23px;
  transition: transform .35s ease, filter .35s ease;
}

.app__theme-toggle:hover .app__menu-glyph {
  transform: rotate(18deg) scale(1.12);
}

.app[data-theme="night"] .app__theme-toggle .app__menu-glyph {
  color: #7dd3fc;
  filter: drop-shadow(0 0 7px rgba(56,189,248,.85));
}

.app[data-theme="day"] .app__theme-toggle .app__menu-glyph {
  color: #f59e0b;
  filter: drop-shadow(0 0 7px rgba(245,158,11,.65));
}

.app__theme-indicator {
  margin-left: auto;
  padding: 3px 7px;
  border-radius: 20px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .08em;
  color: #7dd3fc;
  border: 1px solid rgba(56,189,248,.4);
}

.app[data-theme="day"] .app__theme-indicator {
  color: #a16207;
  border-color: rgba(217,119,6,.4);
  background: rgba(251,191,36,.12);
}

/* DAY MODE */
html[data-theme="day"] body {
  background: #edf5fc !important;
  color: #172b43 !important;
}

html[data-theme="day"] body::before,
html[data-theme="day"] body::after {
  opacity: 0 !important;
  animation: none !important;
}

html[data-theme="day"] #root .app {
  color: #172b43 !important;
  background:
    linear-gradient(145deg, rgba(255,255,255,.96), rgba(224,240,253,.97)) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.9) !important;
}

html[data-theme="day"] .app__header {
  color: #17324d !important;
  background: linear-gradient(180deg, #ffffff, #e4f2ff) !important;
  border-bottom: 1px solid #b8d5ec !important;
  box-shadow: 0 5px 20px rgba(37,99,145,.12) !important;
}

html[data-theme="day"] .app__brand-name {
  color: #075985 !important;
}

html[data-theme="day"] .app__body {
  color: #172b43 !important;
  background: transparent !important;
}

html[data-theme="day"] .app__sidebar {
  color: #17324d !important;
  background: linear-gradient(160deg, #ffffff, #e8f4ff) !important;
  border-right: 1px solid #b8d5ec !important;
  box-shadow: 12px 0 35px rgba(37,99,145,.15) !important;
}

html[data-theme="day"] .app__sidebar-section {
  color: #0876a8 !important;
}

html[data-theme="day"] .app__sidebar-item {
  color: #183b59 !important;
}

html[data-theme="day"] .app__sidebar-item:hover {
  color: #075985 !important;
  background: #d9edff !important;
}

html[data-theme="day"] .app__sidebar-close,
html[data-theme="day"] .app__menu-btn,
html[data-theme="day"] .app__new-btn {
  color: #075985 !important;
}

html[data-theme="day"] .bubble {
  color: #172b43 !important;
  background: #ffffff !important;
  border-color: #9bc9e9 !important;
  box-shadow: 0 3px 14px rgba(37,99,145,.12) !important;
}

html[data-theme="day"] .empty-state {
  color: #17324d !important;
  background: rgba(255,255,255,.88) !important;
  border-color: #9bc9e9 !important;
}

html[data-theme="day"] .empty-state * {
  color: #17324d;
}

html[data-theme="day"] .composer__input {
  color: #172b43 !important;
  background: #ffffff !important;
  border-color: #80bde5 !important;
  box-shadow: 0 2px 12px rgba(37,99,145,.12) !important;
}

html[data-theme="day"] .composer__input::placeholder {
  color: #71869a !important;
}

html[data-theme="day"] .language-option,
html[data-theme="day"] .language-panel__back {
  color: #17324d !important;
  background: #f4faff !important;
}

html[data-theme="day"] .language-option--active {
  background: #d9edff !important;
}

html[data-theme="day"] .app__overlay {
  background: rgba(23,43,67,.35) !important;
}

html[data-theme="day"] .app__theme-toggle {
  border-color: rgba(217,119,6,.3);
}

@media (prefers-reduced-motion: reduce) {
  .app__theme-toggle .app__menu-glyph {
    transition: none !important;
  }
}
'''

with open("src/App.css", "a", encoding="utf-8") as f:
    f.write(css)

print("Day/Night theme installed.")
print("Backup files use the .bak-theme suffix.")
