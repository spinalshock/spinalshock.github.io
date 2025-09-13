# Terminal Keybind Conflicts

## Problem: NeoMutt Ctrl+O Not Working in macOS Terminal

**Issue:** `Ctrl+O` keybinding wasn't responding in NeoMutt when running in macOS Terminal.

**Root Cause:** macOS Terminal reserves `Ctrl+O` for "flow control" functionality.

**Solution:**
```bash
# Disable the conflicting terminal flow control
stty discard undef
```

**Platform Notes:**
- **macOS:** Use `stty discard undef`
- **Linux:** Some terminals may need `stty flush undef` instead

Run the appropriate `stty` command before launching the application with conflicting keybinds.

**Source:** [NeoMutt Issue #1195](https://github.com/neomutt/neomutt/issues/1195)
