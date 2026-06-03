package org.example.FrontendProductos.config;

import org.example.FrontendProductos.segurity.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                        "/",
                                        "/index.html",
                                        "/login.html",
                                        "/register.html",
                                        "/productos.html",
                                        "/pos.html",
                                        "/ventas.html",
                                        "/cuadre.html",
                                        "/usuarios.html",
                                        "/app.js",
                                        "/config.js",
                                        "/login.css",
                                        "/register.css",
                                        "/productos.css",
                                        "/pos.css",
                                        "/ventas.css",
                                        "/cuadre.css",
                                        "/usuarios.css",
                                        "/login.js",
                                        "/register.js",
                                        "/productos.js",
                                        "/pos.js",
                                        "/ventas.js",
                                        "/cuadre.js",
                                        "/usuarios.js",
                                        "/modules/**",
                                        "/tests/**",
                                        "/auth",
                                        "/register",
                                        "/favicon.ico"
                                ).permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
