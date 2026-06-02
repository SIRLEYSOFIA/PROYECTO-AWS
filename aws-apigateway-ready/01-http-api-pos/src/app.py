import json
import os
import hashlib
import time
import uuid
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Attr


dynamodb = boto3.resource("dynamodb")
products_table = dynamodb.Table(os.environ["PRODUCTS_TABLE_NAME"])
sales_table = dynamodb.Table(os.environ["SALES_TABLE_NAME"])
users_table = dynamodb.Table(os.environ["USERS_TABLE_NAME"])


def handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method", "")
    path = event.get("rawPath", "")

    if method == "OPTIONS":
        return response(204, None)

    try:
        if path == "/api/products" and method == "GET":
            return response(200, list_products())
        if path == "/api/products" and method == "POST":
            return response(201, save_product(parse_body(event)))
        if path.startswith("/api/products/") and method == "PUT":
            return response(200, update_product(product_id_from_path(path), parse_body(event)))
        if path.startswith("/api/products/") and method == "PATCH":
            return response(200, patch_product(product_id_from_path(path), parse_body(event)))
        if path.startswith("/api/products/") and method == "DELETE":
            return response(200, deactivate_product(product_id_from_path(path)))
        if path == "/api/products/search" and method == "GET":
            return response(200, search_products(event.get("queryStringParameters") or {}))
        if path == "/api/sales" and method == "POST":
            return response(201, save_sale(parse_body(event)))
        if path == "/api/sales" and method == "GET":
            return response(200, list_sales(event.get("queryStringParameters") or {}))
        if path == "/api/users/auth" and method == "POST":
            return response(200, authenticate_user(parse_body(event)))
        if path == "/api/users" and method == "GET":
            return response(200, list_users())
        if path == "/api/users" and method == "POST":
            return response(201, save_user(parse_body(event)))
        if path.startswith("/api/users/") and method == "DELETE":
            return response(200, delete_user(username_from_path(path)))

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
    required = ["name", "unitPrice", "category"]
    missing = [field for field in required if payload.get(field) in (None, "")]
    if missing:
        raise ValueError("Missing required fields: " + ", ".join(missing))

    product_id = payload.get("id") or next_product_id()
    product = {
        "id": Decimal(str(product_id)),
        "name": str(payload["name"]),
        "description": str(payload.get("description") or payload.get("name") or ""),
        "barcode": str(payload.get("barcode") or product_id),
        "unitPrice": Decimal(str(payload["unitPrice"])),
        "pricePerQuantity": Decimal(str(payload.get("pricePerQuantity") or payload["unitPrice"])),
        "availableStock": Decimal(str(payload.get("availableStock", 999))),
        "category": str(payload["category"]),
        "status": str(payload.get("status") or "activo"),
    }

    products_table.put_item(Item=product)
    return to_frontend_product(product)


def update_product(product_id, payload):
    current = get_product(product_id)
    merged = {
        **current,
        "id": product_id,
        "name": payload.get("name", current.get("name")),
        "description": payload.get("description", current.get("description", "")),
        "barcode": payload.get("barcode", current.get("barcode", str(product_id))),
        "unitPrice": payload.get("unitPrice", current.get("unitPrice", 0)),
        "pricePerQuantity": payload.get(
            "pricePerQuantity",
            current.get("pricePerQuantity", current.get("unitPrice", 0)),
        ),
        "availableStock": payload.get("availableStock", current.get("availableStock", 999)),
        "category": payload.get("category", current.get("category", "")),
        "status": payload.get("status", current.get("status", "activo")),
    }
    return save_product(merged)


def patch_product(product_id, payload):
    current = get_product(product_id)
    status = payload.get("status")
    if not status:
        status = "inactivo" if current.get("status", "activo") == "activo" else "activo"
    current["status"] = status
    return save_product(current)


def deactivate_product(product_id):
    current = get_product(product_id)
    current["status"] = "inactivo"
    return save_product(current)


def get_product(product_id):
    result = products_table.get_item(Key={"id": Decimal(str(product_id))})
    item = result.get("Item")
    if not item:
        raise ValueError("Product not found")
    return item


def next_product_id():
    items = scan_all(products_table)
    if not items:
        return 1
    return max(int(item.get("id", 0)) for item in items) + 1


def product_id_from_path(path):
    try:
        return int(path.rstrip("/").split("/")[-1])
    except ValueError as error:
        raise ValueError("Invalid product id") from error


def save_sale(payload):
    items = payload.get("items")
    if not isinstance(items, list) or not items:
        raise ValueError("Sale must include at least one item")

    sale_id = payload.get("id") or str(uuid.uuid4())
    now = int(time.time())

    sale = {
        "id": sale_id,
        "createdAt": now,
        "cashier": str(payload.get("cashier") or "cashier"),
        "terminalId": str(payload.get("terminalId") or "POS-01"),
        "items": to_decimal(items),
        "subtotal": Decimal(str(payload.get("subtotal", 0))),
        "discount": Decimal(str(payload.get("discount", 0))),
        "total": Decimal(str(payload.get("total", 0))),
        "payment": to_decimal(payload.get("payment") or {}),
        "status": "COMPLETED",
    }

    sales_table.put_item(Item=sale)
    return from_decimal(sale)


def list_sales(params):
    limit = int(params.get("limit") or 50)
    limit = max(1, min(limit, 100))
    items = scan_all(sales_table)
    sales = sorted(items, key=lambda sale: int(sale.get("createdAt", 0)), reverse=True)
    return [from_decimal(sale) for sale in sales[:limit]]


def authenticate_user(payload):
    username = str(payload.get("usuario") or payload.get("username") or "").strip()
    password = str(payload.get("contrasena") or payload.get("password") or "")
    if not username or not password:
        raise ValueError("Usuario y contraseña son obligatorios")

    result = users_table.get_item(Key={"username": username})
    user = result.get("Item")
    if not user or user.get("passwordHash") != hash_password(password):
        raise ValueError("Credenciales incorrectas")
    if user.get("status", "activo") != "activo":
        raise ValueError("Usuario inactivo")
    return public_user(user)


def list_users():
    users = [public_user(item) for item in scan_all(users_table)]
    return sorted(users, key=lambda user: user["username"].lower())


def save_user(payload):
    username = str(payload.get("usuario") or payload.get("username") or "").strip()
    password = str(payload.get("contrasena") or payload.get("password") or "")
    role = str(payload.get("rol") or payload.get("role") or "CAJERO").strip().upper()
    status = str(payload.get("estado") or payload.get("status") or "activo").strip().lower()

    if not username or not password:
        raise ValueError("Usuario y contraseña son obligatorios")
    if role not in ("ADMIN", "CAJERO"):
        raise ValueError("Rol inválido")
    if status not in ("activo", "inactivo"):
        raise ValueError("Estado inválido")

    now = int(time.time())
    user = {
        "username": username,
        "passwordHash": hash_password(password),
        "role": role,
        "status": status,
        "createdAt": now,
    }
    users_table.put_item(Item=user)
    return public_user(user)


def delete_user(username):
    if not username:
        raise ValueError("Usuario inválido")
    users_table.delete_item(Key={"username": username})
    return {"message": "Usuario eliminado", "username": username}


def username_from_path(path):
    return path.rstrip("/").split("/")[-1]


def hash_password(password):
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def public_user(user):
    return {
        "username": user.get("username", ""),
        "role": user.get("role", "CAJERO"),
        "status": user.get("status", "activo"),
        "createdAt": int(user.get("createdAt", 0)),
    }


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
            "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        },
        "body": "" if body is None else json.dumps(from_decimal(body), ensure_ascii=False),
    }


def to_frontend_product(item):
    return {
        "id": int(item["id"]),
        "name": item.get("name", ""),
        "description": item.get("description", ""),
        "barcode": item.get("barcode", str(item["id"])),
        "unitPrice": float(item.get("unitPrice", 0)),
        "pricePerQuantity": float(item.get("pricePerQuantity", item.get("unitPrice", 0))),
        "availableStock": int(item.get("availableStock", 0)),
        "category": item.get("category", ""),
        "status": item.get("status", "activo"),
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
