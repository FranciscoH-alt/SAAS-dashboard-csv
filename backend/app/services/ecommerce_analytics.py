import pandas as pd
from fastapi import UploadFile
from typing import List, Optional
from datetime import datetime, timedelta
import io


# ========== HELPERS ==========

async def read_csv_upload(file: UploadFile) -> pd.DataFrame:
    """Read uploaded CSV file into DataFrame"""
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))
    # Strip whitespace from column names
    df.columns = df.columns.str.strip()
    return df


def has_columns(df: pd.DataFrame, cols: List[str]) -> bool:
    """Check if DataFrame has all specified columns (case-insensitive)"""
    df_cols_lower = [col.lower().strip() for col in df.columns]
    return all(col.lower().strip() in df_cols_lower for col in cols)


# ========== NORMALIZERS ==========

def normalize_ecommerce_sales(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize ecommerce_sales.csv format"""
    normalized = pd.DataFrame({
        'order_id': df['Order_ID'],
        'order_date': pd.to_datetime(df['Order_Date'], errors='coerce'),
        'platform': df['Platform'],
        'customer_id': df['Customer_ID'],
        'product_name': df['Product'],
        'unit_price': pd.to_numeric(df['Price'], errors='coerce'),
        'quantity': pd.to_numeric(df['Quantity'], errors='coerce'),
        'discount': pd.to_numeric(df['Discount'], errors='coerce'),
        'revenue': pd.to_numeric(df['Revenue'], errors='coerce'),
        'country': df['Country']
    })
    return normalized.dropna(subset=['order_id', 'order_date'])


def normalize_train_orders(orders_df: pd.DataFrame, items_df: pd.DataFrame, 
                          products_df: Optional[pd.DataFrame] = None,
                          payments_df: Optional[pd.DataFrame] = None) -> pd.DataFrame:
    """Build normalized sales_df from train_df_Orders + train_df_OrderItems"""
    merged = orders_df.merge(items_df, on='order_id', how='inner')
    
    product_name = 'Unknown'
    if products_df is not None:
        merged = merged.merge(
            products_df[['product_id', 'product_category_name']], 
            on='product_id', 
            how='left'
        )
        product_name = merged['product_category_name'].fillna('Unknown')
    
    revenue = pd.to_numeric(merged['price'], errors='coerce') + pd.to_numeric(merged.get('shipping_charges', 0), errors='coerce')
    
    normalized = pd.DataFrame({
        'order_id': merged['order_id'],
        'order_date': pd.to_datetime(merged['order_purchase_timestamp'], errors='coerce'),
        'platform': 'marketplace',
        'customer_id': merged['customer_id'],
        'product_name': product_name,
        'unit_price': pd.to_numeric(merged['price'], errors='coerce'),
        'quantity': 1,
        'discount': 0,
        'revenue': revenue,
        'country': 'Unknown'
    })
    
    return normalized.dropna(subset=['order_id', 'order_date'])


def normalize_shopify_products(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize Shopify product CSV"""
    normalized = pd.DataFrame({
        'sku': df['Variant SKU'],
        'title': df['Title'],
        'category': df['Type'],
        'price': pd.to_numeric(df['Variant Price'], errors='coerce'),
        'cost': pd.to_numeric(df.get('Cost per item', 0), errors='coerce'),
        'inventory_qty': pd.to_numeric(df['Variant Inventory Qty'], errors='coerce')
    })
    normalized['cost'] = normalized['cost'].fillna(0)
    normalized['inventory_qty'] = normalized['inventory_qty'].fillna(0)
    return normalized.dropna(subset=['sku'])


# ========== KPI FUNCTIONS ==========

def compute_financial_kpis(sales_df: pd.DataFrame) -> dict:
    """Compute financial KPIs"""
    gross_sales = (sales_df['unit_price'] * sales_df['quantity']).sum()
    total_discount = sales_df['discount'].sum()
    net_revenue = sales_df['revenue'].sum()
    num_orders = sales_df['order_id'].nunique()
    aov = net_revenue / num_orders if num_orders > 0 else 0
    
    # Assuming net profit = revenue - (cost would be 70% of revenue as estimate)
    estimated_cogs = net_revenue * 0.7
    net_profit = net_revenue - estimated_cogs
    
    # ROAS placeholder (would need ad spend data)
    roas = 0  # Set to 0 if no ad spend data
    
    min_date = sales_df['order_date'].min()
    max_date = sales_df['order_date'].max()
    period_days = (max_date - min_date).days + 1
    revenue_per_day = net_revenue / period_days if period_days > 0 else 0
    
    platform_data = sales_df.groupby('platform')['revenue'].sum().reset_index()
    platform_breakdown = [
        {'platform': row['platform'], 'revenue': float(row['revenue'])}
        for _, row in platform_data.iterrows()
    ]
    
    product_revenue = sales_df.groupby('product_name').agg({
        'revenue': 'sum',
        'order_id': 'nunique'
    }).reset_index()
    product_revenue.columns = ['name', 'revenue', 'orders']
    product_revenue = product_revenue.sort_values('revenue', ascending=False)
    
    top_products = [
        {'name': row['name'], 'revenue': float(row['revenue']), 'orders': int(row['orders'])}
        for _, row in product_revenue.head(10).iterrows()
    ]
    
    bottom_products = [
        {'name': row['name'], 'revenue': float(row['revenue']), 'orders': int(row['orders'])}
        for _, row in product_revenue.tail(10).iterrows()
    ]
    
    return {
        'gross_sales': float(gross_sales),
        'net_revenue': float(net_revenue),
        'net_profit': float(net_profit),
        'total_discount': float(total_discount),
        'num_orders': int(num_orders),
        'aov': float(aov),
        'roas': float(roas),
        'period_days': int(period_days),
        'revenue_per_day': float(revenue_per_day),
        'platform_breakdown': platform_breakdown,
        'top_products': top_products,
        'bottom_products': bottom_products
    }


def compute_inventory_kpis(products_df: pd.DataFrame, sales_df: Optional[pd.DataFrame] = None) -> dict:
    """Compute inventory KPIs"""
    total_inventory_units = int(products_df['inventory_qty'].sum())
    total_inventory_value = float((products_df['inventory_qty'] * products_df['cost']).sum())
    
    inventory_sorted = products_df.sort_values('inventory_qty', ascending=False)
    
    top_inventory = [
        {
            'sku': row['sku'],
            'title': row['title'],
            'inventory_qty': int(row['inventory_qty']),
            'value': float(row['inventory_qty'] * row['cost'])
        }
        for _, row in inventory_sorted.head(10).iterrows()
    ]
    
    bottom_inventory = [
        {
            'sku': row['sku'],
            'title': row['title'],
            'inventory_qty': int(row['inventory_qty']),
            'value': float(row['inventory_qty'] * row['cost'])
        }
        for _, row in inventory_sorted.tail(10).iterrows()
    ]
    
    result = {
        'total_inventory_units': total_inventory_units,
        'total_inventory_value': total_inventory_value,
        'top_inventory': top_inventory,
        'bottom_inventory': bottom_inventory,
        'dioh_by_sku': [],
        'stockout_predictions': []
    }
    
    if sales_df is not None:
        period_days = (sales_df['order_date'].max() - sales_df['order_date'].min()).days + 1
        if period_days > 0:
            product_sales = sales_df.groupby('product_name')['quantity'].sum().to_dict()
            
            for _, row in products_df.iterrows():
                title = row['title']
                inventory_qty = row['inventory_qty']
                
                units_sold = 0
                for prod_name, qty in product_sales.items():
                    if title.lower() in prod_name.lower() or prod_name.lower() in title.lower():
                        units_sold += qty
                        break
                
                daily_sales_rate = units_sold / period_days if period_days > 0 else 0
                dioh = inventory_qty / daily_sales_rate if daily_sales_rate > 0 else 999999
                
                result['dioh_by_sku'].append({
                    'sku': row['sku'],
                    'title': title,
                    'inventory_qty': int(inventory_qty),
                    'units_sold': int(units_sold),
                    'dioh': float(dioh) if dioh < 999999 else None
                })
                
                if dioh < 30 and dioh > 0:
                    stockout_date = datetime.now() + timedelta(days=dioh)
                    result['stockout_predictions'].append({
                        'sku': row['sku'],
                        'title': title,
                        'inventory_qty': int(inventory_qty),
                        'dioh': float(dioh),
                        'predicted_stockout_date': stockout_date.isoformat()
                    })
    
    return result


# ========== ORCHESTRATOR ==========

async def analyze_ecommerce_files(files: List[UploadFile]) -> dict:
    """Main orchestrator"""
    ecommerce_sales_df = None
    train_orders_df = None
    train_items_df = None
    train_products_df = None
    train_payments_df = None
    shopify_products_dfs = []
    
    for file in files:
        try:
            df = await read_csv_upload(file)
            
            # Detect file types with case-insensitive column checking
            if has_columns(df, ['Order_ID', 'Order_Date', 'Platform', 'Product', 'Price', 'Revenue']):
                ecommerce_sales_df = normalize_ecommerce_sales(df)
            elif has_columns(df, ['order_id', 'customer_id', 'order_status', 'order_purchase_timestamp']):
                train_orders_df = df
            elif has_columns(df, ['order_id', 'product_id', 'price']) and 'seller_id' in [c.lower() for c in df.columns]:
                train_items_df = df
            elif has_columns(df, ['product_id', 'product_category_name']):
                train_products_df = df
            elif has_columns(df, ['order_id', 'payment_type', 'payment_value']):
                train_payments_df = df
            elif has_columns(df, ['Handle', 'Title', 'Variant SKU', 'Variant Price', 'Variant Inventory Qty']):
                shopify_products_dfs.append(normalize_shopify_products(df))
        except Exception as e:
            continue
    
    sales_df = None
    if ecommerce_sales_df is not None:
        sales_df = ecommerce_sales_df
    elif train_orders_df is not None and train_items_df is not None:
        sales_df = normalize_train_orders(train_orders_df, train_items_df, train_products_df, train_payments_df)
    
    if sales_df is None or len(sales_df) == 0:
        raise ValueError("No recognizable sales data found in uploaded files")
    
    products_df = None
    if shopify_products_dfs:
        products_df = pd.concat(shopify_products_dfs, ignore_index=True)
    
    financial = compute_financial_kpis(sales_df)
    inventory = compute_inventory_kpis(products_df, sales_df) if products_df is not None else None
    
    return {
        'financial': financial,
        'inventory': inventory,
        'meta': {
            'num_sales_rows': len(sales_df),
            'num_products_rows': len(products_df) if products_df is not None else 0
        }
    }