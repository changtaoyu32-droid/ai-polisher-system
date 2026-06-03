import { SYSTEM_ROLES } from "./config.js";
import { localRewrite, getLevenshteinDistance, calculateModifyRate, diffText, escapeHtml } from "./engine.js";
import { sendPromptStream } from "./api.js";

// DOM 元素引用
const elRoleSelect = document.getElementById("role-select");
const elActiveRoleTags = document.getElementById("active-role-tags");

const elBtnTheme = document.getElementById("btn-theme");
const elBtnApiConfig = document.getElementById("btn-api-config");
const elApiDrawerBackdrop = document.getElementById("api-drawer-backdrop");
const elBtnCloseDrawer = document.getElementById("btn-close-drawer");

const elApiEndpoint = document.getElementById("api-endpoint");
const elApiKey = document.getElementById("api-key");
const elApiModel = document.getElementById("api-model");
const elApiTemp = document.getElementById("api-temp");
const elValTemp = document.getElementById("val-temp");
const elBtnSaveConfig = document.getElementById("btn-save-config");
const elBtnClearConfig = document.getElementById("btn-clear-config");

const elSourceText = document.getElementById("source-text");
const elBtnClearSource = document.getElementById("btn-clear-source");
const elBtnPasteSource = document.getElementById("btn-paste-source");
const elSourceCharCount = document.getElementById("source-char-count");

const elTargetRender = document.getElementById("target-render");
const elTargetCharCount = document.getElementById("target-char-count");
const elCharStatusBadge = document.getElementById("char-status-badge");

const elBtnViewNormal = document.getElementById("btn-view-normal");
const elBtnViewDiff = document.getElementById("btn-view-diff");
const elBtnCopyTarget = document.getElementById("btn-copy-target");
const elBtnConvert = document.getElementById("btn-convert");

const elValModifyRate = document.getElementById("val-modify-rate");
const elCircleModify = document.getElementById("circle-modify");
const elRingModifyText = document.getElementById("ring-modify-text");
const elValAiBefore = document.getElementById("val-ai-before");
const elValAiAfter = document.getElementById("val-ai-after");
const elValCharRatio = document.getElementById("val-char-ratio");
const elCharStatusIndicator = document.getElementById("char-status-indicator");
const elMetricCharDiff = document.getElementById("metric-char-diff");

const elBtnHistory = document.getElementById("btn-history");
const elHistoryDropdown = document.getElementById("history-dropdown");
const elToast = document.getElementById("toast-notify");

// 状态变量
let currentTheme = localStorage.getItem("theme") || "dark";
let apiConfig = JSON.parse(localStorage.getItem("apiConfig")) || {
  endpoint: "https://api.deepseek.com/v1",
  apiKey: "",
  model: "deepseek-chat",
  temperature: 0.6
};
let isConverting = false;
let currentViewMode = "normal"; // normal | diff
let convertedResult = ""; // 存放最新降重得到的纯文本
let selectedRoleId = SYSTEM_ROLES[0].id; // 默认选中第一个角色

// 初始化页面
function init() {
  // A. 设置主题
  document.body.setAttribute("data-theme", currentTheme);
  
  // B. 动态渲染下拉选择框策略
  renderRoleOptions();

  // C. 回显 API 配置
  elApiEndpoint.value = apiConfig.endpoint;
  elApiKey.value = apiConfig.apiKey;
  elApiModel.value = apiConfig.model;
  elApiTemp.value = apiConfig.temperature;
  elValTemp.textContent = apiConfig.temperature;

  // D. 注册 DOM 事件监听
  registerEvents();
  
  // E. 渲染历史记录列表
  renderHistoryList();

  // F. 预置欢迎文本并分析
  const welcomeText = "随着AI技术的飞速发展，大语言模型生成的文本越来越普遍，但也伴随着表达僵硬、AI概率偏高的问题。通过运用多种长短句转换和词汇替换规则，我们可以极大地提高文本的可读性。";
  elSourceText.value = welcomeText;
  updateSourceWordCount();
  triggerLocalDemo(welcomeText);
}

// 动态渲染角色下拉选择器选项
function renderRoleOptions() {
  elRoleSelect.innerHTML = SYSTEM_ROLES.map(role => `
    <option value="${role.id}">${role.name}</option>
  `).join("");
  
  // 初始化默认角色的推荐查重标签
  elRoleSelect.value = selectedRoleId;
  renderActiveRoleTags(selectedRoleId);
}

// 动态渲染当前选中策略的推荐查重标签
function renderActiveRoleTags(roleId) {
  const role = SYSTEM_ROLES.find(r => r.id === roleId);
  if (!role || !role.tags) {
    elActiveRoleTags.innerHTML = "";
    return;
  }
  
  const tagsHtml = role.tags.map(t => `<span class="role-tag">${t}</span>`).join("");
  elActiveRoleTags.innerHTML = `
    <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">推荐应对:</span>
    ${tagsHtml}
  `;
}

// 展示提示气泡
function showToast(message, isError = false) {
  elToast.querySelector("span").textContent = message;
  if (isError) {
    elToast.style.borderColor = "var(--color-danger)";
  } else {
    elToast.style.borderColor = "var(--border-color-active)";
  }
  elToast.classList.add("show");
  setTimeout(() => elToast.classList.remove("show"), 2500);
}

// 注册所有交互事件
function registerEvents() {
  // 1. 下拉框选择切换
  elRoleSelect.addEventListener("change", (e) => {
    selectedRoleId = e.target.value;
    renderActiveRoleTags(selectedRoleId);
    const role = SYSTEM_ROLES.find(r => r.id === selectedRoleId);
    showToast(`已选定：${role ? role.name : selectedRoleId}`);
  });

  // 2. 主题切换
  elBtnTheme.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    document.body.setAttribute("data-theme", currentTheme);
    localStorage.setItem("theme", currentTheme);
    showToast(`已切换至${currentTheme === 'dark' ? '深色科技' : '苹果明亮'}模式`);
  });

  // 3. 打开/关闭 API 配置抽屉
  elBtnApiConfig.addEventListener("click", () => {
    elApiDrawerBackdrop.classList.add("active");
  });
  elBtnCloseDrawer.addEventListener("click", () => {
    elApiDrawerBackdrop.classList.remove("active");
  });
  elApiDrawerBackdrop.addEventListener("click", (e) => {
    if (e.target === elApiDrawerBackdrop) {
      elApiDrawerBackdrop.classList.remove("active");
    }
  });

  // 4. API 配置保存与清空
  elApiTemp.addEventListener("input", (e) => {
    elValTemp.textContent = e.target.value;
  });
  
  elBtnSaveConfig.addEventListener("click", () => {
    apiConfig = {
      endpoint: elApiEndpoint.value.trim(),
      apiKey: elApiKey.value.trim(),
      model: elApiModel.value.trim(),
      temperature: parseFloat(elApiTemp.value)
    };
    localStorage.setItem("apiConfig", JSON.stringify(apiConfig));
    showToast("API 配置保存成功！");
    elApiDrawerBackdrop.classList.remove("active");
  });

  elBtnClearConfig.addEventListener("click", () => {
    elApiEndpoint.value = "https://api.openai.com/v1";
    elApiKey.value = "";
    elApiModel.value = "gpt-3.5-turbo";
    elApiTemp.value = 0.6;
    elValTemp.textContent = "0.6";
    apiConfig = {
      endpoint: "https://api.openai.com/v1",
      apiKey: "",
      model: "gpt-3.5-turbo",
      temperature: 0.6
    };
    localStorage.removeItem("apiConfig");
    showToast("配置已清空并恢复默认");
  });

  // 5. 原文操作与字数检测
  elSourceText.addEventListener("input", updateSourceWordCount);
  elBtnClearSource.addEventListener("click", () => {
    elSourceText.value = "";
    updateSourceWordCount();
  });
  elBtnPasteSource.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      elSourceText.value = text;
      updateSourceWordCount();
      showToast("已成功粘贴剪贴板内容");
    } catch (err) {
      showToast("粘贴失败，请手动按下 Ctrl+V", true);
    }
  });

  // 6. 核心转换触发
  elBtnConvert.addEventListener("click", handleConvert);

  // 7. 视图切换与复制
  elBtnViewNormal.addEventListener("click", () => {
    currentViewMode = "normal";
    elBtnViewNormal.classList.add("active");
    elBtnViewDiff.classList.remove("active");
    renderTargetText();
  });

  elBtnViewDiff.addEventListener("click", () => {
    currentViewMode = "diff";
    elBtnViewDiff.classList.add("active");
    elBtnViewNormal.classList.remove("active");
    renderTargetText();
  });

  elBtnCopyTarget.addEventListener("click", () => {
    if (!convertedResult) {
      showToast("没有可复制的内容", true);
      return;
    }
    navigator.clipboard.writeText(convertedResult)
      .then(() => showToast("降重文本已复制到剪贴板"))
      .catch(() => showToast("复制失败，请手动选择复制", true));
  });

  // 8. 历史记录弹窗切换
  elBtnHistory.addEventListener("click", (e) => {
    e.stopPropagation();
    elHistoryDropdown.classList.toggle("active");
  });

  document.addEventListener("click", () => {
    elHistoryDropdown.classList.remove("active");
  });
}

// 更新原文字数
function updateSourceWordCount() {
  const text = elSourceText.value;
  elSourceCharCount.textContent = `${text.length} 字`;
}

// 渲染输出框（根据视图模式）
function renderTargetText() {
  if (!convertedResult) {
    elTargetRender.innerHTML = '<span style="color: var(--text-muted);">转换后文本将在此处动态流式输出并分析...</span>';
    return;
  }
  
  if (currentViewMode === "diff") {
    const diffHtml = diffText(elSourceText.value, convertedResult);
    elTargetRender.innerHTML = diffHtml;
  } else {
    elTargetRender.innerHTML = escapeHtml(convertedResult);
  }
}

// 处理转换主逻辑
async function handleConvert() {
  const sourceText = elSourceText.value.trim();
  if (!sourceText) {
    showToast("请输入需要降低AI相似度的原文！", true);
    return;
  }

  if (isConverting) return;

  const role = SYSTEM_ROLES.find(r => r.id === selectedRoleId);
  const systemPrompt = role ? role.systemPrompt : "";

  isConverting = true;
  elBtnConvert.disabled = true;
  elBtnConvert.querySelector("span").textContent = "正在降重改写中...";
  
  // 清空上一次结果并展示输入提示
  convertedResult = "";
  elTargetRender.innerHTML = "";
  elTargetRender.classList.add("typing-cursor");

  // A. 未配置 API Key，执行本地离线转换引擎
  if (!apiConfig.apiKey) {
    showToast("未配置 API Key，已启用本地正则降AI模拟引擎", false);
    
    // 执行本地引擎改写
    const localResult = localRewrite(sourceText);
    
    // 模拟流式打字输出
    simulateTyping(localResult, 
      (chunk) => {
        convertedResult += chunk;
        elTargetRender.textContent = convertedResult;
        elTargetCharCount.textContent = `${convertedResult.length} 字`;
      }, 
      () => {
        // 完成回调
        finalizeConversion(selectedRoleId);
      }
    );
  } 
  // B. 已配置 API Key，发起大模型 SSE 流式请求
  else {
    await sendPromptStream(
      apiConfig,
      systemPrompt,
      sourceText,
      (token) => {
        // 接收每个 token 的回调
        convertedResult += token;
        // 流式过程中为防卡顿只更新纯文本
        elTargetRender.textContent = convertedResult;
        elTargetCharCount.textContent = `${convertedResult.length} 字`;
        updateMetrics(sourceText, convertedResult, false);
      },
      () => {
        // 成功结束
        finalizeConversion(selectedRoleId);
      },
      (errorMsg) => {
        // 报错处理
        elTargetRender.classList.remove("typing-cursor");
        elTargetRender.innerHTML = `<span style="color: var(--color-danger); font-weight: 500;">❌ 转换出错：${errorMsg}</span>`;
        isConverting = false;
        elBtnConvert.disabled = false;
        elBtnConvert.querySelector("span").textContent = "智能降重改写";
        showToast(errorMsg, true);
      }
    );
  }
}

// 本地模拟打字机动画
function simulateTyping(text, onToken, onComplete) {
  let index = 0;
  // 根据总长度调整打字速度，防止长文章打字等待过久
  const speed = Math.max(3, Math.min(20, Math.floor(500 / text.length)));
  const timer = setInterval(() => {
    if (index < text.length) {
      // 每次截取 1~3 个字输出
      const chunkSize = Math.min(3, text.length - index);
      const chunk = text.slice(index, index + chunkSize);
      onToken(chunk);
      index += chunkSize;
    } else {
      timer && clearInterval(timer);
      onComplete();
    }
  }, speed);
}

// 转换完成后更新面板数据与存储
function finalizeConversion(roleId) {
  elTargetRender.classList.remove("typing-cursor");
  isConverting = false;
  elBtnConvert.disabled = false;
  elBtnConvert.querySelector("span").textContent = "智能降重改写";

  // 渲染最终结果（可包含 Diff）
  renderTargetText();

  // 更新指标
  updateMetrics(elSourceText.value, convertedResult, true);

  // 保存历史记录
  saveToHistory(roleId, elSourceText.value, convertedResult);
}

// 用于在初始化时做首屏演示
function triggerLocalDemo(text) {
  const result = localRewrite(text);
  convertedResult = result;
  renderTargetText();
  elTargetCharCount.textContent = `${result.length} 字`;
  updateMetrics(text, result, true);
}

// 更新数据指标图表面板
function updateMetrics(sourceText, targetText, isFinal = true) {
  const sLen = sourceText.length || 1;
  const tLen = targetText.length;

  // 1. 字数比例与合理性监控
  const ratio = Math.round((tLen / sLen) * 100);
  elValCharRatio.textContent = `${ratio}%`;

  elMetricCharDiff.classList.remove("warning-shake");

  if (tLen === 0) {
    elCharStatusIndicator.innerHTML = '<span class="badge-success">待输入</span>';
  } else if (ratio > 105) {
    elCharStatusIndicator.innerHTML = '<span class="badge-warning">偏多警告 ⚠️</span>';
    if (isFinal) {
      elMetricCharDiff.classList.add("warning-shake");
    }
  } else if (ratio < 80) {
    elCharStatusIndicator.innerHTML = '<span class="badge-warning">字数偏少</span>';
  } else {
    elCharStatusIndicator.innerHTML = '<span class="badge-success">完美契合 ✓</span>';
  }

  // 2. 去重修改率 (编辑距离)
  const modifyRate = calculateModifyRate(sourceText, targetText);
  elValModifyRate.textContent = `${modifyRate}%`;
  elRingModifyText.textContent = `${modifyRate}%`;

  // SVG 环形图进度更新 (周长 = 2 * PI * r = 2 * 3.14159 * 23 = 144.51)
  const strokeDashoffset = 144.51 - (144.51 * modifyRate) / 100;
  elCircleModify.style.strokeDashoffset = strokeDashoffset;

  // 3. AI 概率降低值模拟计算
  const baseAi = 95;
  let finalAi = baseAi - Math.floor(modifyRate * 0.95);
  if (finalAi < 8) finalAi = 8;
  if (tLen === 0) finalAi = 95;

  elValAiBefore.textContent = "95%";
  elValAiAfter.textContent = `${finalAi}%`;
}

// 保存至历史记录
function saveToHistory(roleId, source, target) {
  if (!source || !target) return;
  
  const history = JSON.parse(localStorage.getItem("conversion_history")) || [];
  const role = SYSTEM_ROLES.find(r => r.id === roleId);

  const newRecord = {
    id: Date.now(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    roleName: role ? role.name : "未知角色",
    roleId: roleId,
    source: source,
    target: target
  };

  // 保留最近 10 条
  history.unshift(newRecord);
  if (history.length > 10) history.pop();

  localStorage.setItem("conversion_history", JSON.stringify(history));
  renderHistoryList();
}

// 渲染历史记录下拉列表
function renderHistoryList() {
  const history = JSON.parse(localStorage.getItem("conversion_history")) || [];
  if (history.length === 0) {
    elHistoryDropdown.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.82rem;">暂无历史记录</div>';
    return;
  }

  elHistoryDropdown.innerHTML = history.map(item => `
    <div class="history-item" data-id="${item.id}">
      <div class="history-item-time">[${item.time}] ${item.roleName}</div>
      <div class="history-item-preview">${escapeHtml(item.source.slice(0, 50))}...</div>
    </div>
  `).join("");

  // 绑定历史项目点击事件
  elHistoryDropdown.querySelectorAll(".history-item").forEach(el => {
    el.addEventListener("click", () => {
      const id = parseInt(el.getAttribute("data-id"));
      const record = history.find(item => item.id === id);
      if (record) {
        elSourceText.value = record.source;
        convertedResult = record.target;
        updateSourceWordCount();
        elTargetCharCount.textContent = `${convertedResult.length} 字`;
        
        // 更新下拉框状态与标签
        elRoleSelect.value = record.roleId;
        selectedRoleId = record.roleId;
        renderActiveRoleTags(record.roleId);
        
        renderTargetText();
        updateMetrics(record.source, record.target, true);
        showToast("历史记录已成功回填");
      }
    });
  });
}

// 页面加载完成后启动
window.addEventListener("DOMContentLoaded", init);
