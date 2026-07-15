// Deterministic check evaluators for the eval harness.
//
// A "check" is a small declarative assertion about a loaded skill variant. Each
// check runs against the SKILL.md of whichever variant the runner points at, so
// the identical set encodes the CONTRACT a Phase-5 loosening must preserve:
// run the checks against the stable variant to record a baseline, then against
// the wip variant to prove the rewrite kept every load-bearing invariant.
//
// Checks are pure and deterministic — same skill text in, same result out —
// which is exactly why they can gate CI. They cover the three observable
// dimensions the plan calls for:
//   - trigger correctness   -> description_contains / description_matches
//   - output artifact shape -> section_present / body_contains
//   - invariant adherence   -> body_contains / body_matches / body_absent
//
// Anything that genuinely needs a live model (does the description actually FIRE
// on a paraphrased prompt? does the run produce a conformant artifact?) is
// expressed as a `live` scenario field instead — see scenarios/*.json and the
// generated *.trigger.json eval-sets the skill-creator plugin can run.

const norm = (s) => s.replace(/\s+/g, " ").toLowerCase();

const EVALUATORS = {
  // Trigger surface (frontmatter description) contains a phrase.
  description_contains(skill, { value }) {
    return norm(skill.description).includes(norm(value));
  },
  description_matches(skill, { pattern, flags }) {
    return new RegExp(pattern, flags ?? "i").test(skill.description);
  },
  // Body (instructions) contains / omits a literal phrase.
  body_contains(skill, { value }) {
    return norm(skill.body).includes(norm(value));
  },
  body_absent(skill, { value }) {
    return !norm(skill.body).includes(norm(value));
  },
  body_matches(skill, { pattern, flags }) {
    return new RegExp(pattern, flags ?? "im").test(skill.body);
  },
  // A markdown heading exists (## / ### … ) whose text contains value.
  section_present(skill, { value }) {
    const re = new RegExp(`^#{1,6}\\s+.*${escapeRe(value)}`, "im");
    return re.test(skill.body);
  },
};

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Evaluate one check against a loaded skill. Returns { pass, reason }.
export function runCheck(skill, check) {
  if (!skill.exists) {
    return { pass: false, reason: `no SKILL.md at ${skill.dir}` };
  }
  const fn = EVALUATORS[check.type];
  if (!fn) {
    return { pass: false, reason: `unknown check type: ${check.type}` };
  }
  const pass = fn(skill, check);
  return {
    pass,
    reason: pass ? "ok" : `${check.type} failed: ${check.desc || JSON.stringify(check)}`,
  };
}

export const CHECK_TYPES = Object.keys(EVALUATORS);
