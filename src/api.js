/**
 * 智能降低ai系统 - API通信模块
 * 负责通过标准 Server-Sent Events (SSE) 协议请求大语言模型，并支持流式文本解析。
 */

/**
 * 启动大模型流式转换
 * @param {Object} config API配置（apiKey, endpoint, model, temperature）
 * @param {string} systemPrompt 选定角色的 System Prompt
 * @param {string} sourceText 用户输入的原文
 * @param {Function} onToken 流式接收到字符的回调：(token) => void
 * @param {Function} onComplete 传输完成的回调：() => void
 * @param {Function} onError 发生错误的回带：(errorMessage) => void
 */
export async function sendPromptStream(config, systemPrompt, sourceText, onToken, onComplete, onError) {
  const { apiKey, endpoint, model, temperature } = config;

  // 整理 Endpoint 路径，确保以 /v1/chat/completions 结尾
  let cleanEndpoint = (endpoint || "https://api.openai.com/v1").trim();
  if (cleanEndpoint.endsWith("/")) {
    cleanEndpoint = cleanEndpoint.slice(0, -1);
  }
  if (!cleanEndpoint.endsWith("/chat/completions")) {
    // 自动追加标准后缀
    cleanEndpoint = cleanEndpoint + "/chat/completions";
  }

  try {
    const response = await fetch(cleanEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `原文：\n${sourceText}` }
        ],
        temperature: parseFloat(temperature) || 0.6,
        stream: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        parsedError = errorJson.error?.message || errorText;
      } catch (e) {
        // ignore
      }
      throw new Error(`HTTP ${response.status}: ${parsedError}`);
    }

    if (!response.body) {
      throw new Error("API 响应体为空，可能不支持流式输出。");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // 留下最后一行，因为它可能还不完整
      buffer = lines.pop() || "";

      for (const line of lines) {
        const cleaned = line.trim();
        if (!cleaned) continue;

        // 流式终止标识
        if (cleaned === "data: [DONE]") {
          onComplete();
          return;
        }

        if (cleaned.startsWith("data: ")) {
          try {
            const dataStr = cleaned.slice(6);
            if (dataStr === "[DONE]") {
              onComplete();
              return;
            }
            const json = JSON.parse(dataStr);
            const content = json.choices?.[0]?.delta?.content || "";
            if (content) {
              onToken(content);
            }
          } catch (e) {
            // 某些中转 API 输出的 chunk 可能不规范，忽略 JSON 解析错误继续处理
          }
        }
      }
    }

    // 传输正常结束
    onComplete();
  } catch (error) {
    onError(error.message || "请求失败，请检查网络或配置。");
  }
}
