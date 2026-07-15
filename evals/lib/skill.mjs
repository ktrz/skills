// Skill loading + variant resolution for the eval harness.
//
// Zero dependencies (node builtins only), matching the repo's tests/ style.
// A "variant" is a directory holding a SKILL.md: the stable copy lives under
// skills/<group>/<skill>/, the Phase-5 rework lives under skills/wip/<skill>/.
// The harness resolves either from the same scenario file so the exact same
// checks run A/B against both.

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, "..", "..");

// Split a SKILL.md into { frontmatter (raw string), body, description }.
// The description is read from YAML frontmatter; it may be a folded/`>` block
// spanning multiple lines, so we join continuation lines into one string —
// this is the trigger surface the model actually sees in the skill listing.
export function parseSkillMd(text) {
  const fmMatch = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!fmMatch) {
    return { frontmatter: "", body: text, description: "", name: "" };
  }
  const frontmatter = fmMatch[1];
  const body = fmMatch[2];
  return {
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

// Load a skill variant into the shape the check evaluators expect.
export function loadSkill(dir) {
  const skillMd = path.join(dir, "SKILL.md");
  if (!existsSync(skillMd)) {
    return { exists: false, dir, skillMd, frontmatter: "", body: "", description: "", name: "" };
  }
  const text = readFileSync(skillMd, "utf8");
  const parsed = parseSkillMd(text);
  return { exists: true, dir, skillMd, raw: text, ...parsed };
}
