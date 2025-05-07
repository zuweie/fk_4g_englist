const express = require('express');
const router = express.Router();
const path = require('path');
const { expressjwt: jwt } = require('express-jwt');
const { Vocabulary } = require('./db');
const  User  = require('../user/db');

// JWT 验证中间件
const jwtMiddleware = jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256']
});

// 权限验证中间件
const checkPermission = (req, res, next) => {
  if (!req.auth || req.auth.permission < 3) {
    return res.status(401).json({
      err_code: 401,
      err_msg: 'Unauthorized'
    });
  }
  next();
};

// 单词库首页
router.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 获取单词列表
router.get('/list', jwtMiddleware, checkPermission, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const keyword = req.query.keyword || '';
    const skip = (page - 1) * limit;

    // 构建查询条件
    const query = {};
    if (keyword) {
      query.$or = [
        { word: { $regex: keyword, $options: 'i' } },
        { meaning: { $regex: keyword, $options: 'i' } },
        { tags: { $regex: keyword, $options: 'i' } }
      ];
    }

    // 查询数据
    const vocabularies = await Vocabulary.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    // 获取总数
    const total = await Vocabulary.countDocuments(query);

    // 处理结果
    const result = [];
    for (const vocab of vocabularies) {
      // 这里可能是问题所在 - 确保 User 模型存在且正确导入
      let user_name = 'Unknown';
      if (vocab.user_id) {
        const user = await User.findById(vocab.user_id);
        if (user) {
          user_name = user.username;
        }
      }

      // 处理 gap 字段
      let gapLetters = '';
      if (vocab.gap && vocab.gap.length > 0) {
        gapLetters = vocab.gap.map(index => vocab.word[index] || '').join(', ');
      }

      result.push({
        _id: vocab._id,
        user_name: user_name,
        word: vocab.word,
        meaning: vocab.meaning,
        pronunciation: vocab.pronunciation,
        tags: vocab.tags,
        gap: gapLetters,
        created_at: vocab.created_at
      });
    }

    res.json({
      err_code: 0,
      err_msg: 'success',
      data: {
        list: result,
        total: total
      }
    });
  } catch (error) {
    console.error('Error fetching vocabulary list:', error);
    res.status(500).json({
      err_code: 500,
      err_msg: 'Internal server error'
    });
  }
});

// 添加单词
router.post('/add', jwtMiddleware, checkPermission, async (req, res) => {
  try {
    const { word, meaning, pronunciation, tags, gap } = req.body;
    const user_id = req.auth._id;

    // 处理标签
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    
    // 处理空格
    let gapArray = [];
    if (gap) {
      gapArray = gap.split(',').map(g => parseInt(g.trim())).filter(g => !isNaN(g));
    } else {
      // 默认为整个单词的字母索引
      gapArray = Array.from({ length: word.length }, (_, i) => i);
    }

    // 创建新单词
    const newVocabulary = new Vocabulary({
      user_id,
      word,
      meaning,
      pronunciation,
      tags: tagsArray,
      gap: gapArray,
      created_at: new Date(),
      updated_at: new Date()
    });

    await newVocabulary.save();

    res.json({
      err_code: 0,
      err_msg: 'success'
    });
  } catch (error) {
    console.error('Error adding vocabulary:', error);
    res.status(500).json({
      err_code: 500,
      err_msg: 'Internal server error'
    });
  }
});

// 编辑单词
router.post('/edit/:id', jwtMiddleware, checkPermission, async (req, res) => {
  try {
    const { id } = req.params;
    const { word, meaning, pronunciation, tags, gap } = req.body;

    // 处理标签
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    
    // 处理空格
    let gapArray = [];
    if (gap) {
      gapArray = gap.split(',').map(g => parseInt(g.trim())).filter(g => !isNaN(g));
    } else {
      // 默认为整个单词的字母索引
      gapArray = Array.from({ length: word.length }, (_, i) => i);
    }

    // 更新单词
    await Vocabulary.findByIdAndUpdate(id, {
      word,
      meaning,
      pronunciation,
      tags: tagsArray,
      gap: gapArray,
      updated_at: new Date()
    });

    res.json({
      err_code: 0,
      err_msg: 'success'
    });
  } catch (error) {
    console.error('Error editing vocabulary:', error);
    res.status(500).json({
      err_code: 500,
      err_msg: 'Internal server error'
    });
  }
});

// 删除单词
router.delete('/:id', jwtMiddleware, checkPermission, async (req, res) => {
  try {
    const { id } = req.params;
    await Vocabulary.findByIdAndDelete(id);

    res.json({
      err_code: 0,
      err_msg: 'success'
    });
  } catch (error) {
    console.error('Error deleting vocabulary:', error);
    res.status(500).json({
      err_code: 500,
      err_msg: 'Internal server error'
    });
  }
});

// 添加获取单词详情的路由
router.get('/:id', jwtMiddleware, checkPermission, async (req, res) => {
  try {
    const { id } = req.params;
    const vocabulary = await Vocabulary.findById(id);
    
    if (!vocabulary) {
      return res.status(404).json({
        err_code: 404,
        err_msg: 'Vocabulary not found'
      });
    }

    res.json({
      err_code: 0,
      err_msg: 'success',
      data: {
        _id: vocabulary._id,
        word: vocabulary.word,
        meaning: vocabulary.meaning,
        pronunciation: vocabulary.pronunciation,
        tags: vocabulary.tags,
        gap: vocabulary.gap,
        created_at: vocabulary.created_at,
        updated_at: vocabulary.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    res.status(500).json({
      err_code: 500,
      err_msg: 'Internal server error'
    });
  }
});

module.exports = router; 