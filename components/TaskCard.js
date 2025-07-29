function TaskCard({ task, onEdit, onDelete, onStatusChange, editable = true }) {
  try {
    const getCategoryLabel = (category) => {
      const categoryMap = {
        '工作': 'work',
        '生活': 'life',
        '学习': 'study',
        '健康': 'health',
        '其他': 'other'
      };
      return categoryMap[category] || 'other';
    };

    const getCategoryImage = (category) => {
      const imageMap = {
        '工作': '工作',
        '生活': '生活',
        '学习': '学习',
        '健康': '健康',
        '其他': '其它'
      };
      return imageMap[category] || '其它';
    };

    return (
      <div className="card" data-name="taskCard" data-file="components/TaskCard.js" style={{borderLeft: `4px solid var(--brand-color)`}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px'}}>
          <h3 style={{fontSize: '16px', fontWeight: '400', margin: 0}}>{task.title}
            <button onClick={() => onEdit(task.objectId, { editingTitle: true })} style={{marginLeft: '8px', width: '20px', height: '20px', borderRadius: '50%', border: 'none', backgroundColor: '#f8f9fa', color: '#6c757d', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px'}} aria-label="编辑任务标题">✏️</button>
          </h3>
          <button 
            onClick={() => onDelete(task.objectId)} 
            style={{background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', padding: '4px'}}
          >
            <div className="icon-trash text-sm"></div>
          </button>
        </div>
        
        <div style={{marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center'}}>
          <span style={{
            display: 'inline-block',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            background: 'var(--primary-bg)',
            color: 'var(--primary-text)'
          }}>
            {new Date(task.deadline).toLocaleDateString()}
          </span>
          <span className={`category-label category-label-${getCategoryLabel(task.category)}`}>
            <div className="category-label-icon" style={{
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
                switch (task.category) {
                  case '工作':
                    return { backgroundColor: '#3B82F6', borderRadius: '8px' };
                  case '生活':
                    return { backgroundColor: '#FFA500', borderRadius: '20px' };
                  case '健康':
                    return { backgroundColor: '#10B981', borderRadius: '8px' };
                  case '学习':
                    return { backgroundColor: '#00B4D8', borderRadius: '20px' };
                  default:
                    return { backgroundColor: '#808080', borderRadius: '8px' };
                }
              })()
            }}>
              {(() => {
                switch (task.category) {
                  case '工作':
                    return <><i className="fas fa-cog" style={{color: 'white', fontSize: '9px'}}></i><span>工作</span></>;
                  case '生活':
                    return <><i className="fas fa-home" style={{color: 'white', fontSize: '9px'}}></i><span>生活</span></>;
                  case '健康':
                    return <><i className="fas fa-running" style={{color: 'white', fontSize: '9px'}}></i><span>健康</span></>;
                  case '学习':
                    return <><i className="fas fa-book" style={{color: 'white', fontSize: '9px'}}></i><span>学习</span></>;
                  default:
                    return <><i className="fas fa-question" style={{color: 'white', fontSize: '9px'}}></i><span>其它</span></>;
                }
              })()}
            </div>
            <div style={{ 
              fontFamily: '"Source Han Sans", "思源黑体", sans-serif', 
              color: '#333333', 
              fontSize: '14px',
              marginLeft: '0.5em'
            }}>
              {task.subtasks ? task.subtasks.filter(st => st.completed).length : 0} / {task.subtasks ? task.subtasks.length : 0}
            </div>
          </span>
        </div>

        <div style={{marginTop: '12px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
            <p style={{fontSize: '14px', fontWeight: '500', margin: 0}}>子步骤:</p>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              {task.showAddSubtask && (
                <>
                  <input
                    type="text"
                    placeholder="请添加子任务"
                    style={{
                      width: '160px',
                      padding: '4px 10px',
                      border: '1.5px solid #aa96da',
                      borderRadius: '6px',
                      fontSize: '13px',
                      outline: 'none',
                      marginRight: '4px',
                      transition: 'border-color 0.2s',
                      boxShadow: '0 1px 3px rgba(170,150,218,0.07)',
                    }}
                    autoFocus
                    value={task._addSubtaskInputValue || ''}
                    onChange={e => onEdit(task.objectId, { _addSubtaskInputValue: e.target.value })}
                    onFocus={e => e.target.style.borderColor = '#3498db'}
                    onBlur={e => e.target.style.borderColor = '#aa96da'}
                    aria-label="请输入子任务内容"
                  />
                  <button
                    onClick={() => {
                      const value = task._addSubtaskInputValue?.trim();
                      if (value) {
                        const newSubtask = {
                          name: value,
                          date: task.deadline,
                          completed: false,
                          originalText: value
                        };
                        onEdit(task.objectId, {
                          subtasks: [...(task.subtasks || []), newSubtask],
                          showAddSubtask: false,
                          _addSubtaskInputValue: ''
                        });
                      }
                    }}
                    style={{
                      padding: '2px 10px',
                      fontSize: '12px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginRight: '2px'
                    }}
                  >保存</button>
                  <button
                    onClick={() => onEdit(task.objectId, { showAddSubtask: false, _addSubtaskInputValue: '' })}
                    style={{
                      padding: '2px 10px',
                      fontSize: '12px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginRight: '2px'
                    }}
                  >关闭</button>
                </>
              )}
              <button
                onClick={() => onEdit(task.objectId, { showAddSubtask: !task.showAddSubtask, _addSubtaskInputValue: '' })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand-color)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                aria-label="添加子任务"
              >
                <div className="icon-plus text-sm"></div>
              </button>
            </div>
          </div>
          
          {task.subtasks && task.subtasks.length > 0 && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              {task.subtasks.map((subtask, index) => (
                <SubtaskItem
                  key={index}
                  subtask={subtask}
                  index={index}
                  taskId={task.objectId}
                  onEdit={onEdit}
                  task={task}
                  editable={editable}
                />
              ))}
            </div>
          )}
        </div>

        <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
          {task.status === '待分配' && (
            <button
              onClick={async () => {
                try {
                  const decomposition = await aiAgent.decomposeTask(task);
                  const schedule = await aiAgent.scheduleTask(task, decomposition);
                  
                  const processedSubtasks = schedule.schedule || decomposition.subtasks.map((subtask, index) => ({
                    name: subtask,
                    date: task.deadline,
                    completed: false,
                    priority: index + 1,
                    originalText: subtask
                  }));
                  
                  await onEdit(task.objectId, {
                    status: '已分配',
                    subtasks: processedSubtasks,
                    scheduledDate: processedSubtasks[0]?.date || task.deadline,
                    priority: processedSubtasks[0]?.priority || 3,
                    taskType: decomposition.type || '一次性任务',
                    complexity: decomposition.complexity || '简单'
                  });
                } catch (error) {
                  console.error('分配任务失败:', error);
                  alert('分配任务失败，请重试');
                }
              }}
              className="btn btn-primary"
              style={{flex: 1, background: '#fd7e14'}}
            >
              分配
            </button>
          )}
          
          {task.status !== '已完成' && task.status !== '待分配' && (
            <button
              onClick={() => onStatusChange(task.objectId, '已完成')}
              className="btn btn-primary"
              style={{flex: 1, background: '#198754'}}
            >
              标记为完成
            </button>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('TaskCard component error:', error);
    return null;
  }
}