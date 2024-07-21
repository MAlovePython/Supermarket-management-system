// main.js 文件开头
console.log('main.js is loaded and executing');
if (typeof Chart === 'undefined') {
    console.error('Chart.js is not loaded. Make sure to include the Chart.js script in your HTML file.');
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
  } else {
    console.error(`Modal with id ${modalId} not found`);
  }
}
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

async function postData(url, data) {
    try {
        const headers = {
            'Content-Type': 'application/json'
        };

        // 尝试获取 CSRF 令牌，如果存在就添加到 headers 中
        const csrfToken = document.querySelector('meta[name="csrf-token"]');
        if (csrfToken) {
            headers['X-CSRFToken'] = csrfToken.getAttribute('content');
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error("Fetch error:", error);
        throw error;
    }
}

async function getData(url) {
    try {
        console.log('Fetching data from:', url);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Received data:', data);
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}
function refreshTable(tableId, data, columns) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = '';
    data.forEach(item => {
        const tr = document.createElement('tr');
        columns.forEach(column => {
            const td = document.createElement('td');
            td.textContent = item[column];
            tr.appendChild(td);
        });
        const actionTd = document.createElement('td');
        if (tableId === 'productTable') {
            actionTd.innerHTML = `
                <button class="editProductBtn" data-id="${item.id}">修改</button>
                <button class="deleteProductBtn" data-id="${item.id}">删除</button>
            `;
        } else if (tableId === 'supplierTable') {
            actionTd.innerHTML = `
                <button class="editSupplierBtn" data-id="${item.id}">修改</button>
                <button class="deleteSupplierBtn" data-id="${item.id}">删除</button>
            `;
        } else if (tableId === 'employeeTable') {
            actionTd.innerHTML = `
                <button class="editEmployeeBtn" data-id="${item.id}">修改</button>
                <button class="deleteEmployeeBtn" data-id="${item.id}">删除</button>
            `;
        } else if (tableId === 'purchaseTable') {
            actionTd.innerHTML = `
                <button class="editPurchaseBtn" data-id="${item.id}">修改</button>
                <button class="deletePurchaseBtn" data-id="${item.id}">删除</button>
            `;
        } else if (tableId === 'saleTable') {
            actionTd.innerHTML = `
                <button class="editSaleBtn" data-id="${item.id}">修改</button>
                <button class="deleteSaleBtn" data-id="${item.id}">删除</button>
            `;
        }
        tr.appendChild(actionTd);
        tbody.appendChild(tr);
    });
}

// Product 相关函数
async function addProduct(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    try {
        const result = await postData(form.action, Object.fromEntries(formData));
        if (result.success) {
            alert('商品添加成功');
            closeModal('addProductModal');
            location.reload();
        } else {
            alert('商品添加失败: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('发生错误，请稍后再试');
    }
}

async function editProduct(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const productId = formData.get('id');
    try {
        console.log('Editing product:', productId);
        const result = await postData(`/product/edit/${productId}`, Object.fromEntries(formData));
        console.log('Edit result:', result);
        if (result.success) {
            alert('商品修改成功');
            closeModal('editProductModal');
            location.reload();
        } else {
            alert('商品修改失败: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('发生错误，请稍后再试');
    }
}

async function deleteProduct(productId) {
    if (confirm('确定要删除这个商品吗？')) {
        try {
            const result = await postData(`/product/delete/${productId}`, {});
            if (result.success) {
                alert('删除商品成功');
                location.reload();
            } else {
                alert('删除商品失败: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('发生错误，请稍后再试');
        }
    }
}

async function searchProducts(query) {
    try {
        const products = await getData(`/product/search?query=${query}`);
        refreshTable('productTable', products, ['id', 'name', 'category', 'price', 'stock', 'supplier']);
    } catch (error) {
        console.error('Error:', error);
        alert('搜索出错，请稍后再试');
    }
}

// Supplier 相关函数
async function addSupplier(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    try {
        const result = await postData('/supplier/add', Object.fromEntries(formData));
        if (result.success) {
            alert('供应商添加成功');
            closeModal('addSupplierModal');
            location.reload();
        } else {
            alert('供应商添加失败: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('发生错误，请稍后再试');
    }
}

async function editSupplier(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const supplierId = formData.get('id');
    try {
        console.log('Editing supplier:', supplierId);
        const result = await postData(`/supplier/edit/${supplierId}`, Object.fromEntries(formData));
        console.log('Edit result:', result);
        if (result.success) {
            alert('供应商修改成功');
            closeModal('editSupplierModal');
            location.reload();
        } else {
            alert('供应商修改失败: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('发生错误，请稍后再试');
    }
}

async function deleteSupplier(supplierId) {
    if (confirm('确定要删除这个供应商吗？')) {
        try {
            const result = await postData(`/supplier/delete/${supplierId}`, {});
            if (result.success) {
                alert('删除供应商成功');
                location.reload();
            } else {
                alert('删除供应商失败: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('发生错误，请稍后再试');
        }
    }
}

async function searchSuppliers(query) {
    try {
        const suppliers = await getData(`/supplier/search?query=${query}`);
        refreshTable('supplierTable', suppliers, ['id', 'name', 'contact_person', 'phone', 'address']);
    } catch (error) {
        console.error('Error:', error);
        alert('搜索出错，请稍后再试');
    }
}

// Employee 相关函数
async function addEmployee(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    try {
        const result = await postData('/employee/add', Object.fromEntries(formData));
        if (result.success) {
            alert('员工添加成功');
            closeModal('addEmployeeModal');
            location.reload();
        } else {
            alert('员工添加失败: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('发生错误，请稍后再试');
    }
}

async function editEmployee(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const employeeId = formData.get('id');
    try {
        console.log('Editing employee:', employeeId);
        const result = await postData(`/employee/edit/${employeeId}`, Object.fromEntries(formData));
        console.log('Edit result:', result);
        if (result.success) {
            alert('员工修改成功');
            closeModal('editEmployeeModal');
            location.reload();
        } else {
            alert('员工修改失败: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('发生错误，请稍后再试');
    }
}

async function deleteEmployee(employeeId) {
    if (confirm('确定要删除这个员工吗？')) {
        try {
            const result = await postData(`/employee/delete/${employeeId}`, {});
            if (result.success) {
                alert('删除员工成功');
                location.reload();
            } else {
                alert('删除员工失败: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('发生错误，请稍后再试');
        }
    }
}

async function searchEmployees(query) {
    try {
        const employees = await getData(`/employee/search?query=${query}`);
        refreshTable('employeeTable', employees, ['id', 'name', 'position', 'phone', 'hire_date']);
    } catch (error) {
        console.error('Error:', error);
        alert('搜索出错，请稍后再试');
    }
}

// 进货管理相关函数
async function addPurchase(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    try {
        const result = await postData('/purchase/add', Object.fromEntries(formData));
        if (result.success) {
            alert('进货记录添加成功');
            closeModal('addPurchaseModal');
            await refreshPurchaseTable();
        } else {
            alert('进货记录添加失败: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('发生错误，请稍后再试');
    }
}

function openModal(modalId) {
    return new Promise((resolve) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            setTimeout(() => {
                resolve();
            }, 100);
        } else {
            console.error(`Modal with id ${modalId} not found`);
            resolve();
        }
    });
}
async function editPurchase(purchaseId) {
    try {
        console.log('Starting editPurchase for id:', purchaseId);
        const url = `/purchase/${purchaseId}`;
        console.log('Fetching data from URL:', url);
        const purchase = await getData(url);
        console.log('Received purchase data:', JSON.stringify(purchase, null, 2));

        if (!purchase || typeof purchase !== 'object') {
            throw new Error('Invalid purchase data received');
        }

        const fields = [
            {id: 'editPurchaseId', key: 'purchase_id'},  // 改为 'purchase_id'
            {id: 'editProduct_id', key: 'product_id'},
            {id: 'editSupplier_id', key: 'supplier_id'},
            {id: 'editQuantity', key: 'quantity'},
            {id: 'editUnit_price', key: 'unit_price'},
            {id: 'editPurchase_date', key: 'purchase_date'}
        ];

        await openModal('editPurchaseModal');

        setTimeout(() => {
            let allFieldsFound = true;
            fields.forEach(field => {
                const element = document.getElementById(field.id);
                console.log(`Element ${field.id} exists: ${!!element}`);
                if (element) {
                    if (purchase[field.key] !== undefined) {
                        console.log(`Setting ${field.id} to ${purchase[field.key]}`);
                        element.value = purchase[field.key];
                    } else {
                        console.warn(`Field ${field.key} not found in purchase data`);
                        allFieldsFound = false;
                    }
                } else {
                    console.error(`Element with id ${field.id} not found in the DOM`);
                    allFieldsFound = false;
                }
            });

            if (!allFieldsFound) {
                console.error('Some fields were not found. This might cause issues.');
            }
        }, 300);

    } catch (error) {
        console.error('Error in editPurchase:', error);
        alert('获取进货记录失败：' + error.message);
    }
}
async function submitEditPurchase(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    console.log('Submitting edit data:', data);
    const purchaseId = formData.get('id');
    try {
        const result = await postData(`/purchase/edit/${purchaseId}`, Object.fromEntries(formData));
        if (result.success) {
            alert('进货记录修改成功');
            closeModal('editPurchaseModal');
            refreshPurchaseTable();
        } else {
            alert('进货记录修改失败: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('发生错误，请稍后再试');
    }
}
async function deletePurchase(purchaseId) {
    if (confirm('确定要删除这条进货记录吗？')) {
        try {
            const result = await postData(`/purchase/delete/${purchaseId}`, {});
            if (result.success) {
                alert('删除进货记录成功');
                await refreshPurchaseTable();
            } else {
                alert('删除进货记录失败: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('发生错误，请稍后再试');
        }
    }
}

async function searchPurchases() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    try {
        const purchases = await getData(`/purchase/search?start_date=${startDate}&end_date=${endDate}`);
        await refreshPurchaseTable(purchases);
    } catch (error) {
        console.error('Error:', error);
        alert('搜索出错，请稍后再试');
    }
}

async function refreshPurchaseTable(data) {
    if (!data) {
        try {
            data = await getData("/purchase/list");
        } catch (error) {
            console.error('Error:', error);
            alert('获取进货记录失败，请稍后再试');
            return;
        }
    }
    const tbody = document.querySelector('#purchaseTable tbody');
    if (!tbody) {
        console.error('Purchase table body not found');
        return;
    }
    tbody.innerHTML = '';
    data.forEach(purchase => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${purchase.id}</td>
            <td>${purchase.product_name}</td>
            <td>${purchase.supplier_name}</td>
            <td>${purchase.quantity}</td>
            <td>${purchase.unit_price}</td>
            <td>${purchase.purchase_date}</td>
            <td>
                <button class="editPurchaseBtn" data-id="${purchase.id}">修改</button>
                <button class="deletePurchaseBtn" data-id="${purchase.id}">删除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 销售管理相关函数
async function addSale(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    try {
        const result = await postData('/sale/add', Object.fromEntries(formData));
        if (result.success) {
            alert('销售记录添加成功');
            closeModal('addSaleModal');
            await refreshSaleTable();
        } else {
            alert('销售记录添加失败: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('发生错误，请稍后再试');
    }
}

async function editSale(saleId) {
    try {
        console.log('Starting editSale for id:', saleId);
        const url = `/sale/${saleId}`;
        console.log('Fetching data from URL:', url);
        const sale = await getData(url);
        console.log('Received sale data:', JSON.stringify(sale, null, 2));

        if (!sale || typeof sale !== 'object') {
            throw new Error('Invalid sale data received');
        }

        const fields = [
            {id: 'editSaleId', key: 'sale_id'},
            {id: 'editProduct_id', key: 'product_id'},
            {id: 'editQuantity', key: 'quantity'},
            {id: 'editUnit_price', key: 'unit_price'},
            {id: 'editSale_date', key: 'sale_date'},
            {id: 'editEmployee_id', key: 'employee_id'}
        ];

        await openModal('editSaleModal');

        setTimeout(() => {
            let allFieldsFound = true;
            fields.forEach(field => {
                const element = document.getElementById(field.id);
                console.log(`Element ${field.id} exists: ${!!element}`);
                if (element) {
                    if (sale[field.key] !== undefined) {
                        console.log(`Setting ${field.id} to ${sale[field.key]}`);
                        element.value = sale[field.key];
                    } else {
                        console.warn(`Field ${field.key} not found in sale data`);
                        allFieldsFound = false;
                    }
                } else {
                    console.error(`Element with id ${field.id} not found in the DOM`);
                    allFieldsFound = false;
                }
            });

            if (!allFieldsFound) {
                console.error('Some fields were not found. This might cause issues.');
            }
        }, 300);

    } catch (error) {
        console.error('Error in editSale:', error);
        alert('获取销售记录失败：' + error.message);
    }
}

async function submitEditSale(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    console.log('Submitting edit data:', data);
    const saleId = formData.get('id');
    try {
        const result = await postData(`/sale/edit/${saleId}`, data);
        if (result.success) {
            alert('销售记录修改成功');
            closeModal('editSaleModal');
            refreshSaleTable();
        } else {
            alert('销售记录修改失败: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('发生错误，请稍后再试');
    }
}

let isDeleting = false;

async function deleteSale(saleId) {
    if (isDeleting) return; // 防止重复点击

    if (confirm('确定要删除这条销售记录吗？')) {
        isDeleting = true;
        try {
            const result = await postData(`/sale/delete/${saleId}`, {});
            if (result.success) {
                alert('销售记录删除成功');
                await refreshSaleTable();
            } else {
                throw new Error(result.message || '删除失败');
            }
        } catch (error) {
            console.error('Error:', error);
            if (error.message.includes('404')) {
                alert('销售记录可能已被删除');
                await refreshSaleTable(); // 刷新表格以反映最新状态
            } else {
                alert(`删除销售记录失败: ${error.message}`);
            }
        } finally {
            isDeleting = false;
        }
    }
}

async function searchSales() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    try {
        const sales = await getData(`/sale/search?start_date=${startDate}&end_date=${endDate}`);
        await refreshSaleTable(sales);
    } catch (error) {
        console.error('Error:', error);
        alert('搜索出错，请稍后再试');
    }
}

async function refreshSaleTable(data) {
    if (!data) {
        try {
            data = await getData("/sale/list");
        } catch (error) {
            console.error('Error:', error);
            alert('获取销售记录失败，请稍后再试');
            return;
        }
    }
    const tbody = document.querySelector('#saleTable tbody');
    if (!tbody) {
        console.error('Sale table body not found');
        return;
    }
    tbody.innerHTML = '';
    data.forEach(sale => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${sale.id}</td>
            <td>${sale.product_name}</td>
            <td>${sale.quantity}</td>
            <td>${sale.unit_price}</td>
            <td>${sale.total_price}</td>
            <td>${sale.sale_date}</td>
            <td>${sale.employee_name}</td>
            <td>
                <button class="editSaleBtn" data-id="${sale.id}">修改</button>
                <button class="deleteSaleBtn" data-id="${sale.id}">删除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
// 库存管理相关函数
async function loadInventoryData() {
    try {
        inventoryData = await getData('/inventory/list');
        renderInventoryTable(inventoryData);
        loadCategories();
    } catch (error) {
        console.error('Error loading inventory data:', error);
        alert('加载库存数据失败，请稍后再试');
    }
}

function renderInventoryTable(data) {
    const tbody = document.querySelector('#inventoryTable tbody');
    if (!tbody) {
        console.error('Inventory table body not found');
        return;
    }
    tbody.innerHTML = '';
    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.classList.add(item.current_stock < item.warning_level ? 'low-stock' : '');
        tr.innerHTML = `
            <td>${item.product_id}</td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.current_stock}</td>
            <td>${item.warning_level}</td>
            <td>
                <button class="setWarningLevelBtn" data-id="${item.product_id}">设置警戒线</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function setWarningLevel(productId) {
    const newLevel = prompt('请输入新的警戒线数量:');
    if (newLevel === null || newLevel === '') return;

    try {
        const result = await postData(`/inventory/set-warning-level/${productId}`, { warning_level: parseInt(newLevel) });
        if (result.success) {
            alert('警戒线设置成功');
            loadInventoryData();
        } else {
            alert('警戒线设置失败: ' + result.message);
        }
    } catch (error) {
        console.error('Error setting warning level:', error);
        alert('设置警戒线时发生错误，请稍后再试');
    }
}

async function generateInventoryReport() {
    const button = document.getElementById('generateReportBtn');
    button.disabled = true;
    button.textContent = '正在生成报告...';

    try {
        const response = await fetch('/inventory/generate-report');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = '库存报告.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        alert('报告生成成功！');
    } catch (error) {
        console.error('Error generating inventory report:', error);
        alert(`生成库存报告失败: ${error.message}\n请检查服务器日志以获取更多信息。`);
    } finally {
        button.disabled = false;
        button.textContent = '生成库存报告';
    }
}
function applyInventoryFilters() {
    const category = document.getElementById('categoryFilter').value;
    const minStock = parseInt(document.getElementById('minStock').value) || 0;
    const maxStock = parseInt(document.getElementById('maxStock').value) || Infinity;

    const filteredData = inventoryData.filter(item =>
        (category === '' || item.category === category) &&
        item.current_stock >= minStock &&
        item.current_stock <= maxStock
    );

    renderInventoryTable(filteredData);
}

async function loadCategories() {
    try {
        const categories = await getData('/product/categories');
        const select = document.getElementById('categoryFilter');
        if (select) {
            select.innerHTML = '<option value="">所有类别</option>';
            categories.forEach(category => {
                select.insertAdjacentHTML('beforeend', `<option value="${category}">${category}</option>`);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Analysis 相关函数
let chartJsLoaded = false;

function loadChartJs() {
    return new Promise((resolve, reject) => {
        if (typeof Chart !== 'undefined') {
            chartJsLoaded = true;
            resolve();
        } else {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => {
                chartJsLoaded = true;
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        }
    });
}
loadChartJs().catch(error => console.error('Failed to load Chart.js:', error));
let inventoryData = [];

async function createChart(chartId, type, labels, data, label, title) {
    if (!chartJsLoaded) {
        console.error('Chart.js is not loaded');
        return;
    }
    const ctx = document.getElementById(chartId);
    if (!ctx) {
        console.error(`Canvas element with id ${chartId} not found`);
        return;
    }
    return new Chart(ctx.getContext('2d'), {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: title
                }
            }
        }
    });
}


async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            if (response.headers.get("content-type")?.includes("application/json")) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            } else {
                const text = await response.text();
                console.error("Unexpected response:", text);
                throw new Error(`Unexpected response from server. Status: ${response.status}`);
            }
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
        throw error;
    }
}

async function analyzeSalesTrend(startDate, endDate) {
    try {
        await loadChartJs();
        const data = await fetchData(`/analysis/sales_trend?start_date=${startDate}&end_date=${endDate}`);
        createChart('salesTrendChart', 'line', data.map(item => item.date), data.map(item => item.total_sales), '日销售额', '销售趋势分析');
    } catch (error) {
        console.error('分析销售趋势时出错:', error);
        alert('分析销售趋势时出错: ' + error.message);
    }
}

async function analyzeTopSellingProducts() {
    try {
        await loadChartJs();
        const data = await fetchData('/analysis/top_products');
        createChart('topProductsChart', 'bar', data.map(item => item.product_name), data.map(item => item.total_quantity), '销售量', '商品销售排行');
    } catch (error) {
        console.error('分析商品销售排行时出错:', error);
        alert('分析商品销售排行时出错: ' + error.message);
    }
}

async function analyzeEmployeePerformance() {
    try {
        await loadChartJs();
        const data = await fetchData('/analysis/employee_performance');
        createChart('employeePerformanceChart', 'bar', data.map(item => item.employee_name), data.map(item => item.total_sales), '销售额', '员工业绩分析');
    } catch (error) {
        console.error('分析员工业绩时出错:', error);
        alert('分析员工业绩时出错: ' + error.message);
    }
}
async function analyzeInventoryTurnover() {
    try {
        await loadChartJs();
        const data = await fetchData('/analysis/inventory_turnover');
        createChart('inventoryTurnoverChart', 'bar', data.map(item => item.product_name), data.map(item => item.turnover_rate), '周转率', '库存周转率分析');
    } catch (error) {
        console.error('分析库存周转率时出错:', error);
        alert('分析库存周转率时出错: ' + error.message);
    }
}

async function analyzeProfits() {
    try {
        const data = await fetchData('/analysis/profits');
        const tableBody = document.querySelector('#profitsTable tbody');
        tableBody.innerHTML = '';
        data.forEach(item => {
            const row = `
                <tr>
                    <td>${item.product_name}</td>
                    <td>${item.avg_sale_price}</td>
                    <td>${item.avg_purchase_price}</td>
                    <td>${item.profit_per_unit}</td>
                    <td>${item.total_sold}</td>
                    <td>${item.total_profit}</td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    } catch (error) {
        console.error('分析利润时出错:', error);
        alert('分析利润时出错: ' + error.message);
    }
}
function updateProfitsTable(data) {
    const tableBody = document.querySelector('#profitsTable tbody');
    if (!tableBody) {
        console.error('找不到利润表格的 tbody 元素');
        return;
    }

    tableBody.innerHTML = '';  // 清空现有内容

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(item.product_name)}</td>
            <td>${item.avg_sale_price.toFixed(2)}</td>
            <td>${item.avg_purchase_price.toFixed(2)}</td>
            <td>${item.profit_per_unit.toFixed(2)}</td>
            <td>${item.total_sold}</td>
            <td>${item.total_profit.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}


async function exportReport() {
    try {
        // 显示加载提示
        const loadingMessage = document.createElement('div');
        loadingMessage.textContent = '正在生成 CSV 报表,请稍候...';
        loadingMessage.style.position = 'fixed';
        loadingMessage.style.top = '50%';
        loadingMessage.style.left = '50%';
        loadingMessage.style.transform = 'translate(-50%, -50%)';
        loadingMessage.style.padding = '20px';
        loadingMessage.style.background = 'white';
        loadingMessage.style.border = '1px solid #ccc';
        loadingMessage.style.borderRadius = '5px';
        loadingMessage.style.zIndex = '1000';
        document.body.appendChild(loadingMessage);

        // 获取报表数据
        const salesTrendData = await fetchData('/analysis/sales_trend');
        const topProductsData = await fetchData('/analysis/top_products');
        const employeePerformanceData = await fetchData('/analysis/employee_performance');
        const profitsData = await fetchData('/analysis/profits');
        const inventoryTurnoverData = await fetchData('/analysis/inventory_turnover');

        // 准备报表数据
        const reportData = {
            salesTrend: salesTrendData,
            topProducts: topProductsData,
            employeePerformance: employeePerformanceData,
            profits: profitsData,
            inventoryTurnover: inventoryTurnoverData
        };

        // 发送请求到后端生成报表
        const response = await fetch('/analysis/generate_report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: reportData
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Report generation failed: ${errorText}`);
        }

        // 获取生成的报表文件
        const blob = await response.blob();
        const fileName = `分析报表_${new Date().toISOString().split('T')[0]}.csv`;

        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);

        // 移除加载提示
        document.body.removeChild(loadingMessage);

        alert('CSV 报表已成功导出!');
    } catch (error) {
        console.error('导出报表时出错:', error);
        alert('导出报表失败,请稍后重试: ' + error.message);
    }
}
function initializeAnalysis() {
    console.log('初始化分析功能...');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');

    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async function() {
            console.log('分析按钮被点击');
            const startDate = document.getElementById('startDate')?.value || '';
            const endDate = document.getElementById('endDate')?.value || '';
            await loadChartJs();
            analyzeSalesTrend(startDate, endDate);
            analyzeTopSellingProducts();
            analyzeEmployeePerformance();
            analyzeProfits();
            analyzeInventoryTurnover();
            analyzeCustomerBehavior();
        });
    } else {
        console.error('未找到分析按钮');
    }

    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', function() {
            console.log('导出 CSV 按钮被点击');
            exportReport('CSV');
        });
    } else {
        console.error('未找到导出 CSV 按钮');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成');

    // Product 相关事件监听器
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => openModal('addProductModal'));
    }

    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', addProduct);
    }

    const editProductForm = document.getElementById('editProductForm');
    if (editProductForm) {
        editProductForm.addEventListener('submit', editProduct);
    }

    // Supplier 相关事件监听器
    const addSupplierBtn = document.getElementById('addSupplierBtn');
    if (addSupplierBtn) {
        addSupplierBtn.addEventListener('click', () => openModal('addSupplierModal'));
    }

    const addSupplierForm = document.getElementById('addSupplierForm');
    if (addSupplierForm) {
        addSupplierForm.addEventListener('submit', addSupplier);
    }

    const editSupplierForm = document.getElementById('editSupplierForm');
    if (editSupplierForm) {
        editSupplierForm.addEventListener('submit', editSupplier);
    }

    // Employee 相关事件监听器
    const addEmployeeBtn = document.getElementById('addEmployeeBtn');
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', () => openModal('addEmployeeModal'));
    }

    const addEmployeeForm = document.getElementById('addEmployeeForm');
    if (addEmployeeForm) {
        addEmployeeForm.addEventListener('submit', addEmployee);
    }

    const editEmployeeForm = document.getElementById('editEmployeeForm');
    if (editEmployeeForm) {
        editEmployeeForm.addEventListener('submit', editEmployee);
    }

    // Purchase 相关事件监听器
   if (document.getElementById('purchaseTable')) {
        initializePurchaseManagement();
    }

    function initializePurchaseManagement() {
        const addPurchaseBtn = document.getElementById('addPurchaseBtn');
        if (addPurchaseBtn) {
            addPurchaseBtn.addEventListener('click', () => openModal('addPurchaseModal'));
        }

        const addPurchaseForm = document.getElementById('addPurchaseForm');
        if (addPurchaseForm) {
            addPurchaseForm.addEventListener('submit', addPurchase);
        }

        const editPurchaseForm = document.getElementById('editPurchaseForm');
        if (editPurchaseForm) {
            editPurchaseForm.addEventListener('submit', submitEditPurchase);
        }

        // 编辑按钮的事件监听器
        document.addEventListener('click', function(event) {
            if (event.target.classList.contains('editPurchaseBtn')) {
                const purchaseId = event.target.getAttribute('data-id');
                editPurchase(purchaseId);
            }
        });


            // 初始化进货表格
        refreshPurchaseTable();
}
    // Sale 相关事件监听器
    if (document.getElementById('saleTable')) {
    initializeSaleManagement();
}

    function initializeSaleManagement() {
        const addSaleBtn = document.getElementById('addSaleBtn');
        if (addSaleBtn) {
            addSaleBtn.addEventListener('click', () => openModal('addSaleModal'));
        }

        const addSaleForm = document.getElementById('addSaleForm');
        if (addSaleForm) {
            addSaleForm.addEventListener('submit', addSale);
        }

        const editSaleForm = document.getElementById('editSaleForm');
        if (editSaleForm) {
            editSaleForm.addEventListener('submit', submitEditSale);
        }

        const searchSaleBtn = document.getElementById('searchSaleBtn');
        if (searchSaleBtn) {
            searchSaleBtn.addEventListener('click', searchSales);
        }

    // 编辑按钮的事件监听器
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('editSaleBtn')) {
            const saleId = event.target.getAttribute('data-id');
            editSale(saleId);
        }
        if (event.target.classList.contains('deleteSaleBtn')) {
            const saleId = event.target.getAttribute('data-id');
            deleteSale(saleId);
        }
    });

    // 初始化销售表格
    refreshSaleTable();
}
    // Inventory 相关事件监听器
    if (document.getElementById('inventoryTable')) {
        initializeInventoryManagement();
    }

    function initializeInventoryManagement() {
        loadInventoryData();

        const generateReportBtn = document.getElementById('generateReportBtn');
        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', generateInventoryReport);
        }

        const categoryFilter = document.getElementById('categoryFilter');
        const minStock = document.getElementById('minStock');
        const maxStock = document.getElementById('maxStock');

        if (categoryFilter) categoryFilter.addEventListener('change', applyInventoryFilters);
        if (minStock) minStock.addEventListener('input', applyInventoryFilters);
        if (maxStock) maxStock.addEventListener('input', applyInventoryFilters);

        document.addEventListener('click', function(event) {
            if (event.target.classList.contains('setWarningLevelBtn')) {
                const productId = event.target.getAttribute('data-id');
                setWarningLevel(productId);
            }
        });
    }

    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('editProductBtn')) {
            const productId = event.target.getAttribute('data-id');
            getData(`/product/${productId}`).then(product => {
                document.getElementById('editProductId').value = product.product_id;
                document.getElementById('editName').value = product.name;
                document.getElementById('editCategory').value = product.category_id;
                document.getElementById('editPrice').value = product.price;
                document.getElementById('editStock').value = product.stock;
                document.getElementById('editSupplier').value = product.supplier_id;
                openModal('editProductModal');
            }).catch(error => {
                console.error('Error fetching product data:', error);
                alert('获取商品信息失败，请稍后再试');
            });
        }

        if (event.target.classList.contains('deleteProductBtn')) {
            const productId = event.target.getAttribute('data-id');
            deleteProduct(productId);
        }

        if (event.target.classList.contains('editSupplierBtn')) {
            const supplierId = event.target.getAttribute('data-id');
            getData(`/supplier/${supplierId}`).then(supplier => {
                document.getElementById('editSupplierId').value = supplier.supplier_id;
                document.getElementById('editName').value = supplier.name;
                document.getElementById('editContactPerson').value = supplier.contact_person;
                document.getElementById('editPhone').value = supplier.phone;
                document.getElementById('editAddress').value = supplier.address;
                openModal('editSupplierModal');
            }).catch(error => {
                console.error('Error fetching supplier data:', error);
                alert('获取供应商信息失败，请稍后再试');
            });
        }

        if (event.target.classList.contains('deleteSupplierBtn')) {
            const supplierId = event.target.getAttribute('data-id');
            deleteSupplier(supplierId);
        }

        if (event.target.classList.contains('editEmployeeBtn')) {
            const employeeId = event.target.getAttribute('data-id');
            getData(`/employee/${employeeId}`).then(employee => {
                document.getElementById('editEmployeeId').value = employee.employee_id;
                document.getElementById('editName').value = employee.name;
                document.getElementById('editPosition').value = employee.position;
                document.getElementById('editPhone').value = employee.phone;
                document.getElementById('editHireDate').value = employee.hire_date;
                openModal('editEmployeeModal');
            }).catch(error => {
                console.error('Error fetching employee data:', error);
                alert('获取员工信息失败，请稍后再试');
            });
        }

        if (event.target.classList.contains('deleteEmployeeBtn')) {
            const employeeId = event.target.getAttribute('data-id');
            deleteEmployee(employeeId);
        }

       if (event.target.classList.contains('editPurchaseBtn')) {
            const purchaseId = event.target.getAttribute('data-id');
            getData(`/purchase/${purchaseId}`)
                .then(purchase => {
                    console.log('Received purchase data:', purchase);  // 添加日志

                    let idError = false;

                    // 处理所有字段，包括 Product ID 和 Supplier ID
                    const fields = [
                        { id: 'editProductId', key: 'product_id' },
                        { id: 'editSupplierId', key: 'supplier_id' },
                        { id: 'editPurchaseId', key: 'purchase_id' },
                        { id: 'editQuantity', key: 'quantity' },
                        { id: 'editUnitPrice', key: 'unit_price' },
                        { id: 'editPurchaseDate', key: 'purchase_date' }
                    ];

                    fields.forEach(field => {
                        const element = document.getElementById(field.id);
                        if (element) {
                            if (purchase[field.key] !== undefined) {
                                element.value = purchase[field.key];
                            } else {
                                console.warn(`${field.key} is undefined for purchase:`, purchaseId);
                                if (field.id === 'editProductId' || field.id === 'editSupplierId') {
                                    idError = true;
                                }
                            }
                        } else {
                            console.error(`Element with id ${field.id} not found`);
                            if (field.id === 'editProductId' || field.id === 'editSupplierId') {
                        idError = true;
                            }
                        }
                    });

                    if (idError) {
                        console.error('注意：ID错误');
                        alert('请注意ID');
                    }

                    openModal('editPurchaseModal');
                })
                .catch(error => {
                    // 这里只处理严重的错误，如网络错误或服务器错误
                    console.error('Error fetching purchase data:', error);
                    alert('获取进货记录失败，请稍后再试');
                });
        }


        if (event.target.classList.contains('deletePurchaseBtn')) {
            const purchaseId = event.target.getAttribute('data-id');
            deletePurchase(purchaseId);
        }

        if (event.target.classList.contains('editSaleBtn')) {
            const saleId = event.target.getAttribute('data-id');
            getData(`/sale/${saleId}`)
                .then(sale => {
                    console.log('Received sale data:', sale);  // 添加日志

                    let idError = false;

                    // 处理所有字段
                    const fields = [
                        { id: 'editSaleId', key: 'sale_id' },
                        { id: 'editProductId', key: 'product_id' },
                        { id: 'editQuantity', key: 'quantity' },
                        { id: 'editUnitPrice', key: 'unit_price' },
                        { id: 'editSaleDate', key: 'sale_date' },
                        { id: 'editEmployeeId', key: 'employee_id' }
                    ];

                    fields.forEach(field => {
                        const element = document.getElementById(field.id);
                        if (element) {
                            if (sale[field.key] !== undefined) {
                                element.value = sale[field.key];
                            } else {
                                console.warn(`${field.key} is undefined for sale:`, saleId);
                                if (field.id === 'editProductId' || field.id === 'editEmployeeId') {
                                    idError = true;
                                }
                            }
                        } else {
                            console.error(`Element with id ${field.id} not found`);
                            if (field.id === 'editProductId' || field.id === 'editEmployeeId') {
                                idError = true;
                            }
                        }
                    });

                    if (idError) {
                        console.error('注意：ID错误');
                        alert('请注意ID');
                    }

                    openModal('editSaleModal');
                })
                .catch(error => {
                    // 这里只处理严重的错误，如网络错误或服务器错误
                    console.error('Error fetching sale data:', error);
                    console.error('Error details:', error.message, error.stack);
                    alert('获取销售记录失败，请稍后再试');
                });
        }


        if (event.target.classList.contains('deleteSaleBtn')) {
            const saleId = event.target.getAttribute('data-id');
            deleteSale(saleId);
        }
    });

    const searchProductInput = document.getElementById('searchProduct');
    if (searchProductInput) {
        searchProductInput.addEventListener('input', function() {
            searchProducts(this.value);
        });
    }

    const searchSupplierInput = document.getElementById('searchSupplier');
    if (searchSupplierInput) {
        searchSupplierInput.addEventListener('input', function() {
            searchSuppliers(this.value);
        });
    }

    const searchEmployeeInput = document.getElementById('searchEmployee');
    if (searchEmployeeInput) {
        searchEmployeeInput.addEventListener('input', function() {
            searchEmployees(this.value);
        });
    }

    document.querySelectorAll('.closeModal').forEach(btn => {
        btn.addEventListener('click', function() {
            closeModal(this.closest('.modal').id);
        });
    });

// 初始化页面数据
    if (document.getElementById('purchaseTable')) {
    refreshPurchaseTable();
    }

    // 确保只在销售页面上调用这个函数
    if (document.getElementById('saleTable')) {
    refreshSaleTable();
    }

    if (document.getElementById('analysisSection')) {
    initializeAnalysis();
    }
// 库存管理相关函数
async function loadInventoryData() {
    try {
        const response = await fetch('/inventory/list');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to load inventory data');
        }
        inventoryData = await response.json();
        renderInventoryTable(inventoryData);
        loadCategories();
    } catch (error) {
        console.error('Error loading inventory data:', error);
        alert(`加载库存数据失败：${error.message}。请检查服务器日志以获取更多信息。`);
    }
}

function renderInventoryTable(data) {
    const tableBody = document.querySelector('#inventoryTable tbody');
    if (!tableBody) {
        console.error('Inventory table body not found');
        return;
    }

    tableBody.innerHTML = '';
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">没有库存数据</td></tr>';
        return;
    }

    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.product_id}</td>
            <td>${item.name}</td>
            <td>${item.category || 'N/A'}</td>
            <td>${item.current_stock}</td>
            <td>${item.warning_level}</td>
            <td>
                <button class="setWarningLevelBtn" data-id="${item.product_id}">设置警戒线</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}
async function setWarningLevel(productId) {
    const newLevel = prompt('请输入新的警戒线数量:');
    if (newLevel === null || newLevel === '') return;

    try {
        const response = await fetch(`/inventory/set-warning-level/${productId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ warning_level: parseInt(newLevel) })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to set warning level');
        }

        const result = await response.json();
        if (result.success) {
            alert('警戒线设置成功');
            await loadInventoryData();
        } else {
            throw new Error(result.message || '设置失败');
        }
    } catch (error) {
        console.error('Error setting warning level:', error);
        alert(`设置警戒线失败：${error.message}`);
    }
}

let isGeneratingReport = false;

async function generateInventoryReport() {
    if (isGeneratingReport) {
        alert('报告正在生成中，请稍候...');
        return;
    }

    isGeneratingReport = true;
    const button = document.getElementById('generateReportBtn');
    button.disabled = true;
    button.textContent = '正在生成报告...';

    try {
        const response = await fetch('/inventory/generate-report');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = '库存报告.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        alert('报告生成成功！');
    } catch (error) {
        console.error('Error generating inventory report:', error);
        alert(`生成库存报告失败: ${error.message}\n请检查服务器日志以获取更多信息。`);
    } finally {
        isGeneratingReport = false;
        button.disabled = false;
        button.textContent = '生成库存报告';
    }
}

function applyInventoryFilters() {
    const category = document.getElementById('categoryFilter').value;
    const minStock = parseInt(document.getElementById('minStock').value) || 0;
    const maxStock = parseInt(document.getElementById('maxStock').value) || Infinity;

    const filteredData = inventoryData.filter(item =>
        (category === '' || item.category === category) &&
        item.current_stock >= minStock &&
        (maxStock === Infinity || item.current_stock <= maxStock)
    );

    renderInventoryTable(filteredData);
}

async function loadCategories() {
    try {
        const response = await fetch('/product/categories');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const categories = await response.json();
        const select = document.getElementById('categoryFilter');
        if (select) {
            select.innerHTML = '<option value="">所有类别</option>';
            categories.forEach(category => {
                select.insertAdjacentHTML('beforeend', `<option value="${category}">${category}</option>`);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function initializeInventoryManagement() {
    console.log('Initializing inventory management');
    loadInventoryData();

    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateInventoryReport);
    }

    const categoryFilter = document.getElementById('categoryFilter');
    const minStock = document.getElementById('minStock');
    const maxStock = document.getElementById('maxStock');

    if (categoryFilter) categoryFilter.addEventListener('change', applyInventoryFilters);
    if (minStock) minStock.addEventListener('input', applyInventoryFilters);
    if (maxStock) maxStock.addEventListener('input', applyInventoryFilters);

    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('setWarningLevelBtn')) {
            const productId = event.target.getAttribute('data-id');
            setWarningLevel(productId);
        }
    });
}




// 确保在 DOM 加载完成后初始化所有功能
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('analysisSection')) {
        initializeAnalysis();
    }
    initializeInventoryManagement();
// main.js
console.log('main.js is loading');

function refreshDashboard() {
    console.log('refreshDashboard function called');
    fetch('/dashboard/dashboard_data')
        .then(response => {
            console.log('Response received:', response);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Dashboard data received:', data);
            updateRecentSales(data.recent_sales);
            updateLowStockAlert(data.low_stock);
            updateRecentPurchases(data.recent_purchases);
        })
        .catch(error => {
            console.error('Error loading dashboard data:', error);
            document.getElementById('recent-sales').innerHTML = 'Error loading data';
            document.getElementById('low-stock-alert').innerHTML = 'Error loading data';
            document.getElementById('recent-purchases').innerHTML = 'Error loading data';
        });
}

function updateRecentSales(sales) {
    console.log('Updating recent sales', sales);
    const container = document.getElementById('recent-sales');
    if (container) {
        let html = '<ul>';
        sales.forEach(sale => {
            html += `<li>${sale.product}: ${sale.quantity} sold for $${sale.total} on ${sale.date}</li>`;
        });
        html += '</ul>';
        container.innerHTML = html;
    } else {
        console.error('Recent sales container not found');
    }
}

function updateLowStockAlert(items) {
    console.log('Updating low stock alert', items);
    const container = document.getElementById('low-stock-alert');
    if (container) {
        let html = '<ul>';
        items.forEach(item => {
            html += `<li>${item.product}: ${item.quantity} left (threshold: ${item.threshold})</li>`;
        });
        html += '</ul>';
        container.innerHTML = html;
    } else {
        console.error('Low stock alert container not found');
    }
}

function updateRecentPurchases(purchases) {
    console.log('Updating recent purchases', purchases);
    const container = document.getElementById('recent-purchases');
    if (container) {
        let html = '<ul>';
        purchases.forEach(purchase => {
            html += `<li>${purchase.product}: ${purchase.quantity} bought for $${purchase.total} on ${purchase.date}</li>`;
        });
        html += '</ul>';
        container.innerHTML = html;
    } else {
        console.error('Recent purchases container not found');
    }
}

console.log('main.js loaded');
});

});