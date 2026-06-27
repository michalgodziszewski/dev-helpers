# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A collection of Claude Code custom skills that automate common developer workflows — trunk-based development, git operations, publishing, and more. Each skill is a self-contained automation that developers can install and invoke via slash commands.

## Local Context Files

The context/ directory contains personal, ignored workflow state and may not exist in a fresh clone. The feature skill initializes its required local state automatically. Read the following files only when they exist locally:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md
