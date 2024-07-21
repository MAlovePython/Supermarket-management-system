from flask import Blueprint, render_template, request, jsonify, current_app
from app import db
from app.models import Purchase, Product, Supplier
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError

bp = Blueprint('purchase', __name__, url_prefix='/purchase')

@bp.route('/')
def purchases():
    current_app.logger.info('Accessing purchases page')
    purchases = Purchase.query.all()
    products = Product.query.all()
    suppliers = Supplier.query.all()
    return render_template('purchase.html', purchases=purchases, products=products, suppliers=suppliers)

@bp.route('/add', methods=['POST'])
def add_purchase():
    current_app.logger.info('Adding new purchase')
    try:
        data = request.json
        product_id = int(data['product_id'])
        supplier_id = int(data['supplier_id'])
        quantity = int(data['quantity'])
        unit_price = float(data['unit_price'])
        purchase_date = datetime.strptime(data['purchase_date'], '%Y-%m-%d').date()

        product = Product.query.get(product_id)
        if product is None:
            raise ValueError("Product not found")

        new_purchase = Purchase(product_id=product_id, supplier_id=supplier_id, quantity=quantity,
                                unit_price=unit_price, purchase_date=purchase_date)
        db.session.add(new_purchase)

        # 更新库存
        product.stock += quantity

        db.session.commit()
        current_app.logger.info(f'Successfully added new purchase for product ID: {product_id}')
        return jsonify({'success': True, 'message': '进货记录添加成功'})
    except ValueError as e:
        db.session.rollback()
        current_app.logger.error(f'Error adding purchase: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error adding purchase: {str(e)}')
        return jsonify({'success': False, 'message': '添加进货记录失败'}), 500

@bp.route('/search')
def search_purchase():
    current_app.logger.info('Searching purchases')
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        query = Purchase.query

        if start_date:
            query = query.filter(Purchase.purchase_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
        if end_date:
            query = query.filter(Purchase.purchase_date <= datetime.strptime(end_date, '%Y-%m-%d').date())

        purchases = query.all()
        return jsonify([purchase_to_dict(p) for p in purchases])
    except Exception as e:
        current_app.logger.error(f'Error searching purchases: {str(e)}')
        return jsonify({'error': 'An error occurred while searching purchases'}), 500

@bp.route('/list')
def list_purchases():
    try:
        purchases = Purchase.query.all()
        return jsonify([purchase_to_dict(p) for p in purchases])
    except Exception as e:
        current_app.logger.error(f'Error listing purchases: {str(e)}')
        return jsonify({'error': 'An error occurred while listing purchases'}), 500

@bp.route('/<int:id>', methods=['GET'])
def get_purchase(id):
    current_app.logger.info(f'Fetching purchase with id: {id}')
    try:
        purchase = Purchase.query.get_or_404(id)
        result = purchase_to_dict(purchase, include_ids=True)
        current_app.logger.info(f'Returning purchase data: {result}')
        return jsonify(result)
    except SQLAlchemyError as e:
        current_app.logger.error(f'Error fetching purchase: {str(e)}')
        return jsonify({'error': 'An error occurred while fetching the purchase'}), 500

@bp.route('/edit/<int:id>', methods=['POST'])
def edit_purchase(id):
    current_app.logger.info(f'Editing purchase with id: {id}')
    try:
        data = request.json
        current_app.logger.info(f'Received edit data: {data}')
        purchase = Purchase.query.get_or_404(id)

        old_quantity = purchase.quantity
        new_quantity = int(data['quantity'])

        purchase.product_id = int(data['product_id'])
        purchase.supplier_id = int(data['supplier_id'])
        purchase.quantity = new_quantity
        purchase.unit_price = float(data['unit_price'])
        purchase.purchase_date = datetime.strptime(data['purchase_date'], '%Y-%m-%d').date()

        # 更新库存
        product = Product.query.get(purchase.product_id)
        if product is None:
            raise ValueError("Product not found")
        product.stock += (new_quantity - old_quantity)

        db.session.commit()
        current_app.logger.info(f'Successfully updated purchase: {id}')
        return jsonify({'success': True, 'message': '进货记录修改成功'})
    except ValueError as e:
        db.session.rollback()
        current_app.logger.error(f'Error updating purchase: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error updating purchase: {str(e)}')
        return jsonify({'success': False, 'message': '修改进货记录失败'}), 500

@bp.route('/delete/<int:id>', methods=['POST'])
def delete_purchase(id):
    current_app.logger.info(f'Deleting purchase with id: {id}')
    try:
        purchase = Purchase.query.get_or_404(id)

        # 检查产品是否存在
        product = Product.query.get(purchase.product_id)
        if product is None:
            current_app.logger.warning(f'Product not found for purchase id: {id}')
            db.session.delete(purchase)
            db.session.commit()
            return jsonify({'success': True, 'message': '进货记录删除成功（产品不存在）'})

        # 更新库存
        product.stock -= purchase.quantity

        db.session.delete(purchase)
        db.session.commit()
        current_app.logger.info(f'Successfully deleted purchase: {id}')
        return jsonify({'success': True, 'message': '进货记录删除成功'})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error deleting purchase: {str(e)}')
        return jsonify({'success': False, 'message': '删除进货记录失败'}), 500

def purchase_to_dict(purchase, include_ids=False):
    result = {
        'id': purchase.purchase_id,
        'product_name': purchase.product.name if purchase.product else 'Unknown',
        'supplier_name': purchase.supplier.name if purchase.supplier else 'Unknown',
        'quantity': purchase.quantity,
        'unit_price': float(purchase.unit_price),
        'purchase_date': purchase.purchase_date.strftime('%Y-%m-%d')
    }
    if include_ids:
        result.update({
            'purchase_id': purchase.purchase_id,
            'product_id': purchase.product_id,
            'supplier_id': purchase.supplier_id
        })
    return result