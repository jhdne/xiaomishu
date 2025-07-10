function Calendar({ tasks, selectedDate, onDateSelect }) {
  try {
    const [currentMonth, setCurrentMonth] = React.useState(new Date());
    
    const getDaysInMonth = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();
      
      const days = [];
      
      // 添加上个月的末尾日期
      for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const prevDate = new Date(year, month, -i);
        days.push({ date: prevDate, isCurrentMonth: false });
      }
      
      // 添加当月日期
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        days.push({ date, isCurrentMonth: true });
      }
      
      return days;
    };

    const getTasksForDate = (date) => {
      const dateStr = formatLocalDate(date);
      return tasks.filter(task => {
        // 严格检查任务的计划日期
        if (task.scheduledDate === dateStr) return true;
        // 严格检查子任务的日期，确保日期完全匹配
        if (task.subtasks && task.subtasks.some(subtask => {
          const subtaskDate = typeof subtask === 'object' && subtask.date ? subtask.date : null;
          return subtaskDate === dateStr;
        })) return true;
        // 严格检查截止日期
        if (task.deadline === dateStr) return true;
        return false;
      });
    };

    const navigateMonth = (direction) => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
    };

    const days = getDaysInMonth(currentMonth);
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    // 工具函数：本地日期转YYYY-MM-DD字符串
    function formatLocalDate(date) {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return (
      <div className="card" data-name="calendar" data-file="components/Calendar.js">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-gray-100 rounded">
            <div className="icon-chevron-left text-lg"></div>
          </button>
          <h2 className="text-lg font-semibold">
            {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
          </h2>
          <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-gray-100 rounded">
            <div className="icon-chevron-right text-lg"></div>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map(({ date, isCurrentMonth }, index) => {
            const tasksForDay = getTasksForDate(date);
            const isSelected = selectedDate === formatLocalDate(date);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <button
                key={index}
                onClick={() => {
                  if (isCurrentMonth) {
                    const dateStr = formatLocalDate(date);
                    onDateSelect(dateStr);
                  }
                }}
                className={`
                  relative p-2 text-sm min-h-[2.5rem] border rounded
                  ${isCurrentMonth ? 'text-gray-900 cursor-pointer' : 'text-gray-400 cursor-default'}
                  ${isSelected ? 'bg-blue-500 text-white' : isCurrentMonth ? 'hover:bg-gray-100' : ''}
                  ${isToday && !isSelected ? 'bg-blue-100 text-blue-600' : ''}
                `}
              >
                <div>{date.getDate()}</div>
                {tasksForDay.length > 0 && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Calendar component error:', error);
    return null;
  }
}