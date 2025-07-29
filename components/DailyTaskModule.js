function DailyTaskModule({ title, tasks, onTaskUpdate, icon, allTasks, selectedDate, editable }) {
  try {
    if (tasks.length === 0) return null;

    const handleTaskComplete = async (taskId) => {
      await onTaskUpdate(taskId, { status: '已完成' });
    };

    const handleSubtaskToggle = async (taskId, subtaskIndex) => {
      const task = allTasks.find(t => t.objectId === taskId);
      if (!task || !task.subtasks) return;
      
      const updatedSubtasks = [...task.subtasks];
      updatedSubtasks[subtaskIndex] = {
        ...updatedSubtasks[subtaskIndex],
        completed: !updatedSubtasks[subtaskIndex].completed
      };
      
      await onTaskUpdate(taskId, { subtasks: updatedSubtasks });
    };

    const handleEditSubtask = async (taskId, subtaskIndex) => {
      const task = allTasks.find(t => t.objectId === taskId);
      if (!task || !task.subtasks) return;
      
      const subtask = task.subtasks[subtaskIndex];
      const currentName = typeof subtask === 'object' ? subtask.name : subtask;
      const newName = prompt('编辑子任务内容:', currentName);
      
      if (newName && newName.trim()) {
        const updatedSubtasks = [...task.subtasks];
        if (typeof updatedSubtasks[subtaskIndex] === 'string') {
          updatedSubtasks[subtaskIndex] = {
            name: newName.trim(),
            date: selectedDate,
            completed: false,
            priority: subtaskIndex + 1,
            originalText: newName.trim()
          };
        } else {
          updatedSubtasks[subtaskIndex] = {
            ...updatedSubtasks[subtaskIndex],
            name: newName.trim()
          };
        }
        await onTaskUpdate(taskId, { subtasks: updatedSubtasks });
      }
    };

    const handleEditSubtaskTime = async (taskId, subtaskIndex) => {
      const task = allTasks.find(t => t.objectId === taskId);
      if (!task || !task.subtasks) return;
      
      const subtask = task.subtasks[subtaskIndex];
      const currentDate = typeof subtask === 'object' && subtask.date ? subtask.date : selectedDate;
      const newDate = prompt('编辑执行日期(YYYY-MM-DD):', currentDate);
      
      if (newDate && newDate.trim()) {
        const updatedSubtasks = [...task.subtasks];
        if (typeof updatedSubtasks[subtaskIndex] === 'string') {
          updatedSubtasks[subtaskIndex] = {
            name: updatedSubtasks[subtaskIndex],
            date: newDate.trim(),
            completed: false,
            priority: subtaskIndex + 1,
            originalText: updatedSubtasks[subtaskIndex]
          };
        } else {
          updatedSubtasks[subtaskIndex] = {
            ...updatedSubtasks[subtaskIndex],
            date: newDate.trim()
          };
        }
        await onTaskUpdate(taskId, { subtasks: updatedSubtasks });
      }
    };

    const getFilteredSubtasks = (task) => {
      if (!task.subtasks || !selectedDate) return [];
      return task.subtasks.filter(subtask => {
        const subtaskDate = typeof subtask === 'object' && subtask.date ? subtask.date : null;
        return subtaskDate === selectedDate;
      });
    };

    return (
      <div className="mb-4" data-name="dailyTaskModule" data-file="components/DailyTaskModule.js">
        <div className="text-center mb-3">
          <span className={`category-label category-label-${title === '工作' ? 'work' : title === '生活' ? 'life' : title === '学习' ? 'study' : title === '健康' ? 'health' : 'other'}`}>
            {(() => {
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

              let backgroundColor, icon, textColor;
              
              switch (title) {
                case '工作':
                  backgroundColor = '#3B82F6';
                  icon = 'cog';
                  break;
                case '生活':
                  backgroundColor = '#FFA500';
                  icon = 'home';
                  break;
                case '健康':
                  backgroundColor = '#10B981';
                  icon = 'running';
                  break;
                case '学习':
                  backgroundColor = '#00B4D8';
                  icon = 'book';
                  break;
                default:
                  backgroundColor = '#808080';
                  icon = 'question';
                  break;
              }
              
              textColor = getTextColor(backgroundColor);
              
              return (
                <div className="category-label-icon" style={{
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
                  backgroundColor: backgroundColor,
                  borderRadius: title === '生活' || title === '学习' ? '20px' : '8px'
                }}>
                  <i className={`fas fa-${icon}`} style={{color: textColor, fontSize: '9px'}}></i>
                  <span>{title}</span>
                </div>
              );
            })()}
            <div style={{ 
              fontFamily: '"Source Han Sans", "思源黑体", sans-serif', 
              color: '#333333', 
              fontSize: '14px',
              marginLeft: '0.5em'
            }}>
              {tasks.filter(task => task.status === '已完成').length} / {tasks.length}
            </div>
          </span>
        </div>
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div key={task.objectId} className="border rounded-lg p-3 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-800" style={{fontSize: '15px', fontWeight: '400'}}>
                    <span className="oval-label-task" style={{marginRight: '8px'}}>{index + 1}</span>
                    {task.title}
                  </h5>
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-600 space-y-1">
                        {getFilteredSubtasks(task).map((subtask, subtaskIndex) => {
                          const circledNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
                          const isCompleted = typeof subtask === 'object' ? subtask.completed : false;
                          return (
                            <div key={subtaskIndex} className="subtask-item" style={{marginLeft: '20px', marginBottom: '8px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef', display: 'flex', alignItems: 'center', cursor: 'pointer'}} onClick={() => !editable && handleSubtaskToggle(task.objectId, subtaskIndex)}>
                              <span style={{fontSize: '16px', marginRight: '8px', color: isCompleted ? '#10B981' : '#ccc', display: 'flex', alignItems: 'center'}}>
                                {isCompleted
                                  ? <i className="fa-regular fa-circle-check" style={{fontWeight: 400}} aria-label="已完成"></i>
                                  : <i className="fa-regular fa-circle" aria-label="未完成"></i>
                                }
                              </span>
                              <span className={isCompleted ? 'subtask-deleted' : ''} style={{fontSize: '13px'}}>
                                {circledNumbers[subtaskIndex] || `⑩+${subtaskIndex-9}`}. {typeof subtask === 'object' ? subtask.name : subtask}
                              </span>
                              {editable && (
                                <>
                                  <button
                                    onClick={e => { e.stopPropagation(); handleEditSubtask(task.objectId, subtaskIndex); }}
                                    className="edit-subtask-btn"
                                    style={{marginLeft: '8px', width: '20px', height: '20px', borderRadius: '50%', border: 'none', backgroundColor: '#f8f9fa', color: '#6c757d', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', transition: 'all 0.2s ease'}}
                                    onMouseEnter={e => { e.target.style.backgroundColor = '#e9ecef'; e.target.style.color = '#495057'; }}
                                    onMouseLeave={e => { e.target.style.backgroundColor = '#f8f9fa'; e.target.style.color = '#6c757d'; }}
                                  >✏️</button>
                                  <button
                                    onClick={e => { e.stopPropagation(); handleDeleteSubtask(task.objectId, subtaskIndex); }}
                                    style={{marginLeft: '4px', width: '20px', height: '20px', borderRadius: '50%', border: 'none', backgroundColor: '#f8f9fa', color: '#dc3545', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'}}
                                  >×</button>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('DailyTaskModule component error:', error);
    return null;
  }
}

export default DailyTaskModule;