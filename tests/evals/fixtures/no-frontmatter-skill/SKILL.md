# Not a real skill

This fixture has no YAML frontmatter at all. The parser must flag it
(`hasFrontmatter: false`) so the harness fails closed instead of treating the
whole file as a body with an empty description.

- Do NOT push the branch yourself before running `gh pr create`.
