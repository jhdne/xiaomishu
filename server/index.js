const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const USERS_FILE = path.join(__dirname, 'users.json');

app.use(cors());
app.use(express.json());

// 读取用户数据
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

// 写入用户数据
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// 注册接口
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: '邮箱和密码必填' });
  let users = readUsers();
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: '邮箱已注册' });
  }
  const user = { email, password };
  users.push(user);
  writeUsers(users);
  res.json({ user: { email }, token: 'mock-token' });
});

// 登录接口
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  let users = readUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(400).json({ message: '邮箱或密码错误' });
  res.json({ user: { email }, token: 'mock-token' });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`API服务已启动：http://localhost:${PORT}`);
}); 