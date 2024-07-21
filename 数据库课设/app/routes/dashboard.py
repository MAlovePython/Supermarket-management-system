from flask import Blueprint, render_template, jsonify
from app.models import Sale, Product, Purchase
from sqlalchemy import desc
from datetime import datetime, timedelta

bp = Blueprint('dashboard', __name__)

@bp.route('/')
def index():
    data = get_dashboard_data()
    return render_template('index.html', dashboard_data=data)

@bp.route('/dashboard_data')
def dashboard_data():
    data = get_dashboard_data()
    return jsonify(data)

def get_dashboard_data():
    # 获取最近的5条销售记录
    recent_sales = Sale.query.order_by(desc(Sale.sale_date)).limit(5).all()
    sales_data = [{
        'product': sale.product.name,
        'quantity': sale.quantity,
        'total': float(sale.quantity * sale.unit_price),
        'date': sale.sale_date.strftime('%Y-%m-%d')
    } for sale in recent_sales]

    # 获取库存低于警戒线的商品
    low_stock_items = Product.query.filter(Product.stock < Product.alert_threshold).limit(5).all()
    low_stock_data = [{
        'product': product.name,
        'quantity': product.stock,
        'threshold': product.alert_threshold
    } for product in low_stock_items]

    # 获取最近的5条采购记录
    recent_purchases = Purchase.query.order_by(desc(Purchase.purchase_date)).limit(5).all()
    purchase_data = [{
        'product': purchase.product.name,
        'quantity': purchase.quantity,
        'total': float(purchase.quantity * purchase.unit_price),
        'date': purchase.purchase_date.strftime('%Y-%m-%d')
    } for purchase in recent_purchases]

    return {
        'recent_sales': sales_data,
        'low_stock': low_stock_data,
        'recent_purchases': purchase_data
    }