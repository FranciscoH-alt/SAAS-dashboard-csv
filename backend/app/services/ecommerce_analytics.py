import io
from datetime import datetime
from typing import Dict, List, Optional, Tuple

import pandas as pd
from fastapi import HTTPException, UploadFile

# ---------- CSV / Data Utilities ----------

def read_csv_upload(file: UploadFile) -> pd.DataFrame:
    try:
        content = file.file.read()
        file.file.seek(0)
        return pd.read_csv(io.BytesIO(content))
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=400, detail=f"Failed to read CSV: {exc}")


def has_columns(df: pd.DataFrame, columns: List[str]) -> bool:
    return set(columns).issubset({c.strip() for c in df.columns})


# ---------- Normalizers ----------

def normalize_ecommerce_sales(df: pd.DataFrame) -> pd.DataFrame:
    required = [
        "Order_ID",
        "Order_Date",
        "Platform",
        "Customer_ID",
        "Product",
        "Price",
        "Quantity",
        "Discount",
        "Revenue",
    ]
    if not has_columns(df, required):
        missing = [c for c in required if c not in df.columns]
        raise HTTPException(status_code=422, detail=f"Missing columns for ecommerce_sales.csv: {missing}")

    df = df.copy()
    df["Order_Date"] = pd.to_datetime(df["Order_Date"], errors="coerce")
    df["Quantity"] = pd.to_numeric(df["Quantity"], errors="coerce").fillna(0)
    df["Price"] = pd.to_numeric(df["Price"], errors="coerce").fillna(0.0)
    df["Discount"] = pd.to_numeric(df["Discount"], errors="coerce").fillna(0.0)
    df["Revenue"] = pd.to_numeric(df["Revenue"], errors="coerce").fillna(0.0)

    df["gross_sales"] = df["Price"] * df["Quantity"]
    df["net_revenue"] = df["Revenue"]
    df["sku"] = df.get("Product")
    df["platform"] = df.get("Platform")

    return df[
        [
            "Order_ID",
            "Order_Date",
            "platform",
            "Customer_ID",
            "sku",
            "Product",
            "Quantity",
            "Price",
            "Discount",
            "net_revenue",
            "gross_sales",
        ]
    ].rename(columns={"Order_ID": "order_id", "Order_Date": "order_date", "Product": "product"})


def normalize_train_dataset(
    orders: pd.DataFrame,
    order_items: pd.DataFrame,
    products: Optional[pd.DataFrame] = None,
    payments: Optional[pd.DataFrame] = None,
) -> Tuple[pd.DataFrame, Optional[pd.DataFrame]]:
    order_required = [
        "order_id",
        "customer_id",
        "order_status",
        "order_purchase_timestamp",
        "order_approved_at",
        "order_delivered_timestamp",
        "order_estimated_delivery_date",
    ]
    item_required = ["order_id", "product_id", "seller_id", "price", "shipping_charges"]
    if not has_columns(orders, order_required):
        raise HTTPException(status_code=422, detail="Missing columns for train_df_Orders")
    if not has_columns(order_items, item_required):
        raise HTTPException(status_code=422, detail="Missing columns for train_df_OrderItems")

    orders = orders.copy()
    order_items = order_items.copy()

    orders["order_purchase_timestamp"] = pd.to_datetime(
        orders["order_purchase_timestamp"], errors="coerce"
    )
    order_items["price"] = pd.to_numeric(order_items["price"], errors="coerce").fillna(0.0)
    order_items["shipping_charges"] = pd.to_numeric(
        order_items["shipping_charges"], errors="coerce"
    ).fillna(0.0)

    merged = order_items.merge(orders[["order_id", "order_purchase_timestamp"]], on="order_id", how="left")
    merged["Quantity"] = 1
    merged["Price"] = merged["price"] + merged["shipping_charges"]
    merged["Discount"] = 0.0
    merged["Revenue"] = merged["Price"]
    merged["platform"] = "train_df"

    sales_df = merged.rename(
        columns={
            "order_purchase_timestamp": "order_date",
            "product_id": "sku",
            "seller_id": "Customer_ID",
        }
    )[
        [
            "order_id",
            "order_date",
            "platform",
            "Customer_ID",
            "sku",
            "Price",
            "Quantity",
            "Discount",
            "Revenue",
        ]
    ]
    sales_df["gross_sales"] = sales_df["Price"] * sales_df["Quantity"]
    sales_df["net_revenue"] = sales_df["Revenue"]

    normalized_products = None
    if products is not None:
        prod_required = [
            "product_id",
            "product_category_name",
            "product_weight_g",
            "product_length_cm",
            "product_height_cm",
            "product_width_cm",
        ]
        if has_columns(products, prod_required):
            prod = products.copy()
            prod["sku"] = prod["product_id"]
            prod.rename(columns={"product_category_name": "title"}, inplace=True)
            normalized_products = prod[["sku", "title"]]

    return sales_df, normalized_products


def normalize_shopify_products(df: pd.DataFrame) -> pd.DataFrame:
    required = [
        "Handle",
        "Title",
        "Variant SKU",
        "Variant Inventory Qty",
        "Variant Price",
        "Cost per item",
    ]
    if not has_columns(df, required):
        missing = [c for c in required if c not in df.columns]
        raise HTTPException(status_code=422, detail=f"Missing columns for Shopify products: {missing}")

    df = df.copy()
    df["Variant Inventory Qty"] = pd.to_numeric(df["Variant Inventory Qty"], errors="coerce").fillna(0)
    df["Variant Price"] = pd.to_numeric(df["Variant Price"], errors="coerce").fillna(0.0)
    df["Cost per item"] = pd.to_numeric(df["Cost per item"], errors="coerce").fillna(pd.NA)

    df.rename(
        columns={
            "Variant SKU": "sku",
            "Title": "title",
            "Variant Inventory Qty": "inventory_qty",
            "Variant Price": "price",
            "Cost per item": "cost",
        },
        inplace=True,
    )
    return df[["sku", "title", "inventory_qty", "price", "cost"]]


# ---------- KPI Engine ----------

def _safe_sum(series: pd.Series) -> float:
    return float(series.fillna(0).sum())


def compute_financial_kpis(sales_df: pd.DataFrame) -> Dict:
    if sales_df.empty:
        return {
            "gross_sales": 0.0,
            "net_revenue": 0.0,
            "average_order_value": 0.0,
            "gross_profit": 0.0,
            "revenue_by_platform": [],
            "top_products": [],
            "bottom_products": [],
            "revenue_daily": [],
        }

    sales_df = sales_df.copy()
    sales_df["order_date"] = pd.to_datetime(sales_df["order_date"], errors="coerce")

    gross_sales = _safe_sum(sales_df.get("gross_sales", pd.Series(dtype=float)))
    net_revenue = _safe_sum(sales_df.get("net_revenue", pd.Series(dtype=float)))
    unique_orders = sales_df["order_id"].nunique() or 1
    average_order_value = net_revenue / unique_orders

    if "cost" in sales_df.columns:
        sales_df["cogs"] = sales_df["cost"].fillna(0) * sales_df.get("Quantity", 1)
        gross_profit = _safe_sum(sales_df["net_revenue"] - sales_df["cogs"])
    else:
        gross_profit = 0.0

    revenue_by_platform = (
        sales_df.groupby("platform")["net_revenue"].sum().reset_index()
        if "platform" in sales_df.columns
        else pd.DataFrame(columns=["platform", "net_revenue"])
    )

    top_products = (
        sales_df.groupby(["sku", "product"], dropna=False)["net_revenue"].sum().reset_index()
        if "product" in sales_df.columns
        else sales_df.groupby("sku")["net_revenue"].sum().reset_index(name="net_revenue")
    )
    top_products = top_products.sort_values("net_revenue", ascending=False)

    revenue_daily = sales_df.dropna(subset=["order_date"]).groupby(
        sales_df["order_date"].dt.date
    )["net_revenue"].sum().reset_index(name="net_revenue")

    return {
        "gross_sales": gross_sales,
        "net_revenue": net_revenue,
        "average_order_value": average_order_value,
        "gross_profit": gross_profit,
        "revenue_by_platform": revenue_by_platform.to_dict(orient="records"),
        "top_products": top_products.head(10).to_dict(orient="records"),
        "bottom_products": top_products.tail(10).to_dict(orient="records"),
        "revenue_daily": revenue_daily.to_dict(orient="records"),
    }


def compute_inventory_kpis(products_df: pd.DataFrame, sales_df: Optional[pd.DataFrame] = None) -> Dict:
    if products_df is None or products_df.empty:
        return {
            "inventory_on_hand": 0,
            "inventory_value": 0.0,
            "days_of_inventory_on_hand": None,
            "stockout_predictions": [],
        }

    products = products_df.copy()
    products["inventory_qty"] = pd.to_numeric(products["inventory_qty"], errors="coerce").fillna(0)
    products["cost"] = pd.to_numeric(products.get("cost", pd.Series(dtype=float)), errors="coerce")

    inventory_on_hand = int(products["inventory_qty"].sum())
    inventory_value = float((products["inventory_qty"] * products["cost"].fillna(0)).sum())

    avg_daily_usage = None
    if sales_df is not None and not sales_df.empty:
        sales_df = sales_df.copy()
        sales_df["order_date"] = pd.to_datetime(sales_df["order_date"], errors="coerce")
        daily = (
            sales_df.dropna(subset=["order_date"])
            .groupby(["sku", sales_df["order_date"].dt.date])["Quantity"]
            .sum()
            .reset_index(name="qty")
        )
        avg_daily = daily.groupby("sku")["qty"].mean().reset_index(name="avg_daily_qty")
        products = products.merge(avg_daily, on="sku", how="left")
        total_daily = products["avg_daily_qty"].fillna(0).sum()
        avg_daily_usage = total_daily if total_daily > 0 else None
    else:
        products["avg_daily_qty"] = None

    if avg_daily_usage:
        days_of_inventory_on_hand = inventory_on_hand / avg_daily_usage if avg_daily_usage else None
    else:
        days_of_inventory_on_hand = None

    stockout_predictions = []
    for _, row in products.iterrows():
        if pd.isna(row.get("avg_daily_qty")) or row.get("avg_daily_qty", 0) <= 0:
            continue
        days_left = row["inventory_qty"] / row["avg_daily_qty"] if row["avg_daily_qty"] else None
        if days_left is not None:
            stockout_predictions.append({
                "sku": row.get("sku"),
                "title": row.get("title"),
                "days_left": float(days_left),
            })

    return {
        "inventory_on_hand": inventory_on_hand,
        "inventory_value": inventory_value,
        "days_of_inventory_on_hand": float(days_of_inventory_on_hand) if days_of_inventory_on_hand else None,
        "stockout_predictions": stockout_predictions,
    }


# ---------- Pipeline Orchestrator ----------

def analyze_ecommerce_files(files: List[UploadFile]) -> Dict:
    sales_frames: List[pd.DataFrame] = []
    product_frames: List[pd.DataFrame] = []

    train_parts = {"orders": None, "items": None, "products": None, "payments": None}

    for file in files:
        df = read_csv_upload(file)

        if has_columns(
            df,
            ["Order_ID", "Order_Date", "Platform", "Customer_ID", "Product", "Price", "Quantity", "Discount", "Revenue"],
        ):
            sales_frames.append(normalize_ecommerce_sales(df))
            continue

        if has_columns(
            df,
            ["order_id", "customer_id", "order_status", "order_purchase_timestamp", "order_approved_at", "order_delivered_timestamp", "order_estimated_delivery_date"],
        ):
            train_parts["orders"] = df
            continue

        if has_columns(df, ["order_id", "product_id", "seller_id", "price", "shipping_charges"]):
            train_parts["items"] = df
            continue

        if has_columns(
            df,
            [
                "product_id",
                "product_category_name",
                "product_weight_g",
                "product_length_cm",
                "product_height_cm",
                "product_width_cm",
            ],
        ):
            train_parts["products"] = df
            continue

        if has_columns(df, ["order_id", "payment_sequential", "payment_type", "payment_installments", "payment_value"]):
            train_parts["payments"] = df
            continue

        if has_columns(
            df,
            [
                "Handle",
                "Title",
                "Body (HTML)",
                "Vendor",
                "Type",
                "Tags",
                "Published",
                "Option1 Name",
                "Option1 Value",
                "Option2 Name",
                "Option2 Value",
                "Option3 Name",
                "Option3 Value",
                "Variant SKU",
                "Variant Grams",
                "Variant Inventory Tracker",
                "Variant Inventory Qty",
                "Variant Inventory Policy",
                "Variant Fulfillment Service",
                "Variant Price",
                "Variant Compare At Price",
                "Variant Requires Shipping",
                "Variant Taxable",
                "Variant Barcode",
                "Image Src",
                "Image Position",
                "Image Alt Text",
                "Gift Card",
                "SEO Title",
                "SEO Description",
                "Google Shopping / Google Product Category",
                "Google Shopping / Gender",
                "Google Shopping / Age Group",
                "Google Shopping / MPN",
                "Google Shopping / AdWords Grouping",
                "Google Shopping / AdWords Labels",
                "Google Shopping / Condition",
                "Google Shopping / Custom Product",
                "Google Shopping / Custom Label 0",
                "Google Shopping / Custom Label 1",
                "Google Shopping / Custom Label 2",
                "Google Shopping / Custom Label 3",
                "Google Shopping / Custom Label 4",
                "Variant Image",
                "Variant Weight Unit",
                "Variant Tax Code",
                "Cost per item",
            ],
        ):
            product_frames.append(normalize_shopify_products(df))
            continue

        raise HTTPException(status_code=400, detail=f"Unrecognized file format: {file.filename}")

    if train_parts["orders"] is not None and train_parts["items"] is not None:
        sales_df, products_df = normalize_train_dataset(
            train_parts["orders"],
            train_parts["items"],
            products=train_parts["products"],
            payments=train_parts["payments"],
        )
        sales_frames.append(sales_df)
        if products_df is not None:
            product_frames.append(products_df)

    sales_df = pd.concat(sales_frames, ignore_index=True) if sales_frames else pd.DataFrame()
    products_df = pd.concat(product_frames, ignore_index=True) if product_frames else pd.DataFrame()

    financial_kpis = compute_financial_kpis(sales_df)
    inventory_kpis = compute_inventory_kpis(products_df, sales_df if not sales_df.empty else None)

    return {
        "financial_kpis": financial_kpis,
        "inventory_kpis": inventory_kpis,
        "row_counts": {
            "sales_rows": int(len(sales_df)),
            "product_rows": int(len(products_df)),
        },
    }
