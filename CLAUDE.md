# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies and start development
bun install
bun dev

# Run against specific directory
bun dev <directory>

# Run against the repo itself
bun dev .

# Type checking
bun turbo typecheck

# Build standalone executable ("localcode")
./packages/opencode/script/build.ts --single

# Run the headless API server (port 4096)
bun dev serve

# Run web app (requires server running)
bun run --cwd packages/app dev

# Run desktop app
bun run --cwd packages/desktop tauri dev

# Run tests
bun test  # from packages/opencode

# E2E tests
bun run --cwd packages/app test:e2e:local

# Regenerate SDK after API changes
./script/generate.ts
```

## Architecture Overview

OpenCode is a client/server AI coding agent with a TUI frontend. The core architecture consists of:

### Core Components

- **`packages/opencode/`** - Main OpenCode CLI and server
  - `src/cli/` - CLI commands (run, serve, auth, agent, etc.)
  - `src/server/` - HTTP/WebSocket server using Hono
  - `src/agent/` - Agent system with permission-based tool access
  - `src/session/` - LLM conversation management and message processing
  - `src/tool/` - Tool implementations (bash, edit, read, write, grep, glob, etc.)
  - `src/provider/` - LLM provider integrations (Anthropic, OpenAI, etc.)
  - `src/lsp/` - Language Server Protocol support
  - `src/mcp/` - Model Context Protocol server support
  - `src/plugin/` - Plugin system for extending functionality

- **`packages/app/`** - Shared web UI components (SolidJS)
  - Used by both the web interface and desktop app
  - E2E tests with Playwright

- **`packages/desktop/`** - Native desktop app (Tauri)
  - Wraps the web UI in a native shell

- **`packages/console/`** - Backend console services
  - Core, app, function, mail, resource packages

### Key Patterns

1. **Agent System**: Agents are configured with permission rulesets that control tool access. The default branch is `dev`, not `main`.

2. **Tool Registry**: Tools are defined in `src/tool/` and registered in `registry.ts`. Custom tools can be added via plugins or local `{tool,tools}/*.{js,ts}` files.

3. **Server Routes**: API routes are organized under `src/server/routes/` (tui, project, session, pty, mcp, file, config, experimental, provider, question, permission, global).

4. **TUI**: The terminal UI is built with SolidJS and opentui, located in `src/cli/cmd/tui/`.

5. **Monorepo**: Uses Bun workspaces with shared dependencies defined in root `package.json` catalog.

## Code Style Preferences

From `AGENTS.md` and `CONTRIBUTING.md`:

- Keep logic within single functions unless breaking out adds reuse/composition benefits
- Avoid unnecessary destructuring - use `obj.a` instead of `const { a } = obj`
- Avoid `try`/`catch` where possible; prefer `.catch(...)`
- Avoid the `any` type - use precise types
- Prefer single-word variable names where descriptive
- Use Bun APIs when possible (e.g., `Bun.file()`)
- Rely on type inference; avoid explicit type annotations unless necessary
- **Avoid `let` statements** - prefer `const` with ternary operators
- **Avoid `else` statements** - use early returns or IIFEs

Example (good):
```ts
const foo = condition ? 1 : 2
```

Example (bad):
```ts
let foo
if (condition) foo = 1
else foo = 2
```

## Testing Guidelines

- Must avoid using mocks as much as possible
- Tests must test actual implementation, do not duplicate logic into tests

## Contribution Requirements

- All PRs must reference an existing issue
- UI changes require screenshots/videos showing before/after
- Logic changes require explanation of how it was verified
- PR titles follow conventional commit standards: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`
- Optional scope: `feat(app):`, `fix(desktop):`, `chore(opencode):`
- Keep PRs small and focused
- No AI-generated walls of text for PR descriptions
