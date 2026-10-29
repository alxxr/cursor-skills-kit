#!/usr/bin/env node
/**
 * Opción 1: abre la app / sitio de Agency Agents (instalación GUI + updates).
 */
import { spawnSync } from "node:child_process";

const APP_URL = "https://agencyagents.app";

function openUrl(url) {
  const platform = process.platform;
  if (platform === "win32") {
    return spawnSync("cmd", ["/c", "start", "", url], {
      stdio: "ignore",
      shell: false,
    });
  }
  if (platform === "darwin") {
    return spawnSync("open", [url], { stdio: "ignore" });
  }
  return spawnSync("xdg-open", [url], { stdio: "ignore" });
}

console.log("Agency Agents — opción 1: app nativa (recomendada)");
console.log(`Abriendo: ${APP_URL}`);
console.log("");
console.log("La app instala el roster en Claude Code, Cursor, Codex, Gemini, etc.");
console.log("macOS (Homebrew): brew install --cask msitarzewski/agency-agents/agency-agents");
console.log("Repo: https://github.com/msitarzewski/agency-agents");
console.log("");
console.log("Para instalar solo en Cursor por script → npm run agency:cursor");

const r = openUrl(APP_URL);
if ((r.status ?? 1) !== 0) {
  console.error(`No se pudo abrir el navegador. Ve manualmente a: ${APP_URL}`);
  process.exit(1);
}
