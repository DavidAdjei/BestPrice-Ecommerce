import ast
import json
import random
import re
import pandas as pd

random.seed(42)
SAMPLE_PER_SOURCE = 150

def parse_listish(val):
    """Many columns hold a Python/JSON-ish list or dict as a string."""
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    if isinstance(val, (list, dict)):
        return val
    s = str(val).strip()
    if not s or s.lower() == "nan":
        return None
    for parser in (json.loads, ast.literal_eval):
        try:
            return parser(s)
        except Exception:
            continue
    return None

def clean_text(val, max_len=None):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    s = str(val).strip()
    if not s or s.lower() == "nan":
        return None
    s = re.sub(r"\s+", " ", s)
    return s[:max_len] if max_len else s

def to_number(val):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    if isinstance(val, str):
        val = val.strip().strip('"').strip("'").replace(",", "")
        if not val:
            return None
    try:
        n = float(val)
        return n if n == n else None  # filter NaN
    except (TypeError, ValueError):
        return None

def to_int(val, default=None):
    n = to_number(val)
    return int(n) if n is not None else default

def sample_df(df, n):
    return df.sample(n=min(n, len(df)), random_state=42).reset_index(drop=True)

def leaf_category(path_list, fallback):
    if isinstance(path_list, list) and path_list:
        leaf = clean_text(path_list[-1])
        if leaf:
            return leaf
    return fallback

CANONICAL_CATEGORIES = [
    ("Mobiles & Tablets", ["mobile", "tablet", "handphone", "cell phone", "smartphone"]),
    ("Electronics", ["electronic", "elektronik", "televi", "video", "aksesoris elektronik"]),
    ("Clothing & Fashion", ["cloth", "ropa", "apparel", "fashion", "jewelry", "perhiasan"]),
    ("Shoes", ["shoe", "sepatu", "zapato"]),
    ("Bags & Luggage", ["bag", "luggage", "tas", "travel"]),
    ("Beauty & Health", ["beauty", "health", "kecantikan", "belleza", "salud"]),
    ("Home & Living", ["home", "living", "hogar", "household", "furniture", "textile"]),
    ("Tools & Home Improvement", ["tool", "improvement", "hardware"]),
    ("Kitchen & Dining", ["kitchen", "dining", "cocina"]),
    ("Patio & Garden", ["patio", "garden", "lawn", "jardin"]),
    ("Sports & Outdoors", ["sport", "outdoor", "deporte", "aire libre"]),
    ("Toys & Games", ["toy", "game", "juguete", "hobbies", "collecc"]),
    ("Automotive", ["automotive", "motor", "car ", "vehicle"]),
    ("Office & School Supplies", ["office", "school", "oficina"]),
    ("Pet Supplies", ["pet ", "mascota"]),
    ("Baby & Kids", ["baby", "kids", "bebe", "infant"]),
    ("Food & Grocery", ["food", "grocery", "comida"]),
]

def canonical_category(root, category, title):
    haystack = f"{root} {category} {title}".lower()
    for name, keywords in CANONICAL_CATEGORIES:
        if any(kw in haystack for kw in keywords):
            return name
    return "Other"

def make_specs(pairs):
    """pairs: list of {"name":..,"value":..} -> ["Name: Value", ...]"""
    specs = []
    if isinstance(pairs, list):
        for item in pairs:
            if isinstance(item, dict):
                name = clean_text(item.get("name"))
                value = clean_text(item.get("value"))
                if name and value:
                    specs.append(f"{name}: {value}")
    return specs[:12] if specs else None

def stock_from_flag(flag, reviews_count=0):
    if isinstance(flag, str):
        in_stock = flag.strip().lower() in ("in stock", "true", "1", "yes")
    elif isinstance(flag, bool):
        in_stock = flag
    else:
        in_stock = True
    if not in_stock:
        return 0
    return random.randint(15, 120)

products = []

# ---------------- Amazon ----------------
df = sample_df(pd.read_csv("amazon-products.csv"), SAMPLE_PER_SOURCE)
for _, row in df.iterrows():
    images = parse_listish(row.get("images")) or []
    if not images and clean_text(row.get("image_url")):
        images = [row["image_url"]]
    categories = parse_listish(row.get("categories")) or []
    delivery = parse_listish(row.get("delivery"))
    top_review = clean_text(row.get("top_review"), 600)
    reviews = []
    if top_review:
        reviews.append({
            "name": "Verified Buyer",
            "title": "Customer review",
            "content": top_review,
            "rating": to_int(row.get("rating"), 4) or 4,
        })
    products.append({
        "title": clean_text(row.get("title"), 200),
        "description": clean_text(row.get("description"), 2000),
        "price": to_number(row.get("final_price")) or to_number(row.get("initial_price")) or 0,
        "originalPrice": to_number(row.get("initial_price")),
        "currency": clean_text(row.get("currency")) or "USD",
        "rating": to_number(row.get("rating")),
        "brand": clean_text(row.get("brand")) or clean_text(row.get("manufacturer")),
        "categoryPath": [clean_text(c) for c in categories if clean_text(c)],
        "category": canonical_category(categories[0] if categories else "", leaf_category(categories, "General"), row.get("title")),
        "images": [clean_text(i) for i in images if clean_text(i)][:6],
        "sku": clean_text(row.get("asin")) or clean_text(row.get("model_number")),
        "sourceUrl": clean_text(row.get("url")),
        "sourceMarketplace": "Amazon",
        "sellerName": clean_text(row.get("seller_name")) or clean_text(row.get("manufacturer")) or "Amazon Marketplace Seller",
        "colors": None,
        "sizes": None,
        "deliveryInfo": [clean_text(d) for d in delivery] if isinstance(delivery, list) else None,
        "specs": None,
        "inStock": stock_from_flag(row.get("availability")),
        "reviews": reviews,
    })

# ---------------- Lazada ----------------
df = sample_df(pd.read_csv("lazada-products.csv"), SAMPLE_PER_SOURCE)
for _, row in df.iterrows():
    images = parse_listish(row.get("image")) or []
    breadcrumb = parse_listish(row.get("breadcrumb")) or []
    specs_pairs = parse_listish(row.get("product_specifications"))
    products.append({
        "title": clean_text(row.get("title"), 200),
        "description": clean_text(row.get("product_description"), 2000),
        "price": to_number(row.get("final_price")) or 0,
        "originalPrice": to_number(row.get("initial_price")) or None,
        "currency": clean_text(row.get("currency")) or "IDR",
        "rating": to_number(row.get("rating")),
        "brand": clean_text(row.get("brand")),
        "categoryPath": [clean_text(c) for c in breadcrumb if clean_text(c)],
        "category": canonical_category(breadcrumb[0] if breadcrumb else "", leaf_category(breadcrumb, "General"), row.get("title")),
        "images": [clean_text(i) for i in images if clean_text(i)][:6],
        "sku": clean_text(row.get("sku")) or clean_text(row.get("mpn")),
        "sourceUrl": clean_text(row.get("url")),
        "sourceMarketplace": "Lazada",
        "sellerName": clean_text(row.get("seller_name")) or "Lazada Seller",
        "colors": None,
        "sizes": None,
        "deliveryInfo": None,
        "specs": make_specs(specs_pairs),
        "inStock": stock_from_flag(True),
        "reviews": [],
    })

# ---------------- Shein ----------------
df = sample_df(pd.read_csv("shein-products.csv"), SAMPLE_PER_SOURCE)
for _, row in df.iterrows():
    images = parse_listish(row.get("image_urls")) or []
    if not images and clean_text(row.get("main_image")):
        images = [row["main_image"]]
    category_tree = parse_listish(row.get("category_tree")) or []
    category_names = [clean_text(c.get("name")) if isinstance(c, dict) else clean_text(c) for c in category_tree]
    attrs = parse_listish(row.get("other_attributes"))
    sizes = parse_listish(row.get("all_available_sizes"))
    products.append({
        "title": clean_text(row.get("product_name"), 200),
        "description": clean_text(row.get("description"), 2000),
        "price": to_number(row.get("final_price")) or 0,
        "originalPrice": to_number(row.get("initial_price")),
        "currency": clean_text(row.get("currency")) or "USD",
        "rating": to_number(row.get("rating")),
        "brand": clean_text(row.get("brand")) or "SHEIN",
        "categoryPath": [c for c in category_names if c],
        "category": canonical_category(category_names[0] if category_names else "", clean_text(row.get("category")) or leaf_category(category_names, "General"), row.get("product_name")),
        "images": [clean_text(i) for i in images if clean_text(i)][:6],
        "sku": clean_text(row.get("product_id")) or clean_text(row.get("model_number")),
        "sourceUrl": clean_text(row.get("url")),
        "sourceMarketplace": "Shein",
        "sellerName": "SHEIN",
        "colors": [clean_text(row.get("color"))] if clean_text(row.get("color")) else None,
        "sizes": [s for s in sizes if clean_text(s)] if isinstance(sizes, list) else None,
        "deliveryInfo": None,
        "specs": make_specs(attrs),
        "inStock": stock_from_flag(row.get("in_stock")),
        "reviews": [],
    })

# ---------------- Walmart ----------------
df = sample_df(pd.read_csv("walmart-products.csv"), SAMPLE_PER_SOURCE)
for _, row in df.iterrows():
    images = parse_listish(row.get("image_urls")) or []
    if not images and clean_text(row.get("main_image")):
        images = [row["main_image"]]
    categories = parse_listish(row.get("categories")) or []
    specs_pairs = parse_listish(row.get("specifications"))
    colors = parse_listish(row.get("colors"))
    sizes = parse_listish(row.get("sizes"))
    customer_reviews = parse_listish(row.get("customer_reviews")) or []
    reviews = []
    for r in customer_reviews[:3]:
        if isinstance(r, dict) and clean_text(r.get("review")):
            reviews.append({
                "name": clean_text(r.get("name")) or "Verified Buyer",
                "title": clean_text(r.get("title")) or "Customer review",
                "content": clean_text(r.get("review"), 600),
                "rating": to_int(r.get("rating"), 4) or 4,
            })
    products.append({
        "title": clean_text(row.get("product_name"), 200),
        "description": clean_text(row.get("description"), 2000),
        "price": to_number(row.get("final_price")) or 0,
        "originalPrice": to_number(row.get("initial_price")),
        "currency": clean_text(row.get("currency")) or "USD",
        "rating": to_number(row.get("rating")),
        "brand": clean_text(row.get("brand")),
        "categoryPath": [clean_text(c) for c in categories if clean_text(c)],
        "category": canonical_category(categories[0] if categories else "", clean_text(row.get("category_name")) or leaf_category(categories, "General"), row.get("product_name")),
        "images": [clean_text(i) for i in images if clean_text(i)][:6],
        "sku": clean_text(row.get("upc")) or clean_text(row.get("sku")),
        "sourceUrl": clean_text(row.get("url")),
        "sourceMarketplace": "Walmart",
        "sellerName": clean_text(row.get("seller")) or "Walmart.com",
        "colors": [c for c in colors if clean_text(c)] if isinstance(colors, list) else None,
        "sizes": [s for s in sizes if clean_text(s)] if isinstance(sizes, list) else None,
        "deliveryInfo": ["Free delivery available"] if row.get("available_for_delivery") else None,
        "specs": make_specs(specs_pairs),
        "inStock": stock_from_flag(True),
        "reviews": reviews,
    })

# ---------------- Shopee ----------------
df = sample_df(pd.read_csv("shopee-products.csv"), SAMPLE_PER_SOURCE)
for _, row in df.iterrows():
    images = parse_listish(row.get("image")) or []
    breadcrumb = parse_listish(row.get("breadcrumb")) or []
    specs_pairs = parse_listish(row.get("Product Specifications"))
    products.append({
        "title": clean_text(row.get("title"), 200),
        "description": clean_text(row.get("Product Description"), 2000),
        "price": to_number(row.get("final_price")) or 0,
        "originalPrice": to_number(row.get("initial_price")),
        "currency": clean_text(row.get("currency")) or "MXN",
        "rating": to_number(row.get("rating")),
        "brand": clean_text(row.get("brand")),
        "categoryPath": [clean_text(c) for c in breadcrumb if clean_text(c)],
        "category": canonical_category(breadcrumb[0] if breadcrumb else "", leaf_category(breadcrumb, "General"), row.get("title")),
        "images": [clean_text(i) for i in images if clean_text(i)][:6],
        "sku": clean_text(row.get("id")),
        "sourceUrl": clean_text(row.get("url")),
        "sourceMarketplace": "Shopee",
        "sellerName": clean_text(row.get("seller_name")) or "Shopee Seller",
        "colors": None,
        "sizes": None,
        "deliveryInfo": None,
        "specs": make_specs(specs_pairs),
        "inStock": stock_from_flag(True),
        "reviews": [],
    })

# Drop anything missing the essentials
products = [p for p in products if p["title"] and p["images"] and p["price"] > 0]

print("Total normalized products:", len(products))
by_source = {}
for p in products:
    by_source[p["sourceMarketplace"]] = by_source.get(p["sourceMarketplace"], 0) + 1
print(by_source)

with open("products.seed.json", "w") as f:
    json.dump(products, f, indent=2, ensure_ascii=False)
