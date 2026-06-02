/**
 * Custom hooks for POS UX optimization
 * Exports all hooks and their type definitions
 */

// Export all types
export type {
  // Keyboard shortcuts
  ShortcutCategory,
  KeyboardShortcut,
  UseKeyboardShortcutsOptions,
  UseKeyboardShortcutsReturn,
  
  // Barcode scanner
  BarcodeScannerConfig,
  BarcodeScannerState,
  
  // Auto focus
  AutoFocusConfig,
  FocusHistory,
  UseAutoFocusReturn,
  
  // Temporal persistence
  TemporalPersistenceConfig,
  UseTemporalPersistenceReturn,
  
  // Search dropdown
  SearchDropdownConfig,
  SearchDropdownState,
  
  // Context types
  KeyboardShortcutContextValue,
  FocusManagerContextValue,
  
  // Storage types
  TemporalSaleData,
  ShortcutRegistryEntry,
  ShortcutRegistry,
  FocusHistoryEntry,
} from './types'

// Export existing hooks
export { useCatalog } from './useCatalog'
export { useOrder } from './useOrder'
export { usePayment } from './usePayment'
export { useSession } from './useSession'

// New hooks will be exported here as they are implemented:
export { useKeyboardShortcuts } from './useKeyboardShortcuts'
export { useBarcodeScanner } from './useBarcodeScanner'
export { useAutoFocus } from './useAutoFocus'
export { useTemporalPersistence } from './useTemporalPersistence'
export { useSearchDropdown } from './useSearchDropdown'
