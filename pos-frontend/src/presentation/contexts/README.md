# Context Providers

This directory contains React context providers for global state management in the POS application.

## FocusManagerProvider

The `FocusManagerProvider` manages global focus state across the POS application, enabling keyboard-first interaction patterns.

### Features

- **Global Search Input Reference**: Provides a ref to the search input element for auto-focusing
- **Focus Save/Restore**: Maintains a focus history stack for restoring focus after modal interactions
- **Focusable Element Registration**: Allows components to register focusable elements for keyboard navigation
- **Focus History Management**: Tracks focus changes with context information (modal, page, dropdown)

### Usage

Wrap your application with the `FocusManagerProvider`:

```tsx
import { FocusManagerProvider } from '@presentation/contexts'

export function App() {
  return (
    <FocusManagerProvider>
      <POSPage />
    </FocusManagerProvider>
  )
}
```

### API

#### `useFocusManager()` Hook

Returns the focus manager context value:

```tsx
const {
  searchInputRef,      // React.RefObject<HTMLInputElement>
  focusSearch,         // () => void
  saveFocus,           // () => void
  restoreFocus,        // () => void
  registerFocusable    // (id: string, ref: React.RefObject<HTMLElement>) => () => void
} = useFocusManager()
```

#### Methods

- **`focusSearch()`**: Focuses the search input element using `requestAnimationFrame` for timing coordination
- **`saveFocus()`**: Saves the currently focused element to the focus history stack
- **`restoreFocus()`**: Restores focus from the history stack, falling back to search input if history is empty
- **`registerFocusable(id, ref)`**: Registers a focusable element with an ID, returns a cleanup function

### Example: Modal Workflow

```tsx
function MyModal() {
  const { saveFocus, restoreFocus } = useFocusManager()

  const handleOpen = () => {
    saveFocus()  // Save focus before opening modal
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    restoreFocus()  // Restore focus after closing modal
  }

  return (
    <>
      <button onClick={handleOpen}>Open Modal</button>
      {isOpen && (
        <div role="dialog">
          <button onClick={handleClose}>Close</button>
        </div>
      )}
    </>
  )
}
```

### Example: Auto-Focus Search Input

```tsx
function SearchBar() {
  const { searchInputRef, focusSearch } = useFocusManager()

  return (
    <input
      ref={searchInputRef}
      placeholder="Search products..."
      onKeyDown={(e) => {
        if (e.key === 'F1') {
          focusSearch()
        }
      }}
    />
  )
}
```

### Focus History Management

The provider maintains a focus history stack with the following features:

- **Context Detection**: Automatically detects whether focus is in a modal, dropdown, or page context
- **History Limit**: Limits history to 20 entries to prevent memory leaks
- **Element Validation**: Checks if elements still exist in the DOM before restoring focus
- **Fallback Behavior**: Falls back to search input if element no longer exists

### Requirements Satisfied

- **Requirement 1.1**: Auto-focus on search input on page load
- **Requirement 7.2**: Restore focus to search input after modal close

## Future Context Providers

Additional context providers can be added to this directory as needed:

- `KeyboardShortcutProvider`: Global keyboard shortcut management
- `TemporalPersistenceProvider`: Global temporal sale persistence
- `NotificationProvider`: Global notification/toast management
