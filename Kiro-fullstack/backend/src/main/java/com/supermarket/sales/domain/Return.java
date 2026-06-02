package com.supermarket.sales.domain;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class Return {

    private String id;
    private String originalSaleId;
    private String returnId;
    private ReturnType returnType;
    private List<ReturnItem> items = new ArrayList<>();
    private LocalDateTime returnDate;


    public void addItem(ReturnItem item) {
        items.add(item);
    }

    public String getId() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOriginalSaleId() {
        return originalSaleId;
    }

    public void setOriginalSaleId(String originalSaleId) {
        this.originalSaleId = originalSaleId;
    }

    public String getReturnId() {
        return returnId;
    }

    public void setReturnId(String returnId) {
        this.returnId = returnId;
    }

    public ReturnType getReturnType() {
        return returnType;
    }

    public void setReturnType(ReturnType returnType) {
        this.returnType = returnType;
    }

    public List<ReturnItem> getItems() {
        return items;
    }

    public void setItems(List<ReturnItem> items) {
        this.items = items;
    }

    public LocalDateTime getReturnDate() {
        return returnDate;
    }

    public void setReturnDate(LocalDateTime returnDate) {
        this.returnDate = returnDate;
    }
}
