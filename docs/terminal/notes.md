# Terminal Troubleshooting Notes

Problems I've encountered and solved while configuring my terminal setup (Ghostty + tmux + zsh).

## Problem: Ctrl+A and Ctrl+E Not Working in Zsh

**Issue:** `Ctrl+A` (beginning of line) and `Ctrl+E` (end of line) weren't working in my zsh terminal, but worked fine inside Claude Code.

**Investigation Steps:**

1. Used `bindkey` to check current keybindings
2. Discovered zsh was in vi-mode by default
3. Realized vi-mode disables emacs-style keybindings

**Solution:** Added explicit bindings in `~/.zshrc`:

```bash
bindkey -v                    # Enable vi-mode
bindkey '^A' beginning-of-line # But keep Ctrl+A
bindkey '^E' end-of-line       # And Ctrl+E
```

## Problem: Tmux Config Not Reloading

**Issue:** Changes to `~/.tmux.conf` weren't taking effect without restarting tmux completely.

**Solution:** Added reload keybinding to `~/.tmux.conf`:

```tmux
bind r source-file ~/.tmux.conf \; display-message "tmux.conf reloaded!"
```

Now `prefix + r` reloads the config instantly.

## Problem: Accidentally Messed Up Pane Layout

**Issue:** Pressed `Ctrl+Space` (prefix) + `Space` and all my panes got reorganized into a weird layout.

**Root Cause:** `prefix + Space` is tmux's default keybinding for cycling through pane layouts.

**What I Learned:** This is actually a feature, not a bug. Useful layouts include:

- Even horizontal
- Even vertical
- Main horizontal (one large pane on top)
- Main vertical (one large pane on left)

Can cycle through them intentionally now when needed.

## Installing Tmux Plugins

**Discovery:** Can install tmux plugins managed by TPM using `prefix + I` (capital i).

This installs all plugins listed in the `set -g @plugin` lines in `~/.tmux.conf`.

## Debugging Commands Used

**Check zsh keybindings:**

```bash
bindkey                    # Show all bindings
bindkey | grep line       # Filter for specific commands
```

**Reload configurations:**

```bash
# Zsh: source ~/.zshrc (or restart terminal)
# Tmux: prefix + r (after adding reload binding)
```

- Column command is perfect for use with viewing the output of csv files. Cat command output may not be readable, but column command shows it in a good, tabular format.

```bash
column -t -s, test.csv
# -t for tabular, -s for separator, which is a comma here. See man page for more.
```

- fuser command is perfect for finding the process id of open files. For instance, a video, music, image file is open in your system. Or some file can't be closed/modified, or some drive can't be unmounted, because it's being used by some other process. fuser gives you the process id of that file.

```bash
fuser ~/Downloads/**/test.png # 123
kill 123
```

- mkdir command has a -p option, which makes intermediate directories that don't exist. Also, it supports creating multiple nested subdirectories separated using comma and brace expansion

```bash
mkdir -p test/{test1,test2/{test3,test4}}
eza -T test # -T stands for tree, alternatively use -L2 to specify depth order 2
test
├── test1
└── test2
    ├── test3
    └── test4
```

-
