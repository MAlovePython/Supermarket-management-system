from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from config import Config
import os
import logging
from logging.handlers import RotatingFileHandler

db = SQLAlchemy()


def create_app():
    app = Flask(__name__, static_folder='static',static_url_path='/static')
    app.config.from_object(Config)

    db.init_app(app)

    # 设置日志
    configure_logging(app)

    # 注册蓝图
    register_blueprints(app)

    # 注册路由
    @app.route('/')
    def index():
        return render_template('index.html')

    # 添加错误处理
    register_error_handlers(app)

    return app


def configure_logging(app):
    if not app.debug:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        file_handler = RotatingFileHandler('logs/supermarket.log', maxBytes=10240, backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)

    app.logger.setLevel(logging.INFO)
    app.logger.info('Supermarket startup')


def register_blueprints(app):
    from app.routes import product, supplier, employee, purchase, sale, inventory, analysis, dashboard

    blueprints = [
        product.bp,
        supplier.bp,
        employee.bp,
        purchase.bp,
        sale.bp,
        inventory.bp,
        analysis.bp,
        dashboard.bp
    ]

    for blueprint in blueprints:
        app.register_blueprint(blueprint)


def register_error_handlers(app):
    @app.errorhandler(404)
    def not_found_error(error):
        return render_template('404.html'), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return render_template('500.html'), 500