# node 16
FROM node:16

# 设置工作目录
WORKDIR /usr/src/app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
# RUN npm install --production && npm run init
RUN npm install --production

# 复制项目文件
COPY . .

COPY entrypoint.sh .

RUN chomd +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT [ "./entrypoint.sh" ]

# 启动应用
#CMD ["node", "app.js"]
