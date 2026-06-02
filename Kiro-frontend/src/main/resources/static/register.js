const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

function setMessage(type, text) {
    registerMessage.innerHTML = `<div class="message ${type}">${text}</div>`;
}

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    registerMessage.innerHTML = "";

    const usuario = document.getElementById("usuario").value.trim();
    const contrasena = document.getElementById("contrasena").value.trim();

    try {
        const response = await fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, contrasena })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            setMessage("error", data.message || "No fue posible registrar el usuario");
            return;
        }

        setMessage("success", "Usuario cajero creado correctamente. Ya puedes iniciar sesión.");
        registerForm.reset();
    } catch {
        setMessage("error", "No fue posible conectar con el servidor");
    }
});
