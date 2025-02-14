const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('./db');

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET;

// 验证token中间件
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({
            err_code: 401,
            err_msg: 'Unauthorized'
        });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            err_code: 401,
            err_msg: 'Invalid token'
        });
    }
};

// 检查管理员权限中间件
const checkAdminPermission = (req, res, next) => {
    if (req.user.permission < 3) {
        return res.status(401).json({
            err_code: 401,
            err_msg: 'Insufficient permissions'
        });
    }
    next();
};

// 用户模块路由
router.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 用户登录
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const user = await User.findOne({
            $or: [
                { username: username },
                { email: username }
            ]
        });

        if (!user) {
            return res.json({
                err_code: 1,
                err_msg: '用户名或密码错误'
            });
        }

        // 验证密码
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({
                err_code: 1,
                err_msg: '用户名或密码错误'
            });
        }

        const token = jwt.sign({
            _id: user._id,
            username: user.username,
            avatar: user.avatar,
            permission: user.permission
        }, JWT_SECRET);

        res.json({
            err_code: 0,
            err_msg: 'success',
            data: { token }
        });
    } catch (err) {
        res.status(500).json({
            err_code: 500,
            err_msg: err.message
        });
    }
});

// 用户注销
router.post('/logout', verifyToken, (req, res) => {
    res.json({
        err_code: 0,
        err_msg: 'success'
    });
});

// 用户列表
router.get('/list', verifyToken, checkAdminPermission, async (req, res) => {
    const { page = 1, limit = 10, keyword = '' } = req.query;
    
    try {
        const query = {};
        if (keyword) {
            query.$or = [
                { username: new RegExp(keyword, 'i') },
                { email: new RegExp(keyword, 'i') }
            ];
        }

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('_id username avatar email permission openid created_at')
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            err_code: 0,
            err_msg: 'success',
            data: {
                list: users,
                total,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (err) {
        res.status(500).json({
            err_code: 500,
            err_msg: err.message
        });
    }
});

// 用户信息
router.get('/info', verifyToken, checkAdminPermission, async (req, res) => {
    const { _id } = req.query;
    
    try {
        const user = await User.findById(_id)
            .select('_id username avatar email permission openid created_at updated_at');
        
        if (!user) {
            return res.json({
                err_code: 1,
                err_msg: '用户不存在'
            });
        }

        res.json({
            err_code: 0,
            err_msg: 'success',
            data: user
        });
    } catch (err) {
        res.status(500).json({
            err_code: 500,
            err_msg: err.message
        });
    }
});

// 用户更新
router.post('/update', verifyToken, checkAdminPermission, async (req, res) => {
    const { _id, username, avatar, email, permission } = req.body;
    
    try {
        const user = await User.findById(_id);
        if (!user) {
            return res.json({
                err_code: 1,
                err_msg: '用户不存在'
            });
        }

        const updateData = {
            username,
            avatar,
            email,
            permission
        };

        await User.findByIdAndUpdate(_id, updateData);

        res.json({
            err_code: 0,
            err_msg: 'success'
        });
    } catch (err) {
        res.status(500).json({
            err_code: 500,
            err_msg: err.message
        });
    }
});

// 用户删除
router.post('/delete', verifyToken, checkAdminPermission, async (req, res) => {
    const { _id } = req.body;
    
    try {
        const user = await User.findById(_id);
        if (!user) {
            return res.json({
                err_code: 1,
                err_msg: '用户不存在'
            });
        }

        await User.findByIdAndDelete(_id);

        res.json({
            err_code: 0,
            err_msg: 'success'
        });
    } catch (err) {
        res.status(500).json({
            err_code: 500,
            err_msg: err.message
        });
    }
});

// 用户添加
router.post('/add', verifyToken, checkAdminPermission, async (req, res) => {
    const { username, email, password, permission } = req.body;
    
    try {
        // 检查用户名和邮箱是否已存在
        const existingUser = await User.findOne({
            $or: [
                { username: username },
                { email: email }
            ]
        });

        if (existingUser) {
            return res.json({
                err_code: 1,
                err_msg: '用户名或邮箱已存在'
            });
        }

        // 加密密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            permission,
            avatar: req.body.avatar || '/images/default-avatar.png'
        });

        await newUser.save();

        res.json({
            err_code: 0,
            err_msg: 'success'
        });
    } catch (err) {
        res.status(500).json({
            err_code: 500,
            err_msg: err.message
        });
    }
});

module.exports = router; 