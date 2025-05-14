const express = require('express');
const router = express.Router();
const path = require('path');
const { expressjwt: jwt } = require('express-jwt');
const { Vocabulary, Exercise, Analysis } = require('./db');
const User = require('../user/db');

// JWT 验证中间件
const jwtMiddleware = jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256'],
  getToken: function fromHeaderOrQuerystring(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    }
    return null;
  }
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

router.use((req, res, next) => {
  console.log(`Request path: ${req.path}`);
  next();
});

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
router.get('/exercise_items', jwtMiddleware, checkPermission, async (req, res) => {
  try {
    //console.log('获取练习题列表');
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
    //const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    const tagsArray = tags;
    // 处理空格
    let gapArray = [];
    if (gap) {
      //gapArray = gap.split(',').map(g => parseInt(g.trim())).filter(g => !isNaN(g));
      gapArray = gap;
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
router.delete('/vocab/:id', jwtMiddleware, checkPermission, async (req, res) => {
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


//获取单词详情
router.get('/vocab/:id', jwtMiddleware, checkPermission, async (req, res) => {
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



// 完成练习题接口
router.post('/done/:id', jwtMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.auth._id;
    
    // 查找练习题
    const exercise = await Exercise.findById(id);
    
    if (!exercise) {
      return res.status(404).json({
        err_code: 404,
        err_msg: 'Exercise not found'
      });
    }
    
    // 检查用户权限
    if (exercise.user_id !== user_id && req.auth.permission < 3) {
      return res.status(401).json({
        err_code: 401,
        err_msg: 'Unauthorized'
      });
    }
    
    // 切换状态
    let newStatus;
    if (exercise.status === 'done') {
      newStatus = 'unstart';
    } else {
      newStatus = 'done';
    }
    
    // 更新状态
    await Exercise.findByIdAndUpdate(id, {
      status: newStatus,
      updated_at: new Date()
    });
    
    res.json({
      err_code: 0,
      err_msg: 'success'
    });
  } catch (error) {
    console.error('Error updating exercise status:', error);
    res.status(500).json({
      err_code: 500,
      err_msg: 'Internal server error'
    });
  }
});



// 记录错误单词
router.post('/error/:user_id', jwtMiddleware, async (req, res) => {
  try {
    const { user_id } = req.params;
    const { vocab_ids } = req.body;
    
    // 验证用户ID
    if (user_id !== req.auth._id) {
      return res.status(401).json({
        err_code: 401,
        err_msg: 'Unauthorized'
      });
    }
    
    // 处理每个错误单词
    for (const vocab_id of vocab_ids) {
      // 查找分析记录
      let analysis = await Analysis.findOne({ 
        user_id: user_id,
        error_word: vocab_id
      });
      
      if (!analysis) {
        // 创建新记录
        analysis = new Analysis({
          user_id: user_id,
          error_word: vocab_id,
          hit_times: 1,
          error_times: 1,
          error_rate: 100
        });
      } else {
        // 更新现有记录
        analysis.error_times += 1;
        analysis.hit_times += 1;
        analysis.error_rate = Math.round((analysis.error_times / analysis.hit_times) * 100);
        analysis.updated_at = new Date();
      }
      
      await analysis.save();
    }
    
    res.json({
      err_code: 0,
      err_msg: 'success'
    });
  } catch (error) {
    console.error('Error recording error words:', error);
    res.status(500).json({
      err_code: 500,
      err_msg: 'Internal server error'
    });
  }
});


// 更新练习题字段
router.post('/update/:id', jwtMiddleware, checkPermission, async (req, res) => {
  try {
    const { id } = req.params;
    const { reward, reward_tips, status } = req.body;
    
    // 查找练习题
    const exercise = await Exercise.findById(id);
    
    if (!exercise) {
      return res.status(404).json({
        err_code: 404,
        err_msg: 'Exercise not found'
      });
    }
    
    // 更新字段
    const updateData = {};
    
    if (reward !== undefined) {
      updateData.award = reward;
    }
    
    if (reward_tips !== undefined) {
      updateData.award_tips = reward_tips;
    }
    
    if (status !== undefined) {
      updateData.status = status;
    }
    
    // 更新时间
    updateData.updated_at = new Date();
    
    // 执行更新
    await Exercise.findByIdAndUpdate(id, updateData);
    
    res.json({
      err_code: 0,
      err_msg: 'success'
    });
  } catch (error) {
    console.error('Error updating exercise:', error);
    res.status(500).json({
      err_code: 500,
      err_msg: 'Internal server error'
    });
  }
});


router.get('/analysis_list', (req, res) => {
  res.render(path.join(__dirname, 'analysis_list.ejs'));
});

// 更新单词
router.put('/vocabulary/:id', jwtMiddleware, checkPermission, async (req, res) => {
  try {
    const { id } = req.params;
    const { word, meaning, tags, gap } = req.body;
    
    // 查找单词
    const vocabulary = await Vocabulary.findById(id);
    
    if (!vocabulary) {
      return res.status(404).json({
        err_code: 404,
        err_msg: '单词不存在'
      });
    }
    // console.log('body', req.body);
    // console.log('word', word);
    // console.log('meaning', meaning);
    // console.log("tags", tags);

    // 准备更新数据
    const updateData = {
      word: word,
      meaning: meaning,
      tags: tags,
      gap: gap,
      updated_at: new Date()
    };
    
    // 处理发音文件
    if (req.files && req.files.pronunciation) {
      const file = req.files.pronunciation;
      const fileName = `pronunciation_${Date.now()}_${file.name}`;
      const filePath = path.join(__dirname, '../../public/uploads', fileName);
      
      // 保存文件
      await file.mv(filePath);
      
      // 更新发音路径
      updateData.pronunciation = `/uploads/${fileName}`;
    }
    
    // 执行更新
    await Vocabulary.findByIdAndUpdate(id, updateData);
    
    res.json({
      err_code: 0,
      err_msg: 'success'
    });
  } catch (error) {
    console.error('Error updating vocabulary:', error);
    res.status(500).json({
      err_code: 500,
      err_msg: 'Internal server error'
    });
  }
});


// router.get('/index', (req, res) => {
//   res.sendFile(path.join(__dirname, 'index.html'));
// });


// 错题分析数据API - 保留 jwtMiddleware
router.get('/analysis', jwtMiddleware, checkPermission, async (req, res) => {
  try {
    const { page = 1, limit = 10, keyword = '' } = req.query;
    const skip = (page - 1) * parseInt(limit);
    
    // 构建查询条件
    let query = {};
    
    if (keyword) {
      // 查找匹配关键字的用户
      const users = await User.find({
        username: { $regex: keyword, $options: 'i' }
      }).select('_id');
      
      const userIds = users.map(user => user._id.toString());
      
      // 查找匹配关键字的单词
      const vocabs = await Vocabulary.find({
        word: { $regex: keyword, $options: 'i' }
      }).select('_id');
      
      const vocabIds = vocabs.map(vocab => vocab._id.toString());
      
      // 组合查询条件
      query = {
        $or: [
          { user_id: { $in: userIds } },
          { error_word: { $in: vocabIds } }
        ]
      };
    }
    
    // 获取总数
    const total = await Analysis.countDocuments(query);
    
    // 获取分析数据
    const analyses = await Analysis.find(query)
      .sort({ error_rate: -1 }) // 按错误率降序排列
      .skip(skip)
      .limit(parseInt(limit))
      .exec();
    
    // 获取用户和单词信息
    const result = [];
    
    for (const analysis of analyses) {
      // 获取用户信息
      const user = await User.findById(analysis.user_id);
      
      // 获取单词信息
      const vocab = await Vocabulary.findById(analysis.error_word);
      
      if (user && vocab) {
        result.push({
          _id: analysis._id,
          username: user.username,
          word: vocab.word,
          hit_times: analysis.hit_times,
          error_times: analysis.error_times,
          error_rate: Math.round(analysis.error_rate * 100) / 100 // 保留两位小数
        });
      }
    }
    
    res.json({
      err_code: 0,
      err_msg: 'success',
      data: {
        total,
        list: result
      }
    });
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({
      err_code: 500,
      err_msg: 'Internal server error'
    });
  }
});

module.exports = router; 