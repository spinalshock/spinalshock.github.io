import { toast } from "react-toastify";

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

const handleCopyUrl = () => {
  fetch(`https://tinyurl.com/api-create.php?url=${window.location.href}`)
    .then(async (res) => await res.text())
    .then((res) => {
      navigator.clipboard
        .writeText(res)
        .then(() => {
          console.log("URL copied to clipboard");
          toast.success("URL yanked!");
        })
        .catch((error) => {
          console.error("Failed to copy URL:", error);
          toast.error("Failed to copy URL");
        });
    })
    .catch((error) => {
      console.error("Failed to shorten URL:", error);
      toast.error("Failed to shorten URL");
      navigator.clipboard.writeText(window.location.href);
    });
};

const handleClear = (setContent) => {
  setContent("");
  console.log("Content cleared");
  toast.info("Content cleared");
};

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
