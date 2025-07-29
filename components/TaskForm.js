function TaskForm({ onTaskCreate, isProcessing }) {
  try {
    const [formData, setFormData] = React.useState({
      description: '',
      category: '工作',
      startDate: '',
      endDate: ''
    });

    const categories = ['工作', '生活', '学习', '健康', '其他'];

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!formData.description || !formData.startDate || !formData.endDate) {
        alert('请填写完整的任务信息');
        return;
      }
      
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        alert('开始时间不能晚于结束时间');
        return;
      }
      
      // 自动生成标题（取描述的前20个字符）
      const autoTitle = formData.description.length > 20 
        ? formData.description.substring(0, 20) + '...' 
        : formData.description;
      
      await onTaskCreate({
        ...formData,
        title: autoTitle,
        deadline: formData.endDate,
        useAI: true // 默认使用AI拆解
      });
      
      setFormData({
        description: '',
        category: '工作',
        startDate: '',
        endDate: ''
      });
    };

    return (
      <div className="card" data-name="taskForm" data-file="components/TaskForm.js" style={{marginBottom: '24px'}}>
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <h1 className="title-serif title-serif-large mb-4">新任务</h1>
        </div>
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
          <div>
            <label style={{display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#34495e'}}>任务描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="input"
              style={{width: '100%', minHeight: '80px', resize: 'vertical'}}
              placeholder="详细描述任务内容..."
            />
          </div>

          <div style={{display: 'flex', gap: '16px'}}>
            <div style={{flex: '1'}}>
              <label style={{display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#34495e'}}>任务类别</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="input"
                style={{width: '50%'}}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#34495e'}}>时间范围</label>
            <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="input"
                style={{flex: 1}}
                min={new Date().toISOString().split('T')[0]}
              />
              <span style={{color: '#7f8c8d', fontWeight: '500'}}>至</span>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="input"
                style={{flex: 1}}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            style={{
              width: '100%',
              height: '48px',
              background: isProcessing ? '#bdc3c7' : '#aa96da',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 300ms ease',
              boxShadow: isProcessing ? 'none' : '0 4px 15px rgba(170, 150, 218, 0.3)'
            }}
            onMouseOver={(e) => {
              if (!isProcessing) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(52, 152, 219, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (!isProcessing) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(52, 152, 219, 0.3)';
              }
            }}
          >
            {isProcessing ? (
              <>
                <div className="icon-loader-2 text-lg animate-spin"></div>
                AI拆解中...
              </>
            ) : (
              <>
                <div className="icon-zap text-lg"></div>
                AI拆解优化
              </>
            )}
          </button>
        </form>
      </div>
    );
  } catch (error) {
    console.error('TaskForm component error:', error);
    return null;
  }
}
