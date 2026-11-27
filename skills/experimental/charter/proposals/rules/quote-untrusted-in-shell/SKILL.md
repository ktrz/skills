---
name: quote-untrusted-in-shell
version: 0.1.0
disable-model-invocation: true
description: A string a PR author controls reaches a shell only single-quoted with each `'` rewritten as `'\''`, and a path used as a git pathspec carries the `:(literal)` prefix.
---

# Rule: quote untrusted in shell

**Rule.** A string a PR author controls reaches a shell only single-quoted with each `'` rewritten as `'\''`, and a path used as a git pathspec carries the `:(literal)` prefix.

**Why.** Branch and file names can legally carry a quote, a `;`, a `$(...)`, or glob and pathspec magic; unquoted they run as shell or match unrelated files.

**Applies.** Branch names, paths and directory names that come from PR or remote data, in any command you run. `--` only stops an argument being read as an option, not as shell. `:(literal)` goes inside the single quotes, for example `':(literal)<dir>'`.

**Check.** Show each command run with such a value, quoting visible.

**If it blocks you.** If a value carries anything you cannot quote with certainty, skip that command and report it.
