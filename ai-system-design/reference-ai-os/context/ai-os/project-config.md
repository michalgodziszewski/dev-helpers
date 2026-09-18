**Ticket System:** none
**Backport:** disabled
**Remote:** github

<!--
Remote: github | local — read only from this explicit field, never inferred from the
`origin` URL. Absent or `github` means `ai-os`'s `origin` is a networked GitHub remote
(the default: identical git behavior and GitHub-PR guidance to always). `local` means
`origin` is a local bare git repo on the filesystem — every git command runs byte-for-byte
identically with no network, and the GitHub-PR reminders in publish/backport become manual
local-merge reminders. See context/ai-os/local-mode-setup.md for how to stand local mode up.
-->
