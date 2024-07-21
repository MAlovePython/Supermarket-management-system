from flask import Blueprint

# 导入所有路由模块
from .product import bp as product_bp
from .supplier import bp as supplier_bp
from .employee import bp as employee_bp
from .purchase import bp as purchase_bp
from .sale import bp as sale_bp
from .inventory import bp as inventory_bp
from .analysis import bp as analysis_bp
from .dashboard import bp as dashboard_bp  # 添加 dashboard 蓝图

# 创建一个主蓝图来聚合所有子蓝图
main_bp = Blueprint('main', __name__)

# 注册所有子蓝图
main_bp.register_blueprint(product_bp, url_prefix='/product')
main_bp.register_blueprint(supplier_bp, url_prefix='/supplier')
main_bp.register_blueprint(employee_bp, url_prefix='/employee')
main_bp.register_blueprint(purchase_bp, url_prefix='/purchase')
main_bp.register_blueprint(sale_bp, url_prefix='/sale')
main_bp.register_blueprint(inventory_bp, url_prefix='/inventory')
main_bp.register_blueprint(analysis_bp, url_prefix='/analysis')
main_bp.register_blueprint(dashboard_bp, url_prefix='/dashboard')  # 注册 dashboard 蓝图

# 可以在这里添加一些通用的路由
@main_bp.route('/')
def index():
    return 'Welcome to Supermarket Management System'

# 导出主蓝图,以便在app/__init__.py中注册
def init_app(app):
    app.register_blueprint(main_bp)