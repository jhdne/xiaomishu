class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">We're sorry, but something unexpected happened.</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 工具函数：本地日期转YYYY-MM-DD字符串
function formatLocalDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 安全日期格式化，防止非法日期导致崩溃
function safeToLocaleDateString(date) {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString();
  } catch {
    return '';
  }
}

// localStorage持久化工具
function saveTasksToStorage(tasks) {
  try {
    localStorage.setItem('taskManager_tasks', JSON.stringify(tasks));
    console.log('任务数据已保存到localStorage:', tasks.length, '个任务');
  } catch (error) {
    console.error('保存任务数据失败:', error);
  }
}

function loadTasksFromStorage() {
  try {
    const savedTasks = localStorage.getItem('taskManager_tasks');
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks);
      console.log('从localStorage恢复任务数据:', parsedTasks.length, '个任务');
      return parsedTasks;
    }
  } catch (error) {
    console.error('加载任务数据失败:', error);
  }
  return [];
}

function App() {
  try {
    const [tasks, setTasks] = React.useState(() => loadTasksFromStorage() || []);
    const [selectedDate, setSelectedDate] = React.useState(formatLocalDate(new Date()));
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState('daily');
    const [showAllTasks, setShowAllTasks] = React.useState(false);

    // 用户登录状态管理
    const [user, setUser] = React.useState(() => {
      // 预留：从localStorage/sessionStorage加载用户信息
      const saved = localStorage.getItem('taskManager_user');
      return saved ? JSON.parse(saved) : null;
    });
    const isLoggedIn = !!user;
    const [showAuth, setShowAuth] = React.useState(false); // 确保初始为false，只有点击按钮才显示弹窗

    // 子任务添加状态管理
    const [editingNewSubtask, setEditingNewSubtask] = React.useState(false);
    const [newSubtaskName, setNewSubtaskName] = React.useState('');
    const [editingTaskId, setEditingTaskId] = React.useState(null);

    // 拖拽排序状态管理
    const [draggedSubtask, setDraggedSubtask] = React.useState(null);
    const [dragOverIndex, setDragOverIndex] = React.useState(null);

    // 自定义类别管理
    const [customCategories, setCustomCategories] = React.useState(() => {
      const saved = localStorage.getItem('taskManager_customCategories');
      return saved ? JSON.parse(saved) : [];
    });
    const [showAddCategory, setShowAddCategory] = React.useState(false);
    const [newCategoryName, setNewCategoryName] = React.useState('');
    const [newCategoryIcon, setNewCategoryIcon] = React.useState('star');

    React.useEffect(() => {
      const savedTasks = loadTasksFromStorage();
      if (savedTasks.length > 0) {
        setTasks(savedTasks);
      }
    }, []);

    const loadTasks = async () => {
      try {
        const response = await trickleListObjects('task', 100, true);
        if (response && response.items && Array.isArray(response.items)) {
          setTasks(response.items.map(item => ({
            objectId: item.objectId,
            ...item.objectData
          })));
        } else {
          setTasks([]);
        }
      } catch (error) {
        console.error('加载任务失败:', error);
        setTasks([]);
      }
    };

    const handleTaskCreate = async (taskData) => {
      setIsProcessing(true);
      try {
        console.log('开始创建任务:', taskData);
        
        let newTask = {
          id: Date.now().toString(),
          objectId: Date.now().toString(),
          ...taskData,
          createdAt: new Date().toISOString(),
          status: '待分配',
          completed: false,
          deadline: taskData.deadline || taskData.endDate || '',
        };

        if (taskData.useAI) {
          const decomposition = await aiAgent.decomposeTask(taskData);
          console.log('AI拆解结果 decomposition:', decomposition);
          const schedule = await aiAgent.scheduleTask(taskData, decomposition);
          console.log('AI分配结果 schedule:', schedule);
          const processedSubtasks = schedule.schedule || decomposition.subtasks.map((subtask, index) => {
            // 均衡分配子任务，避免扎堆在同一天
            const totalDays = Math.ceil((new Date(taskData.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            const dayInterval = Math.max(1, Math.floor(totalDays / decomposition.subtasks.length));
            const assignedDate = new Date();
            assignedDate.setDate(assignedDate.getDate() + (index * dayInterval));
            
            // 确保不超过截止日期
            if (assignedDate > new Date(taskData.deadline)) {
              assignedDate.setTime(new Date(taskData.deadline).getTime());
            }
            
            return {
              name: subtask,
              date: formatLocalDate(assignedDate),
              completed: false,
              priority: index + 1,
              originalText: subtask,
              estimatedTime: 60,
              workload: 'medium'
            };
          });
          console.log('最终用于存储的 processedSubtasks:', processedSubtasks);
          
          newTask = {
            ...newTask,
            status: '已分配',
            subtasks: processedSubtasks,
            taskType: decomposition.type || '一次性任务',
            complexity: decomposition.complexity || '简单',
            scheduledDate: processedSubtasks[0]?.date || taskData.deadline
          };
        }
        
        console.log('创建的任务对象:', newTask);
        const updatedTasks = [...tasks, newTask];
        setTasks(updatedTasks);
        saveTasksToStorage(updatedTasks);
        
        console.log('任务创建成功，当前任务总数:', updatedTasks.length);
        setIsProcessing(false);
        return newTask;
      } catch (error) {
        console.error('创建任务失败:', error);
        setIsProcessing(false);
        throw error;
      }
    };

    const handleTaskEdit = async (taskId, updatedData) => {
      try {
        const updatedTasks = tasks.map(task => {
          if ((task.id && task.id === taskId) || (task.objectId && task.objectId === taskId)) {
            return { ...task, ...updatedData };
          }
          return task;
        });
        setTasks([...updatedTasks]); // 强制新数组引用，确保刷新
        saveTasksToStorage(updatedTasks);
        const updatedTask = updatedTasks.find(t => (t.id === taskId || t.objectId === taskId));
        console.log('任务更新成功:', taskId, updatedData, '最新subtasks:', updatedTask?.subtasks);
      } catch (error) {
        console.error('任务更新失败:', error);
      }
    };

    const handleTaskDelete = async (taskId) => {
      try {
        const updatedTasks = tasks.filter(task => task.id !== taskId && task.objectId !== taskId);
        setTasks(updatedTasks);
        saveTasksToStorage(updatedTasks);
        console.log('任务删除成功:', taskId);
      } catch (error) {
        console.error('任务删除失败:', error);
      }
    };

    const handleStatusChange = async (taskId, newStatus) => {
      try {
        const updatedTasks = tasks.map(task => 
          task.id === taskId || task.objectId === taskId ? { ...task, status: newStatus } : task
        );
        setTasks(updatedTasks);
        saveTasksToStorage(updatedTasks);
        console.log('状态更新成功:', taskId, newStatus);
      } catch (error) {
        console.error('状态更新失败:', error);
      }
    };

    // 子任务添加相关函数
    const addSubtask = (taskId) => {
      if (newSubtaskName.trim()) {
        const task = tasks.find(t => t.id === taskId || t.objectId === taskId);
        if (task) {
          const newSubtask = {
            name: newSubtaskName.trim(),
            completed: false,
            priority: task.subtasks ? task.subtasks.length + 1 : 1,
            originalText: newSubtaskName.trim()
          };
          const updatedSubtasks = [...(task.subtasks || []), newSubtask];
          handleTaskEdit(taskId, { subtasks: updatedSubtasks });
        }
      }
      setEditingNewSubtask(false);
      setNewSubtaskName('');
      setEditingTaskId(null);
    };

    const cancelEdit = () => {
      setEditingNewSubtask(false);
      setNewSubtaskName('');
      setEditingTaskId(null);
    };

    const startEditSubtask = (taskId) => {
      setEditingNewSubtask(true);
      setNewSubtaskName('');
      setEditingTaskId(taskId);
    };

    // 拖拽排序相关函数
    const handleDragStart = (e, taskId, subtaskIndex) => {
      setDraggedSubtask({ taskId, subtaskIndex });
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', e.target.outerHTML);
    };

    const handleDragOver = (e, index) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverIndex(index);
    };

    const handleDragLeave = () => {
      setDragOverIndex(null);
    };

    const handleDrop = (e, taskId, dropIndex) => {
      e.preventDefault();
      if (draggedSubtask && draggedSubtask.taskId === taskId) {
        const task = tasks.find(t => t.id === taskId || t.objectId === taskId);
        if (task && task.subtasks) {
          const subtasks = [...task.subtasks];
          const draggedItem = subtasks[draggedSubtask.subtaskIndex];
          
          // 移除拖拽的项目
          subtasks.splice(draggedSubtask.subtaskIndex, 1);
          
          // 在目标位置插入
          subtasks.splice(dropIndex, 0, draggedItem);
          
          // 更新优先级
          const updatedSubtasks = subtasks.map((subtask, index) => ({
            ...subtask,
            priority: index + 1
          }));
          
          handleTaskEdit(taskId, { subtasks: updatedSubtasks });
        }
      }
      setDraggedSubtask(null);
      setDragOverIndex(null);
    };

    const handleDragEnd = () => {
      setDraggedSubtask(null);
      setDragOverIndex(null);
    };

    // 自定义类别管理函数
    const addCustomCategory = () => {
      if (newCategoryName.trim() && newCategoryIcon) {
        const newCategory = {
          id: Date.now().toString(),
          name: newCategoryName.trim(),
          icon: newCategoryIcon,
          color: '#aa96da' // 默认使用品牌色
        };
        const updatedCategories = [...customCategories, newCategory];
        setCustomCategories(updatedCategories);
        localStorage.setItem('taskManager_customCategories', JSON.stringify(updatedCategories));
        setNewCategoryName('');
        setNewCategoryIcon('star');
        setShowAddCategory(false);
      }
    };

    const deleteCustomCategory = (categoryId) => {
      const updatedCategories = customCategories.filter(cat => cat.id !== categoryId);
      setCustomCategories(updatedCategories);
      localStorage.setItem('taskManager_customCategories', JSON.stringify(updatedCategories));
    };

    const getCategoryIcon = (categoryName) => {
      // 预设类别图标
      const presetIcons = {
        '工作': 'cog',
        '生活': 'home',
        '学习': 'book',
        '健康': 'running'
      };
      
      // 查找自定义类别
      const customCategory = customCategories.find(cat => cat.name === categoryName);
      if (customCategory) {
        return customCategory.icon;
      }
      
      return presetIcons[categoryName] || 'question';
    };

    const getCategoryColor = (categoryName) => {
      // 预设类别颜色
      const presetColors = {
        '工作': '#3B82F6',
        '生活': '#FFA500',
        '学习': '#00B4D8',
        '健康': '#10B981'
      };
      
      // 查找自定义类别
      const customCategory = customCategories.find(cat => cat.name === categoryName);
      if (customCategory) {
        return customCategory.color;
      }
      
      return presetColors[categoryName] || '#808080';
    };

    // 在每次任务变更后自动保存到localStorage
    React.useEffect(() => { 
      if (tasks.length > 0) {
        saveTasksToStorage(tasks); 
      }
    }, [tasks]);

    return (
      <div className="min-h-screen bg-gray-50" data-name="app" data-file="app.js">
        <header style={{height: '64px', background: 'var(--white)', borderBottom: '1px solid var(--border-color)'}}>
          <div className="max-w-7xl mx-auto px-4 h-full">
            <div className="flex justify-between items-center h-full">
              <div className="flex items-center">
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--brand-color) 0%, #4a90e2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  boxShadow: '0 2px 8px rgba(13, 110, 253, 0.3)'
                }}>
                  <div className="icon-zap text-lg" style={{color: 'white'}}></div>
                </div>
                <div>
                  <h1 style={{fontSize: '20px', fontWeight: '600', margin: 0}}>一点点</h1>
                  <p style={{fontSize: '12px', color: '#6c757d', margin: 0}}>智能任务管理秘书</p>
                </div>
              </div>
              <nav className="flex items-center" style={{gap: '8px'}}>
                <button
                  onClick={() => setActiveTab('daily')}
                  className={`oval-label-nav ${activeTab === 'daily' ? '' : 'btn-secondary'}`}
                  style={activeTab === 'daily' ? {} : {background: '#f8f9fa', color: '#6c757d'}}
                >
                  今日任务
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`oval-label-nav ${activeTab === 'tasks' ? '' : 'btn-secondary'}`}
                  style={activeTab === 'tasks' ? {} : {background: '#f8f9fa', color: '#6c757d'}}
                >
                  添加任务
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`oval-label-nav ${activeTab === 'calendar' ? '' : 'btn-secondary'}`}
                  style={activeTab === 'calendar' ? {} : {background: '#f8f9fa', color: '#6c757d'}}
                >
                  任务日历
                </button>
                {/* 注册/登录按钮或用户信息 */}
                {!isLoggedIn ? (
                  <button
                    className="btn btn-ghost btn-xs rounded-full px-3 ml-2 border border-gray-300 text-gray-700 hover:border-[#aa96da] hover:text-[#aa96da] transition-all"
                    style={{fontWeight: 500, fontSize: '13px', minWidth: 'auto', height: '32px', lineHeight: '1.2'} }
                    onClick={() => setShowAuth(true)}
                    aria-label="注册/登录"
                  >
                    注册/登录
                  </button>
                ) : (
                  <div className="dropdown dropdown-end ml-4">
                    <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                      <div className="w-8 rounded-full bg-[#aa96da] flex items-center justify-center text-white font-bold">
                        {user.email ? user.email[0].toUpperCase() : 'U'}
                      </div>
                    </label>
                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40 mt-2">
                      <li className="px-2 py-1 text-sm text-gray-700">{user.email}</li>
                      <li><button className="btn btn-sm btn-error w-full" onClick={() => { setUser(null); localStorage.removeItem('taskManager_user'); }}>退出登录</button></li>
                    </ul>
                  </div>
                )}
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4" style={{paddingTop: '32px', paddingBottom: '32px'}}>
          {activeTab === 'daily' && (
            <div className="max-w-4xl mx-auto">
              <DailyTasks
                selectedDate={selectedDate || formatLocalDate(new Date())}
                tasks={tasks}
                onTaskUpdate={handleTaskEdit}
                customCategories={customCategories}
              />
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="max-w-6xl mx-auto">
              <div style={{display: 'flex', gap: '24px'}}>
                <div style={{width: '400px', flexShrink: 0}}>
                  <TaskForm 
                    onTaskCreate={handleTaskCreate} 
                    isProcessing={isProcessing}
                    customCategories={customCategories}
                    onAddCategory={(name, icon) => {
                      const newCategory = {
                        id: Date.now().toString(),
                        name: name,
                        icon: icon,
                        color: '#aa96da'
                      };
                      const updatedCategories = [...customCategories, newCategory];
                      setCustomCategories(updatedCategories);
                      localStorage.setItem('taskManager_customCategories', JSON.stringify(updatedCategories));
                    }}
                    onDeleteCategory={deleteCustomCategory}
                  />
                </div>
                <div style={{flex: 1}}>
                  <div className="card" style={{flex: 1}}>
                    <div style={{display: 'flex', justifyContent: 'center'}}>
                      <h1 className="title-serif title-serif-large mb-4">任务列表</h1>
                    </div>
                    {tasks.filter(task => task.status === '已分配').length === 0 ? (
                      <div className="text-center" style={{padding: '32px 16px'}}>
                        <div className="icon-clock text-3xl mb-3" style={{color: '#6c757d'}}></div>
                        <p style={{color: '#6c757d', margin: 0}}>暂无任务</p>
                      </div>
                    ) : (
                      <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                        {tasks
                          .filter(task => task.status !== '已完成')
                          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                          .map((task, taskIndex) => (
                          <div key={task.objectId} className="card" style={{padding: '12px', border: '1px solid #ffc107'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                              <div style={{flex: 1}}>
                                  <h4 style={{fontSize: '14px', fontWeight: '500', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                  <span className="oval-label-task" style={{marginRight: '8px'}}>{taskIndex + 1}</span>
                                    {task.editingTitle ? (
                                      <input
                                        type="text"
                                        value={task.title}
                                        autoFocus
                                        onChange={e => handleTaskEdit(task.objectId, { title: e.target.value })}
                                        onBlur={() => handleTaskEdit(task.objectId, { editingTitle: false })}
                                        onKeyDown={e => { if (e.key === 'Enter') handleTaskEdit(task.objectId, { editingTitle: false }); }}
                                        style={{fontSize: '14px', fontWeight: '500', border: '1px solid #ccc', borderRadius: '4px', padding: '2px 6px', minWidth: '80px'}}
                                      />
                                    ) : (
                                      <>
                                  {task.title}
                                        <button
                                          onClick={e => { e.stopPropagation(); handleTaskEdit(task.objectId, { editingTitle: true }); }}
                                          style={{marginLeft: '8px', width: '20px', height: '20px', borderRadius: '50%', border: 'none', backgroundColor: '#f8f9fa', color: '#6c757d', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px'}}
                                          aria-label="编辑任务标题"
                                        >✏️</button>
                                      </>
                                    )}
                                </h4>
                                  <span style={{fontSize: '12px', color: '#6c757d', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                    {(() => {
                                      const categoryColor = getCategoryColor(task.category);
                                      const icon = getCategoryIcon(task.category);
                                      
                                      // 根据背景色计算文字颜色，确保足够的对比度
                                      const getTextColor = (bgColor) => {
                                        // 将十六进制颜色转换为RGB
                                        const hex = bgColor.replace('#', '');
                                        const r = parseInt(hex.substr(0, 2), 16);
                                        const g = parseInt(hex.substr(2, 2), 16);
                                        const b = parseInt(hex.substr(4, 2), 16);
                                        
                                        // 计算亮度
                                        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                                        
                                        // 如果背景色较亮，使用深色文字；否则使用白色文字
                                        return brightness > 128 ? '#333333' : 'white';
                                      };
                                      
                                      const textColor = getTextColor(categoryColor);
                                      
                                      return (
                                    <div style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '0.2em',
                                      width: '50.4px',
                                      height: '23px',
                                      fontSize: '12px',
                                      fontWeight: '500',
                                          color: textColor,
                                      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                      transition: 'all 0.2s ease',
                                          backgroundColor: categoryColor,
                                          borderRadius: '8px'
                                        }}>
                                          <i className={`fas fa-${icon}`} style={{color: textColor, fontSize: '9px'}}></i>
                                          <span>{task.category}</span>
                                    </div>
                                      );
                                    })()}
                                    • 截止: 
                                    {task.editingDeadline ? (
                                      <input
                                        type="date"
                                        value={task.deadline}
                                        autoFocus
                                        onChange={e => handleTaskEdit(task.objectId, { deadline: e.target.value })}
                                        onBlur={() => handleTaskEdit(task.objectId, { editingDeadline: false })}
                                        onKeyDown={e => { if (e.key === 'Enter') handleTaskEdit(task.objectId, { editingDeadline: false }); }}
                                        style={{fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', padding: '2px 6px'}}
                                      />
                                    ) : (
                                      <>
                                        <span>{safeToLocaleDateString(task.deadline) || '无截止时间'}</span>
                                        <button
                                          onClick={e => { e.stopPropagation(); handleTaskEdit(task.objectId, { editingDeadline: true }); }}
                                          style={{marginLeft: '4px', width: '20px', height: '20px', borderRadius: '50%', border: 'none', backgroundColor: '#f8f9fa', color: '#6c757d', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px'}}
                                          aria-label="编辑截止时间"
                                        >✏️</button>
                                      </>
                                    )}
                                </span>
                                {task.subtasks && task.subtasks.length > 0 && (
                                  <div style={{marginTop: '8px'}}>
                                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px'}}>
                                      <p style={{fontSize: '12px', fontWeight: '500', margin: 0}}>子任务:</p>
                                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                        {editingNewSubtask && editingTaskId === task.objectId ? (
                                          // 编辑状态：显示输入框
                                          <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            transform: 'scale(1)',
                                            opacity: 1,
                                            transition: 'all 0.2s ease'
                                          }}>
                                            <input
                                              type="text"
                                              value={newSubtaskName}
                                              onChange={(e) => setNewSubtaskName(e.target.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter' && newSubtaskName.trim()) {
                                                  addSubtask(task.objectId);
                                                } else if (e.key === 'Escape') {
                                                  cancelEdit();
                                                }
                                              }}
                                              onBlur={() => {
                                                if (newSubtaskName.trim()) {
                                                  addSubtask(task.objectId);
                                                } else {
                                                  cancelEdit();
                                                }
                                              }}
                                              autoFocus
                                              placeholder="输入子任务名称..."
                                              style={{
                                                fontSize: '11px',
                                                border: '1px solid #aa96da',
                                                borderRadius: '4px',
                                                padding: '2px 6px',
                                                width: '140px',
                                                outline: 'none',
                                                backgroundColor: 'white',
                                                boxShadow: '0 2px 4px rgba(170, 150, 218, 0.2)'
                                              }}
                                            />
                                            <button
                                              onClick={() => addSubtask(task.objectId)}
                                              style={{
                                                background: '#aa96da',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '2px 8px',
                                                fontSize: '11px',
                                                cursor: 'pointer',
                                                fontWeight: '500'
                                              }}
                                            >
                                              添加
                                            </button>
                                            <button
                                              onClick={cancelEdit}
                                              style={{
                                                background: 'none',
                                                color: '#6c757d',
                                                border: '1px solid #6c757d',
                                                borderRadius: '4px',
                                                padding: '2px 8px',
                                                fontSize: '11px',
                                                cursor: 'pointer'
                                              }}
                                            >
                                              取消
                                            </button>
                                          </div>
                                        ) : (
                                          // 非编辑状态：显示"+"按钮
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                              startEditSubtask(task.objectId);
                                        }}
                                            style={{
                                              width: '26px',
                                              height: '26px',
                                              borderRadius: '50%',
                                              background: '#00C8FF',
                                              border: 'none',
                                              color: 'white',
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              transition: 'all 0.2s ease'
                                            }}
                                      >
                                        <div className="icon-plus text-xs"></div>
                                      </button>
                                        )}
                                    </div>
                                    </div>
                                    {task.subtasks && Array.isArray(task.subtasks) && task.subtasks.map((subtask, index) => {
                                      const circledNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
                                      const isObj = typeof subtask === 'object' && subtask !== null;
                                      const name = isObj ? subtask.name : subtask;
                                      const date = isObj ? subtask.date : task.deadline;
                                      const isEditing = isObj && subtask.editing;
                                      const isDragging = draggedSubtask && draggedSubtask.taskId === task.objectId && draggedSubtask.subtaskIndex === index;
                                      const isDragOver = dragOverIndex === index;
                                      return (
                                        <div 
                                          key={index} 
                                          draggable={!isEditing}
                                          onDragStart={(e) => handleDragStart(e, task.objectId, index)}
                                          onDragOver={(e) => handleDragOver(e, index)}
                                          onDragLeave={handleDragLeave}
                                          onDrop={(e) => handleDrop(e, task.objectId, index)}
                                          onDragEnd={handleDragEnd}
                                          style={{
                                            fontSize: '11px', 
                                            color: '#6c757d', 
                                            marginLeft: '8px', 
                                            marginBottom: '2px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '4px', 
                                            flexWrap: 'wrap',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            cursor: isEditing ? 'default' : 'grab',
                                            backgroundColor: isDragging ? '#f8f9fa' : isDragOver ? '#e9ecef' : 'transparent',
                                            border: isDragOver ? '2px dashed #aa96da' : '1px solid transparent',
                                            opacity: isDragging ? 0.5 : 1,
                                            transition: 'all 0.2s ease',
                                            transform: isDragging ? 'rotate(2deg)' : 'none'
                                          }}
                                        >
                                          <span style={{fontWeight: '500', color: '#495057'}}>{circledNumbers[index] || `⑩+${index-9}`}</span>
                                          {!isEditing && (
                                            <div 
                                              style={{
                                                width: '12px',
                                                height: '12px',
                                                cursor: 'grab',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#6c757d',
                                                fontSize: '8px'
                                              }}
                                              title="拖拽排序"
                                            >
                                              ⋮⋮
                                            </div>
                                          )}
                                            {isEditing ? (
                                              <>
                                                <input
                                                  type="text"
                                                value={name}
                                                  autoFocus
                                                  onChange={e => {
                                                    const updated = [...task.subtasks];
                                                  updated[index] = { ...(isObj ? subtask : {}), name: e.target.value };
                                                    handleTaskEdit(task.objectId, { subtasks: updated });
                                                  }}
                                                  style={{fontSize: '11px', border: '1px solid #ccc', borderRadius: '4px', padding: '2px 6px', minWidth: '60px', marginRight: '4px'}}
                                                />
                                                <input
                                                  type="date"
                                                value={date}
                                                  onChange={e => {
                                                    const updated = [...task.subtasks];
                                                  updated[index] = { ...(isObj ? subtask : {}), date: e.target.value };
                                                    handleTaskEdit(task.objectId, { subtasks: updated });
                                                  }}
                                                  style={{fontSize: '11px', border: '1px solid #ccc', borderRadius: '4px', padding: '2px 6px', marginLeft: '4px'}}
                                                />
                                                <button
                                                  onClick={() => {
                                                    const updated = [...task.subtasks];
                                                  updated[index] = { ...(isObj ? subtask : {}), editing: false };
                                                    handleTaskEdit(task.objectId, { subtasks: updated });
                                                  }}
                                                  style={{background: '#aa96da', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 8px', marginLeft: '4px', fontSize: '11px', cursor: 'pointer'}}
                                                >保存</button>
                                              </>
                                            ) : (
                                              <>
                                              <span style={{flex: 1, wordBreak: 'break-all', whiteSpace: 'pre-line'}}>{name}</span>
                                                <span
                                                  style={{color: '#6c757d', minWidth: '70px', cursor: 'pointer'}}
                                                  onClick={e => {
                                                    e.stopPropagation();
                                                    const updated = [...task.subtasks];
                                                  updated[index] = { ...(isObj ? subtask : {}), editing: true };
                                                    handleTaskEdit(task.objectId, { subtasks: updated });
                                                  }}
                                                  tabIndex={0}
                                                >
                                                {safeToLocaleDateString(date || task.deadline)}
                                          </span>
                                          <button
                                                  onClick={e => {
                                              e.stopPropagation();
                                                    const updated = [...task.subtasks];
                                                  updated[index] = { ...(isObj ? subtask : {}), editing: true };
                                                    handleTaskEdit(task.objectId, { subtasks: updated });
                                                  }}
                                                  style={{background: '#fff', border: '1px solid #aa96da', color: '#aa96da', borderRadius: '50%', width: '16px', height: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginRight: '4px', transition: 'background 0.2s, color 0.2s', fontSize: '8px'}}
                                                  aria-label="编辑子任务"
                                                  tabIndex={0}
                                                  onMouseOver={e => { e.currentTarget.style.background = '#aa96da'; e.currentTarget.style.color = '#fff'; }}
                                                  onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#aa96da'; }}
                                                >
                                                  <span style={{fontSize: '8px'}}>✏️</span>
                                          </button>
                                              </>
                                            )}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const updatedSubtasks = task.subtasks.filter((_, i) => i !== index);
                                              if (updatedSubtasks.length === 0) {
                                                handleTaskDelete(task.objectId);
                                              } else {
                                                handleTaskEdit(task.objectId, { subtasks: updatedSubtasks });
                                              }
                                            }}
                                            style={{background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', padding: '2px'}}
                                              aria-label="删除子任务"
                                          >
                                            <div className="icon-x text-xs"></div>
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('确定要删除整个任务吗？')) {
                                    handleTaskDelete(task.objectId);
                                  }
                                }}
                                style={{background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', padding: '4px 8px'}}
                              >
                                <div className="icon-trash text-xs"></div>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <div style={{flex: '1 1 0%', minWidth: '320px', maxWidth: '420px'}}>
                <div style={{position: 'relative'}}>
                  <Calendar
                    tasks={tasks}
                    selectedDate={selectedDate}
                    onDateSelect={(date) => {
                      setSelectedDate(date);
                      setShowAllTasks(false);
                    }}
                  />
                  <div style={{textAlign: 'center', marginTop: '16px'}}>
                    <button
                      onClick={() => setShowAllTasks(!showAllTasks)}
                      style={{
                        background: '#aa96da',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        margin: '0 auto'
                      }}
                    >
                      <div className="icon-list text-sm"></div>
                      所有任务
                    </button>
                  </div>
                </div>
              </div>
              <div style={{flex: '1 1 0%', minWidth: '340px', maxWidth: '820px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                {!showAllTasks ? (
                  <div className="card" style={{flex: 1, width: '100%', maxWidth: '700px', margin: '0 auto'}}>
                    <DateHeader date={selectedDate} />
                    {(() => {
                      const dateTasks = tasks.filter(task => {
                        const dateStr = selectedDate;
                        if (task.scheduledDate === dateStr) return true;
                        if (task.subtasks && task.subtasks.some(subtask => typeof subtask === 'object' && subtask.date === dateStr)) return true;
                        if (task.deadline === dateStr) return true;
                        return false;
                      });
                      if (dateTasks.length === 0) {
                        return (
                          <div className="text-center" style={{padding: '32px 16px'}}>
                            <div className="icon-clock text-3xl mb-3" style={{color: '#6c757d'}}></div>
                            <p style={{color: '#6c757d', margin: 0}}>该日期无任务</p>
                          </div>
                        );
                      }
                      return (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                          {dateTasks
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                            .map((task, taskIndex) => (
                              <div key={task.objectId} className="card" style={{padding: '12px', border: '1px solid #ffc107'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                                  <div style={{flex: 1}}>
                                    <h4 style={{fontSize: '14px', fontWeight: '500', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                      <span className="oval-label-task" style={{marginRight: '8px'}}>{taskIndex + 1}</span>
                                      {task.editingTitle ? (
                                        <input
                                          type="text"
                                          value={task.title}
                                          autoFocus
                                          onChange={e => handleTaskEdit(task.objectId, { title: e.target.value })}
                                          onBlur={() => handleTaskEdit(task.objectId, { editingTitle: false })}
                                          onKeyDown={e => { if (e.key === 'Enter') handleTaskEdit(task.objectId, { editingTitle: false }); }}
                                          style={{fontSize: '14px', fontWeight: '500', border: '1px solid #ccc', borderRadius: '4px', padding: '2px 6px', minWidth: '80px'}}
                                        />
                                      ) : (
                                        <>
                                          {task.title}
                                          <button
                                            onClick={e => { e.stopPropagation(); handleTaskEdit(task.objectId, { editingTitle: true }); }}
                                            style={{marginLeft: '8px', width: '20px', height: '20px', borderRadius: '50%', border: 'none', backgroundColor: '#f8f9fa', color: '#6c757d', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px'}}
                                            aria-label="编辑任务标题"
                                          >✏️</button>
                                        </>
                                      )}
                                    </h4>
                                    <span style={{fontSize: '12px', color: '#6c757d', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                      <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.2em',
                                        width: '50.4px',
                                        height: '23px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        color: 'white',
                                        fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                        transition: 'all 0.2s ease',
                                        ...(() => {
                                          const color = getCategoryColor(task.category);
                                          return { backgroundColor: color, borderRadius: '8px' };
                                        })()
                                      }}>
                                        {(() => {
                                          const icon = getCategoryIcon(task.category);
                                          return <><i className={`fas fa-${icon}`} style={{color: 'white', fontSize: '9px'}}></i><span>{task.category}</span></>;
                                        })()}
                                      </div>
                                      • 截止: 
                                      {task.editingDeadline ? (
                                        <input
                                          type="date"
                                          value={task.deadline}
                                          autoFocus
                                          onChange={e => handleTaskEdit(task.objectId, { deadline: e.target.value })}
                                          onBlur={() => handleTaskEdit(task.objectId, { editingDeadline: false })}
                                          onKeyDown={e => { if (e.key === 'Enter') handleTaskEdit(task.objectId, { editingDeadline: false }); }}
                                          style={{fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', padding: '2px 6px'}}
                                        />
                                      ) : (
                                        <>
                                          <span>{safeToLocaleDateString(task.deadline) || '无截止时间'}</span>
                                          <button
                                            onClick={e => { e.stopPropagation(); handleTaskEdit(task.objectId, { editingDeadline: true }); }}
                                            style={{marginLeft: '4px', width: '20px', height: '20px', borderRadius: '50%', border: 'none', backgroundColor: '#f8f9fa', color: '#6c757d', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px'}}
                                            aria-label="编辑截止时间"
                                          >✏️</button>
                                        </>
                                      )}
                                    </span>
                                    {task.subtasks && task.subtasks.length > 0 && (
                                      <div style={{marginTop: '8px'}}>
                                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px'}}>
                                          <p style={{fontSize: '12px', fontWeight: '500', margin: 0}}>子任务:</p>
                                          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                            {editingNewSubtask && editingTaskId === task.objectId ? (
                                              // 编辑状态：显示输入框
                                              <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                transform: 'scale(1)',
                                                opacity: 1,
                                                transition: 'all 0.2s ease'
                                              }}>
                                                <input
                                                  type="text"
                                                  value={newSubtaskName}
                                                  onChange={(e) => setNewSubtaskName(e.target.value)}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && newSubtaskName.trim()) {
                                                      addSubtask(task.objectId);
                                                    } else if (e.key === 'Escape') {
                                                      cancelEdit();
                                                    }
                                                  }}
                                                  onBlur={() => {
                                                    if (newSubtaskName.trim()) {
                                                      addSubtask(task.objectId);
                                                    } else {
                                                      cancelEdit();
                                                    }
                                                  }}
                                                  autoFocus
                                                  placeholder="输入子任务名称..."
                                                  style={{
                                                    fontSize: '11px',
                                                    border: '1px solid #aa96da',
                                                    borderRadius: '4px',
                                                    padding: '2px 6px',
                                                    width: '140px',
                                                    outline: 'none',
                                                    backgroundColor: 'white',
                                                    boxShadow: '0 2px 4px rgba(170, 150, 218, 0.2)'
                                                  }}
                                                />
                                                <button
                                                  onClick={() => addSubtask(task.objectId)}
                                                  style={{
                                                    background: '#aa96da',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '2px 8px',
                                                    fontSize: '11px',
                                                    cursor: 'pointer',
                                                    fontWeight: '500'
                                                  }}
                                                >
                                                  添加
                                                </button>
                                                <button
                                                  onClick={cancelEdit}
                                                  style={{
                                                    background: 'none',
                                                    color: '#6c757d',
                                                    border: '1px solid #6c757d',
                                                    borderRadius: '4px',
                                                    padding: '2px 8px',
                                                    fontSize: '11px',
                                                    cursor: 'pointer'
                                                  }}
                                                >
                                                  取消
                                                </button>
                                              </div>
                                            ) : (
                                              // 非编辑状态：显示"+"按钮
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                                  startEditSubtask(task.objectId);
                                            }}
                                                style={{
                                                  width: '26px',
                                                  height: '26px',
                                                  borderRadius: '50%',
                                                  background: '#00C8FF',
                                                  border: 'none',
                                                  color: 'white',
                                                  cursor: 'pointer',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  transition: 'all 0.2s ease'
                                                }}
                                          >
                                            <div className="icon-plus text-xs"></div>
                                          </button>
                                            )}
                                          </div>
                                        </div>
                                        {task.subtasks.filter(subtask => typeof subtask === 'object' && subtask.date === selectedDate).map((subtask, index) => {
                                          const circledNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
                                          const isEditing = subtask.editing;
                                          const isDragging = draggedSubtask && draggedSubtask.taskId === task.objectId && draggedSubtask.subtaskIndex === index;
                                          const isDragOver = dragOverIndex === index;
                                          return (
                                            <div 
                                              key={index} 
                                              draggable={!isEditing}
                                              onDragStart={(e) => handleDragStart(e, task.objectId, index)}
                                              onDragOver={(e) => handleDragOver(e, index)}
                                              onDragLeave={handleDragLeave}
                                              onDrop={(e) => handleDrop(e, task.objectId, index)}
                                              onDragEnd={handleDragEnd}
                                              style={{
                                                fontSize: '11px', 
                                                color: '#6c757d', 
                                                marginLeft: '8px', 
                                                marginBottom: '2px', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '4px', 
                                                flexWrap: 'wrap',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                cursor: isEditing ? 'default' : 'grab',
                                                backgroundColor: isDragging ? '#f8f9fa' : isDragOver ? '#e9ecef' : 'transparent',
                                                border: isDragOver ? '2px dashed #aa96da' : '1px solid transparent',
                                                opacity: isDragging ? 0.5 : 1,
                                                transition: 'all 0.2s ease',
                                                transform: isDragging ? 'rotate(2deg)' : 'none'
                                              }}
                                            >
                                              <span style={{fontWeight: '500', color: '#495057'}}>{circledNumbers[index] || `⑩+${index-9}`}</span>
                                              {!isEditing && (
                                                <div 
                                                  style={{
                                                    width: '12px',
                                                    height: '12px',
                                                    cursor: 'grab',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#6c757d',
                                                    fontSize: '8px'
                                                  }}
                                                  title="拖拽排序"
                                                >
                                                  ⋮⋮
                                                </div>
                                              )}
                                              {isEditing ? (
                                                <>
                                                  <input
                                                    type="text"
                                                    value={subtask.name}
                                                    autoFocus
                                                    onChange={e => {
                                                      const updated = [...task.subtasks];
                                                      updated[index] = { ...subtask, name: e.target.value };
                                                      handleTaskEdit(task.objectId, { subtasks: updated });
                                                    }}
                                                    style={{fontSize: '11px', border: '1px solid #ccc', borderRadius: '4px', padding: '2px 6px', minWidth: '60px', marginRight: '4px'}}
                                                  />
                                                  <input
                                                    type="date"
                                                    value={subtask.date || task.deadline}
                                                    onChange={e => {
                                                      const updated = [...task.subtasks];
                                                      updated[index] = { ...subtask, date: e.target.value };
                                                      handleTaskEdit(task.objectId, { subtasks: updated });
                                                    }}
                                                    style={{fontSize: '11px', border: '1px solid #ccc', borderRadius: '4px', padding: '2px 6px', marginLeft: '4px'}}
                                                  />
                                                  <button
                                                    onClick={() => {
                                                      const updated = [...task.subtasks];
                                                      updated[index] = { ...subtask, editing: false };
                                                      handleTaskEdit(task.objectId, { subtasks: updated });
                                                    }}
                                                    style={{background: '#aa96da', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 8px', marginLeft: '4px', fontSize: '11px', cursor: 'pointer'}}
                                                  >保存</button>
                                                </>
                                              ) : (
                                                <>
                                                  <span style={{flex: 1, wordBreak: 'break-all', whiteSpace: 'pre-line'}}>{typeof subtask === 'object' ? subtask.name : subtask}</span>
                                                  <span
                                                    style={{color: '#6c757d', minWidth: '70px', cursor: 'pointer'}}
                                                    onClick={e => {
                                                      e.stopPropagation();
                                                      const updated = [...task.subtasks];
                                                      updated[index] = { ...subtask, editing: true };
                                                      handleTaskEdit(task.objectId, { subtasks: updated });
                                                    }}
                                                    tabIndex={0}
                                                  >
                                                    {safeToLocaleDateString(subtask.date || task.deadline)}
                                                  </span>
                                                  <button
                                                    onClick={e => {
                                                      e.stopPropagation();
                                                      const updated = [...task.subtasks];
                                                      updated[index] = { ...subtask, editing: true };
                                                      handleTaskEdit(task.objectId, { subtasks: updated });
                                                    }}
                                                    style={{background: '#fff', border: '1px solid #aa96da', color: '#aa96da', borderRadius: '50%', width: '16px', height: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginRight: '4px', transition: 'background 0.2s, color 0.2s', fontSize: '8px'}}
                                                    aria-label="编辑子任务"
                                                    tabIndex={0}
                                                    onMouseOver={e => { e.currentTarget.style.background = '#aa96da'; e.currentTarget.style.color = '#fff'; }}
                                                    onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#aa96da'; }}
                                                  >
                                                    <span style={{fontSize: '8px'}}>✏️</span>
                                                  </button>
                                                </>
                                              )}
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const updatedSubtasks = task.subtasks.filter((_, i) => i !== index);
                                                  if (updatedSubtasks.length === 0) {
                                                    handleTaskDelete(task.objectId);
                                                  } else {
                                                    handleTaskEdit(task.objectId, { subtasks: updatedSubtasks });
                                                  }
                                                }}
                                                style={{background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', padding: '2px'}}
                                                aria-label="删除子任务"
                                              >
                                                <div className="icon-x text-xs"></div>
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm('确定要删除整个任务吗？')) {
                                        handleTaskDelete(task.objectId);
                                      }
                                    }}
                                    style={{background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', padding: '4px 8px'}}
                                  >
                                    <div className="icon-trash text-xs"></div>
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="card" style={{flex: 1, width: '100%', maxWidth: '700px', margin: '0 auto'}}>
                    <div style={{display: 'flex', justifyContent: 'center'}}>
                      <h1 className="title-serif title-serif-large mb-4">所有任务</h1>
                    </div>
                    {tasks.length === 0 ? (
                      <div className="text-center" style={{padding: '32px 16px'}}>
                        <div className="icon-clock text-3xl mb-3" style={{color: '#6c757d'}}></div>
                        <p style={{color: '#6c757d', margin: 0}}>暂无任务</p>
                      </div>
                    ) : (
                      <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                        {(() => {
                          // 按类别分组
                          const groupedTasks = {};
                          tasks.forEach(task => {
                            if (!groupedTasks[task.category]) {
                              groupedTasks[task.category] = [];
                            }
                            groupedTasks[task.category].push(task);
                          });

                          // 对每个类别内的任务进行排序
                          Object.keys(groupedTasks).forEach(category => {
                            groupedTasks[category].sort((a, b) => {
                              // 首先按状态排序：进行中 > 已完成
                              const statusOrder = { '进行中': 1, '已完成': 2 };
                              const statusDiff = (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3);
                              if (statusDiff !== 0) return statusDiff;
                              
                              // 同状态按截止时间排序：早的在前
                              return new Date(a.deadline) - new Date(b.deadline);
                            });
                          });

                          return Object.keys(groupedTasks).map(category => {
                            const categoryTasks = groupedTasks[category];
                            return (
                              <div key={category}>
                                <div style={{display: 'flex', alignItems: 'center', marginBottom: '12px'}}>
                                  <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.2em',
                                    width: '50.4px',
                                    height: '23px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    color: 'white',
                                    fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    transition: 'all 0.2s ease',
                                    marginRight: '8px',
                                    ...(() => {
                                      const color = getCategoryColor(category);
                                      return { backgroundColor: color, borderRadius: '8px' };
                                    })()
                                  }}>
                                    {(() => {
                                      const icon = getCategoryIcon(category);
                                      return <><i className={`fas fa-${icon}`} style={{color: 'white', fontSize: '9px'}}></i><span>{category}</span></>;
                                    })()}
                                  </div>
                                </div>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                  {/* 列标题 */}
                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '60px 1fr 120px 80px',
                                    gap: '12px',
                                    padding: '8px 12px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: '#495057'
                                  }}>
                                    <div>序号</div>
                                    <div>任务</div>
                                    <div>截止时间</div>
                                    <div>状态</div>
                                  </div>
                                  {/* 任务内容 */}
                                  {categoryTasks.map((task, taskIndex) => (
                                    <div 
                                      key={task.objectId} 
                                      className="card" 
                                      style={{
                                        padding: '12px', 
                                        border: '1px solid #ffc107',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                      }}
                                      onClick={() => {
                                        // 切换子任务显示状态
                                        const updatedTask = { ...task, showSubtasks: !task.showSubtasks };
                                        handleTaskEdit(task.objectId, updatedTask);
                                      }}
                                      onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f8f9fa'; }}
                                      onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                      <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '60px 1fr 120px 80px',
                                        gap: '12px',
                                        alignItems: 'center',
                                        fontSize: '14px'
                                      }}>
                                        <div style={{fontWeight: '500'}}>{taskIndex + 1}</div>
                                        <div style={{fontWeight: '500'}}>{task.title}</div>
                                        <div style={{color: '#6c757d', fontSize: '12px'}}>
                                          {safeToLocaleDateString(task.deadline)}
                                        </div>
                                        {(() => {
                                          const now = new Date();
                                          const hasSubtasks = Array.isArray(task.subtasks) && task.subtasks.length > 0;
                                          // 修正：没有子任务时直接视为已完成
                                          if (!task.subtasks || task.subtasks.length === 0) {
                                            return <span style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              fontWeight: 600,
                                              fontSize: '11px',
                                              color: '#10B981',
                                              lineHeight: 1,
                                              userSelect: 'none',
                                              background: 'none',
                                              border: 'none',
                                              padding: 0
                                            }}>
                                              <i className="fa-regular fa-circle-check" style={{fontSize: '13px', color: '#10B981'}}></i>已完成
                                            </span>;
                                          } else if (hasSubtasks && now <= new Date(task.deadline)) {
                                            return <span style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              fontWeight: 600,
                                              fontSize: '11px',
                                              color: '#3B82F6',
                                              lineHeight: 1,
                                              userSelect: 'none',
                                              background: 'none',
                                              border: 'none',
                                              padding: 0
                                            }}>
                                              <i className="fa-regular fa-clock" style={{fontSize: '13px', color: '#3B82F6'}}></i>进行中
                                            </span>;
                                          } else if (hasSubtasks && now > new Date(task.deadline)) {
                                            return <span style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              fontWeight: 600,
                                              fontSize: '11px',
                                              color: '#EF4444',
                                              lineHeight: 1,
                                              userSelect: 'none',
                                              background: 'none',
                                              border: 'none',
                                              padding: 0
                                            }}>
                                              <i className="fa-regular fa-circle-xmark" style={{fontSize: '13px', color: '#EF4444'}}></i>未完成
                                            </span>;
                                          } else {
                                            return null;
                                          }
                                        })()}
                                      </div>
                                      {task.subtasks && task.subtasks.length > 0 && task.showSubtasks && (
                                        <div style={{marginTop: '8px'}}>
                                          <div style={{display: 'flex', alignItems: 'center', marginBottom: '4px'}}>
                                            <p style={{fontSize: '12px', fontWeight: '500', margin: 0}}>子任务:</p>
                                          </div>
                                          {task.subtasks.map((subtask, index) => {
                                            const circledNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
                                            return (
                                              <div key={index} style={{fontSize: '11px', color: '#6c757d', marginLeft: '8px', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap'}}>
                                                <span style={{fontWeight: '500', color: '#495057'}}>{circledNumbers[index] || `⑩+${index-9}`}</span>
                                                <span style={{flex: 1, wordBreak: 'break-all', whiteSpace: 'pre-line'}}>{typeof subtask === 'object' ? subtask.name : subtask}</span>
                                                <span style={{color: '#6c757d', minWidth: '70px'}}>
                                                  {safeToLocaleDateString(subtask.date || task.deadline)}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
        {/* 注册/登录弹窗 */}
        <AuthModal open={showAuth} onClose={()=>setShowAuth(false)} onAuthSuccess={user=>{setUser(user); setShowAuth(false);}} />
      </div>
    );
  } catch (error) {
    console.error('App component error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

/**
 * 日期头部组件，渲染规范化日期文本及分隔线
 * @param {Object} props
 * @param {string} props.date - YYYY-MM-DD格式
 */
function DateHeader({ date }) {
  // 格式化为"2024 年 5 月 15 日 星期三"
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekDay = '日一二三四五六'.charAt(d.getDay());
  // 构造分色分字号结构
  return (
    <div style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', marginBottom: '16px'}}>
      <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
        <span style={{fontFamily: 'HanaMinA, 华康海报体, sans-serif', fontSize: '20px', color: '#333333', lineHeight: '1'}}>{year}</span>
        <span style={{fontFamily: 'HanaMinA, 华康海报体, sans-serif', fontSize: '16px', color: '#666666', margin: '0 2px', lineHeight: '1'}}> 年 </span>
        <span style={{fontFamily: 'HanaMinA, 华康海报体, sans-serif', fontSize: '20px', color: '#333333', lineHeight: '1'}}>{month}</span>
        <span style={{fontFamily: 'HanaMinA, 华康海报体, sans-serif', fontSize: '16px', color: '#666666', margin: '0 2px', lineHeight: '1'}}> 月 </span>
        <span style={{fontFamily: 'HanaMinA, 华康海报体, sans-serif', fontSize: '20px', color: '#333333', lineHeight: '1'}}>{day}</span>
        <span style={{fontFamily: 'HanaMinA, 华康海报体, sans-serif', fontSize: '16px', color: '#666666', margin: '0 2px', lineHeight: '1'}}> 日 </span>
        <span style={{fontFamily: 'HanaMinA, 华康海报体, sans-serif', fontSize: '16px', color: '#666666', marginLeft: '4px', lineHeight: '1'}}>星期{weekDay}</span>
      </div>
      <div style={{height: '1px', background: '#E5E7EB', width: 'fit-content', minWidth: '120px', marginTop: '8px', alignSelf: 'center'}}>
        <div style={{width: '100%', height: '1px', background: '#E5E7EB'}}></div>
      </div>
    </div>
  );
}
