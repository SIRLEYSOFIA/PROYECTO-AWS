# Custom Hooks for POS UX Optimization

This directory contains custom React hooks that enable keyboard-first interaction, barcode scanner integration, intelligent focus management, and temporal persistence for the POS system.

## Architecture

All hooks follow these principles:
- **Type-safe**: Full TypeScript support with comprehensive type definitions
- **Testable**: Designed for easy testing with React Testing Library
- **Composable**: Hooks can be combined to create complex behaviors
- **Performance-optimized**: Use memoization and proper dependency arrays
- **Error-resilient**: Graceful degradation when features are unavailable

## Hook Categories

### 1. Keyboard Management
- `useKeyboardShortcuts`: Global keyboard shortcut registration and handling
- Context-aware execution (respects input focus)
- Support for modifier keys (Ctrl, Shift, Alt)
- Help overlay integration

### 2. Barcode Scanner
- `useBarcodeScanner`: Detects barcode scanner input by analyzing character timing
- Distinguishes between rapid scanner input (<50ms) and manual typing
- Configurable minimum length and character delay
- Error handling for invalid barcodes

### 3. Focus Management
- `useAutoFocus`: Intelligent focus management with history
- Auto-focus on mount with configurable delay
- Focus save/restore for modal workflows
- Uses requestAnimationFrame for timing coordination

### 4. Persistence
- `useTemporalPersistence`: Auto-save draft orders to IndexedDB
- Debounced saves (500ms) to optimize performance
- Restore on page load
- Clear on successful payment

### 5. Search & Navigation
- `useSearchDropdown`: Keyboard navigation for search results
- Arrow key navigation
- Enter to select, Escape to close
- Mouse hover integration

## Type Definitions

All type definitions are centralized in `types.ts`:
- Hook configuration interfaces
- Return value types
- Context provider types
- Storage data structures

## Testing Utilities

Testing utilities are available in `src/test/hookUtils.ts`:
- `renderTestHook`: Wrapper for renderHook with common setup
- `createHookWrapper`: Create wrapper components for context providers
- `createKeyboardEvent`: Mock keyboard events for testing
- `simulateRapidInput`: Simulate barcode scanner input
- `simulateSlowInput`: Simulate manual typing
- Timing and focus utilities

## Usage Example

```typescript
import { useKeyboardShortcuts, KeyboardShortcut } from '@presentation/hooks'

function MyComponent() {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'F3',
      description: 'Open payment modal',
      category: 'payment',
      handler: () => openPaymentModal(),
      enabled: () => cartHasItems,
    },
  ]

  const { isEnabled } = useKeyboardShortcuts({ shortcuts })

  return <div>Shortcuts enabled: {isEnabled}</div>
}
```

## Testing Example

```typescript
import { renderTestHook, createKeyboardEvent } from '@test/hookUtils'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'

test('executes handler when shortcut is pressed', () => {
  const handler = vi.fn()
  const shortcuts = [{ key: 'F1', handler, category: 'search', description: 'Focus search' }]
  
  renderTestHook(() => useKeyboardShortcuts({ shortcuts }))
  
  const event = createKeyboardEvent('keydown', { key: 'F1' })
  document.dispatchEvent(event)
  
  expect(handler).toHaveBeenCalled()
})
```

## Implementation Status

- [x] Type definitions (`types.ts`)
- [x] Testing utilities (`src/test/hookUtils.ts`)
- [x] Index exports (`index.ts`)
- [ ] `useKeyboardShortcuts` - In progress
- [ ] `useBarcodeScanner` - In progress
- [ ] `useAutoFocus` - In progress
- [ ] `useTemporalPersistence` - In progress
- [ ] `useSearchDropdown` - In progress

## Requirements Coverage

This infrastructure supports the following requirements:
- **1.1, 1.5**: Auto-focus management
- **2.1, 2.3-2.8**: Search dropdown navigation
- **3.1-3.7**: Cart keyboard navigation
- **4.1-4.12**: Global keyboard shortcuts
- **5.1-5.7**: Optimized sale workflow
- **6.1-6.6**: Temporal persistence
- **7.1-7.8**: UX enhancements

## Performance Considerations

- Debouncing: Search (300ms), Persistence (500ms)
- Memoization: Shortcut handlers, dropdown results
- Event delegation: Single global keyboard listener
- Lazy loading: Help overlay, dropdowns

## Accessibility

All hooks support WCAG 2.1 AA compliance:
- Keyboard-only navigation
- Screen reader compatibility
- Focus indicators
- No keyboard traps
- Escape key always available
