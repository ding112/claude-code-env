# Spike Conventions

Patterns and stack choices established across spike sessions.

## Stack

- **TypeScript** via ts-node (project's existing stack)
- No external dependencies beyond project's existing packages
- Use `npx ts-node` to run spike files

## Structure

- Spike directories: `.planning/spikes/NNN-descriptive-name/`
- Each spike has: `spike.ts` (runnable prototype) + `README.md` (documentation)
- Spike logic is self-contained (imports only from project types)

## Patterns

- Template data model: `Record<string, SourceTemplate>` with pure transformation functions
- Template application: `createProviderFromTemplate(source, overrides) → FormDefaults`
- Templates only provide defaults; user overrides take priority via `||` operator
- Validation is separate from template logic

## Tools & Libraries

- **ts-node** for running TypeScript spike files
- **inquirer** (already in project) for interactive CLI demos
