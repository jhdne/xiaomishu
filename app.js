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

function App() {
  try {
    const [tasks, setTasks] = React.useState([]);
    const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState('daily');
    const [showAllTasks, setShowAllTasks] = React.useState(false);

    React.useEffect(() => {
      loadTasks();
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
        if (taskData.useAI) {
          const newTask = await trickleCreateObject('task', {
            ...taskData,
            status: '已分配',
            createdAt: new Date().toISOString()
          });

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
              date: assignedDate.toISOString().split('T')[0],
              completed: false,
              priority: index + 1,
              originalText: subtask,
              estimatedTime: 60,
              workload: 'medium'
            };
          });
          console.log('最终用于存储的 processedSubtasks:', processedSubtasks);
          
          await trickleUpdateObject('task', newTask.objectId, {
            ...taskData,
            status: '已分配',
            subtasks: processedSubtasks,
            taskType: decomposition.type || '一次性任务',
            complexity: decomposition.complexity || '简单',
            scheduledDate: processedSubtasks[0]?.date || taskData.deadline
          });
        } else {
          await trickleCreateObject('task', {
            ...taskData,
            status: '已分配',
            createdAt: new Date().toISOString()
          });
        }

        await loadTasks();
      } catch (error) {
        console.error('创建任务失败:', error);
        alert('创建任务失败，请重试');
      } finally {
        setIsProcessing(false);
      }
    };

    const handleTaskEdit = async (taskId, updatedData) => {
      try {
        await trickleUpdateObject('task', taskId, updatedData);
        await loadTasks();
      } catch (error) {
        console.error('更新任务失败:', error);
      }
    };

    const handleTaskDelete = async (taskId) => {
      try {
        await trickleDeleteObject('task', taskId);
        await loadTasks();
      } catch (error) {
        console.error('删除任务失败:', error);
      }
    };

    const handleStatusChange = async (taskId, newStatus) => {
      try {
        await trickleUpdateObject('task', taskId, { status: newStatus });
        await loadTasks();
      } catch (error) {
        console.error('更新状态失败:', error);
      }
    };

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
              <nav className="flex" style={{gap: '8px'}}>
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
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4" style={{paddingTop: '32px', paddingBottom: '32px'}}>
          {activeTab === 'daily' && (
            <div className="max-w-4xl mx-auto">
              <DailyTasks
                selectedDate={new Date().toISOString().split('T')[0]}
                tasks={tasks}
                onTaskUpdate={handleTaskEdit}
              />
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="max-w-6xl mx-auto">
              <div style={{display: 'flex', gap: '24px'}}>
                <div style={{width: '400px', flexShrink: 0}}>
                  <TaskForm onTaskCreate={handleTaskCreate} isProcessing={isProcessing} />
                </div>
                <div style={{flex: 1}}>
                  <div className="card" style={{flex: 1}}>
                    <div className="oval-label-large" style={{marginBottom: '16px'}}>任务列表</div>
                    {tasks.filter(task => task.status === '已分配').length === 0 ? (
                      <div className="text-center" style={{padding: '32px 16px'}}>
                        <div className="icon-clock text-3xl mb-3" style={{color: '#6c757d'}}></div>
                        <p style={{color: '#6c757d', margin: 0}}>暂无任务</p>
                      </div>
                    ) : (
                      <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                        {tasks.filter(task => task.status !== '已完成').sort((a, b) => {
                          // 按添加时间排序
                          return new Date(a.createdAt) - new Date(b.createdAt);
                        }).map((task, taskIndex) => (
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
                                        style={{background: 'none', border: 'none', color: '#aa96da', cursor: 'pointer', padding: '2px'}}
                                        aria-label="编辑任务标题"
                                      >
                                        <div className="icon-edit text-xs"></div>
                                      </button>
                                    </>
                                  )}
                                </h4>
                                <span style={{fontSize: '12px', color: '#6c757d', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                  {task.category} • 截止: 
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
                                      <span>{new Date(task.deadline).toLocaleDateString()}</span>
                                      <button
                                        onClick={e => { e.stopPropagation(); handleTaskEdit(task.objectId, { editingDeadline: true }); }}
                                        style={{background: 'none', border: 'none', color: '#aa96da', cursor: 'pointer', padding: '2px'}}
                                        aria-label="编辑截止时间"
                                      >
                                        <div className="icon-edit text-xs"></div>
                                      </button>
                                    </>
                                  )}
                                </span>
                                {task.subtasks && task.subtasks.length > 0 && (
                                  <div style={{marginTop: '8px'}}>
                                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px'}}>
                                      <p style={{fontSize: '12px', fontWeight: '500', margin: 0}}>子任务:</p>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newSubtaskName = prompt('添加新子任务:');
                                          if (newSubtaskName && newSubtaskName.trim()) {
                                            const newSubtask = {
                                              name: newSubtaskName.trim(),
                                              completed: false,
                                              priority: task.subtasks.length + 1,
                                              originalText: newSubtaskName.trim()
                                            };
                                            handleTaskEdit(task.objectId, { subtasks: [...task.subtasks, newSubtask] });
                                          }
                                        }}
                                        style={{width: '26px', height: '26px', borderRadius: '50%', background: '#00C8FF', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                                      >
                                        <div className="icon-plus text-xs"></div>
                                      </button>
                                    </div>
                                    {task.subtasks.map((subtask, index) => {
                                      const circledNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
                                      // 新增编辑状态分离
                                      const isEditingName = subtask.editingName;
                                      const isEditingDate = subtask.editingDate;
                                      return (
                                        <div key={index} style={{fontSize: '11px', color: '#6c757d', marginLeft: '8px', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap'}}>
                                          <span style={{fontWeight: '500', color: '#495057'}}>{circledNumbers[index] || `⑩+${index-9}`}</span>
                                          {isEditingName ? (
                                            <input
                                              type="text"
                                              value={subtask.name}
                                              autoFocus
                                              onChange={e => {
                                                const updated = [...task.subtasks];
                                                updated[index] = { ...subtask, name: e.target.value };
                                                handleTaskEdit(task.objectId, { subtasks: updated });
                                              }}
                                              onBlur={() => {
                                                const updated = [...task.subtasks];
                                                updated[index] = { ...subtask, editingName: false };
                                                handleTaskEdit(task.objectId, { subtasks: updated });
                                              }}
                                              onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                  const updated = [...task.subtasks];
                                                  updated[index] = { ...subtask, editingName: false };
                                                  handleTaskEdit(task.objectId, { subtasks: updated });
                                                }
                                              }}
                                              style={{fontSize: '11px', border: '1px solid #ccc', borderRadius: '4px', padding: '2px 6px', minWidth: '60px', marginRight: '4px'}}
                                            />
                                          ) : (
                                            <span style={{flex: 1, wordBreak: 'break-all', whiteSpace: 'pre-line'}}>{subtask.name}</span>
                                          )}
                                          {isEditingDate ? (
                                            <input
                                              type="date"
                                              value={subtask.date || task.deadline}
                                              autoFocus
                                              onChange={e => {
                                                const updated = [...task.subtasks];
                                                updated[index] = { ...subtask, date: e.target.value };
                                                handleTaskEdit(task.objectId, { subtasks: updated });
                                              }}
                                              onBlur={() => {
                                                const updated = [...task.subtasks];
                                                updated[index] = { ...subtask, editingDate: false };
                                                handleTaskEdit(task.objectId, { subtasks: updated });
                                              }}
                                              onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                  const updated = [...task.subtasks];
                                                  updated[index] = { ...subtask, editingDate: false };
                                                  handleTaskEdit(task.objectId, { subtasks: updated });
                                                }
                                              }}
                                              style={{fontSize: '11px', border: '1px solid #ccc', borderRadius: '4px', padding: '2px 6px', marginLeft: '4px'}}
                                            />
                                          ) : (
                                            <span
                                              style={{color: '#6c757d', minWidth: '70px', cursor: 'pointer'}}
                                              onClick={e => {
                                                e.stopPropagation();
                                                const updated = [...task.subtasks];
                                                updated[index] = { ...subtask, editingDate: true };
                                                handleTaskEdit(task.objectId, { subtasks: updated });
                                              }}
                                              tabIndex={0}
                                            >
                                              {subtask.date ? new Date(subtask.date).toLocaleDateString() : new Date(task.deadline).toLocaleDateString()}
                                            </span>
                                          )}
                                          <button
                                            onClick={e => {
                                              e.stopPropagation();
                                              const updated = [...task.subtasks];
                                              updated[index] = { ...subtask, editingName: true };
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
            <div style={{display: 'flex', gap: '24px', alignItems: 'flex-start'}}>
              <div style={{width: '36%', minWidth: '320px'}}>
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
              <div style={{flex: 1, minWidth: '300px'}}>
                {!showAllTasks ? (
                  <DailyTasks
                    selectedDate={selectedDate}
                    tasks={tasks}
                    onTaskUpdate={handleTaskEdit}
                  />
                ) : (
                  <div className={`card task-panel ${showAllTasks ? 'visible' : 'hidden'}`}>
                    <div className="oval-label-all-tasks" style={{marginBottom: '16px'}}>所有任务</div>
                    <div style={{maxHeight: '500px', overflow: 'auto'}}>
                      {['工作', '学习', '生活', '健康', '其他'].map(category => {
                        const categoryTasks = tasks.filter(task => task.category === category).sort((a, b) => {
                          // 先按时间排序
                          const timeA = new Date(a.deadline || a.createdAt);
                          const timeB = new Date(b.deadline || b.createdAt);
                          return timeA - timeB;
                        });
                        if (categoryTasks.length === 0) return null;
                        
                        const inProgressTasks = categoryTasks.filter(task => task.status !== '已完成').sort((a, b) => new Date(a.deadline || a.createdAt) - new Date(b.deadline || b.createdAt));
                        const completedTasks = categoryTasks.filter(task => task.status === '已完成').sort((a, b) => new Date(a.deadline || a.createdAt) - new Date(b.deadline || b.createdAt));
                        const allCategoryTasks = [...inProgressTasks, ...completedTasks];
                        
                        return (
                          <div key={category} style={{marginBottom: '20px'}}>
                            <div className="oval-label-category" style={{marginBottom: '8px'}}>
                              {category}
                            </div>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                              {allCategoryTasks.map((task, index) => (
                                <React.Fragment key={task.objectId}>
                                  <div 
                                    style={{
                                      padding: '8px 12px',
                                      border: '1px solid #e9ecef',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      cursor: 'pointer',
                                      transition: 'all 200ms ease'
                                    }}
                                    onClick={() => {
                                      const isExpanded = task.showDetails;
                                      handleTaskEdit(task.objectId, { showDetails: !isExpanded });
                                    }}
                                    onMouseOver={(e) => {
                                      e.target.style.backgroundColor = '#f8f9fa';
                                    }}
                                    onMouseOut={(e) => {
                                      e.target.style.backgroundColor = 'white';
                                    }}
                                  >
                                    <span style={{color: '#6c757d', minWidth: '20px'}}>{index + 1}</span>
                                    <span style={{color: '#6c757d'}}>|</span>
                                    <span style={{color: '#495057', minWidth: '40px'}}>{task.category}</span>
                                    <span style={{color: '#6c757d'}}>|</span>
                                    <span style={{flex: 1, color: '#212529', fontWeight: '500'}}>{task.title}</span>
                                    <span style={{color: '#6c757d'}}>|</span>
                                    <span style={{color: '#6c757d', minWidth: '80px'}}>{new Date(task.deadline).toLocaleDateString()}</span>
                                    <span style={{color: '#6c757d'}}>|</span>
                                    <span style={{
                                      fontSize: '10px',
                                      padding: '2px 6px',
                                      borderRadius: '10px',
                                      color: 'white',
                                      background: task.status === '待分配' ? '#FFC82C' : task.status === '已完成' ? '#22C55E' : '#00C8FF'
                                    }}>
                                      {task.status === '待分配' ? '待安排' : task.status === '已完成' ? '已完成' : '进行中'}
                                    </span>
                                  </div>
                                  {task.showDetails && (
                                    <div style={{
                                      marginTop: '8px',
                                      padding: '12px',
                                      border: '1px solid #e9ecef',
                                      borderRadius: '4px',
                                      backgroundColor: '#f8f9fa',
                                      fontSize: '12px'
                                    }}>
                                      <p style={{margin: '0 0 8px 0', color: '#495057'}}><strong>描述：</strong>{task.description}</p>
                                      {task.subtasks && task.subtasks.length > 0 && (
                                        <div>
                                          <p style={{margin: '0 0 4px 0', color: '#495057'}}><strong>子任务：</strong></p>
                                          {task.subtasks.map((subtask, idx) => (
                                            <div key={idx} style={{marginLeft: '16px', color: '#6c757d', marginBottom: '2px'}}>
                                              • {typeof subtask === 'string' ? subtask : subtask.name}
                                              {typeof subtask === 'object' && subtask.date && (
                                                <span style={{color: '#007bff', marginLeft: '8px'}}>
                                                  ({new Date(subtask.date).toLocaleDateString()})
                                                </span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
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