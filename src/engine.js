import { LOCAL_REPLACEMENTS } from "./config.js";

/**
 * 字符转义工具，保留 HTML 的特殊字符以及换行
 */
export function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br/>");
}

/**
 * 1. 经典编辑距离 Levenshtein Distance
 */
export function getLevenshteinDistance(s1, s2) {
  const len1 = s1.length;
  const len2 = s2.length;
  const dp = Array.from({ length: len1 + 1 }, () => new Int32Array(len2 + 1));

  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,       // 删除
        dp[i][j - 1] + 1,       // 插入
        dp[i - 1][j - 1] + cost // 替换
      );
    }
  }
  return dp[len1][len2];
}

/**
 * 计算文本修改度百分比
 */
export function calculateModifyRate(s1, s2) {
  if (!s1 && !s2) return 0;
  if (!s1 || !s2) return 100;
  const distance = getLevenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  return Math.min(Math.round((distance / maxLen) * 100), 100);
}

/**
 * 2. 基于最长公共子序列 (LCS) 的字符差异对比 (Diff)
 */
export function diffText(s1, s2) {
  const chars1 = Array.from(s1 || "");
  const chars2 = Array.from(s2 || "");
  const m = chars1.length;
  const n = chars2.length;

  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (chars1[i - 1] === chars2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = m, j = n;
  const result = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && chars1[i - 1] === chars2[j - 1]) {
      result.push({ type: "equal", text: chars1[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: "insert", text: chars2[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i - 1][j] >= dp[i][j - 1])) {
      result.push({ type: "delete", text: chars1[i - 1] });
      i--;
    }
  }
  result.reverse();

  // 合并连续同类型节点
  const merged = [];
  for (const item of result) {
    if (merged.length > 0 && merged[merged.length - 1].type === item.type) {
      merged[merged.length - 1].text += item.text;
    } else {
      merged.push({ ...item });
    }
  }

  // 生成对比 HTML
  return merged.map(item => {
    const escaped = escapeHtml(item.text);
    if (item.type === "insert") {
      return `<span class="diff-insert">${escaped}</span>`;
    } else if (item.type === "delete") {
      return `<span class="diff-delete">${escaped}</span>`;
    } else {
      return escaped;
    }
  }).join("");
}

/**
 * 3. 本地启发式正则降AI替换引擎
 */
export function localRewrite(text) {
  if (!text) return "";
  let result = text;

  // A.1 因果句式变换："因为A，所以B" -> "之所以B，其深层缘由主要在于A"
  result = result.replace(/因为([^，。；！？\s]+)，所以([^，。；！？\s]+)/g, (...args) => {
    const templates = [
      "之所以$2，其深层缘由主要在于$1",
      "鉴于$1，因而$2",
      "$2的产生，与$1这一因果链条密不可分"
    ];
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template.replace(/\$1/g, args[1]).replace(/\$2/g, args[2]);
  });

  // A.2 条件句式重组："如果A，就B" -> "在满足A的前提下，便会B"
  result = result.replace(/如果([^，。；！？\s]+)，就([^，。；！？\s]+)/g, (...args) => {
    const templates = [
      "在满足$1的前提下，便会$2",
      "一旦$1，则势必会$2",
      "要是真正实现了$1，那么就能够完成$2"
    ];
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template.replace(/\$1/g, args[1]).replace(/\$2/g, args[2]);
  });

  // A.3 转折句式精细化："虽然A，但是B" -> "尽管A，然而B"
  result = result.replace(/(?:虽然|尽管)([^，。；！？\s]+)，(?:但是|但|然而)([^，。；！？\s]+)/g, (...args) => {
    const templates = [
      "尽管$1，然而$2",
      "虽说$1，在此基础上却也$2",
      "固然在$1的同时，但也必须注意到$2"
    ];
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template.replace(/\$1/g, args[1]).replace(/\$2/g, args[2]);
  });

  // A.4 递进句式深度化："不仅A，而且B" -> "非但A，更在B的维度上起到了促进作用"
  result = result.replace(/(?:不仅|非但)([^，。；！？\s]+)，(?:而且|并且|还)([^，。；！？\s]+)/g, (...args) => {
    const templates = [
      "非但$1，更在$2的维度上得以深层次显现",
      "在实现$1的同时，更进一步促进了$2",
      "不仅在$1的层面上有所突破，协同其相关的$2也得到了优化"
    ];
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template.replace(/\$1/g, args[1]).replace(/\$2/g, args[2]);
  });

  // A.5 目的/手段句式："通过A，我们能够B" -> "凭借A，使得B得以顺利实现"
  result = result.replace(/通过([^，。；！？\s]+)，(?:我们|系统)?(?:能够|可以|来)([^，。；！？\s]+)/g, (...args) => {
    const templates = [
      "凭借着$1，使得$2这一目标得以顺利完成",
      "在借助$1的背景下，能够极大地便利$2",
      "依靠$1的支撑，从而为$2打下了坚实基础"
    ];
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template.replace(/\$1/g, args[1]).replace(/\$2/g, args[2]);
  });

  // A.6 基础条件句式转换: "若..., 则..." 替换为 "如果..., 就..."
  result = result.replace(/若([^，。；！？\s]+)，则([^，。；！？\s]+)/g, "如果$1，就$2");

  // B. 解耦与动词结构优化: "为了将...解耦" 替换为 "为了实现...的解耦"
  result = result.replace(/为了将([^，。]+)解耦/g, "为了实现$1的解耦");

  // C. 括号内容处理：
  // 1. 解释性括号 A（B） -> B即A 或 A也就是B
  // 匹配形如 中文（中文）的结构
  result = result.replace(/([\u4e00-\u9fa5]+)[（(]([\u4e00-\u9fa5]+)[）)]/g, "$2即$1");
  
  // 2. 代码/文件名标识符旁括号，直接移除括号：如 视图(views.py)中 -> 视图views.py中
  // 匹配形如 中文(英文且有文件特征如.py/类名特征) 的结构
  result = result.replace(/([\u4e00-\u9fa5]+)[（(]([a-zA-Z0-9_\.\-]+)[）)]/g, "$1 $2");

  // D. 顺序执行词汇表替换（每次匹配时均随机在同义词池中抽选，支持正则捕获组，保证多次点击转换结果不一致）
  for (const item of LOCAL_REPLACEMENTS) {
    if (item.replacements && item.replacements.length > 0) {
      result = result.replace(item.pattern, (...args) => {
        const pool = item.replacements;
        const template = pool[Math.floor(Math.random() * pool.length)];
        // 动态将模板中的 $1, $2 替换为正则捕获组的内容
        return template.replace(/\$(\d+)/g, (_, index) => {
          return args[parseInt(index)] || "";
        });
      });
    }
  }

  // E. 兜底判定：如果改写后文本与原文一模一样，或者变化极微小（编辑距离 < 3），
  // 则启动“智能学术句式兜底变换”机制，强行产生合理变化，绝不输出相同文本。
  if (result === text || getLevenshteinDistance(text, result) < 3) {
    // 步骤 1：强制执行高频基础词同义替换，确保必然产生字词级变化
    const fallbackReplacements = [
      { pattern: /可以/g, replacement: "能够" },
      { pattern: /进行/g, replacement: "开展" },
      { pattern: /系统/g, replacement: "系统体系" },
      { pattern: /设计/g, replacement: "规划设计" },
      { pattern: /分析/g, replacement: "剖析与研究" },
      { pattern: /实现/g, replacement: "得以完成" },
      { pattern: /合理/g, replacement: "契合逻辑" },
      { pattern: /重要/g, replacement: "关键核心" },
      { pattern: /在/g, replacement: "于" },
      { pattern: /是/g, replacement: "即为" }
    ];

    let replacedCount = 0;
    for (const item of fallbackReplacements) {
      if (item.pattern.test(result)) {
        // 只替换第一次出现的词，适可而止，避免语意崩坏
        result = result.replace(item.pattern, item.replacement);
        replacedCount++;
        if (replacedCount >= 2) break; // 修改 2 处基础词即可
      }
    }

    // 步骤 2：在句首或句中插入高端学术承接词
    let sentences = result.split(/(。|？|！)/);
    if (sentences.length > 0) {
      for (let i = 0; i < sentences.length; i++) {
        const item = sentences[i].trim();
        if (item.length > 3 && !item.startsWith("在") && !item.startsWith("如果") && !item.startsWith("虽然")) {
          const transitions = ["整体而言，", "可以明显看出，", "显而易见的是，", "在此基础之上，", "从实际应用角度来看，"];
          const randomTrans = transitions[Math.floor(Math.random() * transitions.length)];
          sentences[i] = randomTrans + sentences[i];
          break; // 插入一次即可
        }
      }
      result = sentences.join("");
    }

    // 步骤 3：在句尾进行万能学术行为扩展
    if (result.endsWith("。") && result.length > 10) {
      const endings = [
        "，以便于在此基础之上开展后续的优化与处理工作。",
        "，从而在极大程度上保障了整体架构与流程的稳定性。",
        "，这在实际研究和工程应用中是极其核心的一环。"
      ];
      const randomEnding = endings[Math.floor(Math.random() * endings.length)];
      result = result.slice(0, -1) + randomEnding;
    } else if (result.length > 6) {
      // 若没有句号结尾，直接在末尾加个逗号和扩展
      result = result + "，这在很大程度上促进了整项研究的深入开展。";
    }
  }

  return result;
}
