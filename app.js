const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const wx = require('./rourer/wx');
const user = require('./rourer/user');
const checkTokenExpiration = require('./middleware/veryToken');
const dbObj = require('./utils/Db'); // 数据库对象
const fs = require('fs');
// const { privateKey, publicKey } = require('./utils/generateKey');
const publicKey = fs.readFileSync(path.join(__dirname, 'publicKey.pem'), 'utf8');
const privateKey = fs.readFileSync(path.join(__dirname, 'privateKey.pem'), 'utf8');

const port = 3000;
global.privateKey = privateKey;
global.publicKey = publicKey;

// 使用cors中间件
app.use(cors());
app.use(checkTokenExpiration); // 验证token中间件
// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'pubilc')));
app.use(dbObj.connection); // 使用单例模式建立数据库连接， 给express应用对象添加中间件功能
app.use(express.json()); // 必须在路由之前
app.use(express.urlencoded({ extended: true })); // 必须在路由之前
app.use('/wx', wx);
app.use('/user', user);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
// https://www.expressjs.com.cn/
