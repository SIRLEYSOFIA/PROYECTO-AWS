import json
import os
import time
import uuid
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Attr


dynamodb = boto3.resource("dynamodb")
products_table = dynamodb.Table(os.environ["PRODUCTS_TABLE_NAME"])
sales_table = dynamodb.Table(os.environ["SALES_TABLE_NAME"])


def handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method", "")
    path = event.get("rawPath", "")

    if method == "OPTIONS":
        return response(204, None)

    try:
        if path in ("/api/products", "/productos") and method == "GET":
            params = event.get("queryStringParameters") or {}
            return response(200, search_products(params) if params else list_products())
        if path in ("/api/products", "/productos") and method == "POST":
            return response(201, save_product(parse_body(event)))
        if path == "/api/products/search" and method == "GET":
            return response(200, search_products(event.get("queryStringParameters") or {}))
        if path in ("/api/sales", "/ventas") and method == "POST":
            return response(201, save_sale(parse_body(event)))
        if path in ("/api/sales", "/ventas") and method == "GET":
            return response(200, list_sales(event.get("queryStringParameters") or {}))

        return response(404, {"message": "Route not found"})
    except ValueError as error:
        return response(400, {"message": str(error)})
    except Exception as error:
        print(error)
        return response(500, {"message": "Internal server error"})


def list_products():
    items = scan_all(products_table)
    return sorted([to_frontend_product(item) for item in items], key=lambda product: product["name"])


def search_products(params):
    name = (params.get("name") or "").strip().lower()
    barcode = (params.get("barcode") or "").strip()

    if barcode:
        result = products_table.scan(FilterExpression=Attr("barcode").eq(barcode))
        items = result.get("Items", [])
        if not items:
            return []
        return to_frontend_product(items[0])

    if not name:
        return list_products()

    items = scan_all(products_table)
    matches = [
        to_frontend_product(item)
        for item in items
        if name in str(item.get("name", "")).lower()
        or name in str(item.get("category", "")).lower()
    ]
    return sorted(matches, key=lambda product: product["name"])


def save_product(payload):
    required = ["id", "name", "unitPrice", "category"]
    missing = [field for field in required if payload.get(field) in (None, "")]
    if missing:
        raise ValueError("Missing required fields: " + ", ".join(missing))

    product = {
        "id": Decimal(str(payload["id"])),
        "name": str(payload["name"]),
        "barcode": str(payload.get("barcode") or payload["id"]),
        "unitPrice": Decimal(str(payload["unitPrice"])),
        "availableStock": Decimal(str(payload.get("availableStock", 999))),
        "category": str(payload["category"]),
    }

    products_table.put_item(Item=product)
    return to_frontend_product(product)


def save_sale(payload):
    products = normalize_sale_products(payload)
    if not products:
        raise ValueError("Sale must include at least one product")

    sale_id = payload.get("id") or str(uuid.uuid4())
    now = int(time.time())

    sale = {
        "id": sale_id,
        "createdAt": now,
        "cashier": str(payload.get("cashier") or "cashier"),
        "terminalId": str(payload.get("terminalId") or "POS-01"),
        "products": to_decimal(products),
        "iva": Decimal(str(payload.get("iva", 0))),
        "subtotal": Decimal(str(payload.get("subtotal", 0))),
        "discount": Decimal(str(payload.get("discount", 0))),
        "total": Decimal(str(payload.get("total", 0))),
        "payment": to_decimal(payload.get("payment") or {}),
        "status": "COMPLETED",
    }

    sales_table.put_item(Item=sale)
    return from_decimal(sale)


def normalize_sale_products(payload):
    raw_products = payload.get("products")
    if not isinstance(raw_products, list):
        raw_products = payload.get("items")
    if not isinstance(raw_products, list):
        return []

    products = []
    for item in raw_products:
        if not isinstance(item, dict):
            continue

        product_id = item.get("productId", item.get("producId"))
        product_name = item.get("productName", item.get("name", "Producto"))
        product_price = item.get("productPrice", item.get("unitPrice", 0))
        product_cost = item.get("productCost", item.get("cost", 0))
        quantity = item.get("quantity", 1)

        products.append(
            {
                "productId": Decimal(str(product_id)),
                "productName": str(product_name),
                "productPrice": Decimal(str(product_price)),
                "productCost": Decimal(str(product_cost)),
                "quantity": Decimal(str(quantity)),
            }
        )

    return products


def list_sales(params):
    limit = int(params.get("limit") or 50)
    limit = max(1, min(limit, 100))
    items = scan_all(sales_table)
    sales = sorted(items, key=lambda sale: int(sale.get("createdAt", 0)), reverse=True)
    return [from_decimal(sale) for sale in sales[:limit]]


def scan_all(table):
    items = []
    kwargs = {}
    while True:
        result = table.scan(**kwargs)
        items.extend(result.get("Items", []))
        if "LastEvaluatedKey" not in result:
            return items
        kwargs["ExclusiveStartKey"] = result["LastEvaluatedKey"]


def parse_body(event):
    body = event.get("body")
    if not body:
        return {}
    return json.loads(body)


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
        "body": "" if body is None else json.dumps(from_decimal(body), ensure_ascii=False),
    }


def to_frontend_product(item):
    return {
        "id": int(item["id"]),
        "name": item.get("name", ""),
        "barcode": item.get("barcode", str(item["id"])),
        "unitPrice": float(item.get("unitPrice", 0)),
        "availableStock": int(item.get("availableStock", 0)),
        "category": item.get("category", ""),
    }


def to_decimal(value):
    if isinstance(value, list):
        return [to_decimal(item) for item in value]
    if isinstance(value, dict):
        return {key: to_decimal(item) for key, item in value.items()}
    if isinstance(value, float):
        return Decimal(str(value))
    return value


def from_decimal(value):
    if isinstance(value, list):
        return [from_decimal(item) for item in value]
    if isinstance(value, dict):
        return {key: from_decimal(item) for key, item in value.items()}
    if isinstance(value, Decimal):
        if value % 1 == 0:
            return int(value)
        return float(value)
    return value
