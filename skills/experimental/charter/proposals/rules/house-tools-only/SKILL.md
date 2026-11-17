---
name: house-tools-only
version: 0.1.0
disable-model-invocation: true
description: Where the toolchain map names a tool for a capability, that capability is performed only through that tool; never an equivalent substitute.
---

# Rule: house tools only

**Rule.** Where the toolchain map names a tool for a capability, that capability is performed only through that tool; never an equivalent substitute.

**Why.** Substitutes silently skip the tool's own setup and metadata (copied config, synced PR bases). The result looks the same until something downstream breaks.

**Applies.** Every capability listed in the toolchain map. The map is `~/.claude/charter/toolchain.md`, where `<repo>/.claude/charter-toolchain.md`, if present, replaces the user file row by row (same Capability wins). If neither exists, this rule is inert. When the map names a skill for a tool, that skill is read before the tool's first use; no use before reading. In a subagent, the brief must carry the skill's relevant text. A tool the user names for this task outranks the map.

**Check.** The report names the map file read, or states that neither path exists (rule inert). It lists each mapped capability used and the tool invocation that performed it, and for each tool with a named skill, that the skill was read first.

**If it blocks you.** If the tool is missing or failing, stop that part and record it per `record-dont-guess`; never fall back to a plain equivalent. Continue everything that does not depend on it.
