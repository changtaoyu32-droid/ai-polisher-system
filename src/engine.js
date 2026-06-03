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
 * 3. 本地启发式正则降AI替换引擎（V3 深度重构版）
 * 
 * 核心原理：AI检测器主要检测两个维度：
 * - Perplexity（困惑度）：AI用词极其可预测，困惑度低 → 需要增加用词的不可预测性
 * - Burstiness（突发性）：AI句子长度均匀 → 需要制造长短句交替的"突发"节奏
 * 
 * 本引擎通过四阶段处理：句式结构变换 → 词汇随机替换 → 句子级深度重组 → 人类瑕疵注入
 */
export function localRewrite(text) {
  if (!text) return "";
  let result = text;

  // ===== 第一阶段：句式结构级变换（打破AI的刻板逻辑顺序）=====

  // 因果句式颠倒
  result = result.replace(/因为([^，。；！？]+)，所以([^，。；！？]+)/g, (...a) => {
    const t = ["之所以$2，根本原因就在于$1", "正是由于$1，才使得$2", "$2这一现象的出现，归根结底要追溯到$1"];
    return t[Math.floor(Math.random() * t.length)].replace(/\$1/g, a[1]).replace(/\$2/g, a[2]);
  });

  // 条件句式
  result = result.replace(/(?:如果|若)([^，。；！？]+)，(?:就|则)([^，。；！？]+)/g, (...a) => {
    const t = ["当$1成立时，自然而然地$2", "一旦满足了$1这个前提，$2也就顺理成章了", "只要$1，那么$2便不在话下"];
    return t[Math.floor(Math.random() * t.length)].replace(/\$1/g, a[1]).replace(/\$2/g, a[2]);
  });

  // 转折句式
  result = result.replace(/(?:虽然|尽管)([^，。；！？]+)，(?:但是|但|然而|却)([^，。；！？]+)/g, (...a) => {
    const t = ["诚然$1，不过话说回来$2", "$1这一点固然不假，可换个角度看$2", "哪怕$1，也不能忽视$2这个事实"];
    return t[Math.floor(Math.random() * t.length)].replace(/\$1/g, a[1]).replace(/\$2/g, a[2]);
  });

  // 递进句式
  result = result.replace(/(?:不仅|不但)([^，。；！？]+)，(?:而且|并且|还|更)([^，。；！？]+)/g, (...a) => {
    const t = ["$1只是一方面，更值得关注的是$2", "除了$1以外，$2同样不容小觑", "在$1的基础上更往前走一步就会发现$2"];
    return t[Math.floor(Math.random() * t.length)].replace(/\$1/g, a[1]).replace(/\$2/g, a[2]);
  });

  // 目的手段句式
  result = result.replace(/通过([^，。；！？]+)，(?:我们|系统)?(?:能够|可以|来)([^，。；！？]+)/g, (...a) => {
    const t = ["借助$1这种方式，$2就变得切实可行了", "有了$1作为支撑，想要$2也就不再困难", "把$1用好了，$2自然水到渠成"];
    return t[Math.floor(Math.random() * t.length)].replace(/\$1/g, a[1]).replace(/\$2/g, a[2]);
  });

  // 解耦与动词结构
  result = result.replace(/为了将([^，。]+)解耦/g, "为了实现$1的解耦");

  // 括号内容处理
  result = result.replace(/([\u4e00-\u9fa5]+)[（(]([\u4e00-\u9fa5]+)[）)]/g, "$2即$1");
  result = result.replace(/([\u4e00-\u9fa5]+)[（(]([a-zA-Z0-9_\.\-]+)[）)]/g, "$1 $2");

  // ===== 第二阶段：词汇表随机替换 =====
  for (const item of LOCAL_REPLACEMENTS) {
    if (item.replacements && item.replacements.length > 0) {
      result = result.replace(item.pattern, (...args) => {
        const pool = item.replacements;
        const template = pool[Math.floor(Math.random() * pool.length)];
        return template.replace(/\$(\d+)/g, (_, index) => {
          return args[parseInt(index)] || "";
        });
      });
    }
  }

  // ===== 第三阶段：句子级深度重组（核心降AI策略）=====

  let sentences = result.split(/(?<=[。！？])/g).filter(s => s.trim().length > 0);

  if (sentences.length >= 2) {
    // 策略1：随机合并相邻短句（模拟人类将两个短句合成长句的习惯）
    for (let i = sentences.length - 2; i >= 0; i--) {
      const curr = sentences[i].replace(/[。！？]/g, "").trim();
      const next = sentences[i + 1].replace(/[。！？]/g, "").trim();
      if (curr.length < 15 && next.length < 15 && Math.random() > 0.5) {
        const connectors = ["，与此同时", "，顺带一提", "，紧接着", "，在这种情况下"];
        const c = connectors[Math.floor(Math.random() * connectors.length)];
        sentences[i] = curr + c + next + "。";
        sentences.splice(i + 1, 1);
      }
    }

    // 策略2：随机拆分长句（模拟人类将复杂长句拆成两个短句的思维）
    for (let i = sentences.length - 1; i >= 0; i--) {
      const s = sentences[i];
      if (s.length > 40 && Math.random() > 0.4) {
        const commaIdx = s.indexOf("，", Math.floor(s.length * 0.3));
        if (commaIdx > 0 && commaIdx < s.length - 5) {
          const part1 = s.slice(0, commaIdx) + "。";
          const part2 = s.slice(commaIdx + 1);
          sentences.splice(i, 1, part1, part2);
        }
      }
    }

    // 策略3：随机为句首添加多样化衔接词（打破AI句首的单调性）
    const diverseStarters = [
      "说到这里，", "值得注意的是，", "有意思的是，", "事实上，",
      "从另一个角度来看，", "不得不说，", "坦率地讲，", "换句话说，",
      "进一步来看，", "细想之下，", "回过头来看，", "客观来讲，",
      "这里需要指出的是，", "简单来说，", "严格说来，", "从实践角度出发，"
    ];
    let starterCount = 0;
    const maxStarters = Math.max(1, Math.floor(sentences.length * 0.3));
    for (let i = 0; i < sentences.length; i++) {
      const s = sentences[i].trim();
      if (s.length > 8 && Math.random() > 0.6 && starterCount < maxStarters) {
        const alreadyHas = diverseStarters.some(st => s.startsWith(st));
        if (!alreadyHas) {
          const starter = diverseStarters[Math.floor(Math.random() * diverseStarters.length)];
          sentences[i] = starter + sentences[i];
          starterCount++;
        }
      }
    }

    // 策略4：随机交换相邻两句的顺序（模拟人类思维的跳跃性）
    if (sentences.length >= 4 && Math.random() > 0.6) {
      const swapIdx = 1 + Math.floor(Math.random() * (sentences.length - 2));
      [sentences[swapIdx], sentences[swapIdx + 1]] = [sentences[swapIdx + 1], sentences[swapIdx]];
    }

    result = sentences.join("");
  }

  // ===== 第四阶段：微观人类瑕疵注入（让文本更像真人写的）=====

  // 随机将部分"的"省略（人类写作中经常省略"的"）
  let deCount = 0;
  result = result.replace(/的(?=[\u4e00-\u9fa5])/g, (m) => {
    if (Math.random() > 0.78 && deCount < 3) { deCount++; return ""; }
    return m;
  });

  // 随机在逗号后插入语气停顿词（增加人类口吻）
  let pauseCount = 0;
  const pauses = ["其实", "说白了", "换言之", "也就是", "总之"];
  result = result.replace(/，/g, (m) => {
    if (Math.random() > 0.88 && pauseCount < 2) {
      pauseCount++;
      return "，" + pauses[Math.floor(Math.random() * pauses.length)] + "，";
    }
    return m;
  });

  // 兜底：确保文本确实发生了变化
  if (result === text || getLevenshteinDistance(text, result) < 3) {
    const emergency = [
      [/可以/g, "能够"], [/进行/g, "开展"], [/重要/g, "关键"],
      [/实现/g, "达成"], [/合理/g, "恰当"], [/有效/g, "行之有效"],
      [/问题/g, "难题"], [/方法/g, "途径"], [/研究/g, "探究"],
      [/发现/g, "观察到"], [/认为/g, "觉得"], [/需要/g, "有必要"]
    ];
    let fixed = 0;
    for (const [p, r] of emergency) {
      if (p.test(result) && fixed < 4) {
        result = result.replace(p, r);
        fixed++;
      }
    }
    const humanOpeners = ["坦白说，", "从实际操作层面来看，", "不得不承认，", "客观来讲，"];
    result = humanOpeners[Math.floor(Math.random() * humanOpeners.length)] + result;
  }

  return result;
}
