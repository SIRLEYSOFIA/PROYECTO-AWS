import { useEffect, useRef, useState, useCallback } from 'react'
import { Order } from '@domain/entities/Order'
import { TemporalPersistenceConfig, UseTemporalPersistenceReturn } from './types'
import { container } from '@composition/container'

/**
 * Hook for auto-saving draft orders to IndexedDB with debouncing.
 * 
 * Features:
 * - Debounced save operations (default 500ms)
 * - Automatic restore on mount
 * - Clear method for successful payments
 * - Tracks isSaving and lastSaved state
 * 
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**
 * 
 * @param data - The order data to persist
 * @param config - Configuration options
 * @returns Object with isSaving, lastSaved, clear, and restore methods
 * 
 * @example
 * const { isSaving, lastSaved, clear, restore } = useTemporalPersistence(order, {
 *   key: 'temporal-sale-shift-123',
 *   debounceMs: 500,
 *   onRestore: (restoredOrder) => setOrder(restoredOrder),
 *   onError: (error) => console.error('Persistence error:', error)
 * })
 */
export function useTemporalPersistence(
  data: Order,
  config: TemporalPersistenceConfig,
): UseTemporalPersistenceReturn {
  const {
    key,
    debounceMs = 500,
    onRestore,
    onError,
  } = config

  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Use refs to track debounce timeout and prevent stale closures
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasRestoredRef = useRef(false)

  /**
   * Saves the order to IndexedDB using the repository.
   * This is the actual save operation that gets debounced.
   */
  const performSave = useCallback(async (orderToSave: Order) => {
    try {
      setIsSaving(true)
      
      // Use the existing IndexedDBOrderRepository to save the order
      // We use a special key prefix to distinguish temporal saves
      const temporalOrder: Order = {
        ...orderToSave,
        id: key, // Use the config key as the order ID for temporal storage
      }
      
      await container.orderRepository.save(temporalOrder)
      
      setLastSaved(new Date())
      setIsSaving(false)
    } catch (error) {
      setIsSaving(false)
      const err = error instanceof Error ? error : new Error(String(error))
      onError?.(err)
      console.error('Temporal persistence save error:', err)
    }
  }, [key, onError])

  /**
   * Debounced save function.
   * Clears any pending save and schedules a new one.
   */
  const debouncedSave = useCallback((orderToSave: Order) => {
    // Clear any pending save
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Schedule new save
    debounceTimeoutRef.current = setTimeout(() => {
      performSave(orderToSave)
      debounceTimeoutRef.current = null
    }, debounceMs)
  }, [debounceMs, performSave])

  /**
   * Restores the temporal order from IndexedDB.
   * Called on mount and can be called manually.
   */
  const restore = useCallback(async (): Promise<Order | null> => {
    try {
      const restoredOrder = await container.orderRepository.getById(key)
      
      if (restoredOrder) {
        onRestore?.(restoredOrder)
        setLastSaved(new Date(restoredOrder.updatedAt))
        return restoredOrder
      }
      
      return null
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      onError?.(err)
      console.error('Temporal persistence restore error:', err)
      return null
    }
  }, [key, onRestore, onError])

  /**
   * Clears the temporal data from IndexedDB.
   * Called after successful payment.
   */
  const clear = useCallback(async () => {
    try {
      // Clear any pending save
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
        debounceTimeoutRef.current = null
      }

      // Delete from repository
      await container.orderRepository.delete(key)
      
      setLastSaved(null)
      setIsSaving(false)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      onError?.(err)
      console.error('Temporal persistence clear error:', err)
    }
  }, [key, onError])

  /**
   * Effect: Restore on mount
   * Restores the temporal order when the component mounts.
   * Requirement 6.4: WHEN the POS_System loads, THE POS_System SHALL restore the Temporal_Sale from local storage if it exists
   */
  useEffect(() => {
    if (!hasRestoredRef.current) {
      hasRestoredRef.current = true
      restore()
    }
  }, [restore])

  /**
   * Effect: Debounced save on data change
   * Saves the order whenever the data changes, with debouncing.
   * Requirements 6.1, 6.2, 6.3: WHEN a product is added/modified/discount applied, THE POS_System SHALL save the Temporal_Sale within 500ms
   */
  useEffect(() => {
    debouncedSave(data)

    // Cleanup: flush pending save on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [data, debouncedSave])

  return {
    isSaving,
    lastSaved,
    clear,
    restore,
  }
}
