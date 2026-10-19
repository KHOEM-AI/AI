import { useEffect, useState } from "react";
import { useT, pickText, useLanguageCode } from "../i18n";
import { api } from "../api/client";
import OpCard, { type Op } from "./OpCard";

const CH = { id: "/api/characters" };
const SB = { id: "/api/storyboards" };
const BODY = (ph = "{ }") => [{ k: "*", label: "body (JSON)", kind: "json" as const, ph }];

const GROUPS: { name: string; ops: Op[] }[] = [
  { name: "តួអង្គ", ops: [
    { m: "GET", path: "/api/characters", desc: "បញ្ជីតួអង្គ" },
    { m: "POST", path: "/api/characters", desc: "បង្កើតតួអង្គ", fields: [
      { k: "name", label: "name (ឈ្មោះ)" }, { k: "role", label: "role" },
      { k: "identity", label: "identity JSON", kind: "json", ph: '{"face":"","skinTone":"","gender":"","birthYear":""}' },
      { k: "current", label: "current JSON", kind: "json", ph: '{"age":"","hair":"","outfit":""}' },
      { k: "tags", label: "tags (១ បន្ទាត់ ១ tag)", kind: "lines" }] },
    { m: "GET", path: "/api/characters/:id", desc: "ព័ត៌មានតួអង្គ", pick: CH },
    { m: "POST", path: "/api/characters/:id/merge", desc: "merge ការកែ", pick: CH,
      fields: [{ k: "update", label: "update (JSON)", kind: "json" }, { k: "force", label: "force", kind: "bool" }] },
    { m: "GET", path: "/api/characters/:id/timeline", desc: "timeline", pick: CH },
    { m: "GET", path: "/api/characters/:id/prompt", desc: "prompt", pick: CH, fields: [{ k: "outfit", label: "outfit" }] },
    { m: "GET", path: "/api/characters/:id/refs", desc: "រូបយោង", pick: CH },
    { m: "POST", path: "/api/characters/:id/refs", desc: "បន្ថែមរូបយោង", pick: CH,
      fields: [{ k: "label", label: "label (≤80)" }, { k: "path", label: "path: data/refs/x.jpg ឬ https://..." }] },
    { m: "DELETE", path: "/api/characters/:id/refs/:n", desc: "លុបរូបយោង", pick: CH, danger: true },
    { m: "POST", path: "/api/shotlist", desc: "shotlist", fields: BODY() },
  ] },
  { name: "Storyboard", ops: [
    { m: "GET", path: "/api/storyboards", desc: "បញ្ជី" },
    { m: "GET", path: "/api/storyboards/options", desc: "ជម្រើស" },
    { m: "POST", path: "/api/storyboards", desc: "បង្កើត", fields: [
      { k: "title", label: "title" },
      { k: "style", label: "style", ph: "animation | 3d | realistic | cinematic" },
      { k: "aspect", label: "aspect", ph: "16:9 | 9:16 | 1:1" }] },
    { m: "GET", path: "/api/storyboards/:id", desc: "ព័ត៌មាន", pick: SB },
    { m: "GET", path: "/api/storyboards/:id/continuity", desc: "continuity", pick: SB },
    { m: "POST", path: "/api/storyboards/:id/scenes", desc: "បន្ថែម scene (form)", pick: SB, fields: [
      { k: "title", label: "title (ចំណងជើងឈុត)" }, { k: "location", label: "location" },
      { k: "action", label: "action (សកម្មភាព)", kind: "area" },
      { k: "lighting", label: "lighting" }, { k: "notes", label: "notes", kind: "area" },
      { k: "durationSec", label: "durationSec (1-60)", kind: "number" },
      { k: "timeOfDay", label: "timeOfDay", kind: "select", options: ["dawn","morning","noon","afternoon","golden_hour","dusk","night"] },
      { k: "weather", label: "weather", kind: "select", options: ["clear","cloudy","rain","storm","fog","snow"] },
      { k: "season", label: "season", kind: "select", options: ["dry","rainy","cool","hot"] },
      { k: "camera.shot", label: "camera.shot", kind: "select", options: ["wide","medium","close","extreme_close","aerial","top_down","over_the_shoulder"] },
      { k: "camera.angle", label: "camera.angle", ph: "eye-level" },
      { k: "camera.movement", label: "camera.movement", kind: "select", options: ["static","pan","tilt","zoom","dolly","tracking","handheld","whip_pan","orbit","crane_up","crane_down","drone_flyover","drone_follow","fpv_dive","spiral_up"] },
      { k: "camera.rig", label: "camera.rig", kind: "select", options: ["tripod","handheld","gimbal","drone","crane","cable_cam","vehicle_mount"] },
      { k: "camera.speed", label: "camera.speed", kind: "select", options: ["slow","normal","fast"] },
      { k: "camera.degrees", label: "camera.degrees (0-720)", kind: "number" },
      { k: "characters", label: "characters JSON", kind: "json", ph: '[{"id":"people_xxx","outfit":""}]' },
      { k: "assets", label: "assets (១ បន្ទាត់ ១ id)", kind: "lines" },
      { k: "dialogue", label: "dialogue JSON", kind: "json", ph: '[{"speaker":"narrator","text":"","emotion":""}]' }] },
    { m: "POST", path: "/api/storyboards/:id/scenes", desc: "បន្ថែម scene (JSON)", pick: SB, fields: BODY() },
    { m: "POST", path: "/api/storyboards/:id/scenes/:sc", desc: "កែ scene", pick: SB, fields: BODY() },
    { m: "POST", path: "/api/storyboards/:id/scenes/:sc/status", desc: "ប្ដូរ status", pick: SB, fields: [{ k: "status", label: "status", ph: "draft | approved | needs_regen" }] },
    { m: "GET", path: "/api/storyboards/:id/scenes/:sc/prompt", desc: "prompt របស់ scene", pick: SB },
  ] },
  { name: "Assets", ops: [
    { m: "GET", path: "/api/assets", desc: "ស្វែងរក", fields: ["q", "group", "country", "region", "tag"].map((k) => ({ k })).concat([{ k: "alcohol", ph: "true/false" } as any]) },
    { m: "GET", path: "/api/assets/pick", desc: "ជ្រើសសម្រាប់រឿង", fields: [{ k: "country" }, { k: "region" }, { k: "limit", kind: "number" }, { k: "groups", ph: "a,b" }, { k: "alcohol", ph: "true/false" }] },
    { m: "POST", path: "/api/assets", desc: "បង្កើត asset (form)", fields: [
      { k: "group", label: "group (ជ្រើស)", kind: "select", options: ["people","fashion","tech","vehicles","buildings","valuables","food","fruits","vegetables","farming","drinks","appliances","plants","kitchenware","places","animals"] },
      { k: "nameKm", label: "nameKm (ឈ្មោះខ្មែរ)" }, { k: "nameEn", label: "nameEn" },
      { k: "subgroup", label: "subgroup" },
      { k: "region", label: "region", ph: "global (លំនាំដើម)" }, { k: "country", label: "country", ph: "KH" },
      { k: "appearance", label: "appearance (រូបរាង)", kind: "area" },
      { k: "imageRef", label: "imageRef: path ឬ https://..." },
      { k: "actions", label: "actions (១ បន្ទាត់ ១ សកម្មភាព)", kind: "lines" },
      { k: "tags", label: "tags (១ បន្ទាត់ ១ tag)", kind: "lines" },
      { k: "alcohol", label: "alcohol", kind: "bool" }] },
    { m: "POST", path: "/api/assets", desc: "បង្កើត asset (JSON)", fields: BODY() },
    { m: "POST", path: "/api/assets/seed", desc: "seed ទាំងអស់", danger: true },
  ] },
  { name: "Library", ops: [
    { m: "GET", path: "/api/library/groups", desc: "ក្រុម" },
    { m: "GET", path: "/api/library", desc: "បញ្ជី", fields: [{ k: "group" }, { k: "tag" }, { k: "source" }] },
    { m: "GET", path: "/api/library/:id", desc: "ធាតុមួយ", pick: { id: "/api/library" } },
  ] },
  { name: "វចនានុក្រម", ops: [
    { m: "GET", path: "/api/lexicon/domains", desc: "ដែន" },
    { m: "GET", path: "/api/lexicon/answer", desc: "ឆ្លើយជាខ្មែរ", fields: [{ k: "q" }] },
    { m: "GET", path: "/api/lexicon", desc: "ស្វែងរកពាក្យ", fields: [{ k: "q" }, { k: "domain" }, { k: "limit", kind: "number" }] },
    { m: "POST", path: "/api/lexicon", desc: "បន្ថែមពាក្យ", fields: [
      { k: "domain" }, { k: "km", label: "km (ខ្មែរ)" }, { k: "en" }, { k: "defKm", label: "defKm (និយមន័យ)" }] },
  ] },
  { name: "Hub", ops: [{ m: "GET", path: "/api/hub/status", desc: "ចំនួនទិន្នន័យក្នុងឃ្លាំង" }] },
  { name: "KHOEM", ops: [
    { m: "GET", path: "/api/khoem/health", desc: "health (:8790)" },
    { m: "GET", path: "/api/khoem/languages", desc: "ភាសា" },
    { m: "GET", path: "/api/khoem/locales", desc: "locales" },
    { m: "GET", path: "/api/khoem/coverage", desc: "coverage" },
    { m: "GET", path: "/api/khoem/knowledge", desc: "ចំណេះដឹង", fields: [{ k: "q" }, { k: "exact", ph: "1" }] },
    { m: "GET", path: "/api/khoem/khmer", desc: "ខ្មែរ (exact)", fields: [{ k: "q" }] },
    { m: "POST", path: "/api/khoem/translate", desc: "បកប្រែ", fields: [{ k: "locale", ph: "km" }, { k: "key" }, { k: "params", kind: "json", ph: '{"n":1}' }] },
  ] },
];

const PREFIXES = ["/api/characters", "/api/storyboards", "/api/assets", "/api/library", "/api/lexicon", "/api/hub", "/api/khoem", "/api/shotlist"];

export default function DataCenter({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLanguageCode();
  const [tab, setTab] = useState(GROUPS[0].name);
  const [missing, setMissing] = useState<string[] | null>(null);

  useEffect(() => {
    api<{ routes: { method: string; path: string }[] }>("/api/routes/all")
      .then((r) => {
        const have = new Set<string>();
        GROUPS.forEach((g) => g.ops.forEach((o) => have.add(`${o.m} ${o.path}`)));
        setMissing(
          r.routes
            .filter((x) => PREFIXES.some((p) => x.path === p || x.path.startsWith(p + "/")))
            .map((x) => `${x.method} ${x.path}`)
            .filter((k) => !have.has(k)),
        );
      })
      .catch(() => setMissing(null));
  }, []);

  const group = GROUPS.find((g) => g.name === tab) ?? GROUPS[0];

  return (
    <div className="status-overlay" role="dialog" aria-label="Data Center">
      <div className="status-panel">
        <div className="status-panel__head">
          <div>
            <div className="status-panel__ai-name">Data Center</div>
            <div className="status-panel__page-title">
              {pickText(lang, "តួអង្គ, storyboard, assets, library, វចនានុក្រម, KHOEM", "Characters, storyboards, assets, library, lexicon, KHOEM")}
            </div>
          </div>
          <button className="status-panel__close" onClick={onClose} aria-label={t.close}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {GROUPS.map((g) => (
            <button key={g.name} style={{ fontWeight: g.name === tab ? 700 : 400 }} onClick={() => setTab(g.name)}>{g.name}</button>
          ))}
        </div>

        {group.ops.map((o) => <OpCard key={`${group.name}|${o.m} ${o.path}|${o.desc}`} op={o} lang={lang} />)}

        {missing && (
          <div className="status-panel__meta" style={{ marginTop: 12 }}>
            {missing.length === 0
              ? "✅ UI គ្របដណ្ដប់ route ទាំងអស់ក្នុងក្រុមទាំងនេះ"
              : `⚠️ មិនទាន់មាន UI: ${missing.join(", ")}`}
          </div>
        )}
      </div>
    </div>
  );
}
