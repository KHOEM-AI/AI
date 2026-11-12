from pathlib import Path

def read(path):
    return Path(path).read_text(encoding="utf-8")

def write(path, content):
    Path(path).write_text(content, encoding="utf-8")

# 1. Translation keys
new_keys = """
  sectionSystem: string;
  sectionCode: string;
  sectionMedia: string;
  sectionSecurity: string;
  sectionOther: string;
  navObservability: string;
  navAuditMetrics: string;
  navManagement: string;
  navPatchDashboard: string;
  navCodeCenter: string;
  navToolRegistry: string;
  navApiCenter: string;
  navDataCenter: string;
  navCidc: string;
  navKsv: string;
  navKhoemStudio: string;
  navCai: string;
  navKei: string;
  navSafety: string;
  navLearningCenter: string;
  languageEnglish: string;
  languageKhmer: string;
"""

p = "src/i18n/types.ts"
s = read(p)
if "sectionSystem:" not in s:
    pos = s.rfind("}")
    if pos < 0:
        raise SystemExit("Cannot find end of Translations interface")
    s = s[:pos] + new_keys + s[pos:]
    write(p, s)

# 2. English and Khmer translations
translations = {
    "src/i18n/en.ts": """
  sectionSystem: "SYSTEM MONITORING",
  sectionCode: "CODE & TOOLS",
  sectionMedia: "CAMERA · IMAGE · VIDEO",
  sectionSecurity: "PROTECTION & SECURITY",
  sectionOther: "OTHER",
  navObservability: "Observability",
  navAuditMetrics: "Audit & Metrics",
  navManagement: "Management",
  navPatchDashboard: "Patch Dashboard",
  navCodeCenter: "Code Center",
  navToolRegistry: "Tool Registry",
  navApiCenter: "API Center",
  navDataCenter: "Data Center",
  navCidc: "CIDC · Central Data Core",
  navKsv: "KSV · General Device Control",
  navKhoemStudio: "KHOEM-AI Creative Studio",
  navCai: "CAI · Scan & Count",
  navKei: "KEI · System Protection",
  navSafety: "Safety",
  navLearningCenter: "Learning Center",
  languageEnglish: "English",
  languageKhmer: "Khmer",
""",
    "src/i18n/km.ts": """
  sectionSystem: "ត្រួតពិនិត្យប្រព័ន្ធ",
  sectionCode: "កូដ និងឧបករណ៍",
  sectionMedia: "កាមេរ៉ា · រូបភាព · វីដេអូ",
  sectionSecurity: "ការការពារ និងសុវត្ថិភាព",
  sectionOther: "ផ្សេងៗ",
  navObservability: "ការតាមដានប្រព័ន្ធ",
  navAuditMetrics: "សវនកម្ម និងសូចនាករ",
  navManagement: "ការគ្រប់គ្រង",
  navPatchDashboard: "ផ្ទាំងគ្រប់គ្រង Patch",
  navCodeCenter: "មជ្ឈមណ្ឌលកូដ",
  navToolRegistry: "បញ្ជីឧបករណ៍",
  navApiCenter: "មជ្ឈមណ្ឌល API",
  navDataCenter: "មជ្ឈមណ្ឌលទិន្នន័យ",
  navCidc: "CIDC · ស្នូលទិន្នន័យកណ្តាល",
  navKsv: "KSV · ការគ្រប់គ្រងឧបករណ៍ទូទៅ",
  navKhoemStudio: "ស្ទូឌីយោច្នៃប្រឌិត KHOEM-AI",
  navCai: "CAI · ស្កេន និងរាប់",
  navKei: "KEI · ការការពារប្រព័ន្ធ",
  navSafety: "សុវត្ថិភាព",
  navLearningCenter: "មជ្ឈមណ្ឌលសិក្សា",
  languageEnglish: "អង់គ្លេស",
  languageKhmer: "ខ្មែរ",
"""
}

for p, block in translations.items():
    s = read(p)
    if "sectionSystem:" not in s:
        pos = s.rfind("};")
        if pos < 0:
            raise SystemExit("Cannot find end of translation object: " + p)
        s = s[:pos] + block + s[pos:]
        write(p, s)

# 3. Import custom SVG icons
p = "src/App.tsx"
s = read(p)

if 'from "./components/MenuGlyph"' not in s:
    anchor = 'import HeartbeatLogo from "./components/HeartbeatLogo";'
    if anchor not in s:
        raise SystemExit("Cannot find HeartbeatLogo import in App.tsx")
    s = s.replace(
        anchor,
        anchor + '\nimport MenuGlyph from "./components/MenuGlyph";',
        1
    )

# 4. Replace sidebar navigation, keeping original actions
start = s.find('<nav className="app__sidebar-nav">')
if start < 0:
    raise SystemExit("Cannot find sidebar navigation start")

end = s.find("</nav>", start)
if end < 0:
    raise SystemExit("Cannot find sidebar navigation end")
end += len("</nav>")

nav = r'''<nav className="app__sidebar-nav">
                <div className="app__sidebar-section">{t.sectionSystem}</div>

                <button className="app__sidebar-item" onClick={() => { setShowStatus(true); setShowMenu(false); }}>
                  <MenuGlyph name="status" /> {t.navStatus}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowControl(true); setShowMenu(false); }}>
                  <MenuGlyph name="control" /> {t.navControlCenter}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowObservability(true); setShowMenu(false); }}>
                  <MenuGlyph name="observability" /> {t.navObservability}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowAuditMetrics(true); setShowMenu(false); }}>
                  <MenuGlyph name="audit" /> {t.navAuditMetrics}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowManagement(true); setShowMenu(false); }}>
                  <MenuGlyph name="settings" /> {t.navManagement}
                </button>

                <div className="app__sidebar-section">{t.sectionCode}</div>
                <button className="app__sidebar-item" onClick={() => { setShowPatchDashboard(true); setShowMenu(false); }}>
                  <MenuGlyph name="patch" /> {t.navPatchDashboard}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowCodeCenter(true); setShowMenu(false); }}>
                  <MenuGlyph name="code" /> {t.navCodeCenter}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowToolRegistry(true); setShowMenu(false); }}>
                  <MenuGlyph name="tools" /> {t.navToolRegistry}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowApiCenter(true); setShowMenu(false); }}>
                  <MenuGlyph name="api" /> {t.navApiCenter}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowDataCenter(true); setShowMenu(false); }}>
                  <MenuGlyph name="data" /> {t.navDataCenter}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowCidc(true); setShowMenu(false); }}>
                  <MenuGlyph name="cidc" /> {t.navCidc}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowKsv(true); setShowMenu(false); }}>
                  <MenuGlyph name="device" /> {t.navKsv}
                </button>

                <div className="app__sidebar-section">{t.sectionMedia}</div>
                <button className="app__sidebar-item" onClick={() => { setShowKhoemStudio(true); setShowMenu(false); }}>
                  <MenuGlyph name="studio" /> {t.navKhoemStudio}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowCai(true); setShowMenu(false); }}>
                  <MenuGlyph name="camera" /> {t.navCai}
                </button>

                <div className="app__sidebar-section">{t.sectionSecurity}</div>
                <button className="app__sidebar-item" onClick={() => { setShowKei(true); setShowMenu(false); }}>
                  <MenuGlyph name="shield" /> {t.navKei}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowSafety(true); setShowMenu(false); }}>
                  <MenuGlyph name="safety" /> {t.navSafety}
                </button>

                <div className="app__sidebar-section">{t.sectionOther}</div>
                <button className="app__sidebar-item" onClick={() => { setShowLearningCenter(true); setShowMenu(false); }}>
                  <MenuGlyph name="learning" /> {t.navLearningCenter}
                </button>
                <button className="app__sidebar-item" onClick={() => { setShowHonorific(true); setShowMenu(false); }}>
                  <MenuGlyph name="honorific" /> {t.navHonorific}
                </button>

                <button className="app__sidebar-item" onClick={() => setShowLanguage((v) => !v)}>
                  <MenuGlyph name="language" /> {t.navLanguage} · {language === "en" ? t.languageEnglish : t.languageKhmer}
                </button>

                {showLanguage && (
                  <div className="language-panel__list language-panel__list--inline">
                    <button
                      className={`language-option${language === "en" ? " language-option--active" : ""}`}
                      onClick={() => { handleSelectLanguage("en"); setShowLanguage(false); setShowMenu(false); }}
                    >
                      <span className="language-option__names">
                        <span className="language-option__native">English</span>
                      </span>
                      {language === "en" && <span className="language-option__check">✓</span>}
                    </button>
                    <button
                      className={`language-option${language === "km" ? " language-option--active" : ""}`}
                      onClick={() => { handleSelectLanguage("km"); setShowLanguage(false); setShowMenu(false); }}
                    >
                      <span className="language-option__names">
                        <span className="language-option__native">ខ្មែរ</span>
                      </span>
                      {language === "km" && <span className="language-option__check">✓</span>}
                    </button>
                    <button className="language-panel__back" onClick={() => setShowLanguage(false)}>
                      ← {t.languageClose}
                    </button>
                  </div>
                )}

                {messages.length > 0 && (
                  <button className="app__sidebar-item" onClick={handleNewChat}>
                    <MenuGlyph name="clear" /> {t.navClearChat}
                  </button>
                )}
              </nav>'''

s = s[:start] + nav + s[end:]
write(p, s)

# 5. Sidebar icon and layout styling
p = "src/App.css"
s = read(p)
css = """
/* KHOEM-AI bilingual SVG sidebar */
.app__sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 46px;
  line-height: 1.45;
}
.app__menu-glyph {
  display: block;
  width: 21px;
  height: 21px;
  flex: 0 0 21px;
  color: #63c9ef;
}
.app__sidebar-section {
  margin: 15px 0 5px;
  padding: 0 8px;
  color: #71c9ed;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: .13em;
  text-transform: uppercase;
}
.app__sidebar-section:first-child {
  margin-top: 2px;
}
"""
if "/* KHOEM-AI bilingual SVG sidebar */" not in s:
    s += "\n" + css
    write(p, s)

print("KHOEM-AI bilingual SVG sidebar patch applied.")
