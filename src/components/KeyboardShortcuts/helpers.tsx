import { toast } from "react-toastify";
// Handle copy functionality
const handleCopyContent = (content) => {
  navigator.clipboard
    .writeText(content)
    .then(() => {
      console.log("Content copied to clipboard");
      toast.success("Content yanked!");
    })
    .catch((error) => {
      console.error("Failed to copy content:", error);
      toast.error("Failed to copy content");
    });
};

// Handle copy functionality
const handleCopyUrl = () => {
  navigator.clipboard
    .writeText(window.location.href)
    .then(() => {
      console.log("URL copied to clipboard");
      toast.success("URL yanked!");
    })
    .catch((error) => {
      console.error("Failed to copy URL:", error);
      toast.error("Failed to copy URL");
    });
};

// Handle clear functionality
const handleClear = (setContent) => {
  setContent("");
  console.log("Content cleared");
  toast.info("Content cleared");
};

// Handle paste functionality
const handlePaste = async (setContent) => {
  try {
    const text = await navigator.clipboard.readText();
    setContent(text);
    console.log("Content pasted");
    toast.success("Content pasted");
  } catch (error) {
    console.error("Failed to paste content:", error);
    toast.error("Failed to paste content");
  }
};

export { handleCopyContent, handleCopyUrl, handleClear, handlePaste };
