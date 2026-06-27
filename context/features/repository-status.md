# Repository Status

## Git Workflow

- **Workflow:** branch
- **Work Type:** feature
- **Base Branch:** main

## Description

Create a small read-only PowerShell automation that summarizes the current Git repository status.

## Goals

- Add scripts/repository-status.ps1.
- Display the current local branch.
- Display the configured upstream branch when available.
- Show whether the working tree is clean or contains changes.
- Show whether the local branch is ahead of or behind its upstream.
- Return a clear message when the current directory is not a Git repository.

## Constraints

- Do not modify files, branches, commits, remotes, or the Git index.
- Do not run fetch, pull, push, reset, checkout, switch, clean, or stash.
- Use standard Git and PowerShell commands without additional dependencies.

## Acceptance Criteria

- The script works from a Git repository on Windows PowerShell.
- The output is concise and readable.
- The script exits with a non-zero status outside a Git repository.
- Running the script does not change git status.
