function TaskForm({ onTaskCreate, isProcessing, customCategories = [], onAddCategory, onDeleteCategory }) {
  try {
    const [formData, setFormData] = React.useState({
      description: '',
      category: '工作',
      startDate: '',
      endDate: ''
    });
    // 本地错误和处理状态
    const [error, setError] = React.useState('');
    const [localProcessing, setLocalProcessing] = React.useState(false);
    // invokeAIAgent 兜底
    const aiAgent = typeof window !== 'undefined' && window.invokeAIAgent ? window.invokeAIAgent : async () => [];

    const [showAddCategory, setShowAddCategory] = React.useState(false);
    const [newCategoryName, setNewCategoryName] = React.useState('');
    const [newCategoryIcon, setNewCategoryIcon] = React.useState('star');

    const presetCategories = ['工作', '生活', '学习', '健康'];
    const allCategories = [...presetCategories, ...customCategories.map(cat => cat.name)];

    // 在组件头部添加tab状态
    const [submitTab, setSubmitTab] = React.useState('direct'); // 'direct' or 'ai'

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!formData.description || !formData.startDate || !formData.endDate) {
        alert('请填写完整的任务信息');
        return;
      }
      
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        alert('开始时间不能晚于结束时间');
        return;
      }
      
      // 自动生成标题（取描述的前20个字符）
      const autoTitle = formData.description.length > 20 
        ? formData.description.substring(0, 20) + '...' 
        : formData.description;
      
      await onTaskCreate({
        ...formData,
        title: autoTitle,
        deadline: formData.endDate,
        useAI: true // 默认使用AI拆解
      });
      
      setFormData({
        description: '',
        category: '工作',
        startDate: '',
        endDate: ''
      });
    };

    return (
      <div className="card" data-name="taskForm" data-file="components/TaskForm.js" style={{marginBottom: '24px'}}>
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <h1 className="title-serif title-serif-large mb-4">新任务</h1>
        </div>
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
          <div>
            <label style={{display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#34495e'}}>任务描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="input"
              style={{width: '100%', minHeight: '80px', resize: 'vertical'}}
              placeholder="详细描述任务内容..."
            />
          </div>

          <div style={{display: 'flex', gap: '16px'}}>
            <div style={{flex: '1'}}>
              <label style={{display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#34495e'}}>任务类别</label>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px'}}>
                {allCategories.map(cat => {
                  const isCustom = customCategories.some(customCat => customCat.name === cat);
                  const customCategory = customCategories.find(customCat => customCat.name === cat);
                  
                  return (
                    <div key={cat} style={{position: 'relative'}}>
                      <button
                        type="button"
                        className={`category-btn ${formData.category === cat ? 'selected' : ''}`}
                        onClick={() => setFormData({...formData, category: cat})}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '20px',
                          border: formData.category === cat ? '2px solid #aa96da' : '1px solid #e0e0e0',
                          backgroundColor: formData.category === cat ? '#aa96da' : 'white',
                          color: formData.category === cat ? 'white' : '#333',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          position: 'relative',
                          outline: 'none',
                          boxShadow: 'none'
                        }}
                        onMouseDown={(e) => {
                          // 防止默认行为
                          e.preventDefault();
                        }}
                      >
                        <i className={`fas fa-${isCustom ? customCategory.icon : (() => {
                          switch (cat) {
                            case '工作': return 'cog';
                            case '生活': return 'home';
                            case '学习': return 'book';
                            case '健康': return 'running';
                            default: return 'star';
                          }
                        })()}`} style={{fontSize: '12px'}}></i>
                        <span>{cat}</span>
                      </button>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDeleteCategory) {
                              onDeleteCategory(customCategory.id);
                            }
                          }}
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10
                          }}
                          title="删除类别"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
                
                {/* 添加自定义类别按钮 */}
                <button
                  type="button"
                  onClick={() => setShowAddCategory(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px dashed #aa96da',
                    backgroundColor: 'transparent',
                    color: '#aa96da',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseDown={(e) => {
                    // 防止默认行为
                    e.preventDefault();
                  }}
                >
                  <i className="fas fa-plus" style={{fontSize: '12px'}}></i>
                  <span>添加类别</span>
                </button>
              </div>
              
              {/* 添加自定义类别表单 */}
              {showAddCategory && (
                <div style={{
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  backgroundColor: '#f8f9fa',
                  marginTop: '8px'
                }}>
                  <div style={{display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px'}}>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="输入类别名称..."
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    />
                    <select
                      value={newCategoryIcon}
                      onChange={(e) => setNewCategoryIcon(e.target.value)}
                      style={{
                        padding: '6px 8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      <option value="star">⭐ 星</option>
                      <option value="heart">❤️ 心</option>
                      <option value="flag">🚩 旗</option>
                      <option value="gift">🎁 礼物</option>
                      <option value="music">🎵 音乐</option>
                      <option value="gamepad">🎮 游戏</option>
                      <option value="car">🚗 车</option>
                      <option value="plane">✈️ 飞机</option>
                      <option value="coffee">☕ 咖啡</option>
                      <option value="pizza">🍕 披萨</option>
                    </select>
                  </div>
                  <div style={{display: 'flex', gap: '8px'}}>
                    <button
                      type="button"
                      onClick={() => {
                        if (newCategoryName.trim() && onAddCategory) {
                          onAddCategory(newCategoryName.trim(), newCategoryIcon);
                          setNewCategoryName('');
                          setNewCategoryIcon('star');
                          setShowAddCategory(false);
                        }
                      }}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: '#aa96da',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      添加
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewCategoryName('');
                        setNewCategoryIcon('star');
                        setShowAddCategory(false);
                      }}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label style={{display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#34495e'}}>时间范围</label>
            <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="input"
                style={{flex: 1}}
                min={new Date().toISOString().split('T')[0]}
              />
              <span style={{color: '#7f8c8d', fontWeight: '500'}}>至</span>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="input"
                style={{flex: 1}}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* 分段按钮提交区 - Tabs分段+分割线 */}
          <div className="w-full mt-4 flex justify-center">
            <div className="tabs tabs-boxed bg-white rounded-xl shadow-md flex w-full max-w-md">
              <button
                type="button"
                className={`tab tab-lg flex-1 font-semibold transition-all duration-200 rounded-l-xl
                  ${submitTab === 'direct' ? 'tab-active bg-blue-600 text-white shadow' : 'text-blue-600 hover:bg-blue-50'}`}
                aria-selected={submitTab === 'direct'}
                tabIndex={0}
                onClick={() => setSubmitTab('direct')}
                style={{outline: 'none', border: 'none'}}
              >
                直接提交
              </button>
              <div className="w-px h-8 bg-gray-200 self-center mx-1" />
              <button
                type="button"
                className={`tab tab-lg flex-1 font-semibold transition-all duration-200 rounded-r-xl
                  ${submitTab === 'ai' ? 'tab-active bg-blue-600 text-white shadow' : 'text-blue-600 hover:bg-blue-50'}`}
                aria-selected={submitTab === 'ai'}
                tabIndex={0}
                onClick={() => setSubmitTab('ai')}
                style={{outline: 'none', border: 'none'}}
              >
                AI优化提交
              </button>
            </div>
          </div>
          {/* 提交按钮逻辑，根据tab切换 */}
          <div className="w-full mt-2">
            <button
              type="button"
              className={`btn w-full ${submitTab === 'direct' ? 'btn-primary' : 'btn-secondary'} ${isProcessing || localProcessing ? 'loading' : ''}`}
              disabled={isProcessing || localProcessing}
              onClick={async (e) => {
                e.preventDefault();
                if (submitTab === 'direct') {
                  // 直接提交逻辑
                  if (!formData.description || !formData.category || !formData.startDate || !formData.endDate) {
                    alert('请填写完整的任务信息');
                    return;
                  }
                  if (new Date(formData.startDate) > new Date(formData.endDate)) {
                    alert('开始时间不能晚于结束时间');
                    return;
                  }
                  setError('');
                  setLocalProcessing(true);
                  try {
                    const autoTitle = formData.description.length > 20 
                      ? formData.description.substring(0, 20) + '...'
                      : formData.description;
                    // 自动生成与标题一致的子任务（仅手动添加时）
                    const subtasks = [
                      {
                        name: autoTitle,
                        date: formData.endDate,
                        completed: false,
                        priority: 1,
                        originalText: autoTitle,
                        estimatedTime: 60,
                        workload: 'medium'
                      }
                    ];
                    await onTaskCreate({ ...formData, title: autoTitle, subtasks });
                  } catch (err) {
                    setError(err.message || '添加失败');
                  } finally {
                    setLocalProcessing(false);
                  }
                } else {
                  // AI优化提交逻辑
                  if (!formData.description || !formData.category || !formData.startDate || !formData.endDate) {
                    alert('请填写完整的任务信息');
                    return;
                  }
                  if (new Date(formData.startDate) > new Date(formData.endDate)) {
                    alert('开始时间不能晚于结束时间');
                    return;
                  }
                  setError('');
                  setLocalProcessing(true);
                  try {
                    const autoTitle = formData.description.length > 20 
                      ? formData.description.substring(0, 20) + '...'
                      : formData.description;
                    // 构造AI任务对象
                    const taskObj = {
                      description: formData.description,
                      category: formData.category,
                      deadline: formData.endDate
                    };
                    // 1. 智能拆解
                    const decomposition = await (window.aiAgent?.decomposeTask?.(taskObj) ?? { subtasks: [formData.description], type: '一次性任务', complexity: '简单' });
                    // 2. 智能分配
                    const schedule = await (window.aiAgent?.scheduleTask?.(taskObj, decomposition) ?? { schedule: decomposition.subtasks.map((name, i) => ({ name, date: formData.endDate, completed: false, priority: i + 1 })) });
                    // 保证每个子任务结构完整
                    const subtasks = (schedule.schedule || decomposition.subtasks.map((name, i) => ({ name, date: formData.endDate, completed: false, priority: i + 1 })))
                      .map((subtask, i) => ({
                        name: subtask.name || (typeof subtask === 'string' ? subtask : ''),
                        date: subtask.date || formData.endDate,
                        completed: typeof subtask.completed === 'boolean' ? subtask.completed : false,
                        priority: typeof subtask.priority === 'number' ? subtask.priority : i + 1,
                        originalText: subtask.originalText || subtask.name || (typeof subtask === 'string' ? subtask : ''),
                        estimatedTime: typeof subtask.estimatedTime === 'number' ? subtask.estimatedTime : 60,
                        workload: subtask.workload || 'medium'
                      }));
                    await onTaskCreate({ ...formData, title: autoTitle, subtasks });
                  } catch (err) {
                    setError(err.message || 'AI拆解失败');
                  } finally {
                    setLocalProcessing(false);
                  }
                }
              }}
            >
              {submitTab === 'direct' ? '直接提交' : 'AI优化提交'}
            </button>
          </div>
        </form>
      </div>
    );
  } catch (error) {
    console.error('TaskForm component error:', error);
    return null;
  }
}
