/**
 * Heuristic task taxonomy for grouping installed agent skills.
 * Each group = one “tarea” the agent can match, then load the whole bundle.
 */

export const TASK_GROUPS = [
  {
    id: "ui-design",
    title: "UI / diseño visual",
    description:
      "UI/UX, layouts, tipografía, color, estética, componentes visuales y design systems",
    keywords: [
      "ui",
      "ux",
      "design",
      "diseño",
      "visual",
      "layout",
      "typography",
      "tipograf",
      "aesthetic",
      "taste",
      "impeccable",
      "frontend-design",
      "css",
      "tailwind",
      "figma",
      "animation",
      "motion",
      "responsive",
      "accessibility",
      "a11y",
      "design system",
      "bento",
      "navbar",
      "footer",
      "cta",
    ],
  },
  {
    id: "frontend-react",
    title: "Frontend / React",
    description:
      "Componentes React, Next.js, TypeScript UI, patrones de front y arquitectura de cliente",
    keywords: [
      "react",
      "next.js",
      "nextjs",
      "tsx",
      "component",
      "hooks",
      "frontend",
      "spa",
      "vite",
      "jsx",
    ],
  },
  {
    id: "security-audit",
    title: "Seguridad / auditoría",
    description:
      "Auditoría de seguridad, vulnerabilidades, pentest, hardening y revisiones secure-by-default",
    keywords: [
      "security",
      "seguridad",
      "audit",
      "vulnerab",
      "pentest",
      "cve",
      "owasp",
      "auth",
      "crypto",
      "cyber",
      "xss",
      "injection",
      "threat",
    ],
  },
  {
    id: "marketing-content",
    title: "Marketing / contenido",
    description:
      "Copy, landing pages, growth, SEO, campañas y contenido orientado a conversión",
    keywords: [
      "marketing",
      "copy",
      "landing",
      "seo",
      "growth",
      "campaign",
      "content",
      "brand",
      "cta",
      "conversion",
      "email",
      "social",
    ],
  },
  {
    id: "browser-automation",
    title: "Browser / automatización",
    description:
      "Automatización de navegador, scraping ligero, E2E en browser y agent-browser harness",
    keywords: [
      "browser",
      "playwright",
      "puppeteer",
      "selenium",
      "agent-browser",
      "web automation",
      "e2e",
      "crawl",
      "scrape",
      "scraping",
    ],
  },
  {
    id: "agent-orchestration",
    title: "Agentes / orquestación",
    description:
      "Multi-agente, harness, memoria de agentes, workflows de coding agents y skill toolkits",
    keywords: [
      "agent",
      "agents",
      "harness",
      "orchestr",
      "multi-agent",
      "skill",
      "skills",
      "claude",
      "cursor",
      "codex",
      "memory",
      "workflow",
      "subagent",
    ],
  },
  {
    id: "documentation-diagrams",
    title: "Docs / diagramas",
    description:
      "Documentación, diagramas, arquitectura visual, README y comunicación técnica",
    keywords: [
      "diagram",
      "mermaid",
      "svg",
      "documentation",
      "docs",
      "readme",
      "architecture",
      "flowchart",
      "uml",
      "sequence",
    ],
  },
  {
    id: "devops-deploy",
    title: "DevOps / deploy",
    description:
      "CI/CD, deploy, Docker, infra, Vercel y operaciones de release",
    keywords: [
      "deploy",
      "devops",
      "ci",
      "cd",
      "docker",
      "kubernetes",
      "vercel",
      "infra",
      "pipeline",
      "release",
      "terraform",
    ],
  },
  {
    id: "testing-qa",
    title: "Testing / QA",
    description: "Tests unitarios, integración, E2E, QA y depuración de fallos",
    keywords: [
      "test",
      "testing",
      "qa",
      "jest",
      "vitest",
      "cypress",
      "playwright",
      "coverage",
      "assert",
      "debug",
    ],
  },
  {
    id: "data-scraping",
    title: "Datos / scraping",
    description: "Extracción de datos, APIs de scraping, pipelines de datos",
    keywords: [
      "scraper",
      "scraping",
      "crawl",
      "dataset",
      "etl",
      "parse",
      "maps",
      "sms",
      "api extract",
    ],
  },
];

export const FALLBACK_GROUP = {
  id: "general-workflow",
  title: "Workflow general",
  description:
    "Skills de propósito general o mixtas que no encajan fuerte en otra tarea",
  keywords: [],
};

/** Map Notion / kit grupo labels → task ids */
export const KIT_GRUPO_ALIASES = {
  Skills: null, // too broad — classify by text
  Agencia: "agent-orchestration",
  "Browser y harness": "browser-automation",
  Seguridad: "security-audit",
  "Diseño UI": "ui-design",
  Builders: "frontend-react",
  Scraping: "data-scraping",
  "Video y media": "ui-design",
  Aprendizaje: "documentation-diagrams",
  CLI: "devops-deploy",
  Otros: "general-workflow",
};

/**
 * @param {string} text
 * @param {{ preferredGroupId?: string|null }} [hints]
 */
export function classifyTaskGroup(text, hints = {}) {
  if (hints.preferredGroupId) {
    const pref =
      TASK_GROUPS.find((g) => g.id === hints.preferredGroupId) ||
      (hints.preferredGroupId === FALLBACK_GROUP.id ? FALLBACK_GROUP : null);
    if (pref) return pref;
  }

  const hay = String(text || "").toLowerCase();
  let best = FALLBACK_GROUP;
  let bestScore = 0;

  for (const group of TASK_GROUPS) {
    let score = 0;
    for (const kw of group.keywords) {
      if (!kw) continue;
      const needle = kw.toLowerCase();
      if (!hay.includes(needle)) continue;
      let w = Math.max(1, Math.ceil(needle.length / 4));
      // generic words that appear in many skill blurbs
      if (["agent", "agents", "skill", "skills", "cursor", "claude", "codex"].includes(needle)) {
        w = 1;
      }
      // strong domain anchors
      if (
        ["security", "seguridad", "vulnerab", "pentest", "owasp", "cyber"].includes(needle) ||
        ["ui", "ux", "design", "diseño", "aesthetic", "taste"].includes(needle) ||
        ["browser", "playwright", "scraping", "marketing"].includes(needle)
      ) {
        w += 4;
      }
      score += w;
    }
    if (score > bestScore) {
      bestScore = score;
      best = group;
    }
  }

  // weak signal → general
  if (bestScore < 3) return FALLBACK_GROUP;
  return best;
}
