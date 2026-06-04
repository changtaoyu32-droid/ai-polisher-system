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
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
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

  const merged = [];
  for (const item of result) {
    if (merged.length > 0 && merged[merged.length - 1].type === item.type) {
      merged[merged.length - 1].text += item.text;
    } else {
      merged.push({ ...item });
    }
  }

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

// =====================================================
// 辅助工具函数
// =====================================================

/** 随机从数组中取一项 */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 以概率p返回true */
function chance(p) {
  return Math.random() < p;
}

/** 将文本按句号/问号/叹号拆分为句子数组，保留标点 */
function splitSentences(text) {
  return text.split(/(?<=[。！？])/g).filter(s => s.trim().length > 0);
}

/** 去除句尾标点 */
function stripEndPunct(s) {
  return s.replace(/[。！？]+$/g, "").trim();
}

// =====================================================
// 3. 本地启发式降AI引擎 V4（全面深度重构版）
// =====================================================
//
// AI检测器核心检测维度：
// ① Perplexity（困惑度）：AI用词高度可预测 → 需增加词汇的不可预测性与多样性
// ② Burstiness（突发性）：AI句子长度极其均匀 → 需制造长短句剧烈交替
// ③ Repetition Pattern（重复模式）：AI句首词/连接词高度重复 → 需最大化句首多样性
// ④ Structural Uniformity（结构均一性）：AI段落结构整齐划一 → 需打破并列/排比
//
// V4引擎六阶段处理流水线：
// Phase 1: 句式结构级变换（打破AI刻板逻辑）
// Phase 2: 词汇表多轮随机替换（增加困惑度）
// Phase 3: 主被动语态与句型转换（结构多样化）
// Phase 4: 句子级深度重组（制造突发性）
// Phase 5: 段落级重组（打破结构均一性）
// Phase 6: 人类写作瑕疵注入（模拟真人）
// =====================================================

export function localRewrite(text) {
  if (!text) return "";
  let result = text;

  // ============ Phase 1: 句式结构级变换 ============

  // 1.1 因果句式颠倒（3模板随机）
  result = result.replace(/因为([^，。；！？]+)，所以([^，。；！？]+)/g, (...a) => {
    return pick([
      `之所以${a[2]}，根本原因就在于${a[1]}`,
      `正是由于${a[1]}，才使得${a[2]}`,
      `${a[2]}这一现象的出现，归根结底要追溯到${a[1]}`,
      `${a[1]}直接导致了${a[2]}的发生`
    ]);
  });

  // 1.2 条件句式（4模板）
  result = result.replace(/(?:如果|若)([^，。；！？]+)，(?:就|则|那么)([^，。；！？]+)/g, (...a) => {
    return pick([
      `当${a[1]}成立时，自然而然地${a[2]}`,
      `一旦满足了${a[1]}这个前提，${a[2]}也就顺理成章了`,
      `只要${a[1]}，那么${a[2]}便不在话下`,
      `在${a[1]}的条件下，${a[2]}是完全可以预见的`
    ]);
  });

  // 1.3 转折句式（4模板）
  result = result.replace(/(?:虽然|尽管)([^，。；！？]+)，(?:但是|但|然而|却)([^，。；！？]+)/g, (...a) => {
    return pick([
      `诚然${a[1]}，不过话说回来${a[2]}`,
      `${a[1]}这一点固然不假，可换个角度看${a[2]}`,
      `哪怕${a[1]}，也不能忽视${a[2]}这个事实`,
      `固然${a[1]}没有什么疑问，可反过来想想${a[2]}`
    ]);
  });

  // 1.4 递进句式（4模板）
  result = result.replace(/(?:不仅|不但)([^，。；！？]+)，(?:而且|并且|还|更)([^，。；！？]+)/g, (...a) => {
    return pick([
      `${a[1]}只是一方面，更值得关注的是${a[2]}`,
      `除了${a[1]}以外，${a[2]}同样不容小觑`,
      `在${a[1]}的基础上更往前走一步就会发现${a[2]}`,
      `${a[1]}已经够引人瞩目了，而${a[2]}则让人更加惊喜`
    ]);
  });

  // 1.5 目的/手段句式（4模板）
  result = result.replace(/通过([^，。；！？]+)，(?:我们|系统)?(?:能够|可以|来)([^，。；！？]+)/g, (...a) => {
    return pick([
      `借助${a[1]}这种方式，${a[2]}就变得切实可行了`,
      `有了${a[1]}作为支撑，想要${a[2]}也就不再困难`,
      `把${a[1]}用好了，${a[2]}自然水到渠成`,
      `依托于${a[1]}的力量，${a[2]}得以顺利推进`
    ]);
  });

  // 1.6 总结句式变换
  result = result.replace(/总之，([^。！？]+)/g, (...a) => {
    return pick([
      `说到底，${a[1]}`, `归根结底，${a[1]}`, `概括起来看，${a[1]}`, `把上面这些综合起来看，${a[1]}`
    ]);
  });

  // 1.7 举例句式变换
  result = result.replace(/例如，([^。！？]+)/g, (...a) => {
    return pick([
      `打个比方来说，${a[1]}`, `拿${a[1]}来举例就很典型`, `比方说，${a[1]}`, `像${a[1]}这样的情况就很有代表性`
    ]);
  });

  // 1.8 解耦结构
  result = result.replace(/为了将([^，。]+)解耦/g, "为了实现$1的解耦");

  // 1.9 括号内容处理
  result = result.replace(/([\u4e00-\u9fa5]+)[（(]([\u4e00-\u9fa5]+)[）)]/g, "$2即$1");
  result = result.replace(/([\u4e00-\u9fa5]+)[（(]([a-zA-Z0-9_\.\-]+)[）)]/g, "$1 $2");

  // ============ Phase 2: 词汇表多轮随机替换 ============

  for (const item of LOCAL_REPLACEMENTS) {
    if (item.replacements && item.replacements.length > 0) {
      result = result.replace(item.pattern, (...args) => {
        const template = pick(item.replacements);
        return template.replace(/\$(\d+)/g, (_, index) => {
          return args[parseInt(index)] || "";
        });
      });
    }
  }

  // ============ Phase 3: 主被动语态与句型转换 ============

  // 3.1 把字句转被字句（随机触发）
  result = result.replace(/把([^，。；！？]+)(进行|予以|加以|开展)([^，。；！？]*)/g, (...a) => {
    if (chance(0.5)) return `${a[1]}被${a[3]}`;
    return a[0]; // 保持原样
  });

  // 3.2 将陈述句随机转换为设问句（极低概率，增加文体多样性）
  // "X是Y" → "X难道不正是Y吗" 或 "什么是X？其实就是Y"
  result = result.replace(/([^，。；！？]{4,12})是([^，。；！？]{4,20})的([^，。；！？]{2,8})/g, (...a) => {
    if (chance(0.15)) {
      return pick([
        `谈到${a[3]}，${a[1]}正是${a[2]}的体现`,
        `${a[1]}作为${a[2]}的${a[3]}，这一点毋庸置疑`
      ]);
    }
    return a[0];
  });

  // 3.3 "可以...也可以..." 并列结构打散
  result = result.replace(/可以([^，。；！？]+)，也可以([^，。；！？]+)/g, (...a) => {
    return pick([
      `一方面能够${a[1]}，另一方面还能${a[2]}`,
      `既有条件去${a[1]}，同时也具备${a[2]}的能力`,
      `${a[1]}是一种选择，${a[2]}同样行得通`
    ]);
  });

  // 3.4 "首先...其次...最后..." 列举结构打散
  result = result.replace(/首先([^。！？]+)。其次([^。！？]+)。(?:最后|再次)([^。！？]+)/g, (...a) => {
    if (chance(0.6)) {
      return pick([
        `从几个层面来分析：第一个层面，${a[1].trim()}。紧接着，${a[2].trim()}。在这之后，${a[3].trim()}`,
        `要说起来，${a[1].trim()}。除此以外，${a[2].trim()}。还有一点也不能落下，那就是${a[3].trim()}`,
        `${a[1].trim()}。在此基础之上，${a[2].trim()}。与此同时另一个值得关注的方面是${a[3].trim()}`
      ]);
    }
    return a[0];
  });

  // ============ Phase 4: 句子级深度重组（制造Burstiness） ============

  let sentences = splitSentences(result);

  if (sentences.length >= 2) {
    // 4.1 合并相邻短句（模拟人类连贯思维）
    for (let si = sentences.length - 2; si >= 0; si--) {
      const curr = stripEndPunct(sentences[si]);
      const next = stripEndPunct(sentences[si + 1]);
      if (curr.length < 15 && next.length < 15 && chance(0.45)) {
        const c = pick(["，与此同时", "，顺带一提", "，紧接着", "，在这种情况下", "，同时也"]);
        sentences[si] = curr + c + next + "。";
        sentences.splice(si + 1, 1);
      }
    }

    // 4.2 拆分长句（模拟人类拆分复杂思路）
    for (let si = sentences.length - 1; si >= 0; si--) {
      const s = sentences[si];
      if (s.length > 45 && chance(0.5)) {
        // 在中间位置的逗号处拆分
        const mid = Math.floor(s.length * 0.35);
        const commaIdx = s.indexOf("，", mid);
        if (commaIdx > 5 && commaIdx < s.length - 8) {
          const part1 = s.slice(0, commaIdx) + "。";
          const part2 = s.slice(commaIdx + 1);
          sentences.splice(si, 1, part1, part2);
        }
      }
    }

    // 4.3 句首多样化衔接词注入（打破句首重复性）
    const starters = [
      "说到这里，", "值得注意的是，", "有意思的是，", "事实上，",
      "从另一个角度来看，", "不得不说，", "坦率地讲，", "换句话说，",
      "进一步来看，", "细想之下，", "回过头来看，", "客观来讲，",
      "这里需要指出的是，", "简单来说，", "严格说来，", "从实践角度出发，",
      "往深了说，", "换个思路来想，", "说句实在话，", "仔细琢磨一下就会发现，"
    ];
    let starterCount = 0;
    const maxStarters = Math.max(1, Math.floor(sentences.length * 0.25));
    const usedStarters = new Set();
    for (let si = 0; si < sentences.length; si++) {
      const s = sentences[si].trim();
      if (s.length > 10 && chance(0.45) && starterCount < maxStarters) {
        const alreadyHas = starters.some(st => s.startsWith(st));
        if (!alreadyHas) {
          let starter;
          let attempts = 0;
          do {
            starter = pick(starters);
            attempts++;
          } while (usedStarters.has(starter) && attempts < 5);
          usedStarters.add(starter);
          sentences[si] = starter + sentences[si];
          starterCount++;
        }
      }
    }

    // 4.4 随机交换相邻句序（模拟思维跳跃）
    if (sentences.length >= 4 && chance(0.5)) {
      const swapIdx = 1 + Math.floor(Math.random() * (sentences.length - 2));
      [sentences[swapIdx], sentences[swapIdx + 1]] = [sentences[swapIdx + 1], sentences[swapIdx]];
    }

    // 4.5 随机插入过渡短句（增加句子数量多样性）
    if (sentences.length >= 3 && chance(0.35)) {
      const transitions = [
        "这一点是不能忽略的。",
        "以上分析已经说明了问题的关键所在。",
        "沿着这个思路继续深入下去。",
        "当然，这只是其中一个方面。",
        "这里面的道理其实并不复杂。"
      ];
      const insertIdx = 1 + Math.floor(Math.random() * (sentences.length - 1));
      sentences.splice(insertIdx, 0, pick(transitions));
    }

    result = sentences.join("");
  }

  // ============ Phase 5: 段落级重组（打破结构均一性）============

  let paragraphs = result.split(/\n+/).filter(p => p.trim().length > 0);
  if (paragraphs.length >= 2) {
    for (let pi = 0; pi < paragraphs.length; pi++) {
      const p = paragraphs[pi];
      // 5.1 过长段落随机拆分
      if (p.length > 150 && chance(0.4)) {
        const pSentences = splitSentences(p);
        if (pSentences.length >= 4) {
          const splitAt = Math.floor(pSentences.length * 0.5);
          paragraphs[pi] = pSentences.slice(0, splitAt).join("");
          paragraphs.splice(pi + 1, 0, pSentences.slice(splitAt).join(""));
        }
      }
    }

    // 5.2 为段落添加随机过渡（段首衔接）
    const paraTransitions = [
      "在此基础上，", "接下来谈谈另一个方面，", "从另一个维度来看，",
      "与此紧密相关的是，", "进一步展开来说，"
    ];
    for (let pi = 1; pi < paragraphs.length; pi++) {
      if (chance(0.25) && paragraphs[pi].length > 20) {
        const tr = pick(paraTransitions);
        if (!paraTransitions.some(t => paragraphs[pi].startsWith(t))) {
          paragraphs[pi] = tr + paragraphs[pi];
        }
      }
    }

    result = paragraphs.join("\n");
  }

  // ============ Phase 6: 人类写作瑕疵注入 ============

  // 6.1 随机省略"的"字（人类经常省略）
  let deCount = 0;
  result = result.replace(/的(?=[\u4e00-\u9fa5])/g, (m) => {
    if (chance(0.2) && deCount < 4) { deCount++; return ""; }
    return m;
  });

  // 6.2 随机将"，"后插入语气停顿词
  let pauseCount = 0;
  const pauses = ["其实", "说白了", "换言之", "也就是说", "简而言之", "坦白讲"];
  result = result.replace(/，/g, (m) => {
    if (chance(0.08) && pauseCount < 2) {
      pauseCount++;
      return "，" + pick(pauses) + "，";
    }
    return m;
  });

  // 6.3 随机将部分句号替换为分号（模拟人类标点习惯的不规则性）
  let semicolonCount = 0;
  result = result.replace(/。(?=[\u4e00-\u9fa5])/g, (m) => {
    if (chance(0.1) && semicolonCount < 2) { semicolonCount++; return "；"; }
    return m;
  });

  // 6.4 随机添加弱修饰词（增加不确定性，降低AI的肯定语气）
  const weakeners = [
    [/必须/g, () => chance(0.4) ? pick(["有必要", "确实需要", "应当"]) : "必须"],
    [/显著/g, () => chance(0.4) ? pick(["相当明显", "比较突出", "较为显著"]) : "显著"],
    [/大量/g, () => chance(0.4) ? pick(["不少", "相当数量的", "为数众多的"]) : "大量"],
    [/完全/g, () => chance(0.4) ? pick(["基本上", "几乎完全", "在很大程度上"]) : "完全"],
    [/非常/g, () => chance(0.4) ? pick(["相当", "十分", "颇为"]) : "非常"]
  ];
  for (const [pattern, replacer] of weakeners) {
    result = result.replace(pattern, replacer);
  }

  // 6.5 随机在句末添加补充说明（模拟人类补充思考）
  if (chance(0.25)) {
    const supplements = [
      "——当然这也需要结合具体情况来判断",
      "——不过这只是初步的分析",
      "——具体效果还要看实际应用中的表现",
      "——这一点在后续研究中还有进一步探讨的空间"
    ];
    let sents = splitSentences(result);
    if (sents.length >= 3) {
      const targetIdx = 1 + Math.floor(Math.random() * (sents.length - 2));
      const sent = sents[targetIdx];
      if (sent.endsWith("。") && sent.length > 15) {
        sents[targetIdx] = sent.slice(0, -1) + pick(supplements) + "。";
      }
      result = sents.join("");
    }
  }

  // ============ 兜底：确保文本确实发生了变化 ============
  if (result === text || getLevenshteinDistance(text, result) < 5) {
    // 紧急词汇替换
    const emergency = [
      [/可以/g, "能够"], [/进行/g, "开展"], [/重要/g, "关键"],
      [/实现/g, "达成"], [/合理/g, "恰当"], [/有效/g, "行之有效"],
      [/问题/g, "难题"], [/方法/g, "途径"], [/研究/g, "探究"],
      [/发现/g, "观察到"], [/认为/g, "觉得"], [/需要/g, "有必要"],
      [/影响/g, "左右"], [/提出/g, "给出"], [/具有/g, "拥有"],
      [/存在/g, "客观上存在着"], [/导致/g, "引发"], [/促进/g, "推动"]
    ];
    let fixed = 0;
    for (const [p, r] of emergency) {
      if (p.test(result) && fixed < 5) {
        result = result.replace(p, r);
        fixed++;
      }
    }
    // 加一个人类化的开头
    const humanOpeners = [
      "坦白说，", "从实际操作层面来看，", "不得不承认，",
      "客观来讲，", "仔细想想的话，", "说实话，"
    ];
    result = pick(humanOpeners) + result;
  }

  return result;
}
