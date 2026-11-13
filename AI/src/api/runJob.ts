import { iqaiCancelJob, iqaiJob, iqaiStartJob } from "./client";
import type { IqaiJob } from "./client";

// Start a background job and wait for it (poll). Calls onId once the job exists, onProgress while it runs.
// `stop()` is checked every round: when it returns true the job is cancelled on the server.
export async function runJob(
  type: string,
  params: Record<string, unknown>,
  o: { onId?: (id: string) => void; onProgress?: (p: number) => void; stop?: () => boolean; pollMs?: number } = {},
): Promise<IqaiJob> {
  let job = await iqaiStartJob(type, params);
  if (o.onId) o.onId(job.id);
  while (job.status === "queued" || job.status === "running") {
    if (o.stop && o.stop()) {
      try { await iqaiCancelJob(job.id); } catch { /* the next poll shows the real state */ }
      o.stop = undefined;
    }
    await new Promise((r) => setTimeout(r, o.pollMs ?? 1500));
    job = await iqaiJob(job.id);
    if (o.onProgress) o.onProgress(job.progress);
  }
  return job;
}
