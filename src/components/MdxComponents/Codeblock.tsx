import { useEffect, useId, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

const MermaidBlock = ({ code }: { code: string }) => {
  const id = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "loose" });
        const { svg, bindFunctions } = await mermaid.render(`mermaid-${id}`, code);
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = svg;
        bindFunctions?.(containerRef.current);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, id]);

  if (error) {
    return (
      <pre style={{ color: "#ff6b6b", whiteSpace: "pre-wrap" }}>
        Mermaid error: {error}
        {"\n\n"}
        {code}
      </pre>
    );
  }

  return <div ref={containerRef} className="mermaid" />;
};

const renderers = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    if (!inline && match?.[1] === "mermaid") {
      return <MermaidBlock code={String(children).replace(/\n$/, "")} />;
    }
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

export default renderers;
