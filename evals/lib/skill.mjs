// Skill loading + variant resolution for the eval harness.
//
// Zero dependencies (node builtins only), matching the repo's tests/ style.
// A "variant" is a directory holding a SKILL.md: the stable copy lives under
// skills/<group>/<skill>/, the Phase-5 rework lives under skills/wip/<skill>/.
// The harness resolves either from the same scenario file so the exact same
// checks run A/B against both.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, "..", "..");

// Every parse/load branch returns this exact key set (plus exists/dir/skillMd/
// raw from loadSkill), so no consumer can read an undefined field on one path
// and mis-evaluate instead of failing closed.
function emptySkillFields() {
  return {
    frontmatter: "",
    body: "",
    description: "",
    name: "",
    version: "",
    hasFrontmatter: false,
  };
}

// Split a SKILL.md into { frontmatter (raw string), body, description, … }.
// The description is read from YAML frontmatter; it may be a folded/`>` block
// spanning multiple lines, so we join continuation lines into one string —
// this is the trigger surface the model actually sees in the skill listing.
//
// Tolerates a BOM, CRLF line endings, and leading blank lines. If no
// frontmatter block is found, `hasFrontmatter` is false — runCheck fails all
// checks closed on that flag, so a parse failure is reported as itself rather
// than masquerading as trigger drift (empty description) or letting body
// checks run against text that still contains the frontmatter block.
export function parseSkillMd(text) {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const fmMatch = normalized.match(/^\s*---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!fmMatch) {
    return { ...emptySkillFields(), body: normalized };
  }
  const frontmatter = fmMatch[1];
  const body = fmMatch[2];
  return {
    ...emptySkillFields(),
    hasFrontmatter: true,
    frontmatter,
    body,
    description: extractYamlScalar(frontmatter, "description"),
    name: extractYamlScalar(frontmatter, "name"),
    version: extractYamlScalar(frontmatter, "version"),
  };
}

// Extract a top-level YAML scalar that may be inline, quoted, or a folded/
// literal block (`>` / `|`). Deliberately tiny — the frontmatter shapes in this
// repo are simple and we only need description/name/version.
function extractYamlScalar(frontmatter, key) {
  const lines = frontmatter.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(new RegExp(`^${key}:\\s*(.*)$`));
    if (!m) continue;
    const rest = m[1].trim();
    if (rest && rest !== ">" && rest !== "|" && rest !== ">-" && rest !== "|-") {
      return stripQuotes(rest);
    }
    // Folded/literal block: consume indented continuation lines.
    const collected = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (/^\s+\S/.test(lines[j]) || lines[j].trim() === "") {
        collected.push(lines[j].trim());
      } else {
        break;
      }
    }
    return collected.join(" ").replace(/\s+/g, " ").trim();
  }
  return "";
}

function stripQuotes(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

// Resolve a scenario's target to a concrete skill directory for a variant.
//   variant "stable" -> scenario.stable_path
//   variant "wip"    -> scenario.wip_path (defaults to skills/wip/<target>)
export function resolveVariantDir(scenario, variant) {
  if (variant === "stable") {
    return path.join(REPO_ROOT, scenario.stable_path);
  }
  if (variant === "wip") {
    const wip = scenario.wip_path || path.join("skills", "wip", scenario.target);
    return path.join(REPO_ROOT, wip);
  }
  throw new Error(`unknown variant: ${variant}`);
}

// A variant's references/*.md, concatenated in filename order. Body-level
// checks include this text so the progressive-disclosure refactor the repo's
// review guidelines encourage (moving spec/template text out of SKILL.md into
// references/) is not reported as drift by the Phase-5 gate.
function loadReferencesText(dir) {
  const refDir = path.join(dir, "references");
  if (!existsSync(refDir)) return "";
  return readdirSync(refDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name)
    .sort()
    .map((name) => readFileSync(path.join(refDir, name), "utf8"))
    .join("\n\n");
}

// Load a skill variant into the shape the check evaluators expect. Every
// branch returns the same key set (see emptySkillFields). `body` is the
// SKILL.md body plus the variant's references/*.md (see loadReferencesText);
// `description` remains the frontmatter trigger surface only.
export function loadSkill(dir) {
  const skillMd = path.join(dir, "SKILL.md");
  if (!existsSync(skillMd)) {
    return { exists: false, dir, skillMd, raw: "", ...emptySkillFields() };
  }
  const text = readFileSync(skillMd, "utf8");
  const parsed = parseSkillMd(text);
  const referencesText = loadReferencesText(dir);
  return {
    exists: true,
    dir,
    skillMd,
    raw: text,
    ...parsed,
    body: referencesText ? `${parsed.body}\n\n${referencesText}` : parsed.body,
  };
}
