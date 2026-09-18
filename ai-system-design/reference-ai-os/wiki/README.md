# Wiki (Obsidian vault)

Meant to be opened directly in Obsidian (`.obsidian/` will be created
automatically; its local workspace state is ignored by git, see root
`.gitignore`) — but Obsidian itself is optional, the markdown is the source of
truth either way.

Follows a raw → notes ingestion pattern: `raw/` holds unprocessed source
dumps, `notes/` holds processed reference knowledge, `ideas/` holds concrete
proposals for what to implement next (one file per idea). Start at
[index.md](index.md), which links everything by category.

Role in the system: this is the **last-resort knowledge source**. Per the
routing rules in the root `CLAUDE.md` (the only `CLAUDE.md` in this system),
only check this wiki once you haven't found the answer in `.claude/` or in the
relevant project folder under `projects/`.
