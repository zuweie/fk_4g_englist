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
- 存储位置: Cookie，存储方式，在页面端 api 请求后得到token，在页面端保存 token 到 cookie 中。不要在response 中设置 token 到 cookie。
- Cookie 名称: token
- Cookie 路径: /
- 获取方式: document.cookie
- 使用方式: 在 API 请求头中添加 `Authorization: Bearer <token>`

4. **Token 验证**:
- 所有需要权限的 API 都会验证 token
- 验证失败会返回 401 状态码
- 权限不足会返回 401 状态码

5. **文件上传**
- 文件上传功能在 routers/upload.js 中定义
- 文件上传路径为 public/uploads

## 模块页面开发指南

为确保新模块页面在后台框架中正确显示，请遵循以下结构和样式指南：

### 基本 HTML 结构

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>模块名称</title>
  <!-- 使用与其他模块相同版本的 CSS 库 -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/admin-lte@3.1/dist/css/adminlte.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
  <!-- 其他需要的 CSS 库 -->
</head>
<body class="hold-transition">
  <div class="content-wrapper">
    <!-- 页面标题 -->
    <section class="content-header">
      <div class="container-fluid">
        <div class="row mb-2">
          <div class="col-sm-6">
            <h1>模块标题</h1>
          </div>
        </div>
      </div>
    </section>

    <!-- 页面内容 -->
    <section class="content">
      <div class="card">
        <div class="card-header">
          <!-- 搜索和操作按钮 -->
          <div class="row">
            <div class="col-md-8">
              <div class="input-group">
                <input type="text" class="form-control" id="searchInput" placeholder="搜索...">
                <div class="input-group-append">
                  <button class="btn btn-primary" id="searchBtn">搜索</button>
                </div>
              </div>
            </div>
            <div class="col-md-4 text-right">
              <button class="btn btn-success" id="addBtn">
                <i class="fas fa-plus"></i> 添加
              </button>
            </div>
          </div>
        </div>
        <div class="card-body">
          <!-- 表格或其他内容 -->
          <table class="table table-bordered">
            <thead>
              <tr>
                <!-- 表头 -->
              </tr>
            </thead>
            <tbody id="dataList">
              <!-- 数据列表 -->
            </tbody>
          </table>
          <!-- 分页 -->
          <div class="mt-3" id="pagination"></div>
        </div>
      </div>
    </section>
  </div>

  <!-- 模态框 -->
  <div class="modal fade" id="dataModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <!-- 模态框内容 -->
      </div>
    </div>
  </div>

  <!-- JavaScript 库 -->
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/js/bootstrap.bundle.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/admin-lte@3.1/dist/js/adminlte.min.js"></script>
  <!-- 其他需要的 JS 库 -->
  
  <script>
    // JavaScript 代码
  </script>
</body>
</html>
```

### 关键注意事项

1. **HTML 结构**:
   - 使用 `<body class="hold-transition">` 而不是 `sidebar-mini` 或其他类
   - 最外层容器使用 `<div class="content-wrapper">`
   - 不要添加额外的 `wrapper` 容器

2. **CSS 库版本**:
   - 使用与其他模块相同版本的 CSS 库，推荐:
     - Bootstrap 4.6.0
     - AdminLTE 3.1
     - Font Awesome 5.15.4

3. **布局结构**:
   - 使用 `content-header` 和 `content` 部分
   - 使用 `card` 组件包装内容
   - 使用 Bootstrap 的 `row` 和 `col` 类进行布局

4. **表格和分页**:
   - 表格使用 `table table-bordered` 类
   - 分页容器使用 `mt-3` 类添加上边距

5. **模态框**:
   - 使用 `modal fade` 类
   - 不需要添加 `role="dialog"` 和 `aria-labelledby` 属性

6. **JavaScript 库版本**:
   - 使用与其他模块相同版本的 JavaScript 库

### 常见问题解决

1. **页面显示在右上角**:
   - 检查是否使用了正确的 `content-wrapper` 类
   - 确保没有多余的嵌套容器
   - 确保使用了 `hold-transition` 类而不是 `sidebar-mini`

2. **样式不一致**:
   - 确保使用了与其他模块相同版本的 CSS 库
   - 避免使用自定义样式覆盖框架样式

3. **模态框显示问题**:
   - 确保模态框结构正确
   - 使用 Bootstrap 的标准模态框结构

4. **响应式布局问题**:
   - 使用 Bootstrap 的栅格系统 (`row` 和 `col-*` 类)
   - 为不同屏幕尺寸设置适当的列宽

5. **请求的数据格式问题**
  - 所有带有 body 的请求，例如 post，put 等提交的数据格式必须问 application/json，所有请求的数据统一打包成json。
  - 若如上请求中需要上传文件的情况，不大与 10M 的情况，在页面端将文件转成 base64 编码，然后打包成json。
  - 若上传的文件大于 10M，在页面端调用 /upload api 上传文件，返回 url，再跟其他数据一起打包成 json 提交。

通过遵循这些指南，可以确保新模块页面在后台框架中正确显示，保持与现有模块的一致性。

