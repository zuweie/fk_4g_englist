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

            - 该接口接受三个参数，page 、 limit、keyword、page 是页码，limit 是每页显示的条数。keyword 是搜索关键字，keywork 模糊匹配 username，email 这两个字段。该接口返回用户列表，包含用户_id，用户名字（username），用户头像（avatar），用户邮箱（email），用户权限（permission），用户openid（openid），用户创建时间。数据排列的方式以 created_at 字段降序排列。以上数据使用 json 打包返回。返回的格式为：
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

- 后端控制台。路由地址为：/admin/index。当浏览器请求该地址时，首先检查 cookie 中是否存在 token，若存在，检查 token 中的 permission 是否为 3，若为 3，则调用 /views/admin/index.html 页面。若不为3。则显示权限不足，并且返回 401。当检查完用户的 permission 后，读取 modules/ 文件夹下，各个模块的文件夹中的 config.json 文件，若文件中的 inuse 字段为 true，这在 /views/admin/index.html 页面中显示该模块的入口(config.json 文件中的 name 字段)。各个模块的入口地址为 <module_name>/index。页面右边为一个 iframe。当点击左边的模块入口时，页面右边 iframe 会显示该模块的"首页" 该页面应该嵌套到 iframe 中。

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
- 在页面的右上角添加一个"添加用户的"按钮，点击后。弹出一个用户属性对话框。属性输入包括，用户名，用户头像，邮箱，密码，权限。添加 /user/add 接口，调用此接口，添加用户。
- 在 /routers 文件夹中添加 upload.js 文件，用实现添加文件上传的 api，该 api 用于用户头像的上传。上传的地址放在 /uploads 文件夹下。

### 代码修改 2
请在 /modules/user/index.html 页面中的用户列表中，添加一列，用于显示用户的头像。

### 代码修改 3 
请在 /readme.md 文件中添加说明：当用户登录后，jwt token 的 payload 中会包含用户的 _id 字段，以及 permission 字段。permission 字段的值为用户的权限级别。jwt token 保存在 cookie 中，key 为 token，path 为 /。

# 小学英语单词练习模块
## 本项目基于 'base-admin' 项目二次项目，请先仔细阅读 readme.md 文件，了解项目的基本情况。
## 添加一个模块，名字叫 'vocab exercise'，用于实现小学英语单词练习。
- 模块的入口地址为 '/vocab_exercise/index.html'。
- 模块的配置文件为 'modules/vocab_exercise/config.json'。
    - 配置文件中至少包含以下字段：
        - name: 'vocab exercise'
        - description: '单词练习'
        - inuse: true
- 模块的数据库文件为 'modules/vocab_exercise/db.js'。
    - 数据库中包含三个表：'vocabulary' 和 'exercise' 和 'analysis'。
    - vocabulary 表中包含以下字段：
        - _id(string): 单词id
        - user_id(string): 用户id
        - tags(array): 单词标签
        - word(string): 单词
        - gap(array): 单词空格
        - meaning(string): 单词意思
        - pronunciation(string): 单词发音
        - created_at(datetime): 创建时间
        - updated_at(datetime): 更新时间
    - exercise 表中包含以下字段：
        - _id(string): 练习id
        - name(string): 练习名称
        - user_id(string): 练习用户id
        - words_number(number): 单词数量
        - words(array): 单词的id
        - award(string): 奖励
        - award_tips(string): 奖励提示
        - error_words(array): 错误单词
        - created_at(datetime): 创建时间
        - updated_at(datetime): 更新时间
    - analysis 表中包含以下字段：
        - _id(string): 分析id
        - user_id(string): 用户id
        - error_word(string): 错误单词
        - error_times(number): 错误次数
        - correct_times(number): 正确次数
        - error_rate(number): 错误率
        - created_at(datetime): 创建时间
        - updated_at(datetime): 更新时间
- 模块的路由文件为 'modules/vocab_exercise/router.js'。
    - 路由文件中包含以下路由（api）：
        - GET /vocab_exercise/index: 单词库首页，该路由跳转到 'modules/vocab_exercise/index.html' 页面。页面是 vocabulary 的列表，包含单词id，用户名字，标签，单词，单词意思，单词空格，单词发音，单词标签， 创建时间。
            - 当页面打开后，请调用 /vocab_exercise/list 接口，获取单词列表，并显示在页面上。
            - 在页面中，请添加一个搜索框，用于搜索单词。
            - 每行记录最后一列是一个操作列，包含"编辑"和"删除"按钮。
            - 页面右上角是一个添加按钮。当用户点击添加后弹出一个添加单词对话框。对话框包含以下字段：
                - 单词（word）：输入框，用于输入单词。
                - 单词意思（meaning）：输入框，用于输入单词意思。
                - 单词发音（pronunciation）：音频文件上传输入，用于上传单词发音。
                - 单词标签（tags）：输入框，用于输入单词标签,输入为字符串数组，使用','分隔,默认值为空。
                - 单词空格（gap）：输入框，用于输入单词填空,输入为整形数组，使用','分隔,默认值为整个单词字母的索引。
            - 提交按钮，点击后，调用 POST /vocab_exercise/add 接口，添加单词。将字段打包成json数据提交。其中 user_id 通过 jwt token 中的 payload 得到。
            - 当用点击编辑按钮，弹出一个编辑该单词（_id）对话框。对话框包含以下字段：
                - 单词（word）：输入框，用于输入单词。
                - 单词意思（meaning）：输入框，用于输入单词意思。
                - 单词发音（pronunciation）：音频文件上传输入，用于上传单词发音。
                - 单词标签（tags）：输入框，用于输入单词标签,输入为字符串数组，使用','分隔,默认值为空。
                - 单词空格（gap）：输入框，用于输入单词填空,输入为整形数组，使用','分隔,默认值为整个单词字母的索引。
            - 当用户点击编辑按钮后，调用 POST /vocab_exercise/edit/$id 接口，编辑单词。将字段打包成json数据提交。

        - GET /vocab_exercise/list: 
            - 该接口首先检查请求头部是否带有 Authorization: Bearer <jwt token>，若没有，或者 jwt token 的 payload 中的 permission 字段小于 3。则返回错误码 401，错误信息为 "Unauthorized"。
            - 该接口接受三个参数，page 、limit、keyword。page 是页码，默认为1，limit 是每页显示的条数，默认为20。keyword 是搜索关键字，keywork 模糊匹配 word、tags、meaning 这三个字段。该接口返回单词列表，包含单词id，单词，单词意思，单词发音，单词标签。数据排列的方式以 created_at 字段降序排列。以上数据使用 json 打包返回。返回的格式为：
            {
                err_code: 0,
                err_msg: "success",
                data: {
                    list: [
                        {
                            _id: "vocabulary_id",
                            user_name: "user_name",
                            tags: "vocabulary_tags",
                            word: "vocabulary_word",
                            meaning: "vocabulary_meaning",
                            gap: "vocabulary_gap",
                            pronunciation: "url for audio of pronunciation",
                            created_at: "vocabulary_created_at",
                        }
                    ]
                }
            }
            - 在匹配数据库的记录时，将匹配的记录中的 user_id 字段替换成'users'表中的 user_name 字段。
            - gap 字段为整形的数组，意思为需要填写的字母位置，例如 word 字段为 'apple', gap 字段为[0,2,3], 则代表需要填写字母'a', 'p', 'l'。在接口返回 json 结果的时候，请将 gap 字段替换成需要填写的字母。

        - POST /vocab_exercise/add: 添加单词
            - 该接口首先检查请求头部是否带有 Authorization: Bearer <jwt token>，若没有，或者 jwt token 的 payload 中的 permission 字段小于 3。则返回错误码 401，错误信息为 "Unauthorized"。
            - 该接口接收单词信息为参数，用户id（user_id，在jwt token 的 payload 中得到），标签（tags），单词（word），单词意思（meaning），单词发音（pronunciation），单词空格（gap）,等...。以上信息打包成为一个 json 格式的数据包，提交此接口。接口根据数据包的数据更新数据库中的信息。调用成功后返回的格式为:
            {
                err_code: 0,
                err_msg: "success",
            }
        - POST /vocab_exercise/edit/$id: 编辑单词
            - 该接口首先检查请求头部是否带有 Authorization: Bearer <jwt token>，若没有，或者 jwt token 的 payload 中的 permission 字段小于 3。则返回错误码 401，错误信息为 "Unauthorized"。
            - 该接口接收单词信息为参数，标签（tags），单词（word），单词意思（meaning），单词发音（pronunciation），单词空格（gap）。以上信息打包成为一个 json 格式的数据包，提交此接口。接口根据数据包的数据更新数据库中的信息。调用成功后返回的格式为:
            {
                err_code: 0,
                err_msg: "success",
            }

        - DELETE /vocab_exercise/$id: 删除单词
            - 该接口首先检查请求头部是否带有 Authorization: Bearer <jwt token>，若没有，或者 jwt token 的 payload 中的 permission 字段小于 3。则返回错误码 401，错误信息为 "Unauthorized"。
            - 该接口接受一个参数，单词id（$id）。
            - 该接口调用成功后返回的格式为:
            {
                err_code: 0,
                err_msg: "success",
            }

## 练习题
- 新建一个 'vocab_exercise/exercise.ejs' 页面，练习题入口地址为 '/vocab_exercise/exercise_list'。
- 页面中包含一个练习题列表，包含以下字段：
    - _id，练习题的id
    - create_by，创建者
    - user_id，练习人的id
    - name，练习题名称
    - words，练习题的单词
    - award，奖励
    - award_tips，奖励提示
    - 每行记录最后一列是一个操作列，包含"编辑/删除"按钮。
    - 点击"编辑"按钮后，跳转到 /vocab_exercise/exercise.ejs?id=$id 页面。
    - 点击"删除"按钮后，调用 DELETE /vocab_exercise/exercise/$id 接口，删除练习题。

- 页面风格，或者框架请保持与 /user/index.html 一致。
- 页面右上角有个添加按钮。点击后跳转到 /vocab_exercise/exercise.ejs?id= 页面。
- exercise.ejs 页面包含一个表单，表单包含以下字段：
    - 练习题名称（name）：输入框，用于输入练习题名称。
    - 练习人（user_id）：下拉框，用于选择练习人。
    - 奖励（award）：输入框，用于输入奖励。
    - 奖励提示（award_tips）：输入框，用于输入奖励提示。
- 在字段下方有个单词选择框，左边的是待选单词列表，右边的是已选单词列表。当用户点击左边待选单词列表，单词移动到右边的列表。
- 当用户点击右边的已选单词列表，单词移动到左边的待选单词列表。
- 当用户请求该页面时，请获取所有 vocabulary 表中所有单词的 tags 字段，并且去重形成数组。然后跟据 tags 数组生成单词选择框上的筛选按钮（蓝色）。
- 单词选择框上的单词筛选按钮，一个为“全部”（蓝色），接着是 tags 数组中的每个元素（蓝色）生成的按钮，然后是一个“常错”（蓝色）按钮，然后是一个“未做过”（蓝色）按钮。这些按钮横向排列，每行 8 个。
- 当点击“常错”和“未做过”按钮是，需要检查练习人字段是否空，如果为空，则弹出对话框提示需要练习人，其他按钮这不用提示。点击以上的按钮点击后，调用 GET/vocab_exercise/filter 接口，获取单词列表。
- 返回的单词出现在待选单词列表中。
- 单词单词旋转框中下有个有三个按钮（灰色），分别是：“随机10个”，“随机15个”，“随机20个”。当点击后，从待选单词列表中随机选择相应数量单词到已选单词列表中。
- 当用户点击提交按钮后，调用 POST /vocab_exercise/add_exercise 接口，添加练习题。将字段打包成json数据提交。其中 user_id 通过 jwt token 中的 payload 得到。
- 添加 GET /vocab_exercise/filter 接口，用于获取单词列表。该接口接受一个 type 参数、一个limit 参数 和一个 user_id 参数。
    - type 参数为以下：
        - all: 返回所有单词。返回格式为, [{"_id":"vocabulary_id", "word":"vocabulary_word"}, ...]
        - tags: 返回该标签下的所有单词, 返回格式为, [{"_id":"vocabulary_id", "word":"vocabulary_word"}, ...]
        - error: 返回所有错误单词。返回格式为, [{"_id":"vocabulary_id", "word":"vocabulary_word (error_rate)"}, ...]
        - un: 返回所有未做过该练习的单词。返回格式为, [{"_id":"vocabulary_id", "word":"vocabulary_word"}, ...]
        - limit 为返回单词的数量，默认为 1000
    - 当 type 参数为 error 时，需要跟据 user_id 参数，从 analysis 表中获取该用户的错误单词id, 从 vocabulary 表中获取这些单词(words)，返回跟据字段 error_rate 降序排列。返回格式[{"_id":"vocabulary_id", "word":"vocabulary_word (error_rate)"}, ...]
    - 当 type 参数为 un 时，需要跟据 user_id 参数，从 analysis 表中获取已经做过测试过的单词，然后从 vocabulary 返回排除掉这些单词的单词列表。返回格式[{"_id":"vocabulary_id", "word":"vocabulary_word"}, ...]

- 当参数 id 存在时，exercise.ejs 页面显示该练习题的信息，用户点击提交后，编辑该练习题。
- 当参数 id 不存在时，exercise.ejs 页面显示添加练习题的信息，用户点击提交后，新建一条记录。

- 添加 POST /vocab_exercise/exercise?id=$id 接口，用于做练习题。
    - 该接口首先检查请求头部是否带有 Authorization: Bearer <jwt token>，若没有，或者 jwt token 的 payload 中的 permission 字段小于 3。则返回错误码 401，错误信息为 "Unauthorized"。
    - 当请求带有 id 参数时，该请求更改当前 exercise 记录，否则新建一条记录。
    - 将表单数据打包成 json 数据提交。若是新建记录，新记录中的 create_by 字段通过 jwt token 中的 payload 得到，否则不用修改 create_by 字段。words 字段为单词_id的数组。
    - 调用成功后返回的格式为:
    {
        err_code: 0,
        err_msg: "success",
    }
    - 添加成功后返回 /vocab_exercise/exercise_list.ejs 页面。
- 添加一个 DELETE /vocab_exercise/delete_exercise/$id 接口，用于删除练习题。
    - 该接口首先检查请求头部是否带有 Authorization: Bearer <jwt token>，若没有，或者 jwt token 的 payload 中的 permission 字段小于 3。则返回错误码 401，错误信息为 "Unauthorized"。
    - 该接口接受一个参数，练习题id（$id）。
    - 该接口调用成功后返回的格式为:
    {
        err_code: 0,
        err_msg: "success",
    }.



