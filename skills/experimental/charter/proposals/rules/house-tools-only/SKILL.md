---
name: house-tools-only
version: 0.1.0
disable-model-invocation: true
description: Where the toolchain map names a tool for a capability, that capability is performed only through that tool; never an equivalent substitute.
---

# Rule: house tools only

**Rule.** Where the toolchain map names a tool for a capability, that capability is performed only through that tool; never an equivalent substitute.

**Why.** Substitutes silently skip the tool's own setup and metadata (copied config, synced PR bases). The result looks the same until something downstream breaks.

**Applies.** Every capability listed in the toolchain map. The map is `~/.claude/charter/toolchain.md`, where `<repo>/.claude/charter-toolchain.md`, if present, replaces the user file row by row (same Capability wins). Paths in the toolchain map resolve relative to the map file; tool notes install at `~/.claude/charter/tools/` beside `~/.claude/charter/toolchain.md`, with byte-copied scripts in `tools/<tool>/`. When the map names a skill or tool note to read first, it is read before the tool's first use; no use before reading. In a subagent, the brief must carry its relevant text. A tool the user names for this task outranks the map. If neither map exists and a bound goal needs a tool note (the goal names one, or the capability it uses has config keys or call shapes that only a note holds), stop and say which file is missing: the map path, and the note's path under `~/.claude/charter/tools/`. Exempt: none.

**Check.** The report names the map file read, or states that neither path exists and that no bound goal needed a tool note. It lists each mapped capability used and the tool invocation that performed it, and for each tool with a named skill or note, that it was read first.

**If it blocks you.** If the map or a needed note is missing, stop and name the missing file; never work from memory of the note. If the tool is missing or failing, stop that part and record it per `record-dont-guess`; never fall back to a plain equivalent. Continue everything that does not depend on it.
