# Base Admin - 简易后台管理系统

这是一个基于 Express + MongoDB 开发的轻量级后台管理系统框架。系统采用模块化设计，便于扩展和维护。

## 技术栈

- **后端框架**: Express.js
- **数据库**: MongoDB
- **模板引擎**: EJS
- **UI 框架**: 
  - Bootstrap 4
  - AdminLTE 3.0
- **认证方式**: JWT (JSON Web Token)

## 项目依赖

主要依赖包：
```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",        // 密码加密
    "cookie-parser": "^1.4.7",    // Cookie 解析
    "cors": "^2.8.5",            // 跨域支持
    "dotenv": "^16.4.7",         // 环境变量配置
    "ejs": "^3.1.10",            // 模板引擎
    "express-jwt": "^8.5.1",     // JWT 中间件
    "jsonwebtoken": "^9.0.2",    // JWT 实现
    "mongodb": "^6.13.0",        // MongoDB 驱动
    "mongoose": "^8.10.0"        // MongoDB ODM
  },
  "devDependencies": {
    "nodemon": "^3.1.9"          // 开发热重载
  }
}
```

## 项目结构

```
base-admin/
├── modules/                 # 模块目录
│   └── user/               # 用户模块
│       ├── index.html      # 模块首页
│       ├── config.json     # 模块配置
│       ├── db.js          # 数据模型
│       └── router.js      # 路由定义
├── public/                 # 静态资源
│   ├── css/
│   ├── js/
│   └── images/
├── views/                  # 视图模板
│   └── admin/             # 管理后台视图
│       ├── login.ejs      # 登录页
│       └── index.ejs      # 主页
├── routes/                 # 路由目录
│   └── admin.js           # 管理路由
├── scripts/               # 脚本目录
│   ├── init-admin.js     # 初始化脚本
│   └── uninit-admin.js   # 清理脚本
├── docker/                # Docker 配置
│   └── mongodb/          # MongoDB 配置
├── app.js                # 应用入口
├── .env                  # 环境配置
└── package.json          # 项目配置
```

## 已完成功能

1. **基础框架搭建**
   - Express 服务器配置
   - MongoDB 数据库连接
   - 模板引擎配置
   - 静态资源服务
   - 错误处理中间件

2. **用户模块**
   - 用户数据模型
   - 用户认证（登录/注销）
   - JWT token 验证
   - 用户列表管理
   - 用户信息查询/修改/删除
   - 密码加密存储

3. **管理后台**
   - 登录页面
   - 主页框架
   - 模块化菜单
   - 响应式布局

4. **数据库管理**
   - 数据库初始化脚本
   - 管理员账户创建
   - 数据库清理脚本

## 环境配置

项目使用 .env 文件管理环境配置：

```env
PORT=3000                   # 服务器端口
MONGODB_URI=mongodb://root:1234@localhost:27017?authSource=admin  # 数据库连接
JWT_SECRET=your-secret-key  # JWT 密钥
WEB_NAME=baseadmin         # 数据库名称
```

## 开发命令

```bash
# 安装依赖
npm install

# 初始化数据库和管理员账户
npm run init

# 开发模式运行（带热重载）
npm run dev

# 生产模式运行
npm start

# 清理数据库
npm run uninit
```

## Docker 环境

项目包含 MongoDB 的 Docker 配置：

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: 1234
    ports:
      - "27017:27017"
```

## 默认账户

初始管理员账户：
- 用户名：admin
- 密码：admin123
- 权限级别：3（管理员）

## 模块开发说明

系统支持模块化开发，每个模块需包含以下文件：
1. `index.html`: 模块首页
2. `config.json`: 模块配置
3. `db.js`: 数据模型
4. `router.js`: 路由定义

新模块开发步骤：
1. 在 `modules` 目录下创建新模块目录
2. 实现上述四个基本文件
3. 模块会自动加载到后台菜单

## 注意事项

1. 所有密码都使用 bcrypt 加密存储
2. API 返回格式统一为：
```json
{
    "err_code": 0,
    "err_msg": "success",
    "data": {}
}
```
3. 权限验证使用 JWT token，需在请求头中携带：
```
Authorization: Bearer <token>
```

## 待开发功能

1. 用户密码修改功能
2. 文件上传功能
3. 操作日志记录
4. 权限细分管理
5. 更多...

## 联系方式

如有问题，请联系项目原开发者或在项目 Issues 中提出。

## JWT Token 说明

当用户成功登录后，系统会生成一个 JWT token，包含以下信息：

1. **Payload 结构**:
```json
{
    "_id": "用户ID",
    "username": "用户名",
    "avatar": "用户头像",
    "permission": "用户权限级别"
}
```

2. **权限级别说明**:
- permission = 1: 普通用户
- permission = 2: 高级用户
- permission = 3: 管理员

3. **Token 存储**:
- 存储位置: Cookie
- Cookie 名称: token
- Cookie 路径: /
- 获取方式: document.cookie
- 使用方式: 在 API 请求头中添加 `Authorization: Bearer <token>`

4. **Token 验证**:
- 所有需要权限的 API 都会验证 token
- 验证失败会返回 401 状态码
- 权限不足会返回 401 状态码
