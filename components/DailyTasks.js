function DailyTasks({ selectedDate, tasks, onTaskUpdate, customCategories = [] }) {
  try {
    const getTodayTasks = () => {
      if (!selectedDate) return [];
      return tasks.filter(task => {
        // 严格检查任务的计划日期
        if (task.scheduledDate === selectedDate) return true;
        // 严格检查子任务的日期，确保日期完全匹配
        if (task.subtasks && task.subtasks.some(subtask => {
          const subtaskDate = typeof subtask === 'object' && subtask.date ? subtask.date : null;
          return subtaskDate === selectedDate;
        })) return true;
        // 严格检查截止日期
        if (task.deadline === selectedDate) return true;
        return false;
      }).sort((a, b) => {
        // 先按时间排序，再按类别排序
        const timeA = new Date(a.deadline || a.createdAt);
        const timeB = new Date(b.deadline || b.createdAt);
        if (timeA.getTime() !== timeB.getTime()) {
          return timeA - timeB;
        }
        return a.category.localeCompare(b.category);
      });
    };

    const todayTasks = getTodayTasks();
    const completedTasks = todayTasks.filter(task => task.status === '已完成');
    const pendingTasks = todayTasks.filter(task => task.status !== '已完成');

    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (date.toDateString() === today.toDateString()) {
        return '今天';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return '明天';
      } else {
        return `${date.getMonth() + 1}月${date.getDate()}日`;
      }
    };

    const handleTaskComplete = async (taskId) => {
      await onTaskUpdate(taskId, { status: '已完成' });
    };

    const handleSubtaskToggle = async (taskId, subtaskIndex) => {
      const task = tasks.find(t => t.objectId === taskId);
      if (!task || !task.subtasks) return;
      
      const updatedSubtasks = [...task.subtasks];
      if (typeof updatedSubtasks[subtaskIndex] === 'string') {
        updatedSubtasks[subtaskIndex] = {
          name: updatedSubtasks[subtaskIndex],
          completed: true,
          date: selectedDate,
          estimatedTime: 60
        };
      } else {
        updatedSubtasks[subtaskIndex] = {
          ...updatedSubtasks[subtaskIndex],
          completed: !updatedSubtasks[subtaskIndex].completed
        };
      }
      
      await onTaskUpdate(taskId, { subtasks: updatedSubtasks });
    };

    return (
      <div className="card" data-name="dailyTasks" data-file="components/DailyTasks.js">
        <div className="text-center mb-6">
          <h1 className="title-serif title-serif-large mb-4">今日任务清单</h1>
          <div className="text-sm text-gray-500 mt-2">
            {todayTasks.length - pendingTasks.length} 已完成 / {todayTasks.length} 总计
          </div>
        </div>

        {todayTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="icon-calendar-x text-4xl mb-2 mx-auto"></div>
            <p>该日期无任务</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-4">
              <DailyTaskModule
                title="工作"
                icon="briefcase"
                tasks={pendingTasks.filter(task => task.category === '工作')}
                onTaskUpdate={onTaskUpdate}
                allTasks={tasks}
                selectedDate={selectedDate}
                editable={false}
              />
              <DailyTaskModule
                title="学习"
                icon="book"
                tasks={pendingTasks.filter(task => task.category === '学习')}
                onTaskUpdate={onTaskUpdate}
                allTasks={tasks}
                selectedDate={selectedDate}
                editable={false}
              />
              <DailyTaskModule
                title="生活"
                icon="home"
                tasks={pendingTasks.filter(task => task.category === '生活')}
                onTaskUpdate={onTaskUpdate}
                allTasks={tasks}
                selectedDate={selectedDate}
                editable={false}
              />
              <DailyTaskModule
                title="健康"
                icon="heart"
                tasks={pendingTasks.filter(task => task.category === '健康')}
                onTaskUpdate={onTaskUpdate}
                allTasks={tasks}
                selectedDate={selectedDate}
                editable={false}
              />
              {/* 动态渲染自定义类别 */}
              {customCategories.map(customCat => (
                <DailyTaskModule
                  key={customCat.id}
                  title={customCat.name}
                  icon={customCat.icon}
                  tasks={pendingTasks.filter(task => task.category === customCat.name)}
                  onTaskUpdate={onTaskUpdate}
                  allTasks={tasks}
                  selectedDate={selectedDate}
                  editable={false}
                />
              ))}
            </div>

            {completedTasks.length > 0 && (
              <div className="mt-6">
                <div className="text-center mb-3">
                  <div className="oval-label-completed">已完成</div>
                </div>
                <div className="space-y-2">
                  {completedTasks.map((task, index) => (
                    <div key={task.objectId} className="border rounded-lg p-3 bg-green-50 opacity-75">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="oval-label-task" style={{marginRight: '8px'}}>{index + 1}</span>
                          <div className="icon-check-circle text-green-600 mr-2"></div>
                          <h5 className="font-medium text-gray-800" style={{fontSize: '15px', fontWeight: '400'}}>
                            {task.title}
                          </h5>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <button 
            className="w-full text-sm text-blue-600 text-center flex items-center justify-center hover:text-blue-800"
            onClick={() => {
              if (document.fullscreenEnabled) {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(err => {
                    alert('无法进入全屏模式: ' + err.message);
                  });
                } else {
                  document.exitFullscreen();
                }
              } else {
                alert('您的浏览器不支持全屏功能');
              }
            }}
          >
            <div className="icon-monitor text-sm mr-1"></div>
            设为屏保
          </button>
        </div>
      </div>
    );
  } catch (error) {
    console.error('DailyTasks component error:', error);
    return null;
  }
}