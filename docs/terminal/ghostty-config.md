# Ghostty Terminal Setup

## Config File Locations

Ghostty looks for config in these locations:
- `~/Library/Application Support/com.mitchellh.ghostty/config`
- `~/.config/ghostty/config`

## My Configuration

**File:** `~/.config/ghostty/config`

```toml
# Font - Using Nerd Fonts for icon support
font-family = JetBrainsMono Nerd Font
font-size = 14

# UI Tweaks
window-padding = 8
confirm-close = false

# Theme
theme = Dark Pastel

# Transparency & Blur Effects
background-opacity = 0.85
background-blur = true
```

## Useful Commands

**List available themes:**
```bash
ghostty +list-themes
```

**Reload config without restarting:**
- Shortcut: `Cmd + Shift + ,`
- CLI: `ghostty --reload-config`

## Integration Notes

**Tmux Pane Visibility:** Transparency can make tmux panes blend together. Fixed by setting distinct border colors in `~/.tmux.conf`:
```tmux
set -g pane-border-style fg=colour238      # Inactive panes
set -g pane-active-border-style fg=colour39  # Active pane
```

**Theme Consistency:** Can sync Ghostty theme with Neovim colorscheme for a cohesive look.

**Config Testing:** Always use `Cmd+Shift+,` to reload rather than restarting Ghostty entirely.
