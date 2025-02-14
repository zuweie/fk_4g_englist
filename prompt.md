# BASE ADMIN 简易的后端控制台
请为我开发一个简单的后端控制台。后端控制台使用 web 技术，使用 express 框架，使用 ejs 模板引擎。支持 html5 和 css3。支持移动设备。使用 bootstrap 框架，使用 adminlte 3.0 UI 框架，数据库使用 mongodb。

我希望后端控制台支持模块设计。在项目的根目录下，建立一个 modules 的文件夹，文件夹中存放各个模块文件，每个模块至少有四个文件，文件结构如下（以用户模块为例子）：

```
modules/
    user/
        index.html
        config.josn
        db.js
        router.js
```
文件说明：
- index.html 是模块的首页，该页面显示在控制台的右侧的 iframe 中。
- config.json 是用户模块的配置文件，至少包含两个字段：
    - name: 模块名称，此名称将会显示在控制台的左侧的模块列表中。
    - description: 模块描述
    - inuse: 模块是否启用，若为 true，则该模块将会显示在控制台的左侧的模块列表中。
- db.js 是模块所需要的数据表的定义。
- router.js 是模块所需要的路由定义。例如，在用户模块中，router.js 定义用户登录，用户注册，用户注销，用户信息修改，用户列表查询，用户信息查询，用户删除等路由。

## 后台模块
- 用户模块，该模块存于 modules/user/ 文件夹中。用户模块拥有以下几个文件：

    - index.html 是用户模块的首页，该页面显示用户列表。列表中包含用户id，用户名字，用户邮箱，用户权限，用户操作按钮（修改和删除）。
    - config.json 是用户模块的配置文件，至少包含三个字段：
        - name: "user"
        - description: "用户模块"
        - inuse: ture
    - db.js 是用户模块所需要的数据表的定义，数据表的字段为：
        - username(string): 用户名字
        - email(string): 用户邮箱
        - avatar(string): 用户头像
        - password(string): 用户密码
        - permission(number): 用户权限
        - openid(string): 用户openid
        - token(string): 用户token
        - created_at(datetime): 用户创建时间
        - updated_at(datetime): 用户更新时间

    - router.js 是用户模块所需要的路由定义。router.js中定义一下路由或者 api：
        - GET /user/index: 用户首页，该路由跳转到 modules/user/index.html 页面。

        - post /user/login: 用户登录, 此路由接受两个参数，username/email 和 password。登录后返回 jwt-token。token 的 payload 包含 _id, username、avatar、permission 三个字段，返回格式为 json，如下：
        {
            err_code: 0,
            err_msg: "success",
            data: {
                token: "jwt-token"
            }
        }。

        - post /user/logout: 用户注销，此路由接受一个参数，jwt token. token 放在请求的头部：
        "Authorization: Bearer <jwt token>"


        - GET /user/list: 用户列表，以 API 形式提供。
            - 该接口首先检查请求头部是否带有 Authorization: Bearer <jwt token>，若没有，或者 jwt token 的 payload 中的 permission 字段小于 3。则返回错误码 401，错误信息为 "Unauthorized"。

            - 该接口接受三个参数，page 、 limit、keyword。page 是页码，limit 是每页显示的条数。keyword 是搜索关键字，keywork 模糊匹配 username，email 这两个字段。该接口返回用户列表，包含用户_id，用户名字（username），用户头像（avatar），用户邮箱（email），用户权限（permission），用户openid（openid），用户创建时间。数据排列的方式以 created_at 字段降序排列。以上数据使用 json 打包返回。返回的格式为：
            {
                err_code: 0,
                err_msg: "success",
                data: {
                    list: [
                        {
                            _id: "user_id",
                            username: "user_name",
                            avatar: "user_avatar",
                            email: "user_email",
                            permission: "user_permission",
                            openid: "user_openid",
                            created_at: "user_created_at"
                        }
                    ]
                }
            }
        - GET /user/info: 用户信息.
            - 该接口接受一个参数: _id，
            - 该接口首先检查请求头部是否带有 Authorization: Bearer <jwt token>，若没有，或者 jwt token 的 payload 中的 permission 字段小于 3。则返回错误码 401，错误信息为 "Unauthorized"。
            - 该接口返回用户信息，包含用户_id，用户名字（username），用户头像（avatar），用户邮箱（email），用户权限（permission），用户openid（openid），用户创建时间（created_at），用户更新时间（updated_at）。以上数据使用 json 打包返回。返回的格式为：
            {
                err_code: 0,
                err_msg: "success",
                data: {
                    _id: "user_id",
                    username: "user_name",
                    avatar: "user_avatar",
                    email: "user_email",
                    permission: "user_permission",
                    openid: "user_openid",
                    created_at: "user_created_at"
                }
            }
        - POST /user/update: 用户更新
            - 该接口接受一个参数: _id，
            - 该接口首先检查请求头部是否带有 Authorization: Bearer <jwt token>，若没有，或者 jwt token 的 payload 中的 permission 字段小于 3。则返回错误码 401，错误信息为 "Unauthorized"。
            - 该接口接收用户信息为参数，包含用户ID（_id），用户名字（username），用户头像（avatar），用户邮箱（email），用户权限（permission）。以上信息打包成为一个 json 格式的数据包，提交此接口。接口根据数据包的数据更新数据库中的信息。调用成功后返回的格式为:
            {
                err_code: 0,
                err_msg: "success",
            }

        - POST /user/delete: 用户删除
            - 该接口接受一个参数: _id，
            - 该接口首先检查请求头部是否带有 Authorization: Bearer <jwt token>，若没有，或者 jwt token 的 payload 中的 permission 字段小于 3。则返回错误码 401，错误信息为 "Unauthorized"。
            - 该接口调用成功后返回的格式为:
            {
                err_code: 0,
                err_msg: "success",
            }


## 后端页面

后端请使用使用 adminlte 3.0 UI 框架进行开发。

- 后端登录。路由地址为：/admin/login。该地址调用 /views/admin/login.html 页面，设计简约大气，使用 bootstrap 框架。简约的账户密码，输入框，登录按钮。账户输入框中，有提示词语："请输入用户名或邮箱"。密码输入框中，有提示词语："请输入密码"。当用户点击登录后，调用 /user/login 接口，若调用成功，将 token 保存在浏览器的 cookie 中，跳转到 /admin/index。

- 后端控制台。路由地址为：/admin/index。当浏览器请求该地址时，首先检查 cookie 中是否存在 token，若存在，检查 token 中的 permission 是否为 3，若为 3，则调用 /views/admin/index.html 页面。若不为3。则显示权限不足，并且返回 401。当检查完用户的 permission 后，读取 modules/ 文件夹下，各个模块的文件夹中的 config.json 文件，若文件中的 inuse 字段为 true，这在 /views/admin/index.html 页面中显示该模块的入口(config.json 文件中的 name 字段)。各个模块的入口地址为 <module_name>/index。页面右边为一个 iframe。当点击左边的模块入口时，页面右边 iframe 会显示该模块的“首页” 该页面应该嵌套到 iframe 中。

## 技术交底
- 后端请使用 express 框架进行开发。
- 后端请使用 ejs 模板引擎进行开发。
- 后端请使用 bootstrap 框架进行开发。
- 后端请使用 adminlte 3.0 UI 框架进行开发。
- 后端请使用 mongodb 数据库进行开发。
- 后端请使用 jwt 进行 token 的验证。
- 数据库的链接地址为：mongodb://root:1234@localhost:27017
- 请合理组织代码结构，代码开发过程中请写上详细的注释。
- 请在当前根目录下生成代码。在代码生成过程中，若遇上需要我执行的命令，请暂停生成代码，待命令执行完毕后，再继续生成代码。


### 代码修改 1
请帮我实现 /modules/user/index.html 页面中的用户列表相关的 JavaScript 代码。包括实现：
- 用户列表的显示，调用相关的 api。
- 用户编辑，调用相关的 api。
- 用户删除，调用相关的 api。
- 在页面的右上角添加一个“添加用户的”按钮，点击后。弹出一个用户属性对话框。属性输入包括，用户名，用户头像，邮箱，密码，权限。添加 /user/add 接口，调用此接口，添加用户。
- 在 /routers 文件夹中添加 upload.js 文件，用实现添加文件上传的 api，该 api 用于用户头像的上传。上传的地址放在 /uploads 文件夹下。

### 代码修改 2
请在 /modules/user/index.html 页面中的用户列表中，添加一列，用于显示用户的头像。

### 代码修改 3 
请在 /readme.md 文件中添加说明：当用户登录后，jwt token 的 payload 中会包含用户的 _id 字段，以及 permission 字段。permission 字段的值为用户的权限级别。jwt token 保存在 cookie 中，key 为 token，path 为 /。
