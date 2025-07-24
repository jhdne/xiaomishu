import React, { useState, useRef } from 'react';

/**
 * 虚拟人任务操作页面
 * - 卡片式设计，顶部虚拟人头像
 * - 任务标题、要求、补充信息输入区
 * - 附件上传区，执行按钮，交互提示
 * - 严格按优化方案实现
 */
const VirtualAssistantPage = () => {
  // 解析URL参数获取taskId
  const searchParams = new URLSearchParams(window.location.search);
  const taskId = searchParams.get('taskId');

  // 状态管理
  const [title, setTitle] = useState('');
  const [requirement, setRequirement] = useState('');
  const [detail, setDetail] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [titleFocused, setTitleFocused] = useState(false);
  const [requirementFocused, setRequirementFocused] = useState(false);
  const [detailFocused, setDetailFocused] = useState(false);

  const fileInputRef = useRef(null);

  // 虚拟人提示语
  const getAssistantTip = () => {
    if (loading) return '正在思考中，请稍候...';
    if (result) return '根据您填写的标题和要求，我生成了这些内容，看看是否符合预期？';
    if (!requirement) return '请告诉我这个任务的具体要求，越详细越好哦~';
    if (!file) return '上传相关文件（如参考模板），能让我更精准理解哦~';
    return '';
  };

  // 附件类型校验
  const isValidFile = (file) => {
    if (!file) return true;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    return allowed.includes(file.type);
  };

  // 执行按钮点击
  const handleExecute = async () => {
    setError('');
    if (!title.trim()) {
      setError('请填写任务标题');
      return;
    }
    if (!requirement.trim()) {
      setError('请填写任务要求');
      return;
    }
    if (!isValidFile(file)) {
      setError('仅支持上传PDF、Word、Excel文件');
      return;
    }
    setLoading(true);
    setResult('');
    try {
      // 模拟API调用，实际应替换为真实大模型API
      await new Promise(r => setTimeout(r, 1800));
      setResult('【示例内容】根据您的输入，已生成任务方案。');
    } catch (e) {
      setError('内容生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 样式类
  const cardClass = 'max-w-xl mx-auto mt-10 bg-white border border-gray-200 rounded-lg p-5 shadow-md';
  const avatarClass = 'flex justify-center mb-6';
  const inputBase = 'w-full border rounded px-3 py-2 outline-none transition-all';
  const inputFocus = 'border-[#aa96da] font-bold text-[20px] text-[#333]';
  const inputNormal = 'border-[#ccc] text-[16px] text-[#333]';
  const labelClass = 'block mb-1 text-gray-600 font-medium';
  const tipClass = 'text-[#6c757d] text-sm ml-2';
  const errorClass = 'text-red-500 text-sm mb-2';

  return (
    <div className={cardClass} role="main" aria-label="虚拟人任务操作卡片">
      {/* 虚拟人头像 */}
      <div className={avatarClass}>
        <img src="/virtual/虚拟人（亚洲）.png" alt="虚拟人头像" className="rounded-full" style={{width: 80, height: 80}} />
      </div>
      {/* 任务标题输入框 */}
      <div className="flex flex-col items-center mb-4">
        <input
          className={`${inputBase} ${titleFocused ? inputFocus : inputNormal}`}
          style={{width: '80%', maxWidth: 500, height: 40, fontSize: titleFocused ? 20 : 16, fontWeight: titleFocused ? 700 : 400, color: '#333', marginBottom: 0, padding: 10}}
          placeholder="请输入任务标题"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onFocus={() => setTitleFocused(true)}
          onBlur={() => setTitleFocused(false)}
          aria-label="任务标题"
        />
      </div>
      {/* 任务要求输入区 */}
      <div className="mb-4">
        <div className="flex items-center mb-1">
          <label className={labelClass} htmlFor="requirement">任务要求</label>
          <span className={tipClass}>{getAssistantTip()}</span>
        </div>
        <textarea
          id="requirement"
          className={`${inputBase} ${requirementFocused ? inputFocus : inputNormal}`}
          style={{height: 100, fontSize: 16, color: '#666', padding: 10}}
          placeholder="请填写任务的具体要求（如目标、场景、偏好等）"
          value={requirement}
          onChange={e => setRequirement(e.target.value)}
          onFocus={() => setRequirementFocused(true)}
          onBlur={() => setRequirementFocused(false)}
          aria-label="任务要求"
        />
      </div>
      {/* 补充信息输入区 */}
      <div className="mb-4">
        <label className={labelClass} htmlFor="detail">补充信息</label>
        <textarea
          id="detail"
          className={`${inputBase} ${detailFocused ? inputFocus : inputNormal}`}
          style={{height: 150, fontSize: 14, color: '#333', padding: 10}}
          placeholder="补充任务的详细信息（可选，如具体场景、特殊格式要求等）"
          value={detail}
          onChange={e => setDetail(e.target.value)}
          onFocus={() => setDetailFocused(true)}
          onBlur={() => setDetailFocused(false)}
          aria-label="补充信息"
        />
      </div>
      {/* 附件上传区 */}
      <div className="mb-4">
        <div className="flex items-center mb-1">
          <label className={labelClass} htmlFor="file">附件</label>
          <span className={tipClass}>上传相关文件（如参考模板），能让我更精准理解哦~</span>
        </div>
        <div className="w-full h-20 bg-[#f9f9f9] border-2 border-dashed border-[#aa96da] rounded flex flex-col justify-center items-center cursor-pointer"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          tabIndex={0}
          aria-label="上传附件"
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current && fileInputRef.current.click(); }}
        >
          <input
            ref={fileInputRef}
            id="file"
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            style={{display: 'none'}}
            onChange={e => setFile(e.target.files[0])}
          />
          <span className="text-[#999] text-[14px]">支持上传 PDF、Word、Excel 文件</span>
          {file && <span className="text-[#333] text-xs mt-1">已选择：{file.name}</span>}
        </div>
      </div>
      {/* 错误提示 */}
      {error && <div className={errorClass} role="alert">{error}</div>}
      {/* 执行按钮 */}
      <div className="flex justify-center mt-6">
        <button
          className="w-30 h-10 bg-[#aa96da] text-white font-bold rounded text-[16px] flex items-center justify-center disabled:opacity-60"
          style={{width: 120, height: 40}}
          onClick={handleExecute}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (
            <svg className="animate-spin mr-2" width="20" height="20" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#fff" strokeWidth="5" strokeDasharray="31.4 31.4"/></svg>
          ) : null}
          {loading ? '生成中...' : '执行'}
        </button>
      </div>
      {/* 结果展示 */}
      {result && (
        <div className="mt-6 p-4 bg-[#f8f9fa] rounded border border-[#e0e0e0] text-[#333]">
          {result}
        </div>
      )}
    </div>
  );
};

export default VirtualAssistantPage; 