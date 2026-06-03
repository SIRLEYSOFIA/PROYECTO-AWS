/**
 * pos.js — Main entry point for the POS frontend.
 *
 * Bootstraps all modules after DOMContentLoaded:
 *   - Auth guard (Task 10.4): redirects to /login.html if no valid session
 *   - Header cashier name (Task 10.1): reads username from JWT via getCashierName()
 *   - Header date/time (Task 10.2): displays current time, updates every 60 seconds
 *   - Logout button (Task 10.3): clears session and redirects to /login.html
 *   - Module initialization (Task 11.1): receipt → payment → cartPanel → search
 *
 * Module initialization order matters:
 *   initReceipt() is called BEFORE initPayment(openReceipt) so the receipt
 *   modal DOM references are resolved before payment tries to use them.
 *   openReceipt (the `open` export from receipt.js) is passed into initPayment
 *   to avoid a circular import between payment.js and receipt.js.
 */

import { isAuthenticated, clearSession, getCashierName } from "./modules/auth.js";
import { initSearch } from "./modules/search.js";
import { initScanner } from "./modules/scanner.js";
import { initCartPanel } from "./modules/cartPanel.js";
import { initPayment } from "./modules/payment.js";
import { initReceipt, open as openReceipt } from "./modules/receipt.js";
import CartStore from "./modules/cart.js";

function lastCartItem() {
  return CartStore.items[CartStore.items.length - 1] ?? null;
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function visibleFocusableElements(scope = document) {
  return Array.from(scope.querySelectorAll(focusableSelector)).filter((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  });
}

function activeKeyboardScope() {
  const visibleModal = Array.from(document.querySelectorAll(".modal-overlay"))
    .find((modal) => modal.style.display !== "none");
  return visibleModal || document;
}

function moveFocusByArrow(event) {
  const forwardKeys = ["ArrowRight", "ArrowDown"];
  const backwardKeys = ["ArrowLeft", "ArrowUp"];
  if (!forwardKeys.includes(event.key) && !backwardKeys.includes(event.key)) return false;

  const focusables = visibleFocusableElements(activeKeyboardScope());
  if (focusables.length === 0) return false;

  const currentIndex = focusables.indexOf(document.activeElement);
  const direction = forwardKeys.includes(event.key) ? 1 : -1;
  const nextIndex = currentIndex === -1
    ? (direction > 0 ? 0 : focusables.length - 1)
    : (currentIndex + direction + focusables.length) % focusables.length;

  event.preventDefault();
  focusables[nextIndex].focus();
  if (typeof focusables[nextIndex].select === "function") {
    focusables[nextIndex].select();
  }
  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  // Task 10.4 — Auth guard: redirect immediately if no valid session
  if (!isAuthenticated()) {
    window.location.replace("/login.html");
    return;
  }

  // Task 10.1 — Render cashier username in the persistent header
  const cashierEl = document.getElementById("header-cashier");
  if (cashierEl) cashierEl.textContent = getCashierName();

  // Task 10.2 — Display current date/time and update every 60 seconds
  function updateDateTime() {
    const el = document.getElementById("header-datetime");
    if (el) el.textContent = new Date().toLocaleString();
  }
  updateDateTime();
  setInterval(updateDateTime, 60000);

  // Task 10.3 — Wire logout button: clear session and redirect to login
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearSession();
      window.location.replace("/login.html");
    });
  }

  // Task 11.1 — Initialize all modules
  // Receipt must be initialized before payment so its DOM refs are ready
  initReceipt();
  initPayment(openReceipt);
  initCartPanel();
  initScanner();
  initSearch();

  const searchInput = document.getElementById("search-name");
  const shortcutsBtn = document.getElementById("shortcuts-btn");
  const shortcutsModal = document.getElementById("shortcuts-modal");
  const shortcutsCloseBtn = document.getElementById("shortcuts-close-btn");
  if (searchInput) searchInput.focus();

  function openShortcuts() {
    if (shortcutsModal) shortcutsModal.style.display = "flex";
  }

  function closeShortcuts() {
    if (shortcutsModal) shortcutsModal.style.display = "none";
    searchInput?.focus();
  }

  shortcutsBtn?.addEventListener("click", openShortcuts);
  shortcutsCloseBtn?.addEventListener("click", closeShortcuts);
  shortcutsModal?.addEventListener("click", (event) => {
    if (event.target === shortcutsModal) closeShortcuts();
  });

  document.addEventListener("keydown", (event) => {
    const activeEl = document.activeElement;
    const isTyping = activeEl && ["INPUT", "TEXTAREA", "SELECT"].includes(activeEl.tagName);
    const paymentOpen = document.getElementById("payment-modal")?.style.display !== "none";
    const shortcutsOpen = shortcutsModal?.style.display !== "none";

    if (moveFocusByArrow(event)) {
      return;
    }

    if (shortcutsOpen && event.key === "Escape") {
      event.preventDefault();
      closeShortcuts();
      return;
    }

    if (event.key === "?" && !isTyping) {
      event.preventDefault();
      openShortcuts();
      return;
    }

    if (event.key === "F2") {
      event.preventDefault();
      searchInput?.focus();
      searchInput?.select();
    }

    if (event.ctrlKey && event.key.toLowerCase() === "l") {
      event.preventDefault();
      if (searchInput) searchInput.value = "";
      searchInput?.dispatchEvent(new Event("input", { bubbles: true }));
      searchInput?.focus();
      return;
    }

    if (event.key === "F8" && !paymentOpen) {
      event.preventDefault();
      document.getElementById("proceed-payment-btn")?.click();
      return;
    }

    if (!paymentOpen && event.ctrlKey && event.key === "Backspace") {
      event.preventDefault();
      if (CartStore.items.length > 0 && window.confirm("¿Vaciar el carrito?")) {
        CartStore.clearCart();
      }
      return;
    }

    if (!isTyping && !paymentOpen && event.key === "+") {
      event.preventDefault();
      const item = lastCartItem();
      if (item) CartStore.setQuantity(item.productId, item.quantity + 1);
      return;
    }

    if (!isTyping && !paymentOpen && event.key === "-") {
      event.preventDefault();
      const item = lastCartItem();
      if (item) CartStore.setQuantity(item.productId, Math.max(0, item.quantity - 1));
      return;
    }

    if (!isTyping && !paymentOpen && event.key === "Delete") {
      event.preventDefault();
      const item = lastCartItem();
      if (item) CartStore.removeItem(item.productId);
      return;
    }

  });
});
