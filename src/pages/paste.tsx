import { useState, useEffect, useRef } from "react";
import { ZstdInit } from "@oneidentity/zstd-js";
import MDEditor from "@uiw/react-md-editor";
import { MDXProvider } from "@mdx-js/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast, ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import { compile } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { mdxComponents } from "../components/MdxComponents"; // Your custom MDX components
import { uint8ArrayToBase64, base64ToUint8Array } from "../utils/zstd-helper";
import KeyboardShortcuts from "../components/KeyboardShortcuts";
import useKeyboardShortcuts from "../components/KeyboardShortcuts/useKeyboardShortcuts";

const MIN_INPUT_LENGTH = 100;

const renderers = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    return !inline && match ? (
      <SyntaxHighlighter
        style={dracula}
        language={match[1]}
        PreTag="div"
        {...props}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

const Paste = () => {
  const [content, setContent] = useState("");
  const [zstdModule, setZstdModule] = useState(null);
  const [isZstdReady, setIsZstdReady] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [command, setCommand] = useState("");
  const editorRef = useRef(null);
  const lastKeyPressTime = useRef(0);

  // Focus the MDEditor when entering edit mode
  useEffect(() => {
    if (isEditing && editorRef.current) {
      const textarea = editorRef.current.querySelector("textarea");
      if (textarea) {
        textarea.focus();
      }
    }
  }, [isEditing]);

  // Initialize Zstd and load content from URL
  useEffect(() => {
    async function initZstd() {
      try {
        const module = await ZstdInit();
        setZstdModule(module);
        setIsZstdReady(true);

        const url = new URL(window.location.href);
        const encodedContent = url.searchParams.get("content");
        if (encodedContent) {
          try {
            if (encodedContent.startsWith("C:")) {
              const base64Data = encodedContent.slice(2);
              const compressedBuffer = base64ToUint8Array(base64Data);
              const decompressed =
                module.ZstdSimple.decompress(compressedBuffer);
              setContent(new TextDecoder().decode(decompressed));
            } else if (encodedContent.startsWith("P:")) {
              const base64Data = encodedContent.slice(2);
              const bytes = base64ToUint8Array(base64Data);
              setContent(new TextDecoder().decode(bytes));
            }
          } catch (error) {
            console.error("Decompression failed:", error);
            toast.error("Failed to load content");
          }
        }
      } catch (error) {
        console.error("Zstd initialization failed:", error);
        toast.error("Failed to initialize Zstd");
      }
    }
    initZstd();
  }, []);

  const handleSave = () => {
    if (!isZstdReady) return;

    try {
      const inputBuffer = new TextEncoder().encode(content);
      let encodedContent;

      if (inputBuffer.length < MIN_INPUT_LENGTH) {
        encodedContent = "P:" + uint8ArrayToBase64(inputBuffer);
      } else {
        const compressed = zstdModule.ZstdSimple.compress(inputBuffer, 5);
        encodedContent = "C:" + uint8ArrayToBase64(compressed);
      }

      const url = new URL(window.location.href);
      url.searchParams.set("content", encodedContent);
      window.history.replaceState(null, "", url.toString());
      toast.success("Content saved!");
    } catch (error) {
      console.error("Processing failed:", error);
      toast.error("Failed to save content");
    }
  };

  useKeyboardShortcuts({
    isEditing,
    setIsEditing,
    command,
    setCommand,
    content,
    setContent,
    handleSave,
    setShowHelp,
  });

  return (
    <div>
      {isEditing ? (
        <div ref={editorRef}>
          <MDEditor
            value={content}
            onChange={setContent}
            height={"100%"}
            preview="edit"
            textareaProps={{
              style: { fontFamily: "monospace", fontSize: "16px" },
            }}
          />
        </div>
      ) : (
        <div className="mdx-preview">
          <MDXProvider components={mdxComponents}>
            <ReactMarkdown components={renderers} remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </MDXProvider>
        </div>
      )}{" "}
      {showHelp && <KeyboardShortcuts setShowHelp={setShowHelp} />}
      <div className="vim-status">
        {isEditing ? "-- INSERT --" : command || "-- NORMAL --"}
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        transition={Slide}
      />{" "}
    </div>
  );
};

export default Paste;
