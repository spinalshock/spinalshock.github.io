# Terminal Keybind Conflict

## For cases where user keymaps conflict with terminal keymaps, can try this solution for fix:

> I think macOS' Terminal uses `Ctrl-O` for "flow control".
> Try running: `stty discard undef` in the terminal before NeoMutt.
>
> Side note for Linux Users:
> Some other terminals need `stty flush undef` instead.

**Source:** [Github](https://github.com/neomutt/neomutt/issues/1195)
