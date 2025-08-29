# Notes

:::info
[Course Notes](https://stevekinney.com/courses/ai-development)
:::

## Cursor

1. Cursor reads only first 250 lines of a file, or 100 lines of searched content. SO keep your files short.
2. Has feature to create notes. Notes can reference tools, files, mcps, etc.
3. @.cursor/rules: Create rules here you want to auto append to the cursor context. Here you can specify different strategies:

```
---
descriptions:
globs:
alwaysApply:
---
```

:::info
Good [Repo](https://github.com/PatrickJS/awesome-cursorrules) that has an awesome collection of rules.
Also See [Cursor/rules](https://cursor.directory/rules)
:::

4. Rules tip: Add emojis or some easy to spot text at the bottom and make cursor print it in chat, so that you see the rules were read and applied.

## Agents and MCPs

1. [Cursor agent](https://cursor.com/agents) and [GPT Codex](https://chatgpt.com/codex) allow you to chat with and update any repo from anywhere. Useful for Auditing, Understanding, Checking issues and PRs, etc. It can make changes and submit PRs for your review.

Example use: Audit my repo for accessibility compliance and tell me about it in detail.

2. MCP (Model Context Protocols): are an open standard that enable AI applications to connect with external APIs and tools. They are a mechanism to extend the core extensibility and are Plug-n-Play in nature.

![MCP Structure](/img/MCP.png)

3. Limitations:

- Tool limit: 40 Installed tools context window limitation.
- Context Window Overhead: Each active MCP connection and it's tool descriptions consume tokens in the LLM context window.
- Costs: May incur additional costs depending on models and usage, especially with Max Mode.

:::info
See [Cursor/mcp](https://cursor.directory/mcp)
:::

## Claude Code

1. Use `/init` to create Claude.md file. You can use `# text` to add some text to this file. This is basically your cursor rule equivalent to claude.

![Claude.md](/img/ClaudeMd.png)

This contains your coding standards, style guidelines, Architectural overview, comman commands and project workflows, AI behavorial rules (Error handling, API convention, Problem solving rules), and architectural decision records (Important decisions and their rationale). You need to doctor this file and maintain it.
