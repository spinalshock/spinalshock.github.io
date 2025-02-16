export const mdxComponents = {
  // Override default Markdown elements
  h1: ({ children }) => (
    <h1 style={{ color: "var(--ifm-color-primary)", fontSize: "2.5rem" }}>
      {children}
    </h1>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),

  // Add custom components
  Todo: ({ children }) => (
    <div className="todo-item">
      <input type="checkbox" />
      <span>{children}</span>
    </div>
  ),

  // Example: A custom callout component
  Callout: ({ variant = "info", children }) => (
    <div className={`callout callout-${variant}`}>{children}</div>
  ),
};
