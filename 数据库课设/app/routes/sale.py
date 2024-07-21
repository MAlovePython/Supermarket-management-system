from flask import Blueprint, render_template, request, jsonify, current_app
from app import db
from app.models import Sale, Product, Employee
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError

bp = Blueprint('sale', __name__, url_prefix='/sale')


@bp.route('/')
def sales():
    current_app.logger.info('Accessing sales page')
    sales = Sale.query.all()
    products = Product.query.all()
    employees = Employee.query.all()
    return render_template('sale.html', sales=sales, products=products, employees=employees)


@bp.route('/add', methods=['POST'])
def add_sale():
    current_app.logger.info('Adding new sale')
    try:
        data = request.json
        product_id = int(data['product_id'])
        employee_id = int(data['employee_id'])
        quantity = int(data['quantity'])
        unit_price = float(data['unit_price'])
        sale_date = datetime.strptime(data['sale_date'], '%Y-%m-%d').date()

        product = Product.query.get(product_id)
        if product is None:
            raise ValueError("Product not found")

        if product.stock < quantity:
            raise ValueError("Insufficient stock")

        new_sale = Sale(product_id=product_id, employee_id=employee_id, quantity=quantity,
                        unit_price=unit_price, sale_date=sale_date)
        db.session.add(new_sale)

        # Update stock
        product.stock -= quantity

        db.session.commit()
        current_app.logger.info(f'Successfully added new sale for product ID: {product_id}')
        return jsonify({'success': True, 'message': '销售记录添加成功'})
    except ValueError as e:
        db.session.rollback()
        current_app.logger.error(f'Error adding sale: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error adding sale: {str(e)}')
        return jsonify({'success': False, 'message': '添加销售记录失败'}), 500


@bp.route('/search')
def search_sale():
    current_app.logger.info('Searching sales')
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        employee_id = request.args.get('employee_id')

        query = Sale.query

        if start_date:
            query = query.filter(Sale.sale_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
        if end_date:
            query = query.filter(Sale.sale_date <= datetime.strptime(end_date, '%Y-%m-%d').date())
        if employee_id:
            query = query.filter(Sale.employee_id == employee_id)

        sales = query.all()
        return jsonify([sale_to_dict(s) for s in sales])
    except Exception as e:
        current_app.logger.error(f'Error searching sales: {str(e)}')
        return jsonify({'error': 'An error occurred while searching sales'}), 500


@bp.route('/list')
def list_sales():
    try:
        sales = Sale.query.all()
        return jsonify([sale_to_dict(s) for s in sales])
    except Exception as e:
        current_app.logger.error(f'Error listing sales: {str(e)}')
        return jsonify({'error': 'An error occurred while listing sales'}), 500


@bp.route('/<int:id>', methods=['GET'])
def get_sale(id):
    current_app.logger.info(f'Fetching sale with id: {id}')
    try:
        sale = Sale.query.get_or_404(id)
        result = sale_to_dict(sale, include_ids=True)
        current_app.logger.info(f'Returning sale data: {result}')
        return jsonify(result)
    except SQLAlchemyError as e:
        current_app.logger.error(f'Error fetching sale: {str(e)}')
        return jsonify({'error': 'An error occurred while fetching the sale'}), 500


@bp.route('/edit/<int:id>', methods=['POST'])
def edit_sale(id):
    current_app.logger.info(f'Editing sale with id: {id}')
    try:
        data = request.json
        current_app.logger.info(f'Received edit data: {data}')
        sale = Sale.query.get_or_404(id)

        old_quantity = sale.quantity
        new_quantity = int(data['quantity'])

        sale.product_id = int(data['product_id'])
        sale.employee_id = int(data['employee_id'])
        sale.quantity = new_quantity
        sale.unit_price = float(data['unit_price'])
        sale.sale_date = datetime.strptime(data['sale_date'], '%Y-%m-%d').date()

        # Update stock
        product = Product.query.get(sale.product_id)
        if product is None:
            raise ValueError("Product not found")

        stock_change = old_quantity - new_quantity
        if product.stock + stock_change < 0:
            raise ValueError("Insufficient stock")

        product.stock += stock_change

        db.session.commit()
        current_app.logger.info(f'Successfully updated sale: {id}')
        return jsonify({'success': True, 'message': '销售记录修改成功'})
    except ValueError as e:
        db.session.rollback()
        current_app.logger.error(f'Error updating sale: {str(e)}')
        return jsonify({'success': False, 'message': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error updating sale: {str(e)}')
        return jsonify({'success': False, 'message': '修改销售记录失败'}), 500


from flask import jsonify, current_app
from sqlalchemy.exc import SQLAlchemyError
from app import db
from app.models import Sale, Product

@bp.route('/delete/<int:id>', methods=['POST'])
def delete_sale(id):
    current_app.logger.info(f'Attempting to delete sale with id: {id}')
    try:
        sale = Sale.query.get(id)
        if not sale:
            current_app.logger.warning(f'Sale with id {id} not found')
            return jsonify({'success': False, 'message': '销售记录不存在'}), 404

        current_app.logger.info(f'Sale found: {sale}')

        # 更新库存
        product = Product.query.get(sale.product_id)
        if product:
            current_app.logger.info(f'Updating stock for product {product.product_id}')
            product.stock += sale.quantity
        else:
            current_app.logger.warning(f'Product not found for sale {id}')

        db.session.delete(sale)
        db.session.commit()
        current_app.logger.info(f'Sale {id} deleted successfully')
        return jsonify({'success': True, 'message': '销售记录删除成功'})
    except SQLAlchemyError as e:
        db.session.rollback()
        error_msg = str(e)
        current_app.logger.error(f'Database error when deleting sale {id}: {error_msg}')
        return jsonify({'success': False, 'message': f'数据库错误：{error_msg}'}), 500
    except Exception as e:
        db.session.rollback()
        error_msg = str(e)
        current_app.logger.error(f'Unexpected error when deleting sale {id}: {error_msg}')
        return jsonify({'success': False, 'message': f'删除销售记录时发生意外错误：{error_msg}'}), 500
@bp.route('/statistics')
def sale_statistics():
    current_app.logger.info('Fetching sale statistics')
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        query = Sale.query

        if start_date:
            query = query.filter(Sale.sale_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
        if end_date:
            query = query.filter(Sale.sale_date <= datetime.strptime(end_date, '%Y-%m-%d').date())

        sales = query.all()
        total_amount = sum(s.quantity * s.unit_price for s in sales)
        total_quantity = sum(s.quantity for s in sales)

        return jsonify({
            'total_amount': float(total_amount),
            'total_quantity': total_quantity
        })
    except Exception as e:
        current_app.logger.error(f'Error fetching sale statistics: {str(e)}')
        return jsonify({'error': 'An error occurred while fetching sale statistics'}), 500


def sale_to_dict(sale, include_ids=False):
    result = {
        'id': sale.sale_id,
        'product_name': sale.product.name if sale.product else 'Unknown',
        'employee_name': sale.employee.name if sale.employee else 'Unknown',
        'quantity': sale.quantity,
        'unit_price': float(sale.unit_price),
        'total_price': float(sale.quantity * sale.unit_price),
        'sale_date': sale.sale_date.strftime('%Y-%m-%d')
    }
    if include_ids:
        result.update({
            'sale_id': sale.sale_id,
            'product_id': sale.product_id,
            'employee_id': sale.employee_id
        })
    return result