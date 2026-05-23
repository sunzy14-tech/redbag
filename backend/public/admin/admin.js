const tokenKey = 'redbag_admin_token';
let token = localStorage.getItem(tokenKey) || '';
let products = [];
let strategies = [];

const $ = (selector) => document.querySelector(selector);

function setMessage(selector, text, type = '') {
  const node = $(selector);
  node.textContent = text || '';
  node.className = `message ${type}`.trim();
}

async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.message || data.error || `请求失败 ${res.status}`);
  }
  return data.data;
}

async function downloadFile(path, fileName) {
  const res = await fetch(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || data.error || `下载失败 ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || 'qrcodes.pdf';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function money(cents) {
  if (cents === null || cents === undefined) return '-';
  return `¥${(Number(cents) / 100).toFixed(2)}`;
}

function showDashboard(show) {
  $('#loginPanel').classList.toggle('hidden', show);
  $('#dashboard').classList.toggle('hidden', !show);
}

function renderProducts() {
  $('#productList').innerHTML = products.length ? products.map((item) => `
    <div class="item">
      <strong>${item.name}</strong>
      <span>SKU: ${item.sku}</span>
      <span>${item.description || '暂无说明'}</span>
    </div>
  `).join('') : '<div class="item"><span>暂无产品</span></div>';

  $('#batchProduct').innerHTML = products.map((item) => (
    `<option value="${item.id}">${item.name} / ${item.sku}</option>`
  )).join('');
}

function renderStrategies() {
  $('#strategyList').innerHTML = strategies.length ? strategies.map((item) => `
    <div class="item">
      <strong>${item.name}</strong>
      <span>${item.type}，中奖率 ${item.win_rate}%</span>
      <span>固定 ${money(item.fixed_amount_cents)}，范围 ${money(item.min_amount_cents)} - ${money(item.max_amount_cents)}</span>
    </div>
  `).join('') : '<div class="item"><span>暂无红包策略</span></div>';

  $('#batchStrategy').innerHTML = strategies.map((item) => (
    `<option value="${item.id}">${item.name} / ${item.type}</option>`
  )).join('');
}

function renderBatches(batches) {
  $('#batchList').innerHTML = batches.length ? batches.map((item) => `
    <div class="item">
      <strong>${item.batch_no}</strong>
      <span>${item.product_name}</span>
      <span>${item.quantity} 个</span>
      <span>${item.strategy_name}</span>
      <button type="button" data-export="${item.id}">导出PDF</button>
    </div>
  `).join('') : '<div class="item"><span>暂无批次</span></div>';
}

async function refreshAll() {
  [products, strategies] = await Promise.all([
    api('/api/admin/products'),
    api('/api/admin/strategies')
  ]);
  const batches = await api('/api/admin/batches');
  renderProducts();
  renderStrategies();
  renderBatches(batches);
}

function formJson(form) {
  return Object.fromEntries(new FormData(form).entries());
}

$('#loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage('#loginMessage', '正在登录...');
  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(formJson(event.currentTarget))
    });
    token = data.token;
    localStorage.setItem(tokenKey, token);
    showDashboard(true);
    await refreshAll();
    setMessage('#pageMessage', '登录成功', 'ok');
  } catch (error) {
    setMessage('#loginMessage', error.message, 'error');
  }
});

$('#logoutButton').addEventListener('click', () => {
  token = '';
  localStorage.removeItem(tokenKey);
  showDashboard(false);
});

$('#productForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await api('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(formJson(event.currentTarget))
    });
    event.currentTarget.reset();
    await refreshAll();
    setMessage('#pageMessage', '产品已新增', 'ok');
  } catch (error) {
    setMessage('#pageMessage', error.message, 'error');
  }
});

$('#strategyForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = formJson(event.currentTarget);
  body.winRate = Number(body.winRate || 100);
  ['fixedAmount', 'minAmount', 'maxAmount'].forEach((key) => {
    if (body[key] === '') delete body[key];
    else body[key] = Number(body[key]);
  });
  try {
    await api('/api/admin/strategies', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    event.currentTarget.reset();
    await refreshAll();
    setMessage('#pageMessage', '红包策略已新增', 'ok');
  } catch (error) {
    setMessage('#pageMessage', error.message, 'error');
  }
});

$('#batchForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = formJson(event.currentTarget);
  body.productId = Number(body.productId);
  body.strategyId = Number(body.strategyId);
  body.quantity = Number(body.quantity);
  try {
    await api('/api/admin/batches/generate', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    await refreshAll();
    setMessage('#pageMessage', '二维码批次已生成', 'ok');
  } catch (error) {
    setMessage('#pageMessage', error.message, 'error');
  }
});

$('#batchList').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-export]');
  if (!button) return;
  try {
    const data = await api(`/api/admin/batches/${button.dataset.export}/export`, {
      method: 'POST',
      body: JSON.stringify({ format: 'pdf' })
    });
    await downloadFile(data.downloadUrl, data.fileName);
    setMessage('#pageMessage', 'PDF 已生成并开始下载', 'ok');
  } catch (error) {
    setMessage('#pageMessage', error.message, 'error');
  }
});

if (token) {
  showDashboard(true);
  refreshAll().catch((error) => {
    localStorage.removeItem(tokenKey);
    token = '';
    showDashboard(false);
    setMessage('#loginMessage', error.message, 'error');
  });
}
