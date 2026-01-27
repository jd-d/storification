# MCP Tools Reference

> **Last Updated:** January 12, 2026
> **Total Tools:** ~185

---

## MCP Architecture

**MCP Servers** provide tools. **MCP Clients** (like VS Code/Copilot) consume them.

In this setup, **VS Code + GitHub Copilot is the client**, and multiple **servers** provide tools:

### Connected MCP Servers

| Server | Description | Tool Prefix |
| -------- | ------------- | ------------- |
| **VS Code Built-in** | Core file/editor/terminal tools | (no prefix) |
| **GitHub Copilot Built-in** | PR tools, subagent, notebooks | `github-pull-request_*` |
| **Chrome DevTools** | Browser automation & debugging | `mcp_chrome-devtoo_*` |
| **Context7** | Documentation lookup for libraries | `mcp_context7_*` |
| **MCP Docker** | GitHub, Heroku, Brave, PostgreSQL, Browser | `mcp_mcp_docker_*` |

### Architecture Diagram

```bash
┌─────────────────────────────────────────────────────────┐
│  VS Code (MCP Client)                                   │
│  └── GitHub Copilot (AI Assistant)                      │
│       └── Calls tools from connected servers            │
└─────────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│ Chrome DevTools   │  │ Context7          │  │ MCP Docker        │
│ MCP Server        │  │ MCP Server        │  │ MCP Server        │
│ (26 tools)        │  │ (2 tools)         │  │ (~100 tools)      │
└───────────────────┘  └───────────────────┘  └───────────────────┘
```

### Tool Naming Convention

The prefix identifies the source server:

- `mcp_chrome-devtoo_*` → Chrome DevTools server
- `mcp_context7_*` → Context7 server  
- `mcp_mcp_docker_*` → MCP Docker server
- `github-pull-request_*` → Built into Copilot
- No prefix → VS Code's built-in capabilities

---

## MCP Server Configuration Details

### VS Code Built-in

**Type:** Native integration (no external configuration)

Built into VS Code and GitHub Copilot. Provides core IDE functionality through the Copilot agent system.

**Capabilities:**

- File system operations (read, write, search)
- Terminal access
- Editor diagnostics
- Jupyter notebook support
- Extension management

---

### GitHub Copilot Built-in

**Type:** Native integration (no external configuration)

Built into the GitHub Copilot extension. Provides GitHub-specific functionality.

**Capabilities:**

- Pull request management
- Issue rendering
- Sub-agent orchestration
- Notebook summarization

---

### Chrome DevTools MCP Server

**Type:** stdio (npx)

**Source:** [@anthropic-ai/mcp-server-chrome-devtools](https://www.npmjs.com/package/@anthropic-ai/mcp-server-chrome-devtools)

**Configuration:**

```json
{
  "chrome-devtools": {
    "command": "npx",
    "args": ["-y", "@anthropic-ai/mcp-server-chrome-devtools"]
  }
}
```

**Description:**
Connects to Chrome/Chromium browsers via the Chrome DevTools Protocol (CDP). Enables browser automation, debugging, performance analysis, and DOM inspection.

**Requirements:**

- Chrome or Chromium browser
- Browser must be started with remote debugging enabled:

  ```bash
  google-chrome --remote-debugging-port=9222
  ```

**Capabilities:**

- Page navigation and management
- Element interaction (click, fill, hover, drag)
- Screenshot and DOM snapshot capture
- Console message access
- Network request inspection
- Performance tracing
- JavaScript evaluation
- Device emulation

---

### Context7 MCP Server

**Type:** stdio (npx)

**Source:** [@upstash/context7-mcp](https://www.npmjs.com/package/@upstash/context7-mcp)

**Configuration:**

```json
{
  "Context7": {
    "command": "npx",
    "args": ["-y", "@upstash/context7-mcp@latest"]
  }
}
```

**Description:**
Provides up-to-date documentation for libraries and frameworks. Resolves library names to Context7 IDs and fetches relevant documentation.

**Requirements:**

- Node.js and npm
- Internet connection

**Capabilities:**

- Resolve library names to Context7 identifiers
- Fetch current documentation for libraries
- Supports major frameworks (React, Vue, Next.js, etc.)

**Usage Example:**

1. Call `resolve-library-id` with library name (e.g., "react")
2. Call `get-library-docs` with the resolved ID to get documentation

---

### MCP Docker (Multi-Service Container)

**Type:** stdio (Docker container)

**Source:** [mcp/all Docker image](https://hub.docker.com/r/mcp/all) (Official Anthropic multi-MCP image)

**Configuration:**

```json
{
  "mcp_docker": {
    "type": "stdio",
    "command": "docker",
    "args": [
      "run", "-i", "--rm",
      "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
      "-e", "BRAVE_API_KEY",
      "-e", "HEROKU_API_KEY",
      "-e", "DATABASE_URL",
      "mcp/all"
    ]
  }
}
```

**Description:**
A Docker container bundling multiple MCP servers into one. Provides access to GitHub, Brave Search, Heroku, PostgreSQL, and Playwright browser automation.

**Requirements:**

- Docker installed and running
- Environment variables set:

| Variable | Description | Required For |
| ---------- | ------------- | -------------- |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | GitHub PAT with repo access | GitHub tools |
| `BRAVE_API_KEY` | Brave Search API key | Brave search tools |
| `HEROKU_API_KEY` | Heroku API key | Heroku tools |
| `DATABASE_URL` | PostgreSQL connection string | PostgreSQL tools |

**Bundled MCP Servers:**

| Server | Description |
| -------- | ------------- |
| **GitHub** | Repository, PR, issue, and code management |
| **Brave Search** | Web and local search via Brave |
| **Heroku** | App deployment, scaling, and management |
| **PostgreSQL** | Database queries, diagnostics, backups |
| **Playwright** | Browser automation (alternative to Chrome DevTools) |

**Capabilities:**

- Full GitHub API access (repos, PRs, issues, code search)
- Brave web and local search
- Heroku app lifecycle management
- PostgreSQL database administration
- Browser automation via Playwright

---

## Environment Variables Reference

| Variable | Server | How to Obtain |
| ---------- | -------- | --------------- |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | MCP Docker | [GitHub Settings > Developer settings > PAT](https://github.com/settings/tokens) |
| `BRAVE_API_KEY` | MCP Docker | [Brave Search API](https://brave.com/search/api/) |
| `HEROKU_API_KEY` | MCP Docker | [Heroku Dashboard > Account > API Key](https://dashboard.heroku.com/account) |
| `DATABASE_URL` | MCP Docker | Your PostgreSQL connection string |

---

## Base Tools (Always Available)

### File System Tools

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `create_directory` | Create a new directory | VS Code Built-in |
| `create_file` | Create a new file with content | VS Code Built-in |
| `list_dir` | List directory contents | VS Code Built-in |
| `read_file` | Read file contents | VS Code Built-in |
| `replace_string_in_file` | Replace text in a file | VS Code Built-in |
| `multi_replace_string_in_file` | Multiple replacements in a file | VS Code Built-in |
| `file_search` | Search for files by name | VS Code Built-in |
| `grep_search` | Search file contents with regex | VS Code Built-in |
| `semantic_search` | AI-powered code search | VS Code Built-in |

### Editor Tools

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `get_errors` | Get diagnostics/errors from editor | VS Code Built-in |
| `get_changed_files` | Get list of modified files | VS Code Built-in |
| `list_code_usages` | Find references to a symbol | VS Code Built-in |
| `get_vscode_api` | Access VS Code API documentation | VS Code Built-in |
| `run_vscode_command` | Execute a VS Code command | VS Code Built-in |

### Terminal Tools

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `run_in_terminal` | Run a command in terminal | VS Code Built-in |
| `get_terminal_output` | Get output from terminal | VS Code Built-in |
| `terminal_last_command` | Get last executed command | VS Code Built-in |
| `terminal_selection` | Get selected text in terminal | VS Code Built-in |
| `create_and_run_task` | Create and run a VS Code task | VS Code Built-in |

### Notebook Tools

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `create_new_jupyter_notebook` | Create a new Jupyter notebook | VS Code Built-in |
| `edit_notebook_file` | Edit notebook cells | VS Code Built-in |
| `run_notebook_cell` | Execute a notebook cell | VS Code Built-in |
| `read_notebook_cell_output` | Get output from notebook cell | VS Code Built-in |
| `copilot_getNotebookSummary` | Get summary of notebook | GitHub Copilot Built-in |

### Workspace Tools

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `create_new_workspace` | Create a new VS Code workspace | VS Code Built-in |
| `get_project_setup_info` | Get project configuration info | VS Code Built-in |
| `get_search_view_results` | Get results from search view | VS Code Built-in |
| `install_extension` | Install a VS Code extension | VS Code Built-in |
| `vscode_searchExtensions_internal` | Search for extensions | VS Code Built-in |
| `manage_todo_list` | Manage TODO items | VS Code Built-in |

### Web Tools

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `fetch_webpage` | Fetch content from a URL | VS Code Built-in |
| `open_simple_browser` | Open URL in simple browser | VS Code Built-in |

### GitHub PR Tools

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `github_repo` | Get repository information | VS Code Built-in |
| `github-pull-request_copilot-coding-agent` | Invoke Copilot coding agent | GitHub Copilot Built-in |
| `github-pull-request_renderIssues` | Render GitHub issues | GitHub Copilot Built-in |

### Python Tools

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `activate_python_environment_tools` | Activate Python env tools | VS Code Built-in |
| `configure_python_environment` | Configure Python environment | VS Code Built-in |
| `install_python_packages` | Install Python packages | VS Code Built-in |

### Agent Tools

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `runSubagent` | Run a sub-agent for complex tasks | GitHub Copilot Built-in |
| `test_failure` | Analyze test failures | VS Code Built-in |

### Context7 MCP Tools

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `mcp_context7_resolve-library-id` | Resolve library to Context7 ID | Context7 |
| `mcp_context7_get-library-docs` | Get documentation for a library | Context7 |

### Chrome DevTools MCP Tools (Base)

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `mcp_chrome-devtoo_list_pages` | List open browser pages | Chrome DevTools |
| `mcp_chrome-devtoo_list_network_requests` | List network requests | Chrome DevTools |

### MCP Docker Tools (Base)

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `mcp_mcp_docker_browser_console_messages` | Get browser console messages | MCP Docker |
| `mcp_mcp_docker_browser_network_requests` | Get browser network requests | MCP Docker |
| `mcp_mcp_docker_list_commits` | List commits in repository | MCP Docker |
| `mcp_mcp_docker_search_code` | Search code in repositories | MCP Docker |
| `mcp_mcp_docker_update_pull_request_branch` | Update PR branch | MCP Docker |
| `mcp_mcp_docker_pipelines_promote` | Promote Heroku pipelines | MCP Docker |
| `mcp_mcp_docker_mcp-config-set` | Set MCP configuration | MCP Docker |
| `mcp_mcp_docker_mcp-find` | Find MCP servers | MCP Docker |
| `mcp_mcp_docker_mcp-add` | Add MCP server | MCP Docker |
| `mcp_mcp_docker_pg_locks` | View PostgreSQL locks | MCP Docker |
| `mcp_mcp_docker_pg_outliers` | View PostgreSQL outliers | MCP Docker |
| `mcp_mcp_docker_pg_ps` | View PostgreSQL processes | MCP Docker |

---

## Activation Tools

These tools unlock additional tool categories:

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `activate_browser_navigation_tools` | Unlock browser navigation | VS Code Built-in |
| `activate_element_interaction_tools` | Unlock element interaction | VS Code Built-in |
| `activate_form_interaction_tools` | Unlock form interaction | VS Code Built-in |
| `activate_console_logging_tools` | Unlock console logging | VS Code Built-in |
| `activate_performance_analysis_tools` | Unlock performance analysis | VS Code Built-in |
| `activate_snapshot_capture_tools` | Unlock snapshot capture | VS Code Built-in |
| `activate_pull_request_review_tools` | Unlock PR review tools | VS Code Built-in |
| `activate_github_repository_management_tools` | Unlock GitHub repo management | VS Code Built-in |
| `activate_brave_search_tools` | Unlock Brave search | VS Code Built-in |
| `activate_browser_interaction_tools` | Unlock browser interaction | VS Code Built-in |
| `activate_mcp_server_management_tools` | Unlock MCP server management | VS Code Built-in |
| `activate_app_management_tools` | Unlock Heroku app management | VS Code Built-in |
| `activate_github_file_operations_tools` | Unlock GitHub file operations | VS Code Built-in |
| `activate_heroku_deployment_tools` | Unlock Heroku deployment | VS Code Built-in |
| `activate_team_management_tools` | Unlock Heroku team management | VS Code Built-in |
| `activate_maintenance_management_tools` | Unlock Heroku maintenance | VS Code Built-in |
| `activate_postgresql_management_tools` | Unlock PostgreSQL management | VS Code Built-in |

---

## Activated Tools (Unlocked via Activation)

### Browser Navigation Tools (via `activate_browser_navigation_tools`)

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `mcp_chrome-devtoo_navigate_page` | Navigate to URL | Chrome DevTools |
| `mcp_chrome-devtoo_new_page` | Open new page | Chrome DevTools |
| `mcp_chrome-devtoo_close_page` | Close page | Chrome DevTools |
| `mcp_chrome-devtoo_select_page` | Select/switch page | Chrome DevTools |
| `mcp_chrome-devtoo_resize_page` | Resize browser window | Chrome DevTools |
| `mcp_mcp_docker_browser_navigate` | Navigate browser | MCP Docker |
| `mcp_mcp_docker_browser_screenshot` | Take screenshot | MCP Docker |

### Element Interaction Tools (via `activate_element_interaction_tools`)

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `mcp_chrome-devtoo_click` | Click element | Chrome DevTools |
| `mcp_chrome-devtoo_hover` | Hover over element | Chrome DevTools |
| `mcp_chrome-devtoo_drag` | Drag element | Chrome DevTools |
| `mcp_chrome-devtoo_wait_for` | Wait for element | Chrome DevTools |
| `mcp_mcp_docker_browser_click` | Click element | MCP Docker |
| `mcp_mcp_docker_browser_type` | Type text | MCP Docker |
| `mcp_mcp_docker_browser_select_option` | Select dropdown option | MCP Docker |

### Form Interaction Tools (via `activate_form_interaction_tools`)

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `mcp_chrome-devtoo_fill` | Fill input field | Chrome DevTools |
| `mcp_chrome-devtoo_fill_form` | Fill entire form | Chrome DevTools |
| `mcp_chrome-devtoo_upload_file` | Upload file | Chrome DevTools |
| `mcp_chrome-devtoo_press_key` | Press keyboard key | Chrome DevTools |
| `mcp_chrome-devtoo_handle_dialog` | Handle alert/dialog | Chrome DevTools |

### Console Logging Tools (via `activate_console_logging_tools`)

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `mcp_chrome-devtoo_list_console_messages` | List console messages | Chrome DevTools |
| `mcp_chrome-devtoo_get_console_message` | Get specific console message | Chrome DevTools |
| `mcp_chrome-devtoo_evaluate_script` | Evaluate JavaScript | Chrome DevTools |

### Performance Analysis Tools (via `activate_performance_analysis_tools`)

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `mcp_chrome-devtoo_performance_start_trace` | Start performance trace | Chrome DevTools |
| `mcp_chrome-devtoo_performance_stop_trace` | Stop performance trace | Chrome DevTools |
| `mcp_chrome-devtoo_performance_analyze_insight` | Analyze performance | Chrome DevTools |

### Snapshot Capture Tools (via `activate_snapshot_capture_tools`)

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `mcp_chrome-devtoo_take_screenshot` | Take screenshot | Chrome DevTools |
| `mcp_chrome-devtoo_take_snapshot` | Take DOM snapshot | Chrome DevTools |
| `mcp_chrome-devtoo_emulate` | Emulate device | Chrome DevTools |

### Network Tools (via `activate_browser_navigation_tools`)

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `mcp_chrome-devtoo_get_network_request` | Get network request details | Chrome DevTools |

### Pull Request Review Tools (via `activate_pull_request_review_tools`)

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `mcp_mcp_docker_get_pull_request` | Get PR details | MCP Docker |
| `mcp_mcp_docker_get_pull_request_diff` | Get PR diff | MCP Docker |
| `mcp_mcp_docker_get_pull_request_files` | Get PR files | MCP Docker |
| `mcp_mcp_docker_create_pull_request_review` | Create PR review | MCP Docker |
| `mcp_mcp_docker_create_pull_request` | Create new PR | MCP Docker |
| `mcp_mcp_docker_list_pull_requests` | List PRs | MCP Docker |
| `mcp_mcp_docker_merge_pull_request` | Merge PR | MCP Docker |

### GitHub Repository Management Tools (via `activate_github_repository_management_tools`)

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `mcp_mcp_docker_get_me` | Get authenticated user | MCP Docker |
| `mcp_mcp_docker_get_issue` | Get issue details | MCP Docker |
| `mcp_mcp_docker_create_issue` | Create new issue | MCP Docker |
| `mcp_mcp_docker_list_issues` | List issues | MCP Docker |
| `mcp_mcp_docker_search_issues` | Search issues | MCP Docker |
| `mcp_mcp_docker_get_file_contents` | Get file from repo | MCP Docker |
| `mcp_mcp_docker_create_or_update_file` | Create/update file | MCP Docker |
| `mcp_mcp_docker_push_files` | Push multiple files | MCP Docker |
| `mcp_mcp_docker_create_repository` | Create new repo | MCP Docker |
| `mcp_mcp_docker_fork_repository` | Fork repository | MCP Docker |
| `mcp_mcp_docker_create_branch` | Create branch | MCP Docker |
| `mcp_mcp_docker_get_commit` | Get commit details | MCP Docker |

### GitHub File Operations Tools (via `activate_github_file_operations_tools`)

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `mcp_mcp_docker_create_or_update_file` | Create or update file | MCP Docker |
| `mcp_mcp_docker_push_files` | Push multiple files | MCP Docker |
| `mcp_mcp_docker_get_file_contents` | Get file contents | MCP Docker |

### Brave Search Tools (via `activate_brave_search_tools`)

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `mcp_mcp_docker_brave_web_search` | Web search via Brave | MCP Docker |
| `mcp_mcp_docker_brave_local_search` | Local search via Brave | MCP Docker |

### Heroku App Management Tools (via `activate_app_management_tools`)

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `mcp_mcp_docker_list_apps` | List Heroku apps | MCP Docker |
| `mcp_mcp_docker_get_app` | Get app details | MCP Docker |
| `mcp_mcp_docker_create_app` | Create new app | MCP Docker |
| `mcp_mcp_docker_delete_app` | Delete app | MCP Docker |
| `mcp_mcp_docker_rename_app` | Rename app | MCP Docker |
| `mcp_mcp_docker_get_app_logs` | Get app logs | MCP Docker |
| `mcp_mcp_docker_restart_app` | Restart app | MCP Docker |
| `mcp_mcp_docker_scale_app` | Scale dynos | MCP Docker |
| `mcp_mcp_docker_get_config_vars` | Get config vars | MCP Docker |
| `mcp_mcp_docker_set_config_vars` | Set config vars | MCP Docker |

### Heroku Deployment Tools (via `activate_heroku_deployment_tools`)

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `mcp_mcp_docker_list_releases` | List releases | MCP Docker |
| `mcp_mcp_docker_get_release` | Get release details | MCP Docker |
| `mcp_mcp_docker_rollback` | Rollback to previous | MCP Docker |
| `mcp_mcp_docker_list_builds` | List builds | MCP Docker |
| `mcp_mcp_docker_create_build` | Create build | MCP Docker |
| `mcp_mcp_docker_get_build` | Get build details | MCP Docker |
| `mcp_mcp_docker_list_pipelines` | List pipelines | MCP Docker |
| `mcp_mcp_docker_get_pipeline` | Get pipeline details | MCP Docker |
| `mcp_mcp_docker_list_pipeline_apps` | List pipeline apps | MCP Docker |

### Heroku Team Management Tools (via `activate_team_management_tools`)

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `mcp_mcp_docker_list_teams` | List teams | MCP Docker |
| `mcp_mcp_docker_list_team_members` | List team members | MCP Docker |
| `mcp_mcp_docker_list_team_apps` | List team apps | MCP Docker |
| `mcp_mcp_docker_add_collaborator` | Add app collaborator | MCP Docker |
| `mcp_mcp_docker_remove_collaborator` | Remove collaborator | MCP Docker |

### Heroku Maintenance Tools (via `activate_maintenance_management_tools`)

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `mcp_mcp_docker_get_maintenance` | Get maintenance status | MCP Docker |
| `mcp_mcp_docker_set_maintenance` | Set maintenance mode | MCP Docker |
| `mcp_mcp_docker_list_addons` | List add-ons | MCP Docker |
| `mcp_mcp_docker_get_addon` | Get add-on details | MCP Docker |
| `mcp_mcp_docker_create_addon` | Create add-on | MCP Docker |
| `mcp_mcp_docker_delete_addon` | Delete add-on | MCP Docker |

### PostgreSQL Management Tools (via `activate_postgresql_management_tools`)

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `mcp_mcp_docker_pg_info` | Get database info | MCP Docker |
| `mcp_mcp_docker_pg_ps` | View active queries | MCP Docker |
| `mcp_mcp_docker_pg_locks` | View locks | MCP Docker |
| `mcp_mcp_docker_pg_outliers` | View slow queries | MCP Docker |
| `mcp_mcp_docker_pg_blocking` | View blocking queries | MCP Docker |
| `mcp_mcp_docker_pg_diagnose` | Diagnose database | MCP Docker |
| `mcp_mcp_docker_pg_kill` | Kill query | MCP Docker |
| `mcp_mcp_docker_pg_maintenance` | Run maintenance | MCP Docker |
| `mcp_mcp_docker_pg_credentials` | Get credentials | MCP Docker |
| `mcp_mcp_docker_pg_backups` | List backups | MCP Docker |
| `mcp_mcp_docker_pg_backups_capture` | Create backup | MCP Docker |
| `mcp_mcp_docker_pg_backups_restore` | Restore backup | MCP Docker |
| `mcp_mcp_docker_run_sql_query` | Run SQL query | MCP Docker |

### MCP Server Management Tools (via `activate_mcp_server_management_tools`)

| Tool | Description | MCP Server |
| ------ | ------------- | ------------ |
| `mcp_mcp_docker_mcp-find` | Find MCP servers | MCP Docker |
| `mcp_mcp_docker_mcp-add` | Add MCP server | MCP Docker |
| `mcp_mcp_docker_mcp-config-set` | Set MCP config | MCP Docker |
| `mcp_mcp_docker_mcp-list` | List MCP servers | MCP Docker |
| `mcp_mcp_docker_mcp-remove` | Remove MCP server | MCP Docker |

---

## Summary by MCP Server

| MCP Server | Base Tools | Activated Tools | Total |
| ------------ | ------------ | ----------------- | ------- |
| VS Code Built-in | ~35 | 0 | ~35 |
| GitHub Copilot Built-in | ~5 | 0 | ~5 |
| Chrome DevTools | 2 | ~24 | ~26 |
| Context7 | 2 | 0 | 2 |
| MCP Docker | 12 | ~105 | ~117 |
| **Total** | **~56** | **~129** | **~185** |

---

## Troubleshooting

### Chrome DevTools Not Connecting

1. Start Chrome with remote debugging:

   ```bash
   google-chrome --remote-debugging-port=9222
   ```

2. Verify connection:

   ```bash
   curl http://localhost:9222/json
   ```

### MCP Docker Not Starting

1. Ensure Docker is running:

   ```bash
   docker ps
   ```

2. Check environment variables are set:

   ```bash
   echo $GITHUB_PERSONAL_ACCESS_TOKEN
   echo $BRAVE_API_KEY
   ```

3. Pull latest image:

   ```bash
   docker pull mcp/all
   ```

### Context7 Not Resolving Libraries

1. Check npm/npx is available:

   ```bash
   npx --version
   ```

2. Clear npx cache:

   ```bash
   npx clear-npx-cache
   ```

---

## How to Create This Document

> **For AI Agents:** This section provides instructions for recreating or updating this document.

### Step 1: Identify Available Tools

Start by examining your tool definitions. Count and categorize all tools visible to you. Note:

- Tools with no prefix → VS Code Built-in
- Tools prefixed `mcp_*` → External MCP servers (prefix identifies server)
- Tools prefixed `github-pull-request_*` → GitHub Copilot Built-in

### Step 2: Discover Hidden Tools via Activation

Many tools are gated behind `activate_*` tools. Call each activation tool to unlock additional capabilities:

```bash
activate_browser_navigation_tools
activate_element_interaction_tools
activate_form_interaction_tools
activate_console_logging_tools
activate_performance_analysis_tools
activate_snapshot_capture_tools
activate_pull_request_review_tools
activate_github_repository_management_tools
activate_brave_search_tools
activate_browser_interaction_tools
activate_mcp_server_management_tools
activate_app_management_tools
activate_github_file_operations_tools
activate_heroku_deployment_tools
activate_team_management_tools
activate_maintenance_management_tools
activate_postgresql_management_tools
```

After each activation, re-examine your tool definitions to document newly available tools.

### Step 3: Locate MCP Configuration Files

Search these locations for MCP server configurations:

| Location | Command/Method |
| ---------- | ---------------- |
| Workspace config | `read_file .vscode/mcp.json` |
| User VS Code settings | `read_file ~/.config/Code/User/settings.json` |
| Search workspace | `grep_search "mcp"` in settings files |

Look for JSON structures containing `"command"`, `"args"`, and environment variable references.

### Step 4: Extract Server Details from Config

From the config files, document:

- **Server name** (JSON key)
- **Command type** (`npx`, `docker`, `node`, etc.)
- **Package/image name** (from args)
- **Required environment variables** (from `-e` flags or `env` blocks)

### Step 5: Research External Documentation

For each MCP server package found, fetch documentation:

```bash
# For npm packages
fetch_webpage https://www.npmjs.com/package/{package-name}

# For Docker images  
fetch_webpage https://hub.docker.com/r/{image-name}

# Use Context7 for library docs
mcp_context7_resolve-library-id → mcp_context7_get-library-docs
```

### Step 6: Verify Tool-to-Server Mapping

The tool prefix reveals its source server:

- `mcp_chrome-devtoo_*` → Chrome DevTools MCP Server
- `mcp_context7_*` → Context7 MCP Server
- `mcp_mcp_docker_*` → MCP Docker (multi-service container)

### Tips for Faster Discovery

1. **User settings path varies by OS:**
   - Linux: `~/.config/Code/User/settings.json`
   - macOS: `~/Library/Application Support/Code/User/settings.json`
   - Windows: `%APPDATA%\Code\User\settings.json`

2. **VS Code command to list MCP servers:** `run_vscode_command` with `getMcpServers` (may return empty - config files are more reliable)

3. **Environment variables** are often passed to Docker containers via `-e VAR_NAME` (value pulled from host environment)

4. **The `mcp/all` Docker image** bundles multiple MCP servers (GitHub, Brave, Heroku, PostgreSQL, Playwright) - document each sub-service separately

5. **Tool counts are approximate** - activation may reveal different numbers depending on MCP server versions

### Maintenance

- Update `Last Updated` date when modifying
- Re-run activation tools periodically to catch new tools
- Check npm/Docker for MCP server updates
