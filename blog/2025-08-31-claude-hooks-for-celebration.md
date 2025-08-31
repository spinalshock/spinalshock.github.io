---
slug: claude-hooks-and-raycast-confettis
title: Celebrating AI file generation with visual feedback
authors: [om]
tags: [tech]
---

# Implementing Claude Code Hooks for Visual Feedback with Raycast Confetti

_Published: January 29, 2025_

Ever wanted instant visual celebration when your AI assistant completes a task? Today I'll walk you through implementing Claude Code hooks to trigger Raycast confetti whenever markdown files are written to specific directories - perfect for celebrating successful YouTube video summarizations!

## The Problem: Silent Success

When using Claude Code for batch operations like summarizing YouTube videos, the process can take several minutes. Without visual feedback, it's hard to know when the task completes, especially when working across multiple applications or windows.

**What I wanted:**

- Instant notification when summary files are created
- System-wide visibility (works regardless of active window)
- Celebratory feedback for successful workflows

## The Solution: Claude Code Hooks + Raycast

Claude Code provides a powerful hooks system that can execute shell commands in response to tool usage events. Combined with Raycast's confetti extension, we can create delightful visual feedback.

## Implementation Journey

### Step 1: Understanding Claude Code Hooks

Claude Code hooks are configured in `~/.claude/settings.json` and support several event types:

- `PreToolUse` - Before tool execution
- `PostToolUse` - After tool completion
- `UserPromptSubmit` - When user submits a prompt
- `SessionStart/End` - Session lifecycle events

For our use case, `PostToolUse` is perfect since we want to celebrate after successful file creation.

### Step 2: Basic Hook Configuration

The initial configuration was straightforward:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "open \"raycast://extensions/raycast/raycast/confetti\""
          }
        ]
      }
    ]
  }
}
```

This triggers confetti on ANY Write operation - great for testing, but too noisy for production use.

### Step 3: The Debugging Challenge

Adding path filtering proved more complex than expected. Initial attempts using environment variables failed:

```bash
# This didn't work - no such environment variable
echo '$HOOK_INPUT' | jq -r '.tool_input.file_path'
```

**The breakthrough:** Hook data comes through **stdin**, not environment variables!

### Step 4: Discovering the Data Structure

By capturing stdin data, I discovered the exact JSON structure:

```json
{
  "session_id": "44d2a57c-ea8a-402d-b298-cd3f2041d713",
  "transcript_path": "/Users/omathalye/.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/omathalye/fun/mcp-servers/youtube-transcript",
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/Users/omathalye/fun/second-brain/docs/miscellaneous/test.md",
    "content": "..."
  },
  "tool_response": {
    "type": "create",
    "filePath": "/Users/omathalye/fun/second-brain/docs/miscellaneous/test.md",
    "content": "...",
    "structuredPatch": []
  }
}
```

The key insight: `tool_input.file_path` contains the target file path!

### Step 5: Perfect Path Filtering

With the correct data structure, the final hook became elegant:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "case \"$(jq -r '.tool_input.file_path' 2>/dev/null)\" in *second-brain/docs/*.md) open \"raycast://extensions/raycast/raycast/confetti\" ;; esac"
          }
        ]
      }
    ]
  }
}
```

This command:

1. Reads JSON from stdin
2. Extracts the file path using `jq`
3. Uses shell pattern matching to check if it matches `*second-brain/docs/*.md`
4. Triggers Raycast confetti only for matching files

## Key Technical Insights

### Hook Data Flow

- **Input**: JSON via stdin (not environment variables)
- **Processing**: Shell commands can process this JSON
- **Output**: Commands run asynchronously, don't block Claude Code

### Error Handling

The `2>/dev/null` ensures jq parsing errors don't break the hook. The `case` statement gracefully handles any parsing failures.

### Pattern Matching Strategy

Using shell glob patterns (`*second-brain/docs/*.md`) is more reliable than regex for path matching in this context.

## Real-World Impact

This setup now provides:

✅ **Instant feedback** when YouTube summaries complete  
✅ **System-wide visibility** - works regardless of active application  
✅ **Selective triggering** - only for relevant content files  
✅ **Reliable operation** - graceful error handling  
✅ **Delightful UX** - celebratory confetti animation

## Use Cases Beyond YouTube Summaries

This pattern works for any file-based workflows:

- **Documentation generation** - Celebrate when docs are updated
- **Code generation** - Visual feedback for AI-generated code files
- **Report creation** - Notification when analysis reports complete
- **Content publishing** - Celebrate when blog posts are written

## Configuration Tips

### Multiple Path Patterns

You can match multiple directories by extending the pattern:

```bash
case "$(jq -r '.tool_input.file_path')" in
  *second-brain/docs/*.md|*projects/*/README.md)
    open "raycast://extensions/raycast/raycast/confetti"
    ;;
esac
```

### Different Tools

Hooks can match different tools beyond `Write`:

```json
{
  "matcher": "Edit",
  "hooks": [...]
}
```

### Custom Notifications

Replace Raycast confetti with any notification system:

```bash
# macOS notification
osascript -e 'display notification "File created!" with title "Claude Code"' # Doesn't work anymore
terminal-notifier -message "File created!" -title "Claude Code" -activate com.googlecode.iterm2 # brew install terminal-notifier

# Custom sound
afplay /System/Library/Sounds/Glass.aiff
```

---

## Advanced Power User Applications

While celebratory notifications are fun, Claude Code hooks unlock far more sophisticated automation possibilities for power users:

### Automated Deployment Pipelines

```bash
# Auto-deploy when documentation is updated
case "$(jq -r '.tool_input.file_path')" in
  */docs/*.md)
    cd "$(jq -r '.cwd')" && git add . && git commit -m "Update docs" && git push
    ;;
esac
```

### Intelligent File Organization

```bash
# Auto-categorize and move files based on content analysis
content="$(jq -r '.tool_input.content')"
if echo "$content" | grep -q "TODO\|FIXME"; then
    # Move to pending review folder
    mv "$(jq -r '.tool_input.file_path')" ./pending-review/
fi
```

### Integration with External Systems

```bash
# Sync with external tools and databases
case "$(jq -r '.tool_name')" in
  "Write")
    # Update project tracking system
    curl -X POST "https://api.notion.so/v1/pages" \
      -H "Authorization: Bearer $NOTION_TOKEN" \
      -d @payload.json
    ;;
  "Bash")
    # Log command execution to monitoring system
    echo "$(jq -r '.tool_input.command')" | logger -t claude-code
    ;;
esac
```

### Quality Assurance Automation

```bash
# Auto-run linting and validation
if [[ "$(jq -r '.tool_input.file_path')" == *.js ]]; then
    eslint "$(jq -r '.tool_input.file_path')" --fix
elif [[ "$(jq -r '.tool_input.file_path')" == *.md ]]; then
    markdownlint "$(jq -r '.tool_input.file_path')" --fix
fi
```

### Security and Compliance

```bash
# Scan for secrets or sensitive data
if grep -q "password\|api_key\|token" "$(jq -r '.tool_input.file_path')"; then
    # Alert security team
    slack-notify "#security" "Potential secrets detected in $(jq -r '.tool_input.file_path')"
    # Remove from git history if committed
    git filter-branch --force --index-filter "git rm --cached --ignore-unmatch $(jq -r '.tool_input.file_path')"
fi
```

### Workflow Orchestration

```bash
# Trigger complex workflows based on file types and content
file_path="$(jq -r '.tool_input.file_path')"
case "$file_path" in
  */requirements.txt)
    # Auto-update virtual environment
    pip install -r "$file_path"
    ;;
  */Dockerfile)
    # Auto-build container image
    docker build -t "$(basename $(dirname $file_path))" "$(dirname $file_path)"
    ;;
  */.github/workflows/*.yml)
    # Validate GitHub Actions syntax
    act --dry-run
    ;;
esac
```

### Advanced Monitoring and Analytics

```bash
# Track AI assistant productivity metrics
{
  echo "timestamp: $(date -Iseconds)"
  echo "tool: $(jq -r '.tool_name')"
  echo "session: $(jq -r '.session_id')"
  echo "file_type: $(jq -r '.tool_input.file_path' | sed 's/.*\.//')"
  echo "content_length: $(jq -r '.tool_input.content | length')"
} >> ~/.claude/productivity_metrics.log

# Weekly report generation
if [[ $(date +%w) == 0 ]]; then  # Sunday
    generate_weekly_report.py ~/.claude/productivity_metrics.log
fi
```

### Context-Aware Development Environment

```bash
# Auto-configure development environment based on project type
cwd="$(jq -r '.cwd')"
if [[ -f "$cwd/package.json" ]]; then
    # Node.js project detected
    nvm use
    npm install
elif [[ -f "$cwd/requirements.txt" ]]; then
    # Python project detected
    pyenv local $(cat .python-version 2>/dev/null || echo "3.11")
    pip install -r requirements.txt
elif [[ -f "$cwd/Cargo.toml" ]]; then
    # Rust project detected
    rustup update
    cargo check
fi
```

These advanced use cases transform Claude Code hooks from simple notifications into a comprehensive automation framework that can integrate AI assistance seamlessly into existing development workflows, CI/CD pipelines, and productivity systems.

## Troubleshooting Common Issues

### Hook Not Triggering

1. **Restart Claude Code** after configuration changes
2. **Check JSON syntax** in settings.json
3. **Test with simplified command** (remove path filtering initially)

### Path Matching Issues

1. **Capture actual paths** with debugging commands
2. **Use absolute paths** in patterns when needed
3. **Test patterns** in terminal before using in hooks

### JSON Parsing Errors

1. **Add error handling** with `2>/dev/null`
2. **Validate jq syntax** separately
3. **Use fallback values** with `|| echo ''`

## Conclusion

Claude Code hooks provide a powerful way to integrate AI workflows with system-level automation. While we started with celebratory confetti, the same foundational pattern enables sophisticated deployment pipelines, quality assurance automation, and intelligent workflow orchestration.

By understanding the data flow and properly handling the JSON input, you can create comprehensive automation that makes AI assistance not just more delightful, but deeply integrated into professional development workflows.

The combination of Claude Code's flexibility and creative hook implementations can transform how AI assistants integrate with existing tools, systems, and processes - moving beyond simple task completion to intelligent, context-aware automation.

## Resources

- [Claude Code Hooks Documentation](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [Raycast Extensions](https://raycast.com/extensions)
- [jq Manual](https://jqlang.github.io/jq/manual/)

---

_This blog post was written with assistance from Claude Code, which also triggers confetti upon completion! 🎉_
