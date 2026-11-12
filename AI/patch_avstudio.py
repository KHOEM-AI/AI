import sys, pathlib
p = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "src/components/AvStudio.tsx")
s = p.read_text(encoding="utf-8")
EDITS = [
('''  const [sfxTypes, setSfxTypes] = useState<string[]>([]);
''','''  const [sfxTypes, setSfxTypes] = useState<string[]>([]);
  const [voices, setVoices] = useState<{ id: string; label: string }[]>([]);
  const [sys, setSys] = useState<{ ffmpeg: boolean; khmerFont: boolean } | null>(null);
'''),
('''    api("/videos/effects").then((r) => r.json()).then((j) => setSfxTypes((j.data?.sfxTypes as string[]) ?? [])).catch(() => {});
''','''    api("/videos/effects").then((r) => r.json()).then((j) => setSfxTypes((j.data?.sfxTypes as string[]) ?? [])).catch(() => {});
    api("/audio/voices").then((r) => r.json()).then((j) => setVoices((j.data?.presets as { id: string; label: string }[]) ?? [])).catch(() => {});
    api("/capabilities").then((r) => r.json()).then((j) => setSys(j.data?.system ?? null)).catch(() => {});
'''),
('''      {msg && <div style={{ color: "#ff8a8a", marginBottom: 8 }}>⚠️ {msg}</div>}
''','''      {msg && <div style={{ color: "#ff8a8a", marginBottom: 8 }}>⚠️ {msg}</div>}
      {sys && !sys.ffmpeg && <div style={{ color: "#ffd24f", marginBottom: 8 }}>⚠️ ffmpeg មិនទាន់ដំឡើង (pkg install ffmpeg) · វីដេអូ/ប្តូរសំឡេង មិនដំណើរការ</div>}
      {sys && sys.ffmpeg && !sys.khmerFont && <div style={{ color: "#ffd24f", marginBottom: 8 }}>⚠️ គ្មានពុម្ពអក្សរខ្មែរ · អត្ថបទ→វីដេអូ មិនដំណើរការ (កំណត់ KHMER_FONT ក្នុង IQ-AI/.env)</div>}
'''),
('''          {PRESETS.map((p) => <button key={p} style={btn} onClick={() => void applyVoice(p)}>{p}</button>)}
''','''          {(voices.length ? voices : PRESETS.map((id) => ({ id, label: id }))).map((v) => (
            <button key={v.id} style={btn} onClick={() => void applyVoice(v.id)}>{v.label}</button>
          ))}
'''),
('''          <input style={inp} value={sfxType} onChange={(e) => setSfxType(e.target.value)} placeholder="type (siren…)" />
''','''          {sfxTypes.length ? (
            <select style={inp} value={sfxType} onChange={(e) => setSfxType(e.target.value)}>
              {sfxTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          ) : (
            <input style={inp} value={sfxType} onChange={(e) => setSfxType(e.target.value)} placeholder="type (siren…)" />
          )}
'''),
]
for i, (old, new) in enumerate(EDITS, 1):
    n = s.count(old)
    if n != 1:
        sys.exit(f"edit {i}: expected 1 match, found {n}. Nothing was changed.")
    s = s.replace(old, new)
p.write_text(s, encoding="utf-8")
print(f"OK: {len(EDITS)} edits applied to {p}")
