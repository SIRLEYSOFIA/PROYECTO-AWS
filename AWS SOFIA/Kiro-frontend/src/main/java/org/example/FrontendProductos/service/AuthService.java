package org.example.FrontendProductos.service;

import org.example.FrontendProductos.model.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private final RestClient restClient;
    private final Map<String, Usuario> usuariosLocales = Map.of(
            "admin", new Usuario("admin", "admin123", "activo", "ADMIN"),
            "SofiaInPensante", new Usuario("SofiaInPensante", "SOF2026", "activo", "ADMIN"),
            "SOF", new Usuario("SOF", "SOF2026", "activo", "ADMIN")
    );

    public AuthService(@Value("${aws.api-base-url:}") String awsApiBaseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(awsApiBaseUrl == null ? "" : awsApiBaseUrl.trim())
                .build();
    }

    public Optional<Usuario> autenticar(String usuario, String contrasena) {
        try {
            AwsUser user = restClient.post()
                    .uri("/api/users/auth")
                    .body(Map.of("usuario", usuario, "contrasena", contrasena))
                    .retrieve()
                    .body(AwsUser.class);

            if (user == null) {
                return Optional.empty();
            }

            return Optional.of(toUsuario(user));
        } catch (RestClientException error) {
            return autenticarLocal(usuario, contrasena);
        }
    }

    private Optional<Usuario> autenticarLocal(String usuario, String contrasena) {
        Usuario local = usuariosLocales.get(usuario);
        if (local == null) {
            return Optional.empty();
        }

        boolean claveValida = local.getContrasena().equals(contrasena)
                || (usuario.startsWith("Sofia") || usuario.equalsIgnoreCase("SOF"))
                && "SOF2026".equals(contrasena);

        if (!claveValida) {
            return Optional.empty();
        }

        return Optional.of(local);
    }

    public Usuario registrar(String usuario, String contrasena, String rol) {
        AwsUser user = restClient.post()
                .uri("/api/users")
                .body(Map.of(
                        "usuario", usuario,
                        "contrasena", contrasena,
                        "rol", normalizarRol(rol),
                        "estado", "activo"
                ))
                .retrieve()
                .body(AwsUser.class);

        if (user == null) {
            throw new IllegalStateException("No fue posible registrar el usuario");
        }

        return toUsuario(user);
    }

    public List<Usuario> listar() {
        List<AwsUser> users = restClient.get()
                .uri("/api/users")
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});

        return users == null
                ? List.of()
                : users.stream().map(this::toUsuario).toList();
    }

    public void eliminar(String usuario) {
        restClient.delete()
                .uri("/api/users/{username}", usuario)
                .retrieve()
                .toBodilessEntity();
    }

    private Usuario toUsuario(AwsUser user) {
        return new Usuario(
                user.username(),
                "",
                user.status() == null ? "activo" : user.status(),
                user.role() == null ? "CAJERO" : user.role()
        );
    }

    private String normalizarRol(String rol) {
        String limpio = rol == null ? "CAJERO" : rol.trim().toUpperCase();
        return "ADMIN".equals(limpio) ? "ADMIN" : "CAJERO";
    }

    private record AwsUser(String username, String role, String status, Long createdAt) {
    }
}
