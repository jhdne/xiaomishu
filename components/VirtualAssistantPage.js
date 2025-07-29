// @ts-nocheck
const { useState, useEffect } = React;

function VirtualAssistantPage() {
  // 解析URL参数获取taskId
  const getTaskIdFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('taskId') || '';
  };

  const [taskId, setTaskId] = useState(getTaskIdFromUrl());
  const [title, setTitle] = useState('');
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 根据taskId自动填充任务标题
  useEffect(() => {
    if (taskId && window._mockTasks) {
      const taskObj = window._mockTasks.find(t => t.objectId == taskId);
      if (taskObj && taskObj.objectData && taskObj.objectData.title) {
        setTitle(taskObj.objectData.title);
      }
    }
  }, [taskId]);

  // 发送到AI大模型
  const handleSend = async () => {
    setError('');
    setResult('');
    if (!title.trim() || !input.trim()) {
      setError('请填写任务标题和详细描述');
      return;
    }
    setLoading(true);
    try {
      let aiResult = '';
      if (window.invokeAIAgent) {
        aiResult = await window.invokeAIAgent(
          `你是一个智能任务助手，请根据如下任务标题和描述，帮用户完成任务。输出结构化、详细、可执行的方案。`,
          `任务标题：${title}\n任务描述：${input}`
        );
      } else if (window.aiAgent && window.aiAgent.decomposeTask) {
        // 兼容旧API
        const res = await window.aiAgent.decomposeTask({ title, description: input });
        aiResult = JSON.stringify(res, null, 2);
      } else {
        aiResult = 'AI接口不可用，请检查配置。';
      }
      setResult(typeof aiResult === 'string' ? aiResult : JSON.stringify(aiResult, null, 2));
    } catch (e) {
      setError('AI处理失败，请重试。');
    } finally {
      setLoading(false);
    }
  };

  // 下载结果为txt
  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'AI任务结果'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
        {/* 顶部任务标题 */}
        <input
          className="text-2xl font-bold text-center mb-2 border-0 border-b-2 border-blue-300 focus:ring-0 focus:border-blue-500 bg-transparent w-full outline-none"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="请输入任务标题"
          aria-label="任务标题"
          style={{marginBottom: '1.5rem'}}
        />
        {/* 任务描述输入框 */}
        <textarea
          className="w-full min-h-[90px] max-h-48 p-3 rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-vertical mb-4 text-gray-700 bg-gray-50"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="请输入任务详细描述和要求（如：请帮我拆解任务、生成执行计划等）"
          aria-label="任务描述"
        />
        {/* 错误提示 */}
        {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}
        {/* 发送按钮 */}
        <button
          className="w-full py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold text-lg shadow transition-all mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? 'AI处理中...' : '发送给AI助手'}
        </button>
        {/* 结果区 */}
        {result && (
          <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 mt-2 mb-2 text-gray-800 whitespace-pre-wrap break-words relative">
            <div className="absolute top-2 right-2">
              <button
                className="px-3 py-1 rounded bg-purple-500 text-white text-xs font-semibold shadow hover:bg-purple-600 transition-all"
                onClick={handleDownload}
                aria-label="下载AI结果"
              >下载结果</button>
            </div>
            <div className="text-base leading-relaxed">{result}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// 兼容UMD
if (typeof window !== 'undefined') {
  window.VirtualAssistantPage = VirtualAssistantPage;
} 