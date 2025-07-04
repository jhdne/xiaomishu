function TaskCard({ task, onEdit, onDelete, onStatusChange, editable = true }) {
  try {
    const getCategoryColor = (category) => {
      const colors = {
        '工作': 'bg-blue-100 text-blue-800',
        '生活': 'bg-green-100 text-green-800',
        '学习': 'bg-purple-100 text-purple-800',
        '健康': 'bg-red-100 text-red-800',
        '其他': 'bg-gray-100 text-gray-800'
      };
      return colors[category] || colors['其他'];
    };

    return (
      <div className="card" data-name="taskCard" data-file="components/TaskCard.js" style={{borderLeft: `4px solid var(--brand-color)`}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px'}}>
          <h3 style={{fontSize: '14px', fontWeight: '500', margin: 0}}>{task.title}
            <button onClick={() => onEdit(task.objectId, { editingTitle: true })} style={{marginLeft: '8px', width: '20px', height: '20px', borderRadius: '50%', border: 'none', backgroundColor: '#f8f9fa', color: '#6c757d', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px'}} aria-label="编辑任务标题">✏️</button>
          </h3>
          <button 
            onClick={() => onDelete(task.objectId)} 
            style={{background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', padding: '4px'}}
          >
            <div className="icon-trash text-sm"></div>
          </button>
        </div>
        
        <div style={{marginBottom: '12px'}}>
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
        </div>

        {task.subtasks && task.subtasks.length > 0 && (
          <div style={{marginTop: '12px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
              <p style={{fontSize: '14px', fontWeight: '500', margin: 0}}>子步骤:</p>
              <button
                onClick={() => {
                  const newSubtask = {
                    name: '新子任务',
                    date: task.deadline,
                    completed: false,
                    originalText: '新子任务'
                  };
                  onEdit(task.objectId, {
                    subtasks: [...task.subtasks, newSubtask]
                  });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand-color)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <div className="icon-plus text-sm"></div>
              </button>
            </div>
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
          </div>
        )}

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