const express = require('express');
const router = express.Router();
const path = require('path');
const jwt = require('jsonwebtoken');
const User = require('../modules/user/db');
const { Exercise } = require('../modules/vocab_exercise/db');

// 提供静态文件
router.get('/blank_canvas.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/exercise/blank_canvas.js'));
});

// 首页路由
router.get('/index', async (req, res) => {
  // 检查是否登录
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/exercise/login');
  }

  try {
    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 获取用户的练习题列表
    const exercises = await Exercise.find({ user_id: decoded._id })
      .sort({ status: 1, created_at: 1 }) // status: unstart 排在前面，然后按创建时间升序
      .exec();
    
    res.render('exercise/index', { 
      exercises: exercises,
      user: decoded
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.redirect('/exercise/login');
  }
});

// 登录页面路由
router.get('/login', (req, res) => {
  res.render('exercise/login');
});

// 登录处理路由
router.post('/login', async (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({
      err_code: 400,
      err_msg: '用户名不能为空'
    });
  }

  try {
    // 查找用户
    let user = await User.findOne({ username });
    
    // 如果用户不存在，创建新用户
    if (!user) {
      user = new User({
        username,
        password: '$2a$10$yfIFACI9tIHFH.aDkHyVxOV3GYS5GbyrWnLgQrGqHa9mqWM3cBGOK', // 888888 的哈希值
        email: `${username}@example.com`,
        permission: 1,
        avatar: '/images/default-avatar.png',
        created_at: new Date(),
        updated_at: new Date()
      });
      
      await user.save();
    }
    
    // 生成 JWT token
    const token = jwt.sign(
      { 
        _id: user._id, 
        username: user.username, 
        permission: user.permission,
        avatar: user.avatar
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    // 设置 cookie
    res.cookie('token', token, { 
      path: '/',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
    });
    
    res.json({
      err_code: 0,
      err_msg: 'success',
      data: { token }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      err_code: 500,
      err_msg: '服务器错误'
    });
  }
});

// 练习题页面路由
router.get('/practice', async (req, res) => {
  const { id } = req.query;
  
  // 检查是否登录
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/exercise/login');
  }
  
  try {
    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 获取练习题详情
    const exercise = await Exercise.findById(id);
    
    if (!exercise) {
      return res.status(404).render('error', { 
        message: '练习题不存在',
        error: { status: 404 }
      });
    }
    
    // 获取练习题中的单词详情
    const { Vocabulary } = require('../modules/vocab_exercise/db');
    const wordIds = exercise.words || [];
    const words = [];
    
    for (const wordId of wordIds) {
      const word = await Vocabulary.findById(wordId);
      if (word) {
        words.push(word);
      }
    }
    
    res.render('exercise/practice', { 
      exercise: exercise,
      words: words,
      user: decoded
    });
  } catch (error) {
    console.error('Error loading practice:', error);
    res.redirect('/exercise/login');
  }
});

module.exports = router; 