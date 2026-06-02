import { clearSession, getToken } from "./modules/auth.js";

const BACKEND_API_BASE_URL = window.KIRO_BACKEND_API_BASE_URL || "http://localhost:8080";

const cashierFilter = document.getElementById("cashier-filter");
const dateFilter = document.getElementById("date-filter");
const openingCashInput = document.getElementById("opening-cash");
const declaredCashInput = document.getElementById("declared-cash");
const reloadBtn = document.getElementById("reload-btn");
const logoutBtn = document.getElementById("logout-btn");
const messageEl = document.getElementById("message");
const modeLabel = document.getElementById("mode-label");
const salesBody = document.getElementById("sales-body");
const includedCount = document.getElementById("included-count");

const summarySales = document.getElementById("summary-sales");
const summaryTotal = document.getElementById("summary-total");
const summaryExpected = document.getElementById("summary-expected");
const summaryDifference = document.getElementById("summary-difference");
const openingCashLabel = document.getElementById("opening-cash-label");
const cashSalesLabel = document.getElementById("cash-sales-label");
const cardSalesLabel = document.getElementById("card-sales-label");
const mixedSalesLabel = document.getElementById("mixed-sales-label");
const changeLabel = document.getElementById("change-label");
const expectedCashLabel = document.getElementById("expected-cash-label");
const closingStatus = document.getElementById("closing-status");

let allSales = [];

function todayInputValue() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatTime(value) {
  const date = saleDate(value);
  if (!date) return "-";
  return date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

function saleDate(value) {
  if (!value) return null;
  const date = typeof value === "number" ? new Date(value * 1000) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateInputFromSale(value) {
  const date = saleDate(value);
  if (!date) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function setMessage(text, isError = false) {
  messageEl.textContent = text;
  messageEl.classList.toggle("error", isError);
}

async function apiFetch(path) {
  const token = getToken();
  if (!token) {
    window.location.replace("/login.html");
    return null;
  }

  const response = await fetch(`${BACKEND_API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    clearSession();
    window.location.replace("/login.html");
    return null;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.message || `Error ${response.status}`);
  }
  return data;
}

function normalizeSale(sale) {
  const products = Array.isArray(sale.products) ? sale.products : [];
  const items = products.length ? products : Array.isArray(sale.items) ? sale.items : [];
  const payment = sale.payment || {};
  const cashAmount = parseNumber(payment.cashAmount);
  const cardAmount = parseNumber(payment.cardAmount);
  const changeDue = parseNumber(payment.changeDue);
  const total = parseNumber(sale.total ?? sale.grandTotal);

  let paymentMethod = "Efectivo";
  if (cashAmount > 0 && cardAmount > 0) paymentMethod = "Mixto";
  if (cashAmount === 0 && cardAmount > 0) paymentMethod = "Tarjeta";

  return {
    id: sale.transactionId || sale.id || sale.saleId || "-",
    createdAt: sale.completedAt || sale.createdAt,
    cashier: sale.cashierId || sale.cashier || "-",
    itemCount: items.reduce((sum, item) => sum + parseNumber(item.quantity), 0),
    total,
    cashAmount,
    cardAmount,
    changeDue,
    paymentMethod,
    status: sale.status || "COMPLETED",
  };
}

function filteredSales() {
  const cashier = cashierFilter.value.trim().toLowerCase();
  const date = dateFilter.value;

  return allSales.filter((sale) => {
    const matchesCashier = !cashier || String(sale.cashier).toLowerCase().includes(cashier);
    const matchesDate = !date || dateInputFromSale(sale.createdAt) === date;
    return matchesCashier && matchesDate && sale.status === "COMPLETED";
  });
}

function calculateClosing(sales) {
  const openingCash = parseNumber(openingCashInput.value);
  const declaredCash = parseNumber(declaredCashInput.value);
  const cashSales = sales.reduce((sum, sale) => sum + sale.cashAmount, 0);
  const cardSales = sales.reduce((sum, sale) => sum + sale.cardAmount, 0);
  const changes = sales.reduce((sum, sale) => sum + sale.changeDue, 0);
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const mixedCount = sales.filter((sale) => sale.cashAmount > 0 && sale.cardAmount > 0).length;
  const expectedCash = openingCash + cashSales - changes;
  const difference = declaredCashInput.value === "" ? null : declaredCash - expectedCash;

  return {
    openingCash,
    declaredCash,
    cashSales,
    cardSales,
    changes,
    totalSales,
    mixedCount,
    expectedCash,
    difference,
  };
}

function renderSalesTable(sales) {
  includedCount.textContent = sales.length === 1 ? "1 registro" : `${sales.length} registros`;

  if (!sales.length) {
    salesBody.innerHTML = '<tr><td colspan="6">No hay ventas para este filtro.</td></tr>';
    return;
  }

  salesBody.innerHTML = sales.map((sale) => `
    <tr>
      <td>${formatTime(sale.createdAt)}</td>
      <td>${sale.id}</td>
      <td>${sale.cashier}</td>
      <td>${sale.itemCount}</td>
      <td><span class="payment-pill">${sale.paymentMethod}</span></td>
      <td class="amount">${formatMoney(sale.total)}</td>
    </tr>
  `).join("");
}

function renderClosingStatus(difference) {
  closingStatus.className = "closing-status";

  if (difference === null) {
    closingStatus.textContent = "Ingrese el efectivo contado para calcular el cuadre.";
    return;
  }

  if (difference === 0) {
    closingStatus.textContent = "Caja cuadrada: el efectivo contado coincide con lo esperado.";
    closingStatus.classList.add("ok");
    return;
  }

  if (difference > 0) {
    closingStatus.textContent = `Sobrante de caja: ${formatMoney(difference)}.`;
    closingStatus.classList.add("warn");
    return;
  }

  closingStatus.textContent = `Faltante de caja: ${formatMoney(Math.abs(difference))}.`;
  closingStatus.classList.add("bad");
}

function renderClosing() {
  const sales = filteredSales();
  const closing = calculateClosing(sales);

  summarySales.textContent = String(sales.length);
  summaryTotal.textContent = formatMoney(closing.totalSales);
  summaryExpected.textContent = formatMoney(closing.expectedCash);
  summaryDifference.textContent = closing.difference === null ? "$0" : formatMoney(closing.difference);

  openingCashLabel.textContent = formatMoney(closing.openingCash);
  cashSalesLabel.textContent = formatMoney(closing.cashSales);
  cardSalesLabel.textContent = formatMoney(closing.cardSales);
  mixedSalesLabel.textContent = String(closing.mixedCount);
  changeLabel.textContent = formatMoney(closing.changes);
  expectedCashLabel.textContent = formatMoney(closing.expectedCash);

  renderClosingStatus(closing.difference);
  renderSalesTable(sales);
}

async function loadSales() {
  setMessage("Cargando ventas...");
  modeLabel.textContent = window.KIRO_BACKEND_MODE === "serverless" ? "Modo AWS/SAM" : "Modo local";

  try {
    const data = await apiFetch("/api/sales?limit=100");
    if (!data) return;
    allSales = (Array.isArray(data) ? data : []).map(normalizeSale);
    renderClosing();
    setMessage(`Cuadre calculado con ${allSales.length} venta(s) recientes.`);
  } catch (error) {
    setMessage(error?.message || "No fue posible cargar las ventas.", true);
  }
}

dateFilter.value = todayInputValue();
reloadBtn.addEventListener("click", loadSales);
[cashierFilter, dateFilter, openingCashInput, declaredCashInput].forEach((input) => {
  input.addEventListener("input", renderClosing);
  input.addEventListener("change", renderClosing);
});

logoutBtn.addEventListener("click", () => {
  clearSession();
  window.location.replace("/login.html");
});

loadSales();
