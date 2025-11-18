"""
Seed database with initial product data from JSON file
"""

import json
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import SessionLocal, init_db
from app.db_models import ProductDB, CategoryDB, StoreDB


def seed_database(json_path: str = "data/products_dataset.json"):
    """Load products from JSON and insert into database"""

    # Initialize database tables
    init_db()

    # Load JSON data
    path = Path(json_path)
    if not path.exists():
        path = Path(__file__).parent.parent.parent / json_path

    if not path.exists():
        print(f"Error: Dataset not found at {path}")
        return False

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    products_data = data.get("products", [])
    print(f"Found {len(products_data)} products to seed")

    # Create database session
    db = SessionLocal()

    try:
        # Clear existing data (optional - comment out for production)
        db.query(ProductDB).delete()
        db.query(CategoryDB).delete()
        db.commit()

        # Track categories
        categories = {}

        # Insert products
        for product_data in products_data:
            # Get or create category
            category_name = product_data.get("category", "Other")
            if category_name not in categories:
                category = CategoryDB(name=category_name)
                db.add(category)
                db.flush()
                categories[category_name] = category.id

            # Create product
            product = ProductDB(
                id=product_data["id"],
                barcode=product_data.get("barcode"),
                name=product_data["name"],
                brand=product_data.get("brand"),
                category=category_name,
                category_id=categories[category_name],
                price=product_data["price"],
                unit=product_data.get("unit", "unit"),
                quantity=product_data.get("quantity", 1.0),
                store=product_data.get("store"),
                nutrition=product_data.get("nutrition"),
                sustainability=product_data.get("sustainability"),
                description=product_data.get("description"),
                ingredients=product_data.get("ingredients"),
                allergens=product_data.get("allergens"),
                labels=product_data.get("labels"),
                in_stock=product_data.get("in_stock", True),
                stock_location=product_data.get("stock_location"),
                image_url=product_data.get("image_url"),
            )
            db.add(product)

        # Add sample stores
        stores = [
            StoreDB(
                name="Jumbo Kennedy",
                address="Av. Kennedy 9001, Las Condes",
                latitude=-33.4000,
                longitude=-70.5670,
                is_organic=True,
                is_local=True,
                rating=4.2
            ),
            StoreDB(
                name="Lider Providencia",
                address="Av. Providencia 2124, Providencia",
                latitude=-33.4256,
                longitude=-70.6092,
                is_organic=False,
                is_local=True,
                rating=4.0
            ),
            StoreDB(
                name="Santa Isabel Vitacura",
                address="Av. Vitacura 6715, Vitacura",
                latitude=-33.3989,
                longitude=-70.5723,
                is_organic=True,
                is_local=True,
                rating=4.3
            ),
            StoreDB(
                name="Unimarc Nunoa",
                address="Av. Irarrazaval 3450, Nunoa",
                latitude=-33.4534,
                longitude=-70.5967,
                is_organic=False,
                is_local=True,
                rating=3.8
            ),
            StoreDB(
                name="Tottus La Florida",
                address="Av. Vicuna Mackenna 6100, La Florida",
                latitude=-33.5167,
                longitude=-70.5833,
                is_organic=True,
                is_local=False,
                rating=4.1
            ),
        ]

        for store in stores:
            db.add(store)

        # Commit all changes
        db.commit()

        # Verify
        product_count = db.query(ProductDB).count()
        category_count = db.query(CategoryDB).count()
        store_count = db.query(StoreDB).count()

        print(f"Database seeded successfully!")
        print(f"  - Products: {product_count}")
        print(f"  - Categories: {category_count}")
        print(f"  - Stores: {store_count}")

        return True

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        return False
    finally:
        db.close()


def seed_stores_only():
    """Seed only stores data"""
    init_db()
    db = SessionLocal()

    try:
        # Check if stores already exist
        existing = db.query(StoreDB).count()
        if existing > 0:
            print(f"Stores already exist ({existing}). Skipping.")
            return True

        stores = [
            StoreDB(
                name="Jumbo Kennedy",
                address="Av. Kennedy 9001, Las Condes",
                latitude=-33.4000,
                longitude=-70.5670,
                is_organic=True,
                is_local=True,
                rating=4.2
            ),
            StoreDB(
                name="Lider Providencia",
                address="Av. Providencia 2124, Providencia",
                latitude=-33.4256,
                longitude=-70.6092,
                is_organic=False,
                is_local=True,
                rating=4.0
            ),
            StoreDB(
                name="Santa Isabel Vitacura",
                address="Av. Vitacura 6715, Vitacura",
                latitude=-33.3989,
                longitude=-70.5723,
                is_organic=True,
                is_local=True,
                rating=4.3
            ),
            StoreDB(
                name="Unimarc Nunoa",
                address="Av. Irarrazaval 3450, Nunoa",
                latitude=-33.4534,
                longitude=-70.5967,
                is_organic=False,
                is_local=True,
                rating=3.8
            ),
            StoreDB(
                name="Tottus La Florida",
                address="Av. Vicuna Mackenna 6100, La Florida",
                latitude=-33.5167,
                longitude=-70.5833,
                is_organic=True,
                is_local=False,
                rating=4.1
            ),
        ]

        for store in stores:
            db.add(store)

        db.commit()
        print(f"Seeded {len(stores)} stores")
        return True

    except Exception as e:
        db.rollback()
        print(f"Error seeding stores: {e}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
