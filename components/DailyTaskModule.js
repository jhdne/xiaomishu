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
          <div className="oval-label-category">
            <div className={`icon-${icon} text-sm mr-2`} style={{display: 'inline-block'}}></div>
            {title}
            <span className="ml-2">({tasks.length})</span>
          </div>
        </div>
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div key={task.objectId} className="border rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-800">
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
                              <span style={{fontSize: '16px', marginRight: '8px'}}>{isCompleted ? '✔️' : '□'}</span>
                              <span style={{fontSize: '13px', color: isCompleted ? '#bbb' : '#495057', textDecoration: isCompleted ? 'line-through' : 'none'}}>
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
