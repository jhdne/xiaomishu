function DailyTaskModule({ title, tasks, onTaskUpdate, icon, allTasks }) {
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
                        {task.subtasks.slice(0, 3).map((subtask, subtaskIndex) => {
                          const circledNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
                          return (
                            <div key={subtaskIndex} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <div className="flex items-center">
                                <button 
                                  onClick={() => handleSubtaskToggle(task.objectId, subtaskIndex)}
                                  className="mr-2"
                                >
                                  <div className={`icon-${subtask.completed ? 'check-circle' : 'circle'} text-sm ${subtask.completed ? 'text-green-600' : 'text-gray-400'}`}></div>
                                </button>
                                <span className="text-xs text-gray-500 mr-2">{circledNumbers[subtaskIndex] || `⑩+${subtaskIndex-9}`}</span>
                                <span className={subtask.completed ? 'line-through text-gray-400' : ''}>
                                  {typeof subtask === 'string' ? subtask : subtask.name}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const currentSubtask = typeof subtask === 'string' ? subtask : subtask.name;
                                  const currentDate = typeof subtask === 'object' && subtask.date ? subtask.date : task.deadline;
                                  
                                  const newSubtaskName = prompt('编辑子任务内容:', currentSubtask);
                                  if (newSubtaskName && newSubtaskName.trim()) {
                                    const newDate = prompt('编辑执行日期(YYYY-MM-DD):', currentDate);
                                    if (newDate && newDate.trim()) {
                                      const updatedSubtasks = [...task.subtasks];
                                      if (typeof updatedSubtasks[subtaskIndex] === 'string') {
                                        updatedSubtasks[subtaskIndex] = {
                                          name: newSubtaskName.trim(),
                                          date: newDate.trim(),
                                          completed: false,
                                          priority: subtaskIndex + 1,
                                          originalText: newSubtaskName.trim()
                                        };
                                      } else {
                                        updatedSubtasks[subtaskIndex] = {
                                          ...updatedSubtasks[subtaskIndex], 
                                          name: newSubtaskName.trim(),
                                          date: newDate.trim()
                                        };
                                      }
                                      onTaskUpdate(task.objectId, { subtasks: updatedSubtasks });
                                    }
                                  }
                                }}
                                style={{background: 'none', border: 'none', color: '#aa96da', cursor: 'pointer', padding: '2px'}}
                              >
                                <div className="icon-edit text-xs"></div>
                              </button>
                            </div>
                          );
                        })}
                        {task.subtasks.length > 3 && (
                          <div className="text-gray-400">还有 {task.subtasks.length - 3} 个子任务...</div>
                        )}
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
