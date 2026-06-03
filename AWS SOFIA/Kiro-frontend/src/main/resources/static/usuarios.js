import { clearSession, getCashierName, getToken, getUserRole } from "./modules/auth.js";

const usersBody = document.getElementById("users-body");
const messageEl = document.getElementById("message");
const userForm = document.getElementById("user-form");
const reloadBtn = document.getElementById("reload-btn");
const logoutBtn = document.getElementById("logout-btn");

function setMessage(text, type = "") {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
}

function requireAdmin() {
  if (!getToken()) {
    window.location.replace("/login.html");
    return false;
  }

  if (getUserRole() !== "ADMIN") {
    setMessage("No tienes permiso para administrar usuarios.", "error");
    userForm.style.display = "none";
    return false;
  }

  return true;
}

async function apiFetch(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    clearSession();
    window.location.replace("/login.html");
    return null;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `Error ${response.status}`);
  }
  return data;
}

function renderUsers(users) {
  if (!users.length) {
    usersBody.innerHTML = '<tr><td colspan="4">No hay usuarios registrados.</td></tr>';
    return;
  }

  const currentUser = getCashierName();
  usersBody.innerHTML = users.map((user) => {
    const username = user.usuario || user.username;
    const role = user.rol || user.role;
    const status = user.estado || user.status;
    const self = username === currentUser;

    return `
      <tr>
        <td>${username}</td>
        <td><span class="role-pill">${role}</span></td>
        <td>${status}</td>
        <td>
          <button class="btn btn-danger" data-delete="${username}" ${self ? "disabled" : ""}>
            Borrar
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

async function loadUsers() {
  if (!requireAdmin()) return;

  try {
    setMessage("Cargando usuarios...");
    const users = await apiFetch("/usuarios");
    renderUsers(Array.isArray(users) ? users : []);
    setMessage("Usuarios cargados correctamente.", "success");
  } catch (error) {
    setMessage(error.message || "No fue posible cargar usuarios.", "error");
  }
}

userForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!requireAdmin()) return;

  const usuario = document.getElementById("usuario").value.trim();
  const contrasena = document.getElementById("contrasena").value.trim();
  const rol = document.getElementById("rol").value;

  try {
    await apiFetch("/usuarios", {
      method: "POST",
      body: JSON.stringify({ usuario, contrasena, rol }),
    });
    userForm.reset();
    setMessage("Usuario creado correctamente.", "success");
    loadUsers();
  } catch (error) {
    setMessage(error.message || "No fue posible crear el usuario.", "error");
  }
});

usersBody.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-delete]");
  if (!button || button.disabled || !requireAdmin()) return;

  const username = button.dataset.delete;
  if (!confirm(`¿Borrar el usuario ${username}?`)) return;

  try {
    await apiFetch(`/usuarios/${encodeURIComponent(username)}`, { method: "DELETE" });
    setMessage("Usuario eliminado correctamente.", "success");
    loadUsers();
  } catch (error) {
    setMessage(error.message || "No fue posible borrar el usuario.", "error");
  }
});

reloadBtn.addEventListener("click", loadUsers);
logoutBtn.addEventListener("click", () => {
  clearSession();
  window.location.replace("/login.html");
});

loadUsers();
