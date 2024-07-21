from app import db
from datetime import datetime
import os
class Category(db.Model):
    category_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)

class Supplier(db.Model):
    supplier_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    contact_person = db.Column(db.String(50))
    phone = db.Column(db.String(20))
    address = db.Column(db.String(200))

class Product(db.Model):
    product_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.category_id'))
    price = db.Column(db.Numeric(10, 2))
    stock = db.Column(db.Integer)
    supplier_id = db.Column(db.Integer, db.ForeignKey('supplier.supplier_id'))
    alert_threshold = db.Column(db.Integer, default=0)  # 新增字段

    category = db.relationship('Category', backref='products')
    supplier = db.relationship('Supplier', backref='products')
class Employee(db.Model):
    employee_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    position = db.Column(db.String(50))
    phone = db.Column(db.String(20))
    hire_date = db.Column(db.Date)

class Purchase(db.Model):
    purchase_id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.product_id'))
    supplier_id = db.Column(db.Integer, db.ForeignKey('supplier.supplier_id'))
    quantity = db.Column(db.Integer)
    unit_price = db.Column(db.Numeric(10, 2))
    purchase_date = db.Column(db.Date)

    product = db.relationship('Product', backref='purchases')
    supplier = db.relationship('Supplier', backref='purchases')

class Sale(db.Model):
    sale_id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.product_id'))
    quantity = db.Column(db.Integer)
    unit_price = db.Column(db.Numeric(10, 2))
    sale_date = db.Column(db.Date)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.employee_id'))

    product = db.relationship('Product', backref='sales')
    employee = db.relationship('Employee', backref='sales')
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///your_database.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False