const express = require('express');
const router = express.Router();
const path = require('path');
const { expressjwt: jwt } = require('express-jwt');
const { Vocabulary, Exercise, Analysis } = require('./db');
const User = require('../user/db');

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

// 练习题列表页面
router.get('/exercise_list', (req, res) => {
  res.render(path.join(__dirname, 'exercise_list.ejs'));
});

// 练习题编辑页面
router.get('/exercise', (req, res) => {
  res.render(path.join(__dirname, 'exercise.ejs'));
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

// 获取练习题列表
router.get('/exercise_list', jwtMiddleware, checkPermission, async (req, res) => {
  try {
    console.log('获取练习题列表');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const keyword = req.query.keyword || '';
    const skip = (page - 1) * limit;

    // 构建查询条件
    const query = {};
    if (keyword) {
      query.name = { $regex: keyword, $options: 'i' };
    }

    // 查询数据
    const exercises = await Exercise.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    // 获取总数
    const total = await Exercise.countDocuments(query);

    // 处理结果
    const result = [];
    for (const exercise of exercises) {
      let creator_name = 'Unknown';
      let user_name = 'Unknown';

      // 获取创建者信息
      if (exercise.created_by) {
        const creator = await User.findById(exercise.created_by);
        if (creator) {
          creator_name = creator.username;
        }
      }

      // 获取练习人信息
      if (exercise.user_id) {
        const user = await User.findById(exercise.user_id);
        if (user) {
          user_name = user.username;
        }
      }

      result.push({
        _id: exercise._id,
        name: exercise.name,
        creator_name: creator_name,
        user_name: user_name,
        words: exercise.words || [],
        award: exercise.award || '',
        award_tips: exercise.award_tips || '',
        created_at: exercise.created_at
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
    console.error('Error fetching exercise list:', error);
    res.status(500).json({
      err_code: 500,
      err_msg: 'Internal server error'
    });
  }
});

// 获取练习题详情
router.get('/exercise/:id', jwtMiddleware, checkPermission, async (req, res) => {
  try {
    const { id } = req.params;
    const exercise = await Exercise.findById(id);
    
    if (!exercise) {
      return res.status(404).json({
        err_code: 404,
        err_msg: 'Exercise not found'
      });
    }

    // 获取单词详情
    const wordIds = exercise.words || [];
    const words = [];
    
    for (const wordId of wordIds) {
      const word = await Vocabulary.findById(wordId);
      if (word) {
        words.push({
          _id: word._id,
          word: word.word
        });
      }
    }

    res.json({
      err_code: 0,
      err_msg: 'success',
      data: {
        _id: exercise._id,
        name: exercise.name,
        created_by: exercise.created_by,
        user_id: exercise.user_id,
        words: words,
        award: exercise.award || '',
        award_tips: exercise.award_tips || '',
        created_at: exercise.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching exercise:', error);
    res.status(500).json({
      err_code: 500,
      err_msg: 'Internal server error'
    });
  }
});

// 添加/编辑练习题
router.post('/exercise', jwtMiddleware, checkPermission, async (req, res) => {
  try {
    const { id } = req.query;
    const { name, user_id, words, award, award_tips } = req.body;
    
    if (!name || !user_id || !words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({
        err_code: 400,
        err_msg: 'Invalid request data'
      });
    }
    
    if (id) {
      // 更新练习题
      await Exercise.findByIdAndUpdate(id, {
        name,
        user_id,
        words,
        award: award || '',
        award_tips: award_tips || '',
        updated_at: new Date()
      });
    } else {
      // 创建新练习题
      const newExercise = new Exercise({
        name,
        created_by: req.auth._id,
        user_id,
        words,
        award: award || '',
        award_tips: award_tips || '',
        created_at: new Date(),
        updated_at: new Date()
      });
      
      await newExercise.save();
    }
    
    res.json({
      err_code: 0,
      err_msg: 'success'
    });
  } catch (error) {
    console.error('Error saving exercise:', error);
    res.status(500).json({
      err_code: 500,
      err_msg: 'Internal server error'
    });
  }
});

// 删除练习题
router.delete('/delete_exercise/:id', jwtMiddleware, checkPermission, async (req, res) => {
  try {
    const { id } = req.params;
    await Exercise.findByIdAndDelete(id);
    
    res.json({
      err_code: 0,
      err_msg: 'success'
    });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    res.status(500).json({
      err_code: 500,
      err_msg: 'Internal server error'
    });
  }
});

// 获取所有用户
router.get('/users', jwtMiddleware, checkPermission, async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    
    res.json({
      err_code: 0,
      err_msg: 'success',
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      err_code: 500,
      err_msg: 'Internal server error'
    });
  }
});

// 获取所有标签
router.get('/tags', jwtMiddleware, checkPermission, async (req, res) => {
  try {
    const vocabularies = await Vocabulary.find({}, 'tags');
    const allTags = vocabularies.flatMap(v => v.tags || []);
    const uniqueTags = [...new Set(allTags)].filter(tag => tag);
    
    res.json({
      err_code: 0,
      err_msg: 'success',
      data: uniqueTags
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      err_code: 500,
      err_msg: 'Internal server error'
    });
  }
});

// 获取单词列表（用于筛选）
router.get('/filter', jwtMiddleware, checkPermission, async (req, res) => {
  try {
    const { type, tag, user_id, limit = 1000 } = req.query;
    const limitNum = parseInt(limit);
    
    let words = [];
    
    if (type === 'all') {
      // 获取所有单词
      const vocabularies = await Vocabulary.find({})
        .limit(limitNum)
        .select('_id word');
      
      words = vocabularies.map(v => ({
        _id: v._id,
        word: v.word
      }));
    } else if (type === 'tag' && tag) {
      // 获取特定标签的单词
      const vocabularies = await Vocabulary.find({ tags: tag })
        .limit(limitNum)
        .select('_id word');
      
      words = vocabularies.map(v => ({
        _id: v._id,
        word: v.word
      }));
    } else if (type === 'error' && user_id) {
      // 获取错误率高的单词
      const analyses = await Analysis.find({ user_id })
        .sort({ error_rate: -1 })
        .limit(limitNum);
      
      for (const analysis of analyses) {
        const vocabulary = await Vocabulary.findById(analysis.error_word);
        if (vocabulary) {
          words.push({
            _id: vocabulary._id,
            word: `${vocabulary.word} (${(analysis.error_rate * 100).toFixed(0)}%)`
          });
        }
      }
    } else if (type === 'un' && user_id) {
      // 获取未做过的单词
      const analyses = await Analysis.find({ user_id });
      const doneWordIds = analyses.map(a => a.error_word);
      
      const vocabularies = await Vocabulary.find({ _id: { $nin: doneWordIds } })
        .limit(limitNum)
        .select('_id word');
      
      words = vocabularies.map(v => ({
        _id: v._id,
        word: v.word
      }));
    }
    
    res.json({
      err_code: 0,
      err_msg: 'success',
      data: words
    });
  } catch (error) {
    console.error('Error filtering words:', error);
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

// 获取单词详情
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