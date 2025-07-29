function SubtaskItem({ subtask, index, taskId, onEdit, task, editable }) {
  try {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editData, setEditData] = React.useState({
      name: typeof subtask === 'string' ? subtask : subtask.name,
      date: subtask.date || task.deadline,
      originalText: subtask.originalText || (typeof subtask === 'string' ? subtask : subtask.name)
    });

    const handleSave = () => {
      const updatedSubtasks = [...task.subtasks];
      updatedSubtasks[index] = {
        ...subtask,
        name: editData.name,
        date: editData.date,
        originalText: editData.originalText
      };
      onEdit(taskId, { subtasks: updatedSubtasks });
      setIsEditing(false);
    };

    const handleDelete = () => {
      if (confirm('确定要删除这个子任务吗？')) {
        const updatedSubtasks = task.subtasks.filter((_, i) => i !== index);
        onEdit(taskId, { subtasks: updatedSubtasks });
      }
    };

    const handleToggleComplete = () => {
      const updatedSubtasks = [...task.subtasks];
      updatedSubtasks[index] = {
        ...subtask,
        completed: !subtask.completed
      };
      onEdit(taskId, { subtasks: updatedSubtasks });
    };

    return (
      <div className="text-sm bg-gray-50 p-2 rounded border">
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({...editData, name: e.target.value})}
              className="w-full px-2 py-1 text-xs border rounded"
              placeholder="子任务名称"
            />
            <input
              type="text"
              value={editData.originalText}
              onChange={(e) => setEditData({...editData, originalText: e.target.value})}
              className="w-full px-2 py-1 text-xs border rounded"
              placeholder="原文本描述"
            />
            <input
              type="date"
              value={editData.date}
              onChange={(e) => setEditData({...editData, date: e.target.value})}
              className="w-full px-2 py-1 text-xs border rounded"
            />
            <div className="flex space-x-1">
              <button onClick={handleSave} className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                保存
              </button>
              <button onClick={() => setIsEditing(false)} className="px-2 py-1 bg-gray-600 text-white text-xs rounded">
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <button onClick={handleToggleComplete} className="mr-2" aria-label={subtask.completed ? '标记为未完成' : '标记为已完成'} title={subtask.completed ? '标记为未完成' : '标记为已完成'}>
                {subtask.completed ? (
                  // 极简勾选圆SVG，线条细，尺寸小
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" className="text-green-600" style={{display:'block'}}>
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <polyline points="5.2,8.5 7.2,10.5 11,6.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  // 极简空心圆SVG，线条细，尺寸小
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" className="text-gray-400" style={{display:'block'}}>
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  </svg>
                )}
              </button>
              <span className="text-xs text-gray-500 mr-2">{index + 1}.</span>
              <span className={`flex-1 ${subtask.completed ? 'subtask-deleted' : 'text-gray-700'}`} style={{fontSize:'12px', textAlign:'left', fontWeight:400, display:'block'}} aria-label={typeof subtask === 'string' ? subtask : subtask.name} title={typeof subtask === 'string' ? subtask : subtask.name}>
                {typeof subtask === 'string' ? subtask : subtask.name}
              </span>
            </div>
            {editable && (
              <div className="flex items-center space-x-2">
                <div className="text-xs text-gray-500">
                  {subtask.date && <span>{new Date(subtask.date).toLocaleDateString()}</span>}
                </div>
                <button onClick={() => setIsEditing(true)} style={{color: '#FFC107', borderRadius: '50%', width: '20px', height: '20px', background: '#f8f9fa', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px'}} className="hover:opacity-80">
                  ✏️
                </button>
                <button onClick={handleDelete} className="text-red-600 hover:text-red-800" style={{borderRadius: '50%', width: '20px', height: '20px', background: '#f8f9fa', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'}}>
                  ×
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('SubtaskItem component error:', error);
    return null;
  }
}