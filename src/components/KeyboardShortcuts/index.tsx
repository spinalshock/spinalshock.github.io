interface KeyboardShortcutsInterface {
  setShowHelp: (params: boolean) => void;
}

const KeyboardShortcuts = ({ setShowHelp }: KeyboardShortcutsInterface) => (
  <div className="help-modal">
    <h2>Keyboard Shortcuts</h2>
    <ul>
      <li>
        <kbd>
          <kbd>i</kbd>
        </kbd>
        : Enter insert mode
      </li>
      <li>
        <kbd>
          <kbd>Esc</kbd>
        </kbd>
        : Exit insert mode
      </li>
      <li>
        <kbd>
          <kbd>:w</kbd>
        </kbd>
        : Save content
      </li>
      <li>
        <kbd>
          <kbd>y</kbd>
        </kbd>
        : save content and copy URL
      </li>
      <li>
        <kbd>
          <kbd>Shift</kbd>+<kbd>y</kbd>
        </kbd>
        : copy content
      </li>
      <li>
        <kbd>
          <kbd>p</kbd>
        </kbd>
        : Paste content
      </li>
      <li>
        <kbd>
          <kbd>:q</kbd>
        </kbd>
        : Clear content
      </li>
      <li>
        <kbd>
          <kbd>?</kbd>
        </kbd>
        : Toggle help
      </li>
    </ul>
    <button onClick={() => setShowHelp(false)}>Close</button>
  </div>
);

export default KeyboardShortcuts;
