const express = require('express');
const router = express.Router();
const path = require('path');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const User = require('../modules/user/db');
const { Exercise, Vocabulary } = require('../modules/vocab_exercise/db');
const { randomUUID } = require('crypto');


// 提供model的静态文件
router.get('/model.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/exercise/model.js'));
});

// 提供静态文件
router.get('/blank_canvas.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/exercise/blank_canvas.js'));
});

router.use('/model', express.static(path.join(__dirname, '../views/exercise/model')));

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
    
    // // 设置 cookie
    // res.cookie('token', token, { 
    //   path: '/',
    //   httpOnly: true,
    //   maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
    // });
    
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
    const wordIds = exercise.words || [];
    const words = [];
    
    for (const wordId of wordIds) {
      const word = await Vocabulary.findById(wordId);
      if (word) {
        words.push(word);
      }
    }
    
    res.render('exercise/practice2', { 
      exercise: exercise,
      words: words,
      user: decoded
    });
  } catch (error) {
    console.error('Error loading practice:', error);
    res.redirect('/exercise/login');
  }
});

/**
 * 上传单词 ID， 获取单词
 */
router.get('/playsample', async(req,res)=>{
  const { id } = req.query;
  const vocab = await Vocabulary.findById(id);
  if (!vocab) {
    return res.status(404).json({
      err_code: 404,
      err_msg: '单词不存在'
    });
  }

  let word  = vocab.word;
  //let word = "what the hell is goning on mp3 is not working";
  // 去掉 word 中的空格
  let wordMp3 = word.replace(/\s+/g, '');
  // 查看 public/uploads 路径中是否存在 word.mp3
  const filePath = path.join(__dirname, '../public/uploads', `${wordMp3}.mp3`);
  if (fs.existsSync(filePath)) {
    // 以流媒体形式返回该 mp3 文件
    console.log(`${wordMp3}.mp3 存在.`);
    const stat = fs.statSync(filePath);
    const fileStream = fs.createReadStream(filePath);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', stat.size);
    fileStream.pipe(res);
  } else {
    console.log(`${wordMp3}.mp3 不存在.`);
    
    // TODO： 从有道云 api 中获取该单词发音的语音合成 mp3 文件
    const url = "https://openapi.youdao.com/ttsapi";

    const appid = process.env.YOUDAO_TTS_APPID;
    const secret = process.env.YOUDAO_TTS_SECRET;
    const salt = randomUUID();
    const curtime = Math.floor(Date.now() / 1000);
    const signType = "v3"
    let q = word;
    if (word.length > 20) {
      // q = word 前 10 个字符 + word.lenght + word 后 10 个字符
      q = word.substring(0, 10) + word.length + word.substring(word.length-10, word.length);
    }
    let signString = appid + q + salt + curtime + secret;
    // signString 进行 utf8 编码
    signString = Buffer.from(signString).toString('utf8');
    
    const sign = crypto.createHash('sha256').update(signString).digest('hex');

    const params = {
      appKey: appid,
      // 将word url encode 赋值给 q
      q: word,
      salt: salt,
      curtime: curtime,
      sign: sign,
      signType: signType,
      format: 'mp3',
      voiceName: 'youxiaomei'
    }
    
    try {
      // 以 post application/x-www-form-urlencoded 的形式提交请求
      const response = await axios.post(url, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        responseType: 'arraybuffer'
      });
      
      // 分析 response 的头部的 content-typ 是否为 audio
      const contentType = response.headers['content-type'];

      if (contentType.includes('audio')) {
        // 将 response 的 content 写入到 public/uploads 路径中
        const filePath = path.join(__dirname, '../public/uploads', `${wordMp3}.mp3`);
        // 将 response 中 mp3 的数据写入文件中
        fs.writeFileSync(filePath, response.data);

        // 以流媒体形式返回该 mp3 文件
        console.log(`${wordMp3}.mp3 下载完毕.`);
        const stat = fs.statSync(filePath);
        const fileStream = fs.createReadStream(filePath);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', stat.size);
        fileStream.pipe(res);
      } else {
        return res.status(404).json({
          err_code: 404,
          err_msg: 'mp3 文件不存在'
        });
      }
    } catch (error) {
      console.error('Error fetching TTS:', error);
      return res.status(500).json({
        err_code: 500,
        err_msg: '语音合成失败'
      });
    }
  }
})

module.exports = router; 