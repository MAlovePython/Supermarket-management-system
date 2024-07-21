from flask import Blueprint, render_template, request, jsonify, redirect, url_for
from app import db
from app.models import Product, Category, Supplier

bp = Blueprint('product', __name__)  # 修正这里的 __name__

@bp.route('/products')
def products():
    products = Product.query.all()
    categories = Category.query.distinct(Category.name).all()
    suppliers = Supplier.query.all()
    return render_template('product.html', products=products, categories=categories, suppliers=suppliers)

@bp.route('/product/add', methods=['POST'])
def add_product():
    try:
        data = request.json  # 改为接收 JSON 数据
        name = data['name']
        category_id = data['category_id']
        price = data['price']
        stock = data['stock']
        supplier_id = data['supplier_id']

        new_product = Product(name=name, category_id=category_id, price=price, stock=stock, supplier_id=supplier_id)
        db.session.add(new_product)
        db.session.commit()

        return jsonify({'success': True, 'message': '商品添加成功'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'添加商品失败: {str(e)}'}), 400

@bp.route('/product/<int:id>', methods=['GET'])
def get_product(id):
    product = Product.query.get_or_404(id)
    return jsonify({
        'product_id': product.product_id,
        'name': product.name,
        'category_id': product.category_id,
        'price': float(product.price),
        'stock': product.stock,
        'supplier_id': product.supplier_id
    })

@bp.route('/product/edit/<int:id>', methods=['POST'])
def edit_product(id):
    try:
        data = request.json
        print(f"Received data for product {id}: {data}")  # 添加日志
        product = Product.query.get_or_404(id)
        product.name = data['name']
        product.category_id = data['category_id']
        product.price = data['price']
        product.stock = data['stock']
        product.supplier_id = data['supplier_id']

        db.session.commit()
        print(f"Successfully updated product {id}")  # 添加日志

        return jsonify({'success': True, 'message': '商品修改成功'})
    except Exception as e:
        db.session.rollback()
        print(f"Error updating product {id}: {str(e)}")  # 添加日志
        return jsonify({'success': False, 'message': f'修改商品失败: {str(e)}'}), 400

@bp.route('/product/delete/<int:id>', methods=['POST'])
def delete_product(id):
    try:
        product = Product.query.get_or_404(id)
        db.session.delete(product)
        db.session.commit()

        return jsonify({'success': True, 'message': '商品删除成功'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'删除商品失败: {str(e)}'}), 400

@bp.route('/product/search')
def search_product():
    query = request.args.get('query', '')
    products = Product.query.filter(Product.name.ilike(f'%{query}%')).all()
    return jsonify([{
        'id': p.product_id,
        'name': p.name,
        'category': p.category.name,
        'price': float(p.price),
        'stock': p.stock,
        'supplier': p.supplier.name
    } for p in products])