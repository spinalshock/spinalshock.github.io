# Notes

## Line Breaks

- Avoid using `<br />` for layout or spacing — it's considered outdated.
- Instead, structure your content properly with `<p>` tags for paragraphs or CSS for spacing.

---

## Text Semantics

- Avoid `<b>` and `<i>` → use `<strong>` and `<em>` instead.
  - `<b>` and `<i>` only provide **visual styling** (bold/italic).
  - `<strong>` = **important text** (conveys meaning to screen readers).
  - `<em>` = **emphasized text** (adds stress/importance in speech for assistive tech).

---

## Images and Accessibility

- If an image is **purely decorative**, give it an empty alt attribute:

  ```html
  <img src="decorative.png" alt="" />
  ```

  :::note NOTE
  This makes screen readers skip it. If alt is missing, screen readers may read the file name, which is often unclear or meaningless (e.g., IMG_3421.png).
  :::

- For meaningful images, always provide descriptive alt text:

  ```html
  <img src="chart.png" alt="Sales increased 25% from Q1 to Q2 2024" />
  ```

---

## Labels and Inputs

- Always pair inputs with `<label>`. Without a label, screen readers announce only "input text" or "input password", which is confusing. With a label, users hear context like "Name, input text" or "OTP, input password".

  ```html
  <label for="name">Name</label>
  <input id="name" type="text" />
  ```

- Alternative approaches:

  ```html
  <!-- Implicit labeling -->
  <label>
    Name
    <input type="text" />
  </label>

  <!-- Using aria-label -->
  <input type="text" aria-label="Name" />
  ```

---

## Responsive Design

Always include a mobile-first meta tag:

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

:::warning
Without this, your layout breaks on phones.
:::

---

## Semantic Elements

### `<section>` vs `<article>` vs `<div>`

| Element     | Purpose                      | When to Use                                             | Example                                   |
| ----------- | ---------------------------- | ------------------------------------------------------- | ----------------------------------------- |
| `<section>` | Thematic grouping of content | Content that belongs together and should have a heading | Navigation menu, chapter in documentation |
| `<article>` | Standalone, reusable content | Content that makes sense independently                  | Blog post, news article, comment          |
| `<div>`     | Generic container            | No semantic meaning needed                              | Styling wrapper, layout container         |

**Key Guidelines:**

- `<section>` should usually have a heading and acts as a landmark for accessibility tools
- `<article>` can contain its own header, footer, sections, and can be syndicated elsewhere
- `<div>` is for styling, layout, or scripts when no semantic tag applies

:::tip Rule of Thumb
If content is reusable/standalone → use `<article>`. If it's part of a larger whole → use `<section>`.
:::

---

## Interactive Elements

### Use `<button>` for Clickable Actions

**❌ Avoid:**

```html
<div onclick="doSomething()">Click me</div>
<span class="clickable">Submit</span>
```

**✅ Use instead:**

```html
<button onclick="doSomething()">Click me</button>
<button type="submit">Submit</button>
```

**Why `<button>` is better:**

- ✅ Keyboard/tab navigation support
- ✅ Screen reader accessibility
- ✅ Proper cursor changes
- ✅ Built-in focus management
- ✅ Easy `aria-*` attribute support

### When You Must Use `<div>` (Not Recommended)

If you absolutely need a `<div>` as a button, you must add extensive accessibility code:

```html
<div
  role="button"
  tabindex="0"
  aria-label="Click Me"
  onclick="alert('Clicked!')"
  onkeydown="if(event.key === 'Enter' || event.key === ' ') this.click();"
  style="cursor: pointer;"
>
  Click Me
</div>
```

:::warning
This is significantly more work to replicate what `<button>` provides natively. Always prefer `<button>` unless you have compelling technical constraints.
:::
