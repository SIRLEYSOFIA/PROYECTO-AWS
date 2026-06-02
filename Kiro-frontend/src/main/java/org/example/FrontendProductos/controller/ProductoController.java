package org.example.FrontendProductos.controller;


import jakarta.validation.Valid;
import org.example.FrontendProductos.dto.ProductoRequest;
import org.example.FrontendProductos.dto.ProductoResponse;
import org.example.FrontendProductos.model.Producto;
import org.example.FrontendProductos.service.ProductoService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/productos")
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping
    public ResponseEntity<ProductoResponse> listar(
            @RequestParam(defaultValue = "") String nombre,
            @RequestParam(defaultValue = "") String subcategoria,
            @RequestParam(defaultValue = "") String estado,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "5") int limit
    ) {
        List<Producto> filtrados = productoService.listar(nombre, subcategoria, estado);

        int total = filtrados.size();
        int totalPages = (int) Math.ceil((double) total / limit);
        int fromIndex = Math.max(0, (page - 1) * limit);
        int toIndex = Math.min(fromIndex + limit, total);

        List<Producto> paginados = fromIndex >= total ? List.of() : filtrados.subList(fromIndex, toIndex);

        return ResponseEntity.ok(new ProductoResponse(
                paginados,
                total,
                page,
                limit,
                totalPages == 0 ? 1 : totalPages
        ));
    }

    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody ProductoRequest request) {
        Producto creado = productoService.crear(request);
        return ResponseEntity.status(201).body(Map.of(
                "message", "Producto creado correctamente",
                "producto", creado
        ));
    }
    @PatchMapping("/{id}/estado")
    public ResponseEntity<?> cambiarEstado(@PathVariable Long id) {
        Producto actualizado = productoService.cambiarEstado(id);
        return ResponseEntity.ok(Map.of(
                "message", "Estado del producto actualizado correctamente",
                "producto", actualizado
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @Valid @RequestBody ProductoRequest request) {
        Producto actualizado = productoService.actualizar(id, request);
        return ResponseEntity.ok(Map.of(
                "message", "Producto actualizado correctamente",
                "producto", actualizado
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        Producto eliminado = productoService.eliminar(id);
        return ResponseEntity.ok(Map.of(
                "message", "Producto eliminado correctamente",
                "producto", eliminado
        ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errores = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String campo = ((FieldError) error).getField();
            String mensaje = error.getDefaultMessage();
            errores.put(campo, mensaje);
        });

        return ResponseEntity.badRequest().body(Map.of(
                "message", "Errores de validación",
                "errores", errores
        ));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntime(RuntimeException ex) {
        return ResponseEntity.status(404).body(Map.of(
                "message", ex.getMessage()
        ));
    }
}