# Event Delegation

Event delegation is a powerful JavaScript pattern that leverages event bubbling to efficiently manage event handling in dynamic applications.

## Core Concept

Event delegation assigns a single event handler to a parent element instead of multiple handlers to individual child elements. When an event occurs on a child, it bubbles up to the parent, which then handles the event based on `event.target`.

### Key Benefits

- **Memory Efficiency**: Uses only one event listener instead of many
- **Dynamic Content Support**: Automatically handles dynamically added elements
- **Simplified Management**: Easier to maintain and debug
- **Performance**: Reduces overhead from multiple event listeners

## When to Use Event Delegation

Event delegation is particularly valuable when:

- Working with dynamically generated content (AJAX, DOM manipulation)
- Managing large lists or tables with many interactive elements  
- Building components that add/remove child elements frequently
- Optimizing performance in event-heavy applications

## Practical Examples

### Basic List Management

Instead of attaching individual click handlers to each list item:

```javascript
// Without delegation (inefficient)
document.querySelectorAll('li').forEach(item => {
  item.addEventListener('click', handleClick);
});
```

Use delegation on the parent:

```javascript
// With delegation (efficient)
document.querySelector('ul').addEventListener('click', (event) => {
  if (event.target.tagName === 'LI') {
    handleListItemClick(event.target);
  }
});
```

### Dynamic Todo List

```javascript
const todoList = document.getElementById('todo-list');

todoList.addEventListener('click', (event) => {
  const target = event.target;
  
  if (target.classList.contains('delete-btn')) {
    // Handle delete
    target.closest('li').remove();
  } else if (target.classList.contains('toggle-btn')) {
    // Handle toggle
    target.closest('li').classList.toggle('completed');
  }
});

// Adding new todos works automatically
function addTodo(text) {
  const li = document.createElement('li');
  li.innerHTML = `
    ${text}
    <button class="toggle-btn">✓</button>
    <button class="delete-btn">×</button>
  `;
  todoList.appendChild(li);
}
```

### Table Row Actions

```javascript
const table = document.querySelector('table');

table.addEventListener('click', (event) => {
  const target = event.target;
  const row = target.closest('tr');
  
  if (target.dataset.action === 'edit') {
    editRow(row);
  } else if (target.dataset.action === 'delete') {
    deleteRow(row);
  }
});
```

## Best Practices

### Event Target Validation

Always validate the event target to ensure you're handling the correct elements:

```javascript
container.addEventListener('click', (event) => {
  // Check by tag name
  if (event.target.tagName !== 'BUTTON') return;
  
  // Check by class
  if (!event.target.classList.contains('action-btn')) return;
  
  // Check by data attribute
  if (!event.target.dataset.action) return;
});
```

### Stop Propagation When Needed

```javascript
container.addEventListener('click', (event) => {
  if (event.target.classList.contains('stop-propagation')) {
    event.stopPropagation();
    return;
  }
  
  // Handle other clicks
});
```

## Limitations

- **Event Type Dependency**: Only works with events that bubble (most do, but not all)
- **Target Specificity**: Requires careful target validation
- **Debugging Complexity**: Can be harder to trace event handling in complex applications

## Related Concepts

- **Event Bubbling**: The mechanism that makes delegation possible
- **Event Capturing**: Alternative event phase (rarely used with delegation)
- **`event.currentTarget`**: The element with the event listener (parent)
- **`event.target`**: The element that triggered the event (child)
