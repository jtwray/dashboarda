import { copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const dashboards = ["email-action", "christian-jobs", "local-prospects", "job-rates", "jeep-watch"];
const requested = process.argv.slice(2);
if (requested.some(name => !dashboards.includes(name))) throw new Error("Unknown task dashboard");
for (const name of requested.length ? requested : dashboards) {
  for (const asset of ["dashboard.js", "dashboard.css"]) {
    await copyFile(fileURLToPath(new URL(`../shared/${asset}`, import.meta.url)), fileURLToPath(new URL(`../apps/${name}/${asset}`, import.meta.url)));
  }
}
console.log("Shared dashboard assets synchronized.");
