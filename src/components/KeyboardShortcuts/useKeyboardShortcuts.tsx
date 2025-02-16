import { useEffect } from "react";
import {
  handleCopyContent,
  handleCopyUrl,
  handlePaste,
  handleClear,
} from "./helpers";

interface KeyboardShortcutsProps {
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  setCommand: (command: string) => void;
  command: string;
  content: string;
  setContent: (content: string) => void;
  handleSave: () => void;
  setShowHelp: (value: boolean) => void;
}

const useKeyboardShortcuts = ({
  isEditing,
  setIsEditing,
  setCommand,
  content,
  setContent,
  command,
  handleSave,
  setShowHelp,
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isEditing) {
        if (event.key === "Escape") {
          setIsEditing(false);
          setCommand("");
        }
        return;
      }

      if (event.key === ":") {
        setCommand(":");
      } else if (command.startsWith(":")) {
        if (event.key === "Enter") {
          if (command === ":w") handleSave();
          else if (command === ":q") handleClear(setContent);
          setCommand("");
        } else if (event.key === "Backspace") {
          setCommand((prev) => prev.slice(0, -1));
        } else {
          setCommand((prev) => prev + event.key);
        }
      } else {
        switch (event.key) {
          case "i":
            event.preventDefault();
            setIsEditing(true);
            break;
          case "y":
            handleSave();
            handleCopyUrl();
            break;
          case "Y":
            handleCopyContent(content);
            break;
          case "p":
            handlePaste(setContent);
            break;
          case "?":
            setShowHelp((prev) => !prev);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditing, command, content]);
};

export default useKeyboardShortcuts;
