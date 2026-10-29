// Flat list of every branch (with its region) — builds one page per branch.
// Edit branches in branches.json; this file needs no changes.
import { readFileSync } from "node:fs";
export default function () {
  const data = JSON.parse(readFileSync(new URL("./branches.json", import.meta.url), "utf8"));
  return data.regions.flatMap((r) => r.branches.map((b) => ({ ...b, region: r.region })));
}
