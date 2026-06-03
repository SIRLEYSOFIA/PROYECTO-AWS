package com.supermarket.sales.repository;

import com.supermarket.sales.config.SalesProperties;
import com.supermarket.sales.domain.Sale;
import com.supermarket.sales.domain.SaleState;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

@Repository
public class DynamoSaleRepository implements SaleRepository {

    private final DynamoDbTable<Sale> table;

    public DynamoSaleRepository(DynamoDbEnhancedClient enhancedClient, SalesProperties properties) {
        this.table = enhancedClient.table(properties.tableName(), TableSchema.fromBean(Sale.class));
    }

    @Override
    public Sale save(Sale sale) {
        table.putItem(sale);
        return sale;
    }

    @Override
    public Optional<Sale> findById(String id) {
        Sale sale = table.getItem(Key.builder().partitionValue(id).build());
        return Optional.ofNullable(sale);
    }

    @Override
    public List<Sale> findByTerminalIdAndStatusOrderByFrozenAtDesc(String terminalId, SaleState status) {
        return table.scan()
                .items()
                .stream()
                .filter(sale -> terminalId.equals(sale.getTerminalId()) && status == sale.getStatus())
                .sorted((a, b) -> {
                    if (a.getFrozenAt() == null) return 1;
                    if (b.getFrozenAt() == null) return -1;
                    return b.getFrozenAt().compareTo(a.getFrozenAt());
                })
                .toList();
    }

    @Override
    public List<Sale> findByStatusOrderByCompletedAtDesc(SaleState status) {
        return table.scan()
                .items()
                .stream()
                .filter(sale -> status == sale.getStatus())
                .sorted((a, b) -> {
                    if (a.getCompletedAt() == null) return 1;
                    if (b.getCompletedAt() == null) return -1;
                    return b.getCompletedAt().compareTo(a.getCompletedAt());
                })
                .toList();
    }

    @Override
    public List<Sale> findByStatusAndFrozenAtBefore(SaleState status, LocalDateTime frozenAt) {
        return table.scan()
                .items()
                .stream()
                .filter(sale -> status == sale.getStatus() &&
                        sale.getFrozenAt() != null &&
                        sale.getFrozenAt().isBefore(frozenAt))
                .toList();
    }
}
