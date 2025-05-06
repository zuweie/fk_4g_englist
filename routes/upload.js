const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制5MB
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('只允许上传图片文件!'));
    }
});

// 文件上传接口
router.post('/avatar', upload.single('avatar'), (req, res) => {
    if (!req.file) {
        return res.json({
            err_code: 1,
            err_msg: '没有上传文件'
        });
    }

    res.json({
        err_code: 0,
        err_msg: 'success',
        data: {
            url: '/uploads/' + req.file.filename
        }
    });
});

// 添加对音频文件的支持
const pronunciationStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/uploads/pronunciations');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'pronunciation-' + uniqueSuffix + ext);
  }
});

const pronunciationUpload = multer({
  storage: pronunciationStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制10MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /mp3|wav|ogg|m4a/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('audio/');
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('只允许上传音频文件!'));
  }
});

// 音频文件上传接口
router.post('/pronunciation', pronunciationUpload.single('pronunciation'), (req, res) => {
  if (!req.file) {
    return res.json({
      err_code: 1,
      err_msg: '没有上传文件'
    });
  }

  res.json({
    err_code: 0,
    err_msg: 'success',
    data: {
      url: '/uploads/pronunciations/' + req.file.filename
    }
  });
});

module.exports = router; 