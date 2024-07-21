from flask import Blueprint, render_template, request, jsonify, send_file, current_app
from app import db
from app.models import Product, Category
from sqlalchemy.exc import SQLAlchemyError
bp = Blueprint('inventory', __name__)
from flask import current_app, send_file, jsonify
import io
import csv


@bp.route('/inventory')
def inventory():
    """渲染库存管理页面"""
    products = Product.query.all()
    categories = Category.query.all()
    return render_template('inventory.html', products=products, categories=categories)

@bp.route('/inventory/list')
def inventory_list():
    try:
        current_app.logger.info("Fetching inventory list")
        products = Product.query.all()
        current_app.logger.info(f"Found {len(products)} products")

        inventory_data = []
        for p in products:
            try:
                category_name = p.category.name if p.category else None
            except Exception as e:
                current_app.logger.error(f"Error getting category for product {p.product_id}: {str(e)}")
                category_name = None

            inventory_data.append({
                'product_id': p.product_id,
                'name': p.name,
                'category': category_name,
                'current_stock': p.stock,
                'warning_level': p.alert_threshold or 0
            })

        current_app.logger.info("Successfully prepared inventory data")
        return jsonify(inventory_data)
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error in inventory list: {str(e)}", exc_info=True)
        return jsonify({'error': 'Database error'}), 500
    except Exception as e:
        current_app.logger.error(f"Unexpected error in inventory list: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500
@bp.route('/inventory/set-warning-level/<int:product_id>', methods=['POST'])
def set_warning_level(product_id):
    """设置商品的警戒库存水平"""
    try:
        data = request.json
        warning_level = data.get('warning_level')

        product = Product.query.get_or_404(product_id)
        product.alert_threshold = warning_level
        db.session.commit()

        return jsonify({'success': True, 'message': '警戒线设置成功'})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error setting warning level: {str(e)}")
        return jsonify({'error': 'Failed to set warning level'}), 500


@bp.route('/inventory/generate-report')
def generate_report():
    try:
        current_app.logger.info("Starting to generate inventory report")
        products = Product.query.all()

        if not products:
            current_app.logger.warning("No products found in the database")
            return jsonify({'error': 'No products found'}), 404

        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow(['ID', '名称', '类别', '当前库存', '警戒线', '状态'])
        for product in products:
            try:
                category_name = product.category.name if product.category else 'Unknown'
                alert_threshold = product.alert_threshold or 0  # 使用 0 作为默认值
                status = '低库存' if product.stock < alert_threshold else '正常'
                writer.writerow([
                    product.product_id,
                    product.name,
                    category_name,
                    product.stock,
                    alert_threshold,
                    status
                ])
            except AttributeError as e:
                current_app.logger.error(f"Error processing product {product.product_id}: {str(e)}")

        output.seek(0)
        current_app.logger.info("Inventory report generated successfully")
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8-sig')),
            mimetype='text/csv',
            as_attachment=True,
            download_name='inventory_report.csv'
        )
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error while generating report: {str(e)}", exc_info=True)
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        current_app.logger.error(f"Unexpected error generating inventory report: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500
@bp.route('/product/categories')
def get_categories():
    """获取所有商品类别的API"""
    try:
        categories = Category.query.all()
        return jsonify([c.name for c in categories])
    except Exception as e:
        current_app.logger.error(f"Error fetching categories: {str(e)}")
        return jsonify({'error': 'Failed to fetch categories'}), 500