// Saved story projects (scenes + settings). Stored in this browser (localStorage). A project keeps the
// library ids of its photos, not the photos, so the photos must stay in the library.

export type StoryProjectScene = { imageId: string; name: string; text: string; sec: number; say?: string; voice?: string };
export type StoryProjectSettings = {
  defSec: number; transition: string; effect: string; size: string; sfx: string; bg: string; fg: string; voice?: string;
};
export type StoryProject = {
  id: string; name: string; savedAt: string; settings: StoryProjectSettings; scenes: StoryProjectScene[];
};

const KEY = "khoem.story.projects.v1";

const isScene = (s: unknown): s is StoryProjectScene => {
  const o = s as StoryProjectScene;
  return !!o && typeof o.imageId === "string" && typeof o.name === "string" && typeof o.text === "string" && typeof o.sec === "number";
};
const isProject = (p: unknown): p is StoryProject => {
  const o = p as StoryProject;
  return !!o && typeof o.id === "string" && typeof o.name === "string" && !!o.settings && Array.isArray(o.scenes) && o.scenes.every(isScene);
};

export const newProjectId = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function listProjects(): StoryProject[] {
  try {
    const raw = localStorage.getItem(KEY);
    const v: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter(isProject).sort((a, b) => b.savedAt.localeCompare(a.savedAt)) : [];
  } catch { return []; }
}

function write(all: StoryProject[]) {
  try { localStorage.setItem(KEY, JSON.stringify(all)); }
  catch { throw new Error("មិនអាចរក្សាទុកក្នុងកម្មវិធីរុករកបានទេ · Could not save in this browser (storage full or blocked)"); }
}

export function saveProject(p: StoryProject): void {
  const all = listProjects().filter((x) => x.id !== p.id);
  all.push(p);
  write(all);
}

export function deleteProject(id: string): void {
  write(listProjects().filter((x) => x.id !== id));
}
