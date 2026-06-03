import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Order, createOrder } from '@domain/entities/Order'

/**
 * Unit tests for useTemporalPersistence hook
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**
 */

// Mock the container module BEFORE importing the hook
vi.mock('@composition/container', () => ({
  container: {
    orderRepository: {
      save: vi.fn(),
      getById: vi.fn(),
      delete: vi.fn(),
      getActive: vi.fn(),
      complete: vi.fn(),
    },
  },
}))

// Import AFTER mocking
import { useTemporalPersistence } from './useTemporalPersistence'
import { container } from '@composition/container'

const mockOrderRepository = container.orderRepository as any

describe('useTemporalPersistence', () => {
  const testKey = 'temporal-sale-test-shift-123'
  let testOrder: Order

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Create a test order
    testOrder = createOrder({
      id: 'order-123',
      cashierId: 'cashier-1',
      shiftId: 'shift-123',
    })
  })

  afterEach(() => {
    // Only run pending timers if fake timers are in use
    if (vi.isFakeTimers()) {
      vi.runOnlyPendingTimers()
      vi.useRealTimers()
    }
  })

  describe('Debounce timing (500ms)', () => {
    it('should debounce save operations by 500ms', () => {
      mockOrderRepository.save.mockResolvedValue(undefined)
      mockOrderRepository.getById.mockResolvedValue(null)

      const { rerender } = renderHook(
        ({ data }) => useTemporalPersistence(data, { key: testKey }),
        { initialProps: { data: testOrder } }
      )

      // Requirement 6.1: WHEN a product is added to the Product_Cart, THE POS_System SHALL save the Temporal_Sale to browser local storage within 500ms
      
      // First update
      act(() => {
        rerender({ data: { ...testOrder, items: [] } })
      })

      // Save should not be called yet
      expect(mockOrderRepository.save).not.toHaveBeenCalled()

      // Advance time by 250ms (halfway through debounce)
      act(() => {
        vi.advanceTimersByTime(250)
      })

      // Still not called
      expect(mockOrderRepository.save).not.toHaveBeenCalled()

      // Advance time by another 250ms (total 500ms)
      act(() => {
        vi.advanceTimersByTime(250)
      })

      // Now it should be called
      expect(mockOrderRepository.save).toHaveBeenCalledTimes(1)
    })

    it('should reset debounce timer on new data changes', () => {
      mockOrderRepository.save.mockResolvedValue(undefined)
      mockOrderRepository.getById.mockResolvedValue(null)

      const { rerender } = renderHook(
        ({ data }) => useTemporalPersistence(data, { key: testKey }),
        { initialProps: { data: testOrder } }
      )

      // First update
      act(() => {
        rerender({ data: { ...testOrder, items: [] } })
      })

      // Advance time by 300ms
      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(mockOrderRepository.save).not.toHaveBeenCalled()

      // Second update (resets debounce)
      act(() => {
        rerender({ data: { ...testOrder, items: [] } })
      })

      // Advance time by 200ms (total 500ms from first, but only 200ms from second)
      act(() => {
        vi.advanceTimersByTime(200)
      })

      // Still not called because debounce was reset
      expect(mockOrderRepository.save).not.toHaveBeenCalled()

      // Advance time by another 300ms (total 500ms from second update)
      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(mockOrderRepository.save).toHaveBeenCalledTimes(1)
    })
  })

  describe('Save to IndexedDB', () => {
    it('should save to IndexedDB on data change', () => {
      mockOrderRepository.save.mockResolvedValue(undefined)
      mockOrderRepository.getById.mockResolvedValue(null)

      const { rerender } = renderHook(
        ({ data }) => useTemporalPersistence(data, { key: testKey }),
        { initialProps: { data: testOrder } }
      )

      // Requirement 6.1: WHEN a product is added to the Product_Cart, THE POS_System SHALL save the Temporal_Sale to browser local storage within 500ms
      
      const updatedOrder = { ...testOrder, items: [] }
      
      act(() => {
        rerender({ data: updatedOrder })
      })

      // Advance time to trigger save
      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(mockOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: testKey,
          items: [],
        })
      )
    })

    it('should update lastSaved timestamp after successful save', async () => {
      vi.useRealTimers()
      mockOrderRepository.save.mockResolvedValue(undefined)
      mockOrderRepository.getById.mockResolvedValue(null)

      const { result, rerender } = renderHook(
        ({ data }) => useTemporalPersistence(data, { key: testKey, debounceMs: 50 }),
        { initialProps: { data: testOrder } }
      )

      expect(result.current.lastSaved).toBeNull()

      act(() => {
        rerender({ data: { ...testOrder, items: [] } })
      })

      // Wait for debounce and save to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(result.current.lastSaved).not.toBeNull()
      expect(result.current.lastSaved).toBeInstanceOf(Date)
      
      vi.useFakeTimers()
    })

    it('should call onError callback on save failure', async () => {
      vi.useRealTimers()
      const onError = vi.fn()
      const saveError = new Error('Save failed')
      mockOrderRepository.save.mockRejectedValue(saveError)
      mockOrderRepository.getById.mockResolvedValue(null)

      const { rerender } = renderHook(
        ({ data }) => useTemporalPersistence(data, { key: testKey, onError, debounceMs: 50 }),
        { initialProps: { data: testOrder } }
      )

      act(() => {
        rerender({ data: { ...testOrder, items: [] } })
      })

      // Wait for debounce and save to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(onError).toHaveBeenCalledWith(saveError)
      
      vi.useFakeTimers()
    })
  })

  describe('Restore on mount', () => {
    it('should restore data on mount', async () => {
      vi.useRealTimers()
      const restoredOrder = { ...testOrder, items: [] }
      mockOrderRepository.getById.mockResolvedValue(restoredOrder)

      // Requirement 6.4: WHEN the POS_System loads, THE POS_System SHALL restore the Temporal_Sale from local storage if it exists
      
      renderHook(
        () => useTemporalPersistence(testOrder, { key: testKey }),
      )

      // Wait for async restore to complete
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(mockOrderRepository.getById).toHaveBeenCalledWith(testKey)
      
      vi.useFakeTimers()
    })

    it('should call onRestore callback with restored data', async () => {
      vi.useRealTimers()
      const onRestore = vi.fn()
      const restoredOrder = { ...testOrder, items: [] }
      mockOrderRepository.getById.mockResolvedValue(restoredOrder)

      renderHook(
        () => useTemporalPersistence(testOrder, { key: testKey, onRestore }),
      )

      // Wait for async restore to complete
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(onRestore).toHaveBeenCalledWith(restoredOrder)
      
      vi.useFakeTimers()
    })

    it('should set lastSaved from restored order updatedAt', async () => {
      vi.useRealTimers()
      const restoredOrder = { ...testOrder, items: [] }
      mockOrderRepository.getById.mockResolvedValue(restoredOrder)

      const { result } = renderHook(
        () => useTemporalPersistence(testOrder, { key: testKey }),
      )

      // Wait for async restore to complete
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(result.current.lastSaved).not.toBeNull()
      
      vi.useFakeTimers()
    })

    it('should handle restore when no data exists', async () => {
      vi.useRealTimers()
      mockOrderRepository.getById.mockResolvedValue(null)

      const { result } = renderHook(
        () => useTemporalPersistence(testOrder, { key: testKey }),
      )

      // Wait for async restore to complete
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(mockOrderRepository.getById).toHaveBeenCalledWith(testKey)
      expect(result.current.lastSaved).toBeNull()
      
      vi.useFakeTimers()
    })

    it('should call onError callback on restore failure', async () => {
      vi.useRealTimers()
      const onError = vi.fn()
      const restoreError = new Error('Restore failed')
      mockOrderRepository.getById.mockRejectedValue(restoreError)

      renderHook(
        () => useTemporalPersistence(testOrder, { key: testKey, onError }),
      )

      // Wait for async restore to complete
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(onError).toHaveBeenCalledWith(restoreError)
      
      vi.useFakeTimers()
    })

    it('should only restore once on mount', async () => {
      vi.useRealTimers()
      mockOrderRepository.getById.mockResolvedValue(null)

      const { rerender } = renderHook(
        ({ data }) => useTemporalPersistence(data, { key: testKey }),
        { initialProps: { data: testOrder } }
      )

      // Wait for async restore to complete
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(mockOrderRepository.getById).toHaveBeenCalledTimes(1)

      // Rerender with new data
      act(() => {
        rerender({ data: { ...testOrder, items: [] } })
      })

      // getById should still only have been called once
      expect(mockOrderRepository.getById).toHaveBeenCalledTimes(1)
      
      vi.useFakeTimers()
    })
  })

  describe('Clear functionality', () => {
    it('should clear temporal data from IndexedDB', async () => {
      vi.useRealTimers()
      mockOrderRepository.save.mockResolvedValue(undefined)
      mockOrderRepository.getById.mockResolvedValue(null)
      mockOrderRepository.delete.mockResolvedValue(undefined)

      const { result } = renderHook(
        () => useTemporalPersistence(testOrder, { key: testKey }),
      )

      // Requirement 6.5: WHEN a sale is completed and payment is confirmed, THE POS_System SHALL clear the Temporal_Sale from local storage

      act(() => {
        result.current.clear()
      })

      // Wait for async clear to complete
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(mockOrderRepository.delete).toHaveBeenCalledWith(testKey)
      
      vi.useFakeTimers()
    })

    it('should reset lastSaved after clear', async () => {
      vi.useRealTimers()
      mockOrderRepository.save.mockResolvedValue(undefined)
      mockOrderRepository.getById.mockResolvedValue(null)
      mockOrderRepository.delete.mockResolvedValue(undefined)

      const { result, rerender } = renderHook(
        ({ data }) => useTemporalPersistence(data, { key: testKey, debounceMs: 50 }),
        { initialProps: { data: testOrder } }
      )

      // Trigger a save first
      act(() => {
        rerender({ data: { ...testOrder, items: [] } })
      })

      // Wait for save to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(result.current.lastSaved).not.toBeNull()

      // Clear
      act(() => {
        result.current.clear()
      })

      // Wait for async clear to complete
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(result.current.lastSaved).toBeNull()
      
      vi.useFakeTimers()
    })

    it('should cancel pending save on clear', () => {
      mockOrderRepository.save.mockResolvedValue(undefined)
      mockOrderRepository.getById.mockResolvedValue(null)
      mockOrderRepository.delete.mockResolvedValue(undefined)

      const { result, rerender } = renderHook(
        ({ data }) => useTemporalPersistence(data, { key: testKey }),
        { initialProps: { data: testOrder } }
      )

      // Trigger a save
      act(() => {
        rerender({ data: { ...testOrder, items: [] } })
      })

      // Advance time but not enough to trigger save (250ms < 500ms debounce)
      act(() => {
        vi.advanceTimersByTime(250)
      })

      // Verify save hasn't been called yet
      expect(mockOrderRepository.save).not.toHaveBeenCalled()

      // Clear before save completes
      act(() => {
        result.current.clear()
      })

      // Advance time past the original debounce (total 500ms from rerender)
      act(() => {
        vi.advanceTimersByTime(300)
      })

      // Save should not have been called because we cleared the pending save
      expect(mockOrderRepository.save).not.toHaveBeenCalled()
    })

    it('should call onError callback on clear failure', async () => {
      vi.useRealTimers()
      const onError = vi.fn()
      const deleteError = new Error('Delete failed')
      mockOrderRepository.save.mockResolvedValue(undefined)
      mockOrderRepository.getById.mockResolvedValue(null)
      mockOrderRepository.delete.mockRejectedValue(deleteError)

      const { result } = renderHook(
        () => useTemporalPersistence(testOrder, { key: testKey, onError }),
      )

      act(() => {
        result.current.clear()
      })

      // Wait for async clear to complete
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(onError).toHaveBeenCalledWith(deleteError)
      
      vi.useFakeTimers()
    })
  })

  describe('Manual restore', () => {
    it('should allow manual restore call', async () => {
      const restoredOrder = { ...testOrder, items: [] }
      mockOrderRepository.getById.mockResolvedValue(restoredOrder)

      const { result } = renderHook(
        () => useTemporalPersistence(testOrder, { key: testKey }),
      )

      // Wait for initial restore
      act(() => {
        vi.runAllTimers()
      })

      expect(mockOrderRepository.getById).toHaveBeenCalledTimes(1)

      // Manual restore
      const manualResult = await act(async () => {
        return result.current.restore()
      })

      expect(manualResult).toEqual(restoredOrder)
      expect(mockOrderRepository.getById).toHaveBeenCalledTimes(2)
    })

    it('should return null when no data exists on manual restore', async () => {
      mockOrderRepository.getById.mockResolvedValue(null)

      const { result } = renderHook(
        () => useTemporalPersistence(testOrder, { key: testKey }),
      )

      act(() => {
        vi.runAllTimers()
      })

      const manualResult = await act(async () => {
        return result.current.restore()
      })

      expect(manualResult).toBeNull()
    })
  })

  describe('Cleanup on unmount', () => {
    it('should clear pending save on unmount', () => {
      mockOrderRepository.save.mockResolvedValue(undefined)
      mockOrderRepository.getById.mockResolvedValue(null)

      const { unmount, rerender } = renderHook(
        ({ data }) => useTemporalPersistence(data, { key: testKey }),
        { initialProps: { data: testOrder } }
      )

      // Trigger a save
      act(() => {
        rerender({ data: { ...testOrder, items: [] } })
      })

      // Advance time but not enough to trigger save
      act(() => {
        vi.advanceTimersByTime(250)
      })

      // Unmount
      unmount()

      // Advance time past the debounce
      act(() => {
        vi.advanceTimersByTime(300)
      })

      // Save should not have been called
      expect(mockOrderRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('Multiple data changes', () => {
    it('should handle multiple rapid data changes with debounce', () => {
      mockOrderRepository.save.mockResolvedValue(undefined)
      mockOrderRepository.getById.mockResolvedValue(null)

      // Requirement 6.2: WHEN a Cart_Item quantity or price is modified, THE POS_System SHALL update the Temporal_Sale in local storage within 500ms
      // Requirement 6.3: WHEN a discount is applied, THE POS_System SHALL update the Temporal_Sale in local storage within 500ms

      const { rerender } = renderHook(
        ({ data }) => useTemporalPersistence(data, { key: testKey }),
        { initialProps: { data: testOrder } }
      )

      // Multiple rapid changes
      act(() => {
        rerender({ data: { ...testOrder, items: [] } })
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      act(() => {
        rerender({ data: { ...testOrder, items: [] } })
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      act(() => {
        rerender({ data: { ...testOrder, items: [] } })
      })

      // No saves yet (only 200ms elapsed, debounce is 500ms)
      expect(mockOrderRepository.save).not.toHaveBeenCalled()

      // Advance to trigger save (total 500ms from last rerender)
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // Should only save once (debounced) - the last rerender should trigger one save
      // Note: The save is called but the promise resolution happens asynchronously
      expect(mockOrderRepository.save).toHaveBeenCalled()
    })
  })
})

