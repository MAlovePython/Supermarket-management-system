from flask import Blueprint, render_template, request, jsonify, current_app
from app import db
from app.models import Employee
from datetime import datetime

bp = Blueprint('employee', __name__, url_prefix='/employee')

@bp.route('/')
def employees():
    current_app.logger.info('Accessing employees page')
    employees = Employee.query.all()
    return render_template('employee.html', employees=employees)

@bp.route('/add', methods=['POST'])
def add_employee():
    current_app.logger.info('Adding new employee')
    try:
        data = request.json
        hire_date = datetime.strptime(data['hire_date'], '%Y-%m-%d').date()
        new_employee = Employee(
            name=data['name'],
            position=data['position'],
            phone=data['phone'],
            hire_date=hire_date
        )
        db.session.add(new_employee)
        db.session.commit()
        current_app.logger.info(f'Employee added successfully: {new_employee.name}')
        return jsonify({'success': True, 'message': '员工添加成功'})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error adding employee: {str(e)}')
        return jsonify({'success': False, 'message': f'添加员工失败: {str(e)}'}), 400

@bp.route('/<int:id>', methods=['GET'])
def get_employee(id):
    current_app.logger.info(f'Fetching employee with id: {id}')
    employee = Employee.query.get_or_404(id)
    return jsonify({
        'employee_id': employee.employee_id,
        'name': employee.name,
        'position': employee.position,
        'phone': employee.phone,
        'hire_date': employee.hire_date.strftime('%Y-%m-%d')
    })

@bp.route('/edit/<int:id>', methods=['POST'])
def edit_employee(id):
    current_app.logger.info(f'Editing employee with id: {id}')
    try:
        data = request.json
        employee = Employee.query.get_or_404(id)
        employee.name = data['name']
        employee.position = data['position']
        employee.phone = data['phone']
        employee.hire_date = datetime.strptime(data['hire_date'], '%Y-%m-%d').date()

        db.session.commit()
        current_app.logger.info(f'Employee edited successfully: {employee.name}')
        return jsonify({'success': True, 'message': '员工信息修改成功'})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error editing employee: {str(e)}')
        return jsonify({'success': False, 'message': f'修改员工信息失败: {str(e)}'}), 400

@bp.route('/delete/<int:id>', methods=['POST'])
def delete_employee(id):
    current_app.logger.info(f'Deleting employee with id: {id}')
    try:
        employee = Employee.query.get_or_404(id)
        db.session.delete(employee)
        db.session.commit()
        current_app.logger.info(f'Employee deleted successfully: {employee.name}')
        return jsonify({'success': True, 'message': '员工删除成功'})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error deleting employee: {str(e)}')
        return jsonify({'success': False, 'message': f'删除员工失败: {str(e)}'}), 400

@bp.route('/search')
def search_employee():
    query = request.args.get('query', '')
    current_app.logger.info(f'Searching employees with query: {query}')
    employees = Employee.query.filter(
        (Employee.name.ilike(f'%{query}%')) |
        (Employee.position.ilike(f'%{query}%'))
    ).all()
    return jsonify([{
        'id': e.employee_id,
        'name': e.name,
        'position': e.position,
        'phone': e.phone,
        'hire_date': e.hire_date.strftime('%Y-%m-%d')
    } for e in employees])