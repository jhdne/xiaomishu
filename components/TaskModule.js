function TaskModule({ title, tasks, onEdit, onDelete, onStatusChange, icon }) {
  try {
    if (tasks.length === 0) return null;

    return (
      <div className="mb-6" data-name="taskModule" data-file="components/TaskModule.js">
        <div className="text-center mb-4">
          <div className="flex items-center justify-center">
            <div className={`icon-${icon} text-xl mr-2`}></div>
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <span className="ml-2 text-sm text-gray-500">({tasks.length})</span>
          </div>
        </div>
        <div className="space-y-3">
          {tasks.map(task => (
            <TaskCard
              key={task.objectId}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('TaskModule component error:', error);
    return null;
  }
}