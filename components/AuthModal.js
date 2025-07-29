// AuthModal.js
// DaisyUI风格注册/登录弹窗组件

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AuthModal({ open, onClose, onAuthSuccess }) {
  const [tab, setTab] = React.useState('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTab('login'); setEmail(''); setPassword(''); setConfirm(''); setError('');
    }
  }, [open]);

  // 调试：渲染时输出open状态
  React.useEffect(() => {
    console.log('AuthModal rendered, open=', open);
  }, [open]);

  function validate() {
    if (!emailRegex.test(email)) return '请输入有效邮箱';
    if (password.length < 6) return '密码至少6位';
    if (tab === 'register' && password !== confirm) return '两次密码不一致';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    console.log('handleSubmit called', tab, email);
    const err = validate();
    if (err) return setError(err);
    setLoading(true);
    setError('');
    try {
      let res, data;
      if (tab === 'register') {
        res = await fetch('http://localhost:3000/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.message || '注册失败');
      } else {
        res = await fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.message || '登录失败');
      }
      // 成功，保存token和用户信息
      const user = data.user || { email };
      if (data.token) user.token = data.token;
      localStorage.setItem('taskManager_user', JSON.stringify(user));
      onAuthSuccess(user);
      onClose();
    } catch (e) {
      setError(e.message || '网络错误');
      console.error('fetch error', e);
      if (e instanceof TypeError) setError('无法连接服务器，请检查后端服务和CORS设置');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open ? (
        <div className="modal modal-open" style={{zIndex: 50}}>
          <div className="modal-box p-4 max-w-xs rounded-2xl shadow-xl" style={{minWidth: '320px'}}>
            <div className="tabs tabs-boxed mb-3 text-sm rounded-xl">
              <a className={`tab px-3 py-1.5 ${tab==='login'?'tab-active':''}`} style={{borderRadius: '10px'}} onClick={()=>setTab('login')}>登录</a>
              <a className={`tab px-3 py-1.5 ${tab==='register'?'tab-active':''}`} style={{borderRadius: '10px'}} onClick={()=>setTab('register')}>注册</a>
            </div>
            <form onSubmit={handleSubmit} className="space-y-2" autoComplete="off">
              <input type="email" className="input input-bordered w-full h-9 text-sm rounded-lg" placeholder="邮箱" autoFocus value={email} onChange={e=>setEmail(e.target.value)} required />
              <input type="password" className="input input-bordered w-full h-9 text-sm rounded-lg" placeholder="密码" value={password} onChange={e=>setPassword(e.target.value)} required />
              {tab==='register' && (
                <input type="password" className="input input-bordered w-full h-9 text-sm rounded-lg" placeholder="确认密码" value={confirm} onChange={e=>setConfirm(e.target.value)} required />
              )}
              {error && <div className="text-red-500 text-xs mb-1">{error}</div>}
              <button type="submit" className={`btn btn-primary w-full h-9 min-h-0 text-sm rounded-lg mt-1 ${loading?'loading':''}`} disabled={loading}>{tab==='login'?'登录':'注册'}</button>
            </form>
            <div className="mt-2 text-center text-xs text-gray-400">{tab==='login'? '没有账号？':'已有账号？'} <a className="link text-[#aa96da] font-medium" onClick={()=>setTab(tab==='login'?'register':'login')}>{tab==='login'?'注册':'登录'}</a></div>
            <div className="mt-3 text-center text-[11px] text-gray-300">仅为演示，未接入真实后端</div>
            <button className="btn btn-xs btn-circle btn-ghost absolute right-2 top-2 text-lg" style={{padding: '0 0.3rem'}} onClick={onClose} aria-label="关闭">✕</button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default AuthModal; 