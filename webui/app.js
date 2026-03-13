// API 基础路径
const API_BASE = '/api';

// 状态
let profiles = [];
let providers = [];
let currentProfile = null;

// DOM 元素
const elements = {
  currentProfileName: document.getElementById('current-profile-name'),
  currentProfileType: document.getElementById('current-profile-type'),
  profilesTbody: document.getElementById('profiles-tbody'),
  errorToast: document.getElementById('error-toast'),
  successToast: document.getElementById('success-toast'),
  detailsDrawer: document.getElementById('details-drawer'),
  detailsTitle: document.getElementById('details-title'),
  detailsBody: document.getElementById('details-body'),
  createModal: document.getElementById('create-modal'),
  createForm: document.getElementById('create-form'),
  createProvider: document.getElementById('create-provider'),
  createModel: document.getElementById('create-model'),
};

// 显示错误提示
function showError(message) {
  elements.errorToast.textContent = message;
  elements.errorToast.classList.remove('hidden');
  setTimeout(() => elements.errorToast.classList.add('hidden'), 3000);
}

// 显示成功提示
function showSuccess(message) {
  elements.successToast.textContent = message;
  elements.successToast.classList.remove('hidden');
  setTimeout(() => elements.successToast.classList.add('hidden'), 3000);
}

// 格式化日期
function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 获取 Provider 类型标签
function getProviderTypeBadge(type) {
  const badges = {
    'openai-compatible': '<span class="badge badge-openai">OpenAI Compatible</span>',
    'claude-native': '<span class="badge badge-claude">Claude Native</span>',
    'custom': '<span class="badge badge-custom">Custom</span>',
  };
  return badges[type] || `<span class="badge">${escapeHtml(type)}</span>`;
}

// HTML 转义防止 XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// API 请求封装
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `请求失败: ${response.status}`);
  }

  return response.json();
}

// 加载当前 profile
async function loadCurrent() {
  try {
    const data = await apiRequest('/current');
    currentProfile = data.active ? { name: data.active, ...data.profile } : null;
    updateCurrentStatus();
  } catch (error) {
    console.error('加载当前配置失败:', error);
  }
}

// 加载 profiles 列表
async function loadProfiles() {
  try {
    const data = await apiRequest('/profiles');
    profiles = data.profiles || [];
    renderProfiles();
  } catch (error) {
    console.error('加载配置列表失败:', error);
    elements.profilesTbody.innerHTML = `
      <tr>
        <td colspan="6" class="error-row">加载失败: ${escapeHtml(error.message)}</td>
      </tr>
    `;
  }
}

// 加载 providers 列表
async function loadProviders() {
  try {
    const data = await apiRequest('/providers');
    providers = data.providers || [];
    updateProviderSelect();
  } catch (error) {
    console.error('加载 Providers 失败:', error);
  }
}

// 更新 Provider 下拉框
function updateProviderSelect() {
  const select = elements.createProvider;
  select.innerHTML = '<option value="">请选择 Provider</option>';

  providers.forEach(provider => {
    const option = document.createElement('option');
    option.value = provider.name;
    option.textContent = provider.displayName;
    option.dataset.defaultModel = provider.defaultModel;
    option.dataset.models = JSON.stringify(provider.models);
    select.appendChild(option);
  });
}

// 更新模型输入提示
function updateModelHint() {
  const providerSelect = elements.createProvider;
  const modelInput = elements.createModel;
  const selectedOption = providerSelect.options[providerSelect.selectedIndex];

  if (selectedOption && selectedOption.value) {
    const defaultModel = selectedOption.dataset.defaultModel || '';
    modelInput.placeholder = `可选，留空使用默认: ${defaultModel}`;
  } else {
    modelInput.placeholder = '选择 Provider 后可用';
  }
}

// 更新当前状态显示
function updateCurrentStatus() {
  if (currentProfile) {
    elements.currentProfileName.textContent = currentProfile.name;
    elements.currentProfileType.innerHTML = `<span class="status-badge">${escapeHtml(currentProfile.providerDisplayName || currentProfile.provider)}</span>`;
  } else {
    elements.currentProfileName.textContent = '无';
    elements.currentProfileType.textContent = '';
  }
}

// 渲染 profiles 列表
function renderProfiles() {
  if (profiles.length === 0) {
    elements.profilesTbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-row">暂无配置，点击"新建配置"创建</td>
      </tr>
    `;
    return;
  }

  elements.profilesTbody.innerHTML = profiles.map(profile => {
    const isActive = profile.isActive;
    const model = profile.model || profile.defaultModel || '-';

    return `
      <tr class="${isActive ? 'active-row' : ''}">
        <td>
          <span class="profile-name">${escapeHtml(profile.name)}</span>
          ${isActive ? '<span class="active-badge">当前</span>' : ''}
        </td>
        <td>${getProviderTypeBadge(profile.providerType)}</td>
        <td>
          <div>${escapeHtml(profile.providerDisplayName || profile.provider)}</div>
          <div class="profile-model">${escapeHtml(model)}</div>
        </td>
        <td>${escapeHtml(profile.description) || '-'}</td>
        <td>${formatDate(profile.createdAt)}</td>
        <td class="actions">
          ${!isActive ? `<button class="btn btn-sm btn-use" data-name="${escapeHtml(profile.name)}">启用</button>` : ''}
          <button class="btn btn-sm btn-details" data-name="${escapeHtml(profile.name)}">详情</button>
          <button class="btn btn-sm btn-delete" data-name="${escapeHtml(profile.name)}">删除</button>
        </td>
      </tr>
    `;
  }).join('');

  // 绑定事件
  elements.profilesTbody.querySelectorAll('.btn-use').forEach(btn => {
    btn.addEventListener('click', () => useProfile(btn.dataset.name));
  });
  elements.profilesTbody.querySelectorAll('.btn-details').forEach(btn => {
    btn.addEventListener('click', () => showDetails(btn.dataset.name));
  });
  elements.profilesTbody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteProfile(btn.dataset.name));
  });
}

// 启用 profile
async function useProfile(name) {
  try {
    await apiRequest('/use', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    showSuccess(`已启用配置: ${name}`);
    await loadCurrent();
    await loadProfiles();
  } catch (error) {
    showError(error.message);
  }
}

// 删除 profile
async function deleteProfile(name) {
  if (!confirm(`确定要删除配置 "${name}" 吗？`)) {
    return;
  }

  try {
    await apiRequest(`/profiles/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
    showSuccess(`已删除配置: ${name}`);
    await loadCurrent();
    await loadProfiles();
  } catch (error) {
    showError(error.message);
  }
}

// 显示详情
function showDetails(name) {
  const profile = profiles.find(p => p.name === name);
  if (!profile) return;

  elements.detailsTitle.textContent = `${profile.name} 详情`;

  const model = profile.model || profile.defaultModel || '-';

  let html = `
    <div class="detail-group">
      <label>名称</label>
      <div>${escapeHtml(profile.name)}</div>
    </div>
    <div class="detail-group">
      <label>Provider</label>
      <div>${escapeHtml(profile.providerDisplayName || profile.provider)}</div>
    </div>
    <div class="detail-group">
      <label>Provider 类型</label>
      <div>${getProviderTypeBadge(profile.providerType)}</div>
    </div>
    <div class="detail-group">
      <label>模型</label>
      <div>${escapeHtml(model)}${profile.model ? ' (覆盖)' : ' (默认)'}</div>
    </div>
    <div class="detail-group">
      <label>描述</label>
      <div>${escapeHtml(profile.description) || '-'}</div>
    </div>
    <div class="detail-group">
      <label>创建时间</label>
      <div>${formatDate(profile.createdAt)}</div>
    </div>
    <div class="detail-group">
      <label>更新时间</label>
      <div>${formatDate(profile.updatedAt)}</div>
    </div>
  `;

  if (profile.availableModels && profile.availableModels.length > 0) {
    html += `
      <div class="detail-group">
        <label>可用模型</label>
        <div>${profile.availableModels.map(m => escapeHtml(m)).join(', ')}</div>
      </div>
    `;
  }

  elements.detailsBody.innerHTML = html;
  elements.detailsDrawer.classList.remove('hidden');
}

// 关闭详情抽屉
function closeDetails() {
  elements.detailsDrawer.classList.add('hidden');
}

// 打开创建弹窗
function openCreateModal() {
  elements.createForm.reset();
  elements.createModel.placeholder = '选择 Provider 后可用';
  elements.createModal.classList.remove('hidden');
}

// 关闭创建弹窗
function closeCreateModal() {
  elements.createModal.classList.add('hidden');
}

// 创建 profile
async function createProfile(event) {
  event.preventDefault();

  const formData = new FormData(elements.createForm);
  const name = formData.get('name')?.toString().trim();
  const provider = formData.get('provider')?.toString().trim();
  const model = formData.get('model')?.toString().trim();
  const description = formData.get('description')?.toString().trim();
  const useNow = formData.get('use-now') === 'on';

  if (!name) {
    showError('请填写名称');
    return;
  }

  if (!provider) {
    showError('请选择 Provider');
    return;
  }

  // 验证名称格式（只允许字母、数字、下划线、连字符）
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    showError('名称只能包含字母、数字、下划线和连字符');
    return;
  }

  const body = {
    name,
    provider,
    model: model || undefined,
    description: description || undefined,
    useNow,
  };

  try {
    const result = await apiRequest('/profiles', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    showSuccess(`配置 "${result.created}" 已创建${result.used ? ' 并已启用' : ''}`);
    closeCreateModal();
    await loadCurrent();
    await loadProfiles();
  } catch (error) {
    showError(error.message);
  }
}

// 初始化
function init() {
  // 加载数据
  Promise.all([loadProviders(), loadCurrent(), loadProfiles()]);

  // 刷新按钮
  document.getElementById('refresh-btn').addEventListener('click', () => {
    loadCurrent();
    loadProfiles();
  });

  // 新建按钮
  document.getElementById('create-btn').addEventListener('click', openCreateModal);

  // 详情抽屉
  document.getElementById('close-details').addEventListener('click', closeDetails);
  document.querySelector('.drawer-overlay').addEventListener('click', closeDetails);

  // 创建弹窗
  document.getElementById('close-create').addEventListener('click', closeCreateModal);
  document.getElementById('create-cancel').addEventListener('click', closeCreateModal);
  document.querySelector('.modal-overlay').addEventListener('click', closeCreateModal);
  elements.createForm.addEventListener('submit', createProfile);
  document.getElementById('create-submit').addEventListener('click', createProfile);

  // Provider 选择变化时更新模型提示
  elements.createProvider.addEventListener('change', updateModelHint);
}

// 启动
init();