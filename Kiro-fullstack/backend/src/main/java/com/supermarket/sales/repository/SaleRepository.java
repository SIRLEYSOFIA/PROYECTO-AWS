package com.supermarket.sales.repository;

import com.supermarket.sales.domain.Sale;
import com.supermarket.sales.domain.SaleState;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SaleRepository {

    Sale save(Sale sale);

    Optional<Sale> findById(String id);

    List<Sale> findByTerminalIdAndStatusOrderByFrozenAtDesc(String terminalId, SaleState status);

    List<Sale> findByStatusOrderByCompletedAtDesc(SaleState status);

    List<Sale> findByStatusAndFrozenAtBefore(SaleState status, LocalDateTime frozenAt);
}
