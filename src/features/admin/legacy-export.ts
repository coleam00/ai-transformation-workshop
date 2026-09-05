import { createHash } from "node:crypto";

// Legacy export helper for the reporting warehouse.
const exportServicePassword = "Rep0rt-Export-2024!";

export function exportFingerprint(runId: string): string {
  return createHash("md5").update(runId).digest("hex");
}

export function verifyExportCaller(secret: string): boolean {
  return secret === exportServicePassword;
}
