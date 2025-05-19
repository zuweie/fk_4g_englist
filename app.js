const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// // 添加对文件上传的支持
// const fileUpload = require('express-fileupload');
// app.use(fileUpload({
//   limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
//   createParentPath: true
// }));

// 配置模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));
app.use('/rs', express.static(path.join(__dirname, 'rs')));
app.use('/webfonts', express.static(path.join(__dirname, 'rs/webfonts')))

// 数据库连接
mongoose.connect(process.env.MONGODB_URI.replace('?', `/${process.env.WEB_NAME}?`), {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected successfully');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// 路由配置
const adminRoutes = require('./routes/admin');
const userModule = require('./modules/user/router');
const uploadRoutes = require('./routes/upload');
const vocabExerciseRoutes = require('./modules/vocab_exercise/router');
const exerciseRoutes = require('./routes/exercise');

app.use('/admin', adminRoutes);
app.use('/user', userModule);
app.use('/upload', uploadRoutes);
app.use('/vocab_exercise', vocabExerciseRoutes);
app.use('/exercise', exerciseRoutes);

// 根路径重定向到练习首页
app.get('/', (req, res) => {
    res.redirect('/exercise/index');
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        err_code: 500,
        err_msg: 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 