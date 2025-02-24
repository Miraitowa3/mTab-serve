const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const wx = require('./rourer/wx');
const dbObj = require('./utils/Db'); // 数据库对象

const port = 3000;
// 使用cors中间件
app.use(cors());
// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'pubilc')));
app.use(dbObj.connection); // 使用单例模式建立数据库连接， 给express应用对象添加中间件功能

app.use('/wx', wx);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
// https://www.expressjs.com.cn/
