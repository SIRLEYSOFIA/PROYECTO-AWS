import argparse
import json
from decimal import Decimal
from pathlib import Path

import boto3


def main():
    parser = argparse.ArgumentParser(description="Seed POS products into DynamoDB.")
    parser.add_argument("--table", required=True, help="DynamoDB products table name")
    parser.add_argument(
        "--source",
        default="../../frontend/data/productos.json",
        help="Path to frontend productos.json",
    )
    args = parser.parse_args()

    source = Path(__file__).resolve().parent.joinpath(args.source).resolve()
    products = json.loads(source.read_text(encoding="utf-8"), parse_float=Decimal)

    table = boto3.resource("dynamodb").Table(args.table)
    with table.batch_writer() as batch:
        for product in products:
            if product.get("estado") != "activo":
                continue

            item = {
                "id": Decimal(str(product["id"])),
                "name": product["nombre"],
                "barcode": str(product["id"]),
                "unitPrice": Decimal(str(product["precio"])),
                "availableStock": Decimal("999"),
                "category": product["subcategoria"],
            }
            batch.put_item(Item=item)
            print(f"Seeded {item['id']} - {item['name']}")


if __name__ == "__main__":
    main()
