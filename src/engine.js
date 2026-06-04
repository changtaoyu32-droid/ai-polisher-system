import { LOCAL_REPLACEMENTS } from "./config.js";

/**
 * 字符转义工具
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
 * 编辑距离
 */
export function getLevenshteinDistance(s1, s2) {
  const len1 = s1.length, len2 = s2.length;
  const dp = Array.from({ length: len1 + 1 }, () => new Int32Array(len2 + 1));
  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[len1][len2];
}

export function calculateModifyRate(s1, s2) {
  if (!s1 && !s2) return 0;
  if (!s1 || !s2) return 100;
  const d = getLevenshteinDistance(s1, s2);
  return Math.min(Math.round((d / Math.max(s1.length, s2.length)) * 100), 100);
}

/**
 * LCS Diff
 */
export function diffText(s1, s2) {
  const c1 = Array.from(s1 || ""), c2 = Array.from(s2 || "");
  const m = c1.length, n = c2.length;
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = c1[i-1] === c2[j-1] ? dp[i-1][j-1]+1 : Math.max(dp[i-1][j], dp[i][j-1]);

  let i = m, j = n;
  const result = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && c1[i-1] === c2[j-1]) { result.push({type:"equal",text:c1[i-1]}); i--; j--; }
    else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) { result.push({type:"insert",text:c2[j-1]}); j--; }
    else { result.push({type:"delete",text:c1[i-1]}); i--; }
  }
  result.reverse();
  const merged = [];
  for (const it of result) {
    if (merged.length > 0 && merged[merged.length-1].type === it.type) merged[merged.length-1].text += it.text;
    else merged.push({...it});
  }
  return merged.map(it => {
    const e = escapeHtml(it.text);
    if (it.type === "insert") return `<span class="diff-insert">${e}</span>`;
    if (it.type === "delete") return `<span class="diff-delete">${e}</span>`;
    return e;
  }).join("");
}

// ===================== 工具函数 =====================
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const chance = p => Math.random() < p;
const splitSents = t => t.split(/(?<=[。！？])/g).filter(s => s.trim().length > 0);
const stripPunct = s => s.replace(/[。！？]+$/g, "").trim();

// =====================================================
// V5 终极版 本地降AI引擎
// =====================================================
// 三大强度体系 + 真·双轮迭代重塑 = 极致本地降重
// =====================================================

export function localRewrite(text, intensity = "medium") {
  if (!text) return "";

  // 1. 轻度模式 (light)：轻度词汇润色与柔化，完全保留原有复杂的学术结构
  if (intensity === "light") {
    let result = text;
    // 词汇表多轮随机替换
    for (const item of LOCAL_REPLACEMENTS) {
      if (item.replacements && item.replacements.length > 0) {
        result = result.replace(item.pattern, (...args) => {
          const tpl = pick(item.replacements);
          return tpl.replace(/\$(\d+)/g, (_, idx) => args[parseInt(idx)] || "");
        });
      }
    }
    // 弱修饰词柔化替换
    const weakeners = [
      [/必须/g, () => chance(0.3) ? pick(["有必要", "确实需要", "应当"]) : "必须"],
      [/显著/g, () => chance(0.3) ? pick(["相当明显", "比较突出", "较为显著"]) : "显著"],
      [/完全/g, () => chance(0.2) ? pick(["基本上", "几乎完全", "在很大程度上"]) : "完全"],
      [/非常/g, () => chance(0.3) ? pick(["相当", "十分", "颇为"]) : "非常"]
    ];
    for (const [p, r] of weakeners) result = result.replace(p, r);

    // 极小比例人类瑕疵 (省略 "的")
    result = result.replace(/的(?=[\u4e00-\u9fa5])/g, m => chance(0.04) ? "" : m);

    // 兜底
    if (result === text || getLevenshteinDistance(text, result) < 2) {
      result = result.replace(/进行/g, "开展").replace(/重要/g, "关键").replace(/需要/g, "有必要");
    }
    return result;
  }

  // 2. 中度模式 (medium)：可读性与去重率的折中平衡 (常规单轮流水线)
  if (intensity === "medium") {
    let result = text;
    // 句式结构变换
    // 因果
    result = result.replace(/因为([^，。；！？]+)，所以([^，。；！？]+)/g, (...a) =>
      chance(0.65) ? pick([`之所以${a[2]}，根本原因就在于${a[1]}`, `正是由于${a[1]}，才使得${a[2]}`]) : a[0]);
    // 条件
    result = result.replace(/(?:如果|若)([^，。；！？]+)，(?:就|则|那么)([^，。；！？]+)/g, (...a) =>
      chance(0.6) ? pick([`一旦满足了${a[1]}这个前提，${a[2]}也就顺理成章了`, `只要${a[1]}，那么${a[2]}便不在话下`]) : a[0]);
    // 转折
    result = result.replace(/(?:虽然|尽管)([^，。；！？]+)，(?:但是|但|然而|却)([^，。；！？]+)/g, (...a) =>
      chance(0.6) ? pick([`诚然${a[1]}，不过话说回来${a[2]}`, `${a[1]}这一点固然不假，可换个角度看${a[2]}`]) : a[0]);
    // 递进
    result = result.replace(/(?:不仅|不但)([^，。；！？]+)，(?:而且|并且|还|更)([^，。；！？]+)/g, (...a) =>
      chance(0.6) ? pick([`${a[1]}只是一方面，更值得关注的是${a[2]}`, `除了${a[1]}以外，${a[2]}同样不容小觑`]) : a[0]);
    // 目的
    result = result.replace(/通过([^，。；！？]+)，(?:我们|系统)?(?:能够|可以|来)([^，。；！？]+)/g, (...a) =>
      chance(0.6) ? pick([`借助${a[1]}这种方式，${a[2]}就变得切实可行了`, `依托于${a[1]}的力量，${a[2]}得以顺利推进`]) : a[0]);
    // 总结
    result = result.replace(/总之，([^。！？]+)/g, (...a) => chance(0.5) ? `概括起来看，${a[1]}` : a[0]);
    // 举例
    result = result.replace(/例如，([^。！？]+)/g, (...a) => chance(0.5) ? `打个比方来说，${a[1]}` : a[0]);
    
    // "随着...发展"
    result = result.replace(/随着([^，。]+)的(?:快速|飞速|迅猛)?发展/g, (...a) =>
      pick([`在${a[1]}不断演进的背景下`, `伴伴随着${a[1]}的日益成熟`]));

    // AI高频词
    result = result.replace(/综上所述/g, () => pick(["总的来说", "整体而言", "概括地讲"]));
    result = result.replace(/众所周知/g, () => pick(["大家都清楚", "这一点已经是共识了"]));
    result = result.replace(/不可或缺/g, () => pick(["少不了", "离不开的"]));
    result = result.replace(/至关重要/g, () => pick(["极为关键", "不可等闲视之"]));

    // 括号处理
    result = result.replace(/([\u4e00-\u9fa5]+)[（(]([\u4e00-\u9fa5]+)[）)]/g, "$2即$1");
    result = result.replace(/([\u4e00-\u9fa5]+)[（(]([a-zA-Z0-9_\.\-]+)[）)]/g, "$1 $2");

    // 词汇表多轮替换
    for (const item of LOCAL_REPLACEMENTS) {
      if (item.replacements && item.replacements.length > 0) {
        result = result.replace(item.pattern, (...args) => {
          const tpl = pick(item.replacements);
          return tpl.replace(/\$(\d+)/g, (_, idx) => args[parseInt(idx)] || "");
        });
      }
    }

    // 主被动语态与并列列举打散
    result = result.replace(/可以([^，。；！？]+)，也可以([^，。；！？]+)/g, (...a) =>
      chance(0.5) ? `一方面能够${a[1]}，另一方面还能${a[2]}` : a[0]);
    result = result.replace(/一方面([^，。；！？]+)，另一方面([^，。；！？]+)/g, (...a) =>
      chance(0.5) ? `从一个角度看${a[1]}，换个视角则${a[2]}` : a[0]);

    // 句子级重组
    let sents = splitSents(result);
    if (sents.length >= 2) {
      // 合并短句 (概率 0.3)
      for (let si = sents.length - 2; si >= 0; si--) {
        const c = stripPunct(sents[si]), n = stripPunct(sents[si + 1]);
        if (c.length < 15 && n.length < 15 && chance(0.3)) {
          sents[si] = c + "，同时也" + n + "。";
          sents.splice(si + 1, 1);
        }
      }
      // 拆分长句
      for (let si = sents.length - 1; si >= 0; si--) {
        const s = sents[si];
        if (s.length > 50 && chance(0.4)) {
          const mid = Math.floor(s.length * 0.4);
          const ci = s.indexOf("，", mid);
          if (ci > 8 && ci < s.length - 10) {
            sents.splice(si, 1, s.slice(0, ci) + "。", s.slice(ci + 1));
          }
        }
      }
      // 句首多样化
      const starters = ["事实上，", "值得注意的是，", "从另一个角度来看，", "换句话说，", "客观来讲，", "简单来说，"];
      let sCount = 0;
      const maxS = Math.max(1, Math.floor(sents.length * 0.2));
      for (let si = 0; si < sents.length; si++) {
        if (sents[si].length > 15 && chance(0.25) && sCount < maxS) {
          sents[si] = pick(starters) + sents[si];
          sCount++;
        }
      }
      result = sents.join("");
    }

    // 人类瑕疵与弱修饰词
    let dc = 0;
    result = result.replace(/的(?=[\u4e00-\u9fa5])/g, m => { if (chance(0.1) && dc < 2) { dc++; return ""; } return m; });
    const weakeners = [
      [/必须/g, () => chance(0.3) ? "确实需要" : "必须"],
      [/显著/g, () => chance(0.3) ? "比较突出" : "显著"],
      [/完全/g, () => chance(0.3) ? "基本上" : "完全"]
    ];
    for (const [p, r] of weakeners) result = result.replace(p, r);

    // 对冲 hedges
    let hedgeCount = 0;
    const hedges = [
      [/表明/g, () => { if (chance(0.2) && hedgeCount < 1) { hedgeCount++; return "在一定程度上表明"; } return "表明"; }],
      [/证明/g, () => { if (chance(0.2) && hedgeCount < 1) { hedgeCount++; return "在某种程度上验证了"; } return "证明"; }]
    ];
    for (const [p, r] of hedges) result = result.replace(p, r);

    // 兜底
    if (result === text || getLevenshteinDistance(text, result) < 3) {
      result = result.replace(/可以/g, "能够").replace(/重要/g, "关键");
    }
    return result;
  }

  // 3. 重度模式 (hard)：极致降重，彻底瓦解 AI 特征 (真·双轮重塑流水线)
  if (intensity === "hard") {
    // ------------------ Pass 1: 瓦解与结构重组 ------------------
    let midText = text;

    // 1.1 强力的句式结构级变换
    // 因果
    midText = midText.replace(/因为([^，。；！？]+)，所以([^，。；！？]+)/g, (...a) =>
      pick([
        `之所以${a[2]}，其深层缘由主要在于${a[1]}`, 
        `正是由于${a[1]}，才使得${a[2]}`,
        `${a[2]}这一状况，归根结底应追溯至${a[1]}`, 
        `${a[1]}的出现，间接或直接地引发了${a[2]}`
      ]));

    // 条件
    midText = midText.replace(/(?:如果|若)([^，。；！？]+)，(?:就|则|那么)([^，。；！？]+)/g, (...a) =>
      pick([
        `一旦满足了${a[1]}这一特定前提，${a[2]}也就顺理成章了`, 
        `当${a[1]}能够成立时，自然而然会产生${a[2]}`,
        `只要${a[1]}，那么${a[2]}便不在话下`, 
        `在${a[1]}的情况下，${a[2]}是完全可以预见的`
      ]));

    // 转折
    midText = midText.replace(/(?:虽然|尽管)([^，。；！？]+)，(?:但是|但|然而|却)([^，。；！？]+)/g, (...a) =>
      pick([
        `诚然${a[1]}，不过话又说回来，${a[2]}`, 
        `${a[1]}这一点固然不假，可若换个角度分析，${a[2]}`,
        `哪怕${a[1]}，也不能抹杀${a[2]}这一客观事实`, 
        `固然${a[1]}没有什么疑问，可反过来思考，${a[2]}`
      ]));

    // 递进
    midText = midText.replace(/(?:不仅|不但)([^，。；！？]+)，(?:而且|并且|还|更)([^，。；！？]+)/g, (...a) =>
      pick([
        `${a[1]}仅是其中一方面，更为关键的在于${a[2]}`, 
        `除了${a[1]}之外，${a[2]}同样是不容忽视的`,
        `在${a[1]}的基石之上更进一步，即可体察到${a[2]}`, 
        `${a[1]}已足够显著，而${a[2]}则提供了更深层次的支撑`
      ]));

    // 目的手段
    midText = midText.replace(/通过([^，。；！？]+)，(?:我们|系统)?(?:能够|可以|来)([^，。；！？]+)/g, (...a) =>
      pick([
        `借助${a[1]}这一特定路径，${a[2]}就变得切实可行了`, 
        `有了${a[1]}作为技术支撑，想要达成${a[2]}也就不再是难事`,
        `若是能妥善运用${a[1]}，${a[2]}自然会水到渠成`, 
        `依托于${a[1]}的底层逻辑，${a[2]}得以顺利向前推进`
      ]));

    // 总结与举例
    midText = midText.replace(/总之，([^。！？]+)/g, (...a) =>
      pick([`说到底，${a[1]}`, `归根结底，${a[1]}`, `把上面这些综合起来看，${a[1]}`, `总括而言，${a[1]}`]));
    midText = midText.replace(/例如，([^。！？]+)/g, (...a) =>
      pick([`打个比方来说，${a[1]}`, `拿${a[1]}来剖析就极其典型`, `比方说，${a[1]}`, `诸如${a[1]}之类即是鲜活的例证`]));

    // "随着...发展"
    midText = midText.replace(/随着([^，。]+)的(?:快速|飞速|迅猛)?发展/g, (...a) =>
      pick([
        `在${a[1]}得以不断演进和深化的时代背景下`, 
        `伴随着${a[1]}的日益成熟与广泛普及`, 
        `${a[1]}这些年取得的长足进步，直接催生了新的格局`
      ]));

    // 括号及AI高频句
    midText = midText.replace(/([\u4e00-\u9fa5]+)[（(]([\u4e00-\u9fa5]+)[）)]/g, "$2即$1");
    midText = midText.replace(/([\u4e00-\u9fa5]+)[（(]([a-zA-Z0-9_\.\-]+)[）)]/g, "$1 $2");
    midText = midText.replace(/为了将([^，。]+)解耦/g, "为了实现$1的充分解耦");

    // 1.2 词汇表多轮随机深度替换
    for (const item of LOCAL_REPLACEMENTS) {
      if (item.replacements && item.replacements.length > 0) {
        midText = midText.replace(item.pattern, (...args) => {
          const tpl = pick(item.replacements);
          return tpl.replace(/\$(\d+)/g, (_, idx) => args[parseInt(idx)] || "");
        });
      }
    }

    // 1.3 主被动语态与并列/列举打散
    midText = midText.replace(/可以([^，。；！？]+)，也可以([^，。；！？]+)/g, (...a) =>
      pick([
        `一方面能够${a[1]}，另一方面还能${a[2]}`, 
        `既具备去${a[1]}的条件，同时也留有${a[2]}的余地`,
        `采纳${a[1]}固然可行，选用${a[2]}同样不失为上策`
      ]));
    midText = midText.replace(/首先([^。！？]+)。其次([^。！？]+)。(?:最后|再次)([^。！？]+)/g, (...a) => {
      return pick([
        `从几个维度来剖析：第一个维度是，${a[1].trim()}。紧接着在第二个维度上，${a[2].trim()}。最后在总结层面上，${a[3].trim()}`,
        `要谈及此事，首先得明确${a[1].trim()}。另外，也不要忽视了${a[2].trim()}。还有一个同样要紧的环节，那就是${a[3].trim()}`
      ]);
    });
    midText = midText.replace(/一方面([^，。；！？]+)，另一方面([^，。；！？]+)/g, (...a) =>
      pick([
        `从一个视角来看，${a[1]}；而转换到另一视角，则${a[2]}`, 
        `前半截阐明了${a[1]}，后半截则揭示了${a[2]}`,
        `不单纯是由于${a[1]}，其中亦掺杂着${a[2]}的缘由`
      ]));

    // ------------------ Pass 2: 语义解耦与人类写作节奏重塑 ------------------
    let sents = splitSents(midText);

    if (sents.length >= 2) {
      // 2.1 句子级深度重组
      // 合并极短句
      for (let si = sents.length - 2; si >= 0; si--) {
        const c = stripPunct(sents[si]), n = stripPunct(sents[si + 1]);
        if (c.length < 16 && n.length < 16 && chance(0.5)) {
          const conn = pick(["，而在这一基础上", "，顺理成章的是", "，紧接着来看", "，与此同时也", "，抛开这些不谈"]);
          sents[si] = c + conn + n + "。";
          sents.splice(si + 1, 1);
        }
      }
      
      // 拆分特长句
      for (let si = sents.length - 1; si >= 0; si--) {
        const s = sents[si];
        if (s.length > 40 && chance(0.6)) {
          const mid = Math.floor(s.length * 0.35);
          const ci = s.indexOf("，", mid);
          if (ci > 6 && ci < s.length - 8) {
            sents.splice(si, 1, s.slice(0, ci) + "。", s.slice(ci + 1));
          }
        }
      }

      // 句首多样化（去重版）
      const starters = [
        "说到这里，", "值得注意的是，", "有意思的是，", "事实上，", "从另一个角度来看，", 
        "不得不说，", "坦率地讲，", "换句话说，", "进一步来看，", "细想之下，", 
        "回过头来看，", "客观来讲，", "简单来说，", "说句实在话，", "仔细琢磨一下，"
      ];
      let sCount = 0;
      const maxS = Math.max(1, Math.floor(sents.length * 0.35));
      const usedS = new Set();
      for (let si = 0; si < sents.length; si++) {
        const s = sents[si].trim();
        if (s.length > 10 && chance(0.45) && sCount < maxS) {
          if (!starters.some(st => s.startsWith(st))) {
            let st, att = 0;
            do { st = pick(starters); att++; } while (usedS.has(st) && att < 10);
            usedS.add(st);
            sents[si] = st + sents[si];
            sCount++;
          }
        }
      }

      // 句序微调
      if (sents.length >= 4 && chance(0.5)) {
        const idx = 1 + Math.floor(Math.random() * (sents.length - 2));
        [sents[idx], sents[idx + 1]] = [sents[idx + 1], sents[idx]];
      }

      // 插入过渡短句
      if (sents.length >= 3 && chance(0.35)) {
        const trans = [
          "这是怎么也绕不开的一点。", "以上种种，其实都点明了事物的核心特质。",
          "顺着这个脉络，我们可以继续探寻下去。", "诚然，这仅仅是问题的冰山一角。",
          "这里头的原委，倒也算不上多么深奥。"
        ];
        const idx = 1 + Math.floor(Math.random() * (sents.length - 1));
        sents.splice(idx, 0, pick(trans));
      }
    }

    let resultText = sents.join("");

    // 2.2 段落级重构与衔接
    let paras = resultText.split(/\n+/).filter(p => p.trim().length > 0);
    if (paras.length >= 2) {
      for (let pi = 0; pi < paras.length; pi++) {
        if (paras[pi].length > 130 && chance(0.5)) {
          const ps = splitSents(paras[pi]);
          if (ps.length >= 4) {
            const sp = Math.floor(ps.length * 0.5);
            paras[pi] = ps.slice(0, sp).join("");
            paras.splice(pi + 1, 0, ps.slice(sp).join(""));
          }
        }
      }
      const pTrans = ["在此根基上，", "进而言之，", "由上述分析不难看出，", "与这一态势紧密关联的是，", "更进一步地讲，"];
      for (let pi = 1; pi < paras.length; pi++) {
        if (chance(0.25) && paras[pi].length > 15 && !pTrans.some(t => paras[pi].startsWith(t))) {
          paras[pi] = pick(pTrans) + paras[pi];
        }
      }
      resultText = paras.join("\n");
    }

    // 2.3 人类微瑕疵注入
    // 省略"的"
    let dc = 0;
    resultText = resultText.replace(/的(?=[\u4e00-\u9fa5])/g, m => { if (chance(0.22) && dc < 5) { dc++; return ""; } return m; });

    // 语气停顿词
    let pc = 0;
    const pauses = ["客观说", "坦白讲", "也就是说", "简而言之", "毫无疑问"];
    resultText = resultText.replace(/，/g, m => { if (chance(0.08) && pc < 3) { pc++; return "，" + pick(pauses) + "，"; } return m; });

    // 句号转分号
    let sc = 0;
    resultText = resultText.replace(/。(?=[\u4e00-\u9fa5])/g, m => { if (chance(0.12) && sc < 3) { sc++; return "；"; } return m; });

    // 2.4 弱修饰词替换与学术对冲语言 (hedges) 注入
    const weakeners = [
      [/必须/g, () => chance(0.5) ? pick(["确实需要", "妥善考虑", "有待于"]) : "必须"],
      [/显著/g, () => chance(0.5) ? pick(["较为突出", "相当显眼", "颇具成效"]) : "显著"],
      [/完全/g, () => chance(0.5) ? pick(["大体上", "绝大部分", "基本上"]) : "完全"],
      [/非常/g, () => chance(0.5) ? pick(["相当", "极其", "颇为"]) : "非常"],
      [/绝对/g, () => chance(0.5) ? pick(["极大可能", "几乎无一例外", "在绝大层面上"]) : "绝对"]
    ];
    for (const [p, r] of weakeners) resultText = resultText.replace(p, r);

    let hedgeCount = 0;
    const hedges = [
      [/表明/g, () => { if (chance(0.4) && hedgeCount < 4) { hedgeCount++; return pick(["似乎暗示了", "在特定范围内表明", "多半反映出"]); } return "表明"; }],
      [/证明/g, () => { if (chance(0.4) && hedgeCount < 4) { hedgeCount++; return pick(["基本印证了", "可在一定程度上佐证", "粗略证实了"]); } return "证明"; }],
      [/说明/g, () => { if (chance(0.35) && hedgeCount < 4) { hedgeCount++; return pick(["或许能说明", "侧面表征着", "有理由推断出"]); } return "说明"; }],
      [/可以看出/g, () => { if (chance(0.45) && hedgeCount < 4) { hedgeCount++; return pick(["大体上能够察觉到", "似乎容易看出", "如果不带偏见地观察，似乎能发现"]); } return "可以看出"; }]
    ];
    for (const [p, r] of hedges) resultText = resultText.replace(p, r);

    // 2.5 从句嵌套与信息重排
    let embedCount = 0;
    const embeddings = [
      [/([\u4e00-\u9fa5]{2,6})(?:具有|拥有)([\u4e00-\u9fa5]{2,15}的)([\u4e00-\u9fa5]{2,6})/g,
        (...a) => { if (chance(0.4) && embedCount < 3) { embedCount++; return `${a[1]}——作为一个以${a[2]}为核心的载体——所具备的${a[3]}`; } return a[0]; }],
      [/([\u4e00-\u9fa5]{2,8})对([\u4e00-\u9fa5]{2,8})(?:有|具有|产生)([\u4e00-\u9fa5]{2,6})(?:影响|作用)/g,
        (...a) => { if (chance(0.35) && embedCount < 3) { embedCount++; return `${a[1]}在作用于${a[2]}的过程里所倾注的${a[3]}影响`; } return a[0]; }]
    ];
    for (const [p, r] of embeddings) resultText = resultText.replace(p, r);

    // 句间交叉引用注入
    let refCount = 0;
    const refs = ["正如上文反复探讨的，", "如果回顾我们刚才提到的，", "这与前一部分的论证不谋而合，", "循着前文铺垫的基调，"];
    let finalSents = splitSents(resultText);
    if (finalSents.length >= 5) {
      for (let si = 3; si < finalSents.length; si++) {
        if (chance(0.2) && refCount < 2 && finalSents[si].length > 12) {
          if (!refs.some(r => finalSents[si].startsWith(r))) {
            finalSents[si] = pick(refs) + finalSents[si];
            refCount++;
          }
        }
      }
      resultText = finalSents.join("");
    }

    // 2.6 节奏方差强制控制 (Burstiness Enforcement)
    finalSents = splitSents(resultText);
    if (finalSents.length >= 4) {
      const lengths = finalSents.map(s => s.length);
      const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((sum, l) => sum + (l - avg) ** 2, 0) / lengths.length;
      const stddev = Math.sqrt(variance);

      if (stddev < avg * 0.35) {
        // 找到最长的句子并劈开
        let maxIdx = 0;
        for (let si = 1; si < finalSents.length; si++) {
          if (finalSents[si].length > finalSents[maxIdx].length) maxIdx = si;
        }
        const longest = finalSents[maxIdx];
        const ci = longest.indexOf("，", Math.floor(longest.length * 0.3));
        if (ci > 4 && ci < longest.length - 6) {
          finalSents.splice(maxIdx, 1, longest.slice(0, ci) + "。", longest.slice(ci + 1));
        }

        // 找到最短的两个并合并
        let minPairIdx = -1, minPairLen = Infinity;
        for (let si = 0; si < finalSents.length - 1; si++) {
          const total = finalSents[si].length + finalSents[si + 1].length;
          if (total < minPairLen) { minPairLen = total; minPairIdx = si; }
        }
        if (minPairIdx >= 0 && minPairLen < 35) {
          const a = stripPunct(finalSents[minPairIdx]);
          const b = stripPunct(finalSents[minPairIdx + 1]);
          finalSents[minPairIdx] = a + "，" + b + "。";
          finalSents.splice(minPairIdx + 1, 1);
        }
      }
      resultText = finalSents.join("");
    }

    // 2.7 句末补充说明（破折号延伸）
    if (chance(0.4)) {
      const supplements = [
        "——这无疑需要依托于未来的临床/工程实验来判定",
        "——虽然业界目前关于此处的争论还比较多",
        "——这也为后继的理论延展留下了一个有趣的口子",
        "——即便局外的很多研究都极力试图反驳这一点"
      ];
      let ss = splitSents(resultText);
      if (ss.length >= 3) {
        const ti = 1 + Math.floor(Math.random() * (ss.length - 2));
        if (ss[ti].endsWith("。") && ss[ti].length > 15) {
          ss[ti] = ss[ti].slice(0, -1) + pick(supplements) + "。";
        }
        resultText = ss.join("");
      }
    }

    // ------------------ 最终重度兜底 ------------------
    if (resultText === text || getLevenshteinDistance(text, resultText) < 5) {
      const emergency = [
        [/可以/g,"有能力"],[/进行/g,"着手开展"],[/重要/g,"牵一发而动全身"],[/实现/g,"贯彻落实"],
        [/合理/g,"得当"],[/有效/g,"卓有成效"],[/问题/g,"拦路虎"],[/方法/g,"新手段"],
        [/研究/g,"深耕细作"],[/发现/g,"敏锐捕捉到"]
      ];
      let fixed = 0;
      for (const [p, r] of emergency) { if (p.test(resultText) && fixed < 5) { resultText = resultText.replace(p, r); fixed++; } }
      resultText = pick(["老实说，","就实践反馈来看，","必须要直面的是，","从冷思考的角度出发，"]) + resultText;
    }

    return resultText;
  }

  return text;
}
