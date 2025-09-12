# React Notes

:::notes
[Course Website](https://react-v9.holt.courses/)
:::

## Build Tools

### Vite
- Uses **esbuild** for development builds and **Rollup** for production builds
- Soon to be replaced by **Rolldown** (Rust-based build tool)

## Accessibility

### Form Event Handlers
- React components should use **explicit event handlers** on form elements rather than a single handler on the parent
- While parent handlers work through event bubbling, explicit handlers improve **accessibility for screen readers**

## React Hooks

### useEffect Patterns
- `useEffect` callback function **cannot be async**
- Async functions always return a Promise, but `useEffect` expects either:
  - `undefined` (no cleanup)
  - A cleanup function that runs on component unmount
- `useEffect` dependency array if not passed, will run on **ALL state changes**, effectively equivalent to DDOSing yourself


## Browser APIs

### WebP Image Format
- **WebP** is Google's image format that's more efficient than PNG/JPEG
- Better compression with same quality
- Supported by all modern browsers

### Internationalization API
- **Intl** is the browser's Internationalization API for locale-sensitive operations
- Key objects: `DateTimeFormat`, `NumberFormat`, `Collator`, `RelativeTimeFormat`

```javascript
// Currency formatting
new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
}).format(123.45);
// "$123.45"

// Date formatting
new Intl.DateTimeFormat("fr-FR").format(new Date());
// "11/09/2025"

// React usage
const intl = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const amount = intl.format(someValue);
```

## Development Tools

### React Strict Mode
- Provides warnings about legacy or deprecated features
- **Double renders** components and effects to catch subtle bugs
- Helps identify side effects that cause inconsistent renders
- Only affects development mode, not production

### React Developer Tools
- Shows component props, state, and context values
- **Performance profiler** to identify rendering bottlenecks
- Component tree navigation and inspection

### Browser Console Shortcuts
- **`$0`** - Last selected element in browser inspector
- **`$r`** - Last selected React component in React DevTools

### Custom Hooks

- Must begin with **`use`** prefix for linter rule enforcement
- Purpose: **Reusing stateful logic** across components
- Benefits: Easier testing of component logic in isolation
- Extract complex component logic into reusable functions

### [useDebugValue](https://react.dev/reference/react/useDebugValue)

- Used for debugging custom hook states or when multiple states need to be checked at the same time.
- **React DevTools integration** - shows debug info alongside hook state
- **Production-safe** - ignored in production builds
- Supports **lazy evaluation** with formatter function for expensive computations

:::tip
Don't add debug values to every custom Hook. It's most valuable for custom Hooks that are part of **shared libraries** and that have a complex internal data structure that's difficult to inspect.

**Shared libraries** include:

- **Component libraries**: Material-UI, Ant Design, Chakra UI
- **Hook libraries**: React Query, SWR, Zustand
- **Internal company packages**: Shared across teams/projects
- **Open source packages**: Published to npm

**Why it matters more for libraries**: Users can't modify your source code or add `console.logs`. `useDebugValue` is their only window into your hook's internal state, making it essential for developer experience.
:::

```javascript
// Authentication hook with complex state
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  useDebugValue(
    user ? `${user.name} (${permissions.length} perms)` : "Not logged in",
  );

  return { user, loading, permissions, login, logout };
}

// API cache hook showing cache status
function useApiCache(endpoint) {
  const [data, setData] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  useDebugValue(
    lastFetch ? `Cached ${Date.now() - lastFetch}ms ago` : "No cache",
  );

  return data;
}
```

### useContext
- Should only be used for **application-level state management**
- Gets hard to debug from where the context is being modified in large projects

## Component Best Practices

### Function Naming
Use named functions for components instead of anonymous functions for better debugging traces:
```javascript
// Good
export default function App() {}

// Avoid
export default const App = () => {}
```

### Data Flow
- React props have **one-way data flow**
- Data can only be passed from parent to child
- Children cannot modify parent data directly
- Parents must pass functions to children to manipulate parent state

## Routing

### Router Comparison
- **Tanstack Router**: Exclusively focused on client-side routing
- **React Router**: Supports both server (Remix) and client-side routing

### Link vs Anchor Tags
Why use `<Link>` instead of `<a>` tags:
- Handles client-side routing
- Manages browser history properly
- Prevents full page reloads
- Handles prefetching of pages

## Data Fetching

### Tanstack Query (formerly React Query)
- Simplifies caching API requests
- Handles cache expiry automatically
- Manages hydration and precaching
- Eliminates need for complex manual caching logic 
