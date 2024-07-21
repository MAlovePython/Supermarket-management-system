from flask import Blueprint, render_template, request, jsonify, send_file
from app import db
from app.models import Sale, Product, Employee, Purchase
from sqlalchemy import func
from datetime import datetime, timedelta
import traceback
import logging
from sqlalchemy.orm import aliased
import csv
import tempfile
import os
from flask import Blueprint, render_template, request, jsonify, send_file
from io import BytesIO
import csv
from io import StringIO
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

bp = Blueprint('analysis', __name__, url_prefix='/analysis')

@bp.route('/')
def analysis():
    logger.info("Rendering analysis page")
    return render_template('analysis.html')

@bp.route('/sales_trend')
def sales_trend():
    logger.info("Sales trend analysis requested")
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        query = db.session.query(
            func.cast(Sale.sale_date, db.Date).label('date'),
            func.sum(Sale.quantity * Sale.unit_price).label('total_sales')
        )

        if start_date:
            query = query.filter(Sale.sale_date >= datetime.strptime(start_date, '%Y-%m-%d'))
        if end_date:
            query = query.filter(Sale.sale_date <= datetime.strptime(end_date, '%Y-%m-%d'))

        result = query.group_by(func.cast(Sale.sale_date, db.Date)).order_by('date').all()

        return jsonify([{
            'date': item.date.strftime('%Y-%m-%d'),
            'total_sales': float(item.total_sales)
        } for item in result])
    except Exception as e:
        logger.error(f"Error in sales_trend: {str(e)}")
        return jsonify({"error": str(e)}), 500

@bp.route('/top_products')
def top_products():
    logger.info("Top products analysis requested")
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        query = db.session.query(
            Product.name,
            func.sum(Sale.quantity).label('total_quantity'),
            func.sum(Sale.quantity * Sale.unit_price).label('total_sales')
        ).join(Sale)

        if start_date:
            query = query.filter(Sale.sale_date >= datetime.strptime(start_date, '%Y-%m-%d'))
        if end_date:
            query = query.filter(Sale.sale_date <= datetime.strptime(end_date, '%Y-%m-%d'))

        result = query.group_by(Product.name).order_by(func.sum(Sale.quantity * Sale.unit_price).desc()).limit(10).all()

        return jsonify([{
            'product_name': item.name,
            'total_quantity': int(item.total_quantity),
            'total_sales': float(item.total_sales)
        } for item in result])
    except Exception as e:
        logger.error(f"Error in top_products: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@bp.route('/employee_performance')
def employee_performance():
    logger.info("Employee performance analysis requested")
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        query = db.session.query(
            Employee.name,
            func.sum(Sale.quantity).label('total_quantity'),
            func.sum(Sale.quantity * Sale.unit_price).label('total_sales')
        ).join(Sale)

        if start_date:
            query = query.filter(Sale.sale_date >= datetime.strptime(start_date, '%Y-%m-%d'))
        if end_date:
            query = query.filter(Sale.sale_date <= datetime.strptime(end_date, '%Y-%m-%d'))

        result = query.group_by(Employee.name).order_by(func.sum(Sale.quantity * Sale.unit_price).desc()).all()

        return jsonify([{
            'employee_name': item.name,
            'total_quantity': int(item.total_quantity),
            'total_sales': float(item.total_sales)
        } for item in result])
    except Exception as e:
        logger.error(f"Error in employee_performance: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@bp.route('/profits')
def profits():
    try:
        profit_data = calculate_profits(db)
        return jsonify(profit_data)
    except Exception as e:
        logger.error(f"Error in profits calculation: {str(e)}")
        return jsonify({"error": str(e)}), 500

def calculate_profits(db):
    Sale_alias = aliased(Sale)
    Purchase_alias = aliased(Purchase)

    profit_data = db.session.query(
        Product.product_id,
        Product.name,
        func.avg(Sale_alias.unit_price).label('avg_sale_price'),
        func.avg(Purchase_alias.unit_price).label('avg_purchase_price'),
        (func.avg(Sale_alias.unit_price) - func.avg(Purchase_alias.unit_price)).label('profit_per_unit'),
        func.sum(Sale_alias.quantity).label('total_sold'),
        (func.sum(Sale_alias.quantity * Sale_alias.unit_price) -
         func.sum(Sale_alias.quantity * Purchase_alias.unit_price)).label('total_profit')
    ).join(Sale_alias, Product.product_id == Sale_alias.product_id
    ).join(Purchase_alias, Product.product_id == Purchase_alias.product_id
    ).group_by(Product.product_id, Product.name
    ).all()

    return [
        {
            'product_id': item.product_id,
            'product_name': item.name,
            'avg_sale_price': round(item.avg_sale_price, 2) if item.avg_sale_price else 0,
            'avg_purchase_price': round(item.avg_purchase_price, 2) if item.avg_purchase_price else 0,
            'profit_per_unit': round(item.profit_per_unit, 2) if item.profit_per_unit else 0,
            'total_sold': item.total_sold or 0,
            'total_profit': round(item.total_profit, 2) if item.total_profit else 0
        } for item in profit_data
    ]

@bp.route('/inventory_turnover')
def inventory_turnover():
    logger.info("Inventory turnover analysis requested")
    try:
        current_date = datetime.now()
        start_date = current_date - timedelta(days=30)  # 计算最近30天的周转率

        query = db.session.query(
            Product.name,
            Product.stock,
            func.coalesce(func.sum(Sale.quantity), 0).label('sales')
        ).outerjoin(Sale, db.and_(
            Sale.product_id == Product.product_id,
            Sale.sale_date.between(start_date, current_date)
        )).group_by(Product.product_id, Product.name, Product.stock)

        result = query.all()

        return jsonify([{
            'product_name': item.name,
            'current_stock': item.stock,
            'sales_last_30_days': int(item.sales),
            'turnover_rate': round(float(item.sales) / float(item.stock or 1), 2)
        } for item in result])
    except Exception as e:
        logger.error(f"Error in inventory_turnover: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@bp.route('/generate_report', methods=['POST'])
def generate_report():
    try:
        data = request.json
        report_data = data['data']

        # 使用StringIO对象
        output = StringIO()
        generate_csv_report(output, report_data)

        # 将StringIO的内容转换为字节
        output_bytes = output.getvalue().encode('utf-8-sig')

        # 创建一个BytesIO对象来保存字节数据
        bytes_io = BytesIO(output_bytes)

        # 发送文件
        return send_file(
            bytes_io,
            mimetype='text/csv',
            as_attachment=True,
            download_name='analysis_report.csv',
        )
    except Exception as e:
        logger.error(f"Error in generate_report: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


def generate_csv_report(output, data):
    writer = csv.writer(output, quoting=csv.QUOTE_NONNUMERIC)

    # 销售趋势
    writer.writerow(["销售趋势"])
    writer.writerow(["日期", "销售额"])
    for item in data['salesTrend']:
        writer.writerow([item['date'], item['total_sales']])
    writer.writerow([])  # 空行分隔

    # 热销商品
    writer.writerow(["热销商品"])
    writer.writerow(["商品名称", "销售量", "销售额"])
    for item in data['topProducts']:
        writer.writerow([item['product_name'], item['total_quantity'], item['total_sales']])
    writer.writerow([])

    # 员工业绩
    writer.writerow(["员工业绩"])
    writer.writerow(["员工姓名", "销售量", "销售额"])
    for item in data['employeePerformance']:
        writer.writerow([item['employee_name'], item['total_quantity'], item['total_sales']])
    writer.writerow([])

    # 商品利润
    writer.writerow(["商品利润"])
    writer.writerow(["商品名称", "平均售价", "平均进价", "单位利润", "总销量", "总利润"])
    for item in data['profits']:
        writer.writerow([
            item['product_name'],
            item['avg_sale_price'],
            item['avg_purchase_price'],
            item['profit_per_unit'],
            item['total_sold'],
            item['total_profit']
        ])
    writer.writerow([])

    # 库存周转率
    writer.writerow(["库存周转率"])
    writer.writerow(["商品名称", "当前库存", "30天销量", "周转率"])
    for item in data['inventoryTurnover']:
        writer.writerow([
            item['product_name'],
            item['current_stock'],
            item['sales_last_30_days'],
            item['turnover_rate']
        ])
def generate_csv_report(output, data):
    output.write(b'\xef\xbb\xbf')  # UTF-8 BOM
    writer = csv.writer(output, quoting=csv.QUOTE_NONNUMERIC)

    def writerow(row):
        writer.writerow([str(item).encode('utf-8') for item in row])

    # 销售趋势
    writerow(["销售趋势"])
    writerow(["日期", "销售额"])
    for item in data['salesTrend']:
        writerow([item['date'], item['total_sales']])
    writerow([])  # 空行分隔

    # 热销商品
    writerow(["热销商品"])
    writerow(["商品名称", "销售量", "销售额"])
    for item in data['topProducts']:
        writerow([item['product_name'], item['total_quantity'], item['total_sales']])
    writerow([])

    # 员工业绩
    writerow(["员工业绩"])
    writerow(["员工姓名", "销售量", "销售额"])
    for item in data['employeePerformance']:
        writerow([item['employee_name'], item['total_quantity'], item['total_sales']])
    writerow([])

    # 商品利润
    writerow(["商品利润"])
    writerow(["商品名称", "平均售价", "平均进价", "单位利润", "总销量", "总利润"])
    for item in data['profits']:
        writerow([
            item['product_name'],
            item['avg_sale_price'],
            item['avg_purchase_price'],
            item['profit_per_unit'],
            item['total_sold'],
            item['total_profit']
        ])
    writerow([])

    # 库存周转率
    writerow(["库存周转率"])
    writerow(["商品名称", "当前库存", "30天销量", "周转率"])
    for item in data['inventoryTurnover']:
        writerow([
            item['product_name'],
            item['current_stock'],
            item['sales_last_30_days'],
            item['turnover_rate']
        ])



def generate_csv_report(output, data):
    output.write(b'\xef\xbb\xbf')  # UTF-8 BOM
    writer = csv.writer(output)

    # 销售趋势
    writer.writerow(["销售趋势"])
    writer.writerow(["日期", "销售额"])
    for item in data['salesTrend']:
        writer.writerow([item['date'], item['total_sales']])
    writer.writerow([])  # 空行分隔

    # 热销商品
    writer.writerow(["热销商品"])
    writer.writerow(["商品名称", "销售量", "销售额"])
    for item in data['topProducts']:
        writer.writerow([item['product_name'], item['total_quantity'], item['total_sales']])
    writer.writerow([])

    # 员工业绩
    writer.writerow(["员工业绩"])
    writer.writerow(["员工姓名", "销售量", "销售额"])
    for item in data['employeePerformance']:
        writer.writerow([item['employee_name'], item['total_quantity'], item['total_sales']])
    writer.writerow([])

    # 商品利润
    writer.writerow(["商品利润"])
    writer.writerow(["商品名称", "平均售价", "平均进价", "单位利润", "总销量", "总利润"])
    for item in data['profits']:
        writer.writerow([
            item['product_name'],
            item['avg_sale_price'],
            item['avg_purchase_price'],
            item['profit_per_unit'],
            item['total_sold'],
            item['total_profit']
        ])
    writer.writerow([])

    # 库存周转率
    writer.writerow(["库存周转率"])
    writer.writerow(["商品名称", "当前库存", "30天销量", "周转率"])
    for item in data['inventoryTurnover']:
        writer.writerow([
            item['product_name'],
            item['current_stock'],
            item['sales_last_30_days'],
            item['turnover_rate']
        ])

def generate_csv_report(file, data):
    writer = csv.writer(file)

    # 销售趋势
    writer.writerow(["销售趋势"])
    writer.writerow(["日期", "销售额"])
    for item in data['salesTrend']:
        writer.writerow([item['date'], item['total_sales']])
    writer.writerow([])  # 空行分隔

    # 热销商品
    writer.writerow(["热销商品"])
    writer.writerow(["商品名称", "销售量", "销售额"])
    for item in data['topProducts']:
        writer.writerow([item['product_name'], item['total_quantity'], item['total_sales']])
    writer.writerow([])

    # 员工业绩
    writer.writerow(["员工业绩"])
    writer.writerow(["员工姓名", "销售量", "销售额"])
    for item in data['employeePerformance']:
        writer.writerow([item['employee_name'], item['total_quantity'], item['total_sales']])
    writer.writerow([])

    # 商品利润
    writer.writerow(["商品利润"])
    writer.writerow(["商品名称", "平均售价", "平均进价", "单位利润", "总销量", "总利润"])
    for item in data['profits']:
        writer.writerow([
            item['product_name'],
            item['avg_sale_price'],
            item['avg_purchase_price'],
            item['profit_per_unit'],
            item['total_sold'],
            item['total_profit']
        ])
    writer.writerow([])

    # 库存周转率
    writer.writerow(["库存周转率"])
    writer.writerow(["商品名称", "当前库存", "30天销量", "周转率"])
    for item in data['inventoryTurnover']:
        writer.writerow([
            item['product_name'],
            item['current_stock'],
            item['sales_last_30_days'],
            item['turnover_rate']
        ])