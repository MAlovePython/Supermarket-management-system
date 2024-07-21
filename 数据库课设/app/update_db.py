from app import create_app, db
from app.models import Product

app = create_app()

with app.app_context():
    # 添加新列
    with db.engine.connect() as conn:
        conn.execute('ALTER TABLE product ADD COLUMN alert_threshold INTEGER DEFAULT 0')

    # 更新 SQLAlchemy 的元数据
    db.Model.metadata.reflect(db.engine)

    print("Database updated successfully!")