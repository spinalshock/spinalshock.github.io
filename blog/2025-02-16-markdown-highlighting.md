---
slug: markdown syntax highlighting
title: Highlighting code syntax in react-markdown
authors: [om]
tags: [javascript, react, docusaurus]
---

# Adding Code Syntax Highlighting to react-markdown in a React App

If you're using `react-markdown` to render Markdown in your React application, you might notice that code blocks don’t have syntax highlighting by default. In this post, I’ll show you how I added syntax highlighting using `react-syntax-highlighter`, making my Markdown renderer more visually appealing—similar to how Docusaurus does it with Prism.

<!-- truncate -->

## Step 1: Install Dependencies
First, install the necessary packages:
```sh
npm install react-markdown react-syntax-highlighter remark-gfm
```
- `react-markdown`: Parses and renders Markdown
- `react-syntax-highlighter`: Adds syntax highlighting
- `remark-gfm`: Enables GitHub Flavored Markdown features (like tables, task lists, and more)

## Step 2: Create a Code Component
We need to define a custom `CodeBlock` component that uses `react-syntax-highlighter`.

```tsx
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  return !inline && match ? (
    <SyntaxHighlighter style={dracula} language={match[1]} PreTag="div" {...props}>
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  ) : (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

export default CodeBlock;
```

- This component detects the language from the `className` of the code block (e.g., `language-js` for JavaScript).
- It applies syntax highlighting using the `dracula` theme from Prism.
- If the text is inline code (like `inline code`), it renders a normal `<code>` tag.

## Step 3: Integrate with react-markdown
Now, modify your Markdown rendering component to use `CodeBlock`:

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';

const MarkdownRenderer = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code: CodeBlock,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
```

## Step 4: Use the Markdown Renderer
Finally, use the `MarkdownRenderer` component in your app:

```tsx
const markdownContent = `
\`\`\`js
console.log("Hello, world!");
\`\`\`
`;

<MarkdownRenderer content={markdownContent} />;
```

Now, when your Markdown includes code blocks, they will be syntax-highlighted using Prism!

## Conclusion
By combining `react-markdown` with `react-syntax-highlighter`, I was able to add beautiful syntax highlighting to my Markdown-based content. This approach is lightweight, flexible, and works well for blogs, documentation, or any app that renders Markdown.

Happy coding! 🚀

