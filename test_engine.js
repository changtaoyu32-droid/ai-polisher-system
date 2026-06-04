import { localRewrite, getLevenshteinDistance, calculateModifyRate } from './src/engine.js';

const singleSentenceText = "随着AI技术的飞速发展，大语言模型生成的文本越来越普遍，但也伴随着表达僵硬、AI概率偏高的问题。";

const multiSentenceText = "随着人工智能技术的飞速发展，大语言模型生成的文本在学术界和工业界变得越来越普遍。然而，这些由模型自动生成的文本往往伴随着表达僵硬、逻辑单一以及AI特征概率偏高的问题。为了解决这个问题，研究人员通常需要进行手动的文本润色和重构。通过采用先进的同义替换与句式改写技术，我们可以显著提高文章的质量，并降低其在各种检测系统中的重复率和AI生成概率。因此，开发一个智能降AI系统具有非常重要的研究意义和实用价值。";

function runTest(text, title) {
  console.log(`========================================`);
  console.log(`TEST SUITE: ${title}`);
  console.log(`========================================`);
  console.log(`Original Text:\n${text}\n`);
  
  const intensities = ['light', 'medium', 'hard'];
  for (const intensity of intensities) {
    console.log(`----------------------------------------`);
    console.log(`Intensity: ${intensity.toUpperCase()}`);
    console.log(`----------------------------------------`);
    
    // 运行两次以展示 V5 随机同义词池和多样化重组的随机裂变效果
    for (let run = 1; run <= 2; run++) {
      const start = Date.now();
      const rewritten = localRewrite(text, intensity);
      const duration = Date.now() - start;
      
      const distance = getLevenshteinDistance(text, rewritten);
      const modifyRate = calculateModifyRate(text, rewritten);
      
      console.log(`Run #${run} (took ${duration}ms):`);
      console.log(`Rewritten Text:\n${rewritten}`);
      console.log(`Levenshtein Distance: ${distance} | Modify Rate: ${modifyRate}%`);
      console.log();
    }
  }
}

console.log("STARTING ACADEMIC POLISHING ENGINE V5 UNIT TESTS");
runTest(singleSentenceText, "User Request Single-Sentence Text");
runTest(multiSentenceText, "Academic Paragraph (Multi-Sentence)");
