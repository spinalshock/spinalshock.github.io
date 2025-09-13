# Tmux-Fingers Plugin Setup & Troubleshooting

## Problem: Global Keybinding Disaster

**Issue:** Accidentally set tmux-fingers to use `f` as a global key (with `-n` flag). Couldn't type anything containing "f" in terminal anymore - it would trigger tmux-fingers instead of typing the letter.

**How It Happened:** Initially configured tmux-fingers with:
```tmux
# WRONG - This breaks normal typing
set -g @fingers-key f -n  # The -n flag made it global
```

## Investigation & Debugging

**Step 1: Check all tmux keybindings**
```bash
tmux list-keys                # Show all tmux key bindings
tmux list-keys | grep 'f'     # Find specific key bindings using 'f'
```

**Step 2: Identify the problematic binding**
Found that `f` was bound globally (without prefix), intercepting all 'f' key presses.

**Step 3: Remove the problematic keybinding**

**Temporary fix (in running tmux session):**
```bash
# Enter tmux command mode with prefix + :
<prefix> + :

# Remove global keybinding
unbind -n f

# Remove prefix keybinding (if exists)
unbind-key f
```

## Correct Configuration

**File:** `~/.tmux.conf`

```tmux
# Disable the default global binding (safety measure)
set -gu @fingers-key

# Set jump-only key (NOT global - no -n flag)
set -g @fingers-jump-key 'f'
```

**How to use after fix:**
- `prefix + f` → Enter tmux-fingers mode
- Select text by typing the highlighted letters
- No interference with normal typing

## Key Learnings

1. **The `-n` flag danger:** Makes keybindings global (no prefix needed), which can hijack normal terminal input
2. **Plugin option vs. keybinding:** `@fingers-jump-key` is a plugin option, not a direct keybinding
3. **Safety first:** Always use `set -gu @fingers-key` to disable default global bindings
4. **Testing:** Test plugin configs in a disposable tmux session first

## Useful Commands

**Check current tmux-fingers config:**
```bash
tmux show-options -g | grep fingers
```

**Reload tmux config:**
```bash
tmux source-file ~/.tmux.conf
# Or use custom reload: prefix + r
```

**Install/update plugins via TPM:**
```bash
# prefix + I (capital i)
```

## Prevention

Always be careful with:
- Global keybindings (`-n` flag)
- Common letters as keybindings
- Plugin default configurations

Test configuration changes incrementally rather than applying multiple changes at once.