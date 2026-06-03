/**
 * Type definitions for custom hooks used in POS UX optimization
 * These types support keyboard-first interaction, barcode scanning, focus management, and temporal persistence
 */

import { ProductViewModel } from '@application/view-models/ProductViewModel'
import { Order } from '@domain/entities/Order'

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

/**
 * Keyboard shortcut category for grouping in help overlay
 */
export type ShortcutCategory = 'search' | 'cart' | 'payment' | 'navigation'

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  /** Key identifier (e.g., 'F1', 'Escape', 'Enter') */
  key: string
  /** Whether Ctrl key must be pressed */
  ctrlKey?: boolean
  /** Whether Shift key must be pressed */
  shiftKey?: boolean
  /** Whether Alt key must be pressed */
  altKey?: boolean
  /** Human-readable description of the shortcut action */
  description: string
  /** Category for grouping in help overlay */
  category: ShortcutCategory
  /** Handler function to execute when shortcut is triggered */
  handler: (event: KeyboardEvent) => void
  /** Optional function to determine if shortcut is currently enabled */
  enabled?: () => boolean
}

/**
 * Options for useKeyboardShortcuts hook
 */
export interface UseKeyboardShortcutsOptions {
  /** Array of keyboard shortcuts to register */
  shortcuts: KeyboardShortcut[]
  /** Whether shortcuts should work when user is typing in input fields (default: false) */
  enableWhenTyping?: boolean
}

/**
 * Return value from useKeyboardShortcuts hook
 */
export interface UseKeyboardShortcutsReturn {
  /** All registered shortcuts */
  shortcuts: KeyboardShortcut[]
  /** Whether keyboard shortcuts are currently enabled */
  isEnabled: boolean
  /** Toggle the keyboard shortcuts help overlay */
  toggleHelp: () => void
}

// ============================================================================
// Barcode Scanner
// ============================================================================

/**
 * Configuration for useBarcodeScanner hook
 */
export interface BarcodeScannerConfig {
  /** Minimum barcode length to be considered valid (default: 4) */
  minLength?: number
  /** Maximum delay between characters to detect scanner input in ms (default: 50) */
  maxCharDelay?: number
  /** Callback when a valid barcode is scanned */
  onScan: (barcode: string) => void
  /** Optional callback when an error occurs */
  onError?: (error: string) => void
}

/**
 * State returned by useBarcodeScanner hook
 */
export interface BarcodeScannerState {
  /** Whether a barcode scan is currently in progress */
  isScanning: boolean
  /** The last successfully scanned barcode */
  lastBarcode: string | null
}

// ============================================================================
// Auto Focus
// ============================================================================

/**
 * Configuration for useAutoFocus hook
 */
export interface AutoFocusConfig {
  /** Reference to the element that should receive auto-focus */
  targetRef: React.RefObject<HTMLElement>
  /** Whether auto-focus is enabled (default: true) */
  enabled?: boolean
  /** Whether to restore focus when modals close (default: true) */
  restoreOnModalClose?: boolean
  /** Delay in ms before focusing (default: 0) */
  delay?: number
}

/**
 * Focus history entry for tracking focus changes
 */
export interface FocusHistory {
  /** The element that had focus */
  element: HTMLElement
  /** Timestamp when focus was recorded */
  timestamp: number
}

/**
 * Return value from useAutoFocus hook
 */
export interface UseAutoFocusReturn {
  /** Manually trigger focus on the target element */
  focus: () => void
  /** Manually blur the target element */
  blur: () => void
  /** Save the current focus to history */
  saveFocus: () => void
  /** Restore focus from history */
  restoreFocus: () => void
}

// ============================================================================
// Temporal Persistence
// ============================================================================

/**
 * Configuration for useTemporalPersistence hook
 */
export interface TemporalPersistenceConfig {
  /** Storage key for the temporal data */
  key: string
  /** Debounce delay in ms before saving (default: 500) */
  debounceMs?: number
  /** Optional callback when data is restored */
  onRestore?: (data: Order) => void
  /** Optional callback when an error occurs */
  onError?: (error: Error) => void
}

/**
 * Return value from useTemporalPersistence hook
 */
export interface UseTemporalPersistenceReturn {
  /** Whether a save operation is currently in progress */
  isSaving: boolean
  /** Timestamp of the last successful save */
  lastSaved: Date | null
  /** Manually clear the temporal data */
  clear: () => void
  /** Manually restore the temporal data */
  restore: () => Promise<Order | null>
}

// ============================================================================
// Search Dropdown
// ============================================================================

/**
 * Configuration for useSearchDropdown hook
 */
export interface SearchDropdownConfig {
  /** Array of search results to display */
  results: ProductViewModel[]
  /** Callback when a product is selected */
  onSelect: (product: ProductViewModel) => void
  /** Callback when the dropdown should close */
  onClose: () => void
  /** Whether the dropdown is currently open */
  isOpen: boolean
}

/**
 * State returned by useSearchDropdown hook
 */
export interface SearchDropdownState {
  /** Index of the currently highlighted result */
  highlightedIndex: number
  /** Move highlight to previous result */
  moveUp: () => void
  /** Move highlight to next result */
  moveDown: () => void
  /** Select the currently highlighted result */
  selectHighlighted: () => void
  /** Reset the dropdown state */
  reset: () => void
}

// ============================================================================
// Context Types
// ============================================================================

/**
 * Context value for KeyboardShortcutProvider
 */
export interface KeyboardShortcutContextValue {
  /** Register a new keyboard shortcut, returns cleanup function */
  registerShortcut: (shortcut: KeyboardShortcut) => () => void
  /** Unregister a keyboard shortcut by key */
  unregisterShortcut: (key: string) => void
  /** Whether the help overlay is currently open */
  isHelpOpen: boolean
  /** Toggle the help overlay */
  toggleHelp: () => void
  /** All currently registered shortcuts */
  allShortcuts: KeyboardShortcut[]
}

/**
 * Context value for FocusManagerProvider
 */
export interface FocusManagerContextValue {
  /** Reference to the search input element */
  searchInputRef: React.RefObject<HTMLInputElement>
  /** Focus the search input */
  focusSearch: () => void
  /** Save the current focus to history */
  saveFocus: () => void
  /** Restore focus from history */
  restoreFocus: () => void
  /** Register a focusable element with an ID */
  registerFocusable: (id: string, ref: React.RefObject<HTMLElement>) => void
}

// ============================================================================
// Storage Types
// ============================================================================

/**
 * Temporal sale data stored in IndexedDB
 */
export interface TemporalSaleData {
  /** Order ID */
  orderId: string
  /** Order items */
  items: Order['items']
  /** Order-level discount */
  orderDiscount: Order['orderDiscount']
  /** Customer ID if selected */
  customerId?: string
  /** Seller ID if selected */
  sellerId?: string
  /** Timestamp when the data was saved */
  timestamp: number
  /** Version number for migration compatibility */
  version: number
}

/**
 * Keyboard shortcut registry entry
 */
export interface ShortcutRegistryEntry {
  /** The shortcut definition */
  shortcut: KeyboardShortcut
  /** Priority for conflict resolution (higher = higher priority) */
  priority: number
  /** Timestamp when the shortcut was registered */
  registeredAt: number
}

/**
 * Keyboard shortcut registry
 */
export interface ShortcutRegistry {
  [key: string]: ShortcutRegistryEntry
}

/**
 * Focus history entry with context
 */
export interface FocusHistoryEntry {
  /** ID of the element that had focus */
  elementId: string
  /** Timestamp when focus was recorded */
  timestamp: number
  /** Context where focus occurred */
  context: 'modal' | 'page' | 'dropdown'
}
