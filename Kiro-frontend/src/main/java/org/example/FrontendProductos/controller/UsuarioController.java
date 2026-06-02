package org.example.FrontendProductos.controller;

import org.example.FrontendProductos.model.Usuario;
import org.example.FrontendProductos.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class UsuarioController {

    private final AuthService authService;

    public UsuarioController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        Usuario usuario = authService.registrar(
                request.get("usuario"),
                request.get("contrasena"),
                "CAJERO"
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Usuario registrado correctamente",
                "usuario", usuario.getUsuario(),
                "rol", usuario.getRol()
        ));
    }

    @GetMapping("/usuarios")
    public ResponseEntity<?> list(Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Solo un administrador puede gestionar usuarios"));
        }
        return ResponseEntity.ok(authService.listar());
    }

    @PostMapping("/usuarios")
    public ResponseEntity<?> create(Authentication authentication, @RequestBody Map<String, String> request) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Solo un administrador puede crear usuarios con rol"));
        }
        Usuario usuario = authService.registrar(
                request.get("usuario"),
                request.get("contrasena"),
                request.get("rol")
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(usuario);
    }

    @DeleteMapping("/usuarios/{usuario}")
    public ResponseEntity<?> delete(Authentication authentication, @PathVariable String usuario) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Solo un administrador puede borrar usuarios"));
        }
        if (authentication != null && usuario.equals(authentication.getName())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "No puedes borrar tu propio usuario activo"));
        }
        authService.eliminar(usuario);
        return ResponseEntity.ok(Map.of("message", "Usuario eliminado"));
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}
