// AI智能任务处理工具
const aiAgent = {
  // 智能拆解任务
  async decomposeTask(task) {
    try {
      const systemPrompt = `你是智能任务拆解系统，擅长将各类任务转化为清晰的执行路径。请基于以下步骤进行拆解任务：

1. 深度分析任务特征：
   - 类型判断：
     - 时间段任务：有明确起止日期的项目类任务
     - 一次性任务：需完成的单次事件
     - 习惯性任务：需长期坚持的行为养成
   - 复杂度评估：
     - 简单任务：步骤≤3且无复杂依赖
     - 复杂任务：多阶段协同或需专业知识

2. 拆解数量限制：
   - 一次性简单任务：子任务≤3
   - 习惯性简单任务：子任务≤3
   - 其它类型任务：子任务≤5
   - 只提取核心可执行步骤，避免冗余

3. 输出标准模板：
{
  "type": "任务类型",
  "complexity": "复杂度等级",
  "steps": [
    "核心步骤1",
    "核心步骤2",
    "核心步骤N"
  ]
}

请严格按照此模板分析并拆解任务，只返回JSON格式结果，不要添加任何其他内容。`;

      const userPrompt = `任务描述：${task.description}
任务类别：${task.category}
截止日期：${task.deadline}
当前日期：${new Date().toISOString().split('T')[0]}`;

      const response = await invokeAIAgent(systemPrompt, userPrompt);
      let cleanedResponse = response.replace(/```json|```/g, '').trim();
      
      // 确保响应是有效的JSON
      if (!cleanedResponse.startsWith('{')) {
        const jsonStart = cleanedResponse.indexOf('{');
        const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd !== -1) {
          cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd);
        }
      }
      
      const result = JSON.parse(cleanedResponse);
      return { 
        subtasks: result.steps || [task.description],
        type: result.type || '一次性任务',
        complexity: result.complexity || '简单'
      };
    } catch (error) {
      console.error('任务拆解失败:', error);
      return { 
        subtasks: [task.description],
        type: '一次性任务',
        complexity: '简单'
      };
    }
  },

  // 智能分配任务到日期
  async scheduleTask(task, decomposition) {
    try {
      const systemPrompt = `你是智能任务分配系统，核心原则是子任务不能扎堆安排在同一天，要根据每日合理任务量均衡分布。

核心分配原则：
1. 均衡分配：避免多个子任务集中在同一天，合理分散到不同日期
2. 时间范围：所有子任务必须在当前日期到截止日期之间完成
3. 工作量评估：根据任务复杂度安排每日任务数量
4. 缓冲时间：预留适当缓冲时间应对突发情况

分配策略：
- 简单任务：每日可安排2-3个子任务
- 复杂任务：每日安排1-2个子任务  
- 紧急任务：优先安排在前期完成
- 绝对避免在同一天安排过多子任务

请严格按照以下JSON格式返回分配结果，不要添加任何其他内容：
{
  "schedule": [
    {
      "name": "具体子任务名称",
      "date": "2024-12-20",
      "estimatedTime": 120,
      "completed": false,
      "priority": 1,
      "workload": "medium"
    }
  ]
}`;

      const userPrompt = `主任务：${task.description}
任务类别：${task.category}
截止日期：${task.deadline}
任务类型：${decomposition.type}
复杂度：${decomposition.complexity}
拆解步骤：${decomposition.subtasks.join(', ')}
当前日期：${new Date().toISOString().split('T')[0]}`;

      const response = await invokeAIAgent(systemPrompt, userPrompt);
      let cleanedResponse = response.replace(/```json|```/g, '').trim();
      
      // 确保响应是有效的JSON
      if (!cleanedResponse.startsWith('{')) {
        const jsonStart = cleanedResponse.indexOf('{');
        const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd !== -1) {
          cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd);
        }
      }
      
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('任务分配失败:', error);
      return { 
        schedule: decomposition.subtasks.map((subtask, index) => ({
          name: subtask,
          date: task.deadline,
          estimatedTime: 60,
          completed: false,
          priority: index + 1
        }))
      };
    }
  }
};

// Gemini API Key（仅测试用，生产环境请勿暴露）
const GEMINI_API_KEY = "AIzaSyA3Qpikt4WprxuuRlEws_NKtaTohVxpQCY";

// Gemini API调用实现
async function invokeAIAgent(systemPrompt, userPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [
      { role: "user", parts: [{ text: `${systemPrompt}\n${userPrompt}` }] }
    ]
  };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    // Gemini 返回内容结构：data.candidates[0].content.parts[0].text
    let aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // 只提取JSON部分
    aiText = aiText.replace(/```json|```/g, '').trim();
    return aiText;
  } catch (e) {
    console.error('Gemini API 调用失败:', e);
    return '{"type":"一次性任务","complexity":"简单","steps":["AI子任务1","AI子任务2"]}';
  }
}

window.aiAgent = aiAgent;