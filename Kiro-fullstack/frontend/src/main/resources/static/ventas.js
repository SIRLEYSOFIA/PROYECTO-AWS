import { clearSession, getToken } from "./modules/auth.js";

const BACKEND_API_BASE_URL = window.KIRO_BACKEND_API_BASE_URL || "http://localhost:8080";

const salesBody = document.getElementById("sales-body");
const messageEl = document.getElementById("message");
const reloadBtn = document.getElementById("reload-btn");
const logoutBtn = document.getElementById("logout-btn");
const modeLabel = document.getElementById("mode-label");
const summaryCount = document.getElementById("summary-count");
const summaryTotal = document.getElementById("summary-total");
const summaryItems = document.getElementById("summary-items");

function formatMoney(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";
  const date = typeof value === "number" ? new Date(value * 1000) : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-CO");
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
  const subtotal = sale.subtotal ?? 0;
  const total = sale.total ?? sale.grandTotal ?? 0;
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return {
    id: sale.transactionId || sale.id || sale.saleId || "-",
    createdAt: sale.completedAt || sale.createdAt,
    cashier: sale.cashierId || sale.cashier || "-",
    itemCount,
    subtotal,
    total,
    status: sale.status || "COMPLETED",
  };
}

function renderSummary(sales) {
  const total = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const items = sales.reduce((sum, sale) => sum + Number(sale.itemCount || 0), 0);
  summaryCount.textContent = String(sales.length);
  summaryTotal.textContent = formatMoney(total);
  summaryItems.textContent = String(items);
}

function renderSales(sales) {
  renderSummary(sales);

  if (!sales.length) {
    salesBody.innerHTML = '<tr><td colspan="7">Todavia no hay ventas completadas.</td></tr>';
    return;
  }

  salesBody.innerHTML = sales.map((sale) => `
    <tr>
      <td>${sale.id}</td>
      <td>${formatDate(sale.createdAt)}</td>
      <td>${sale.cashier}</td>
      <td>${sale.itemCount}</td>
      <td class="amount">${formatMoney(sale.subtotal)}</td>
      <td class="amount">${formatMoney(sale.total)}</td>
      <td><span class="status">${sale.status}</span></td>
    </tr>
  `).join("");
}

async function loadSales() {
  setMessage("Cargando ventas...");
  modeLabel.textContent = window.KIRO_BACKEND_MODE === "serverless" ? "Modo AWS/SAM" : "Modo local";

  try {
    const data = await apiFetch("/api/sales?limit=50");
    if (!data) return;
    const sales = (Array.isArray(data) ? data : []).map(normalizeSale);
    renderSales(sales);
    setMessage(`Mostrando ${sales.length} venta(s).`);
  } catch (error) {
    setMessage(error?.message || "No fue posible cargar las ventas.", true);
  }
}

reloadBtn.addEventListener("click", loadSales);
logoutBtn.addEventListener("click", () => {
  clearSession();
  window.location.replace("/login.html");
});

loadSales();
