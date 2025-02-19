const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const wx = require('./rourer/wx');
const port = 3000;
// 使用cors中间件
app.use(cors());
// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'pubilc')));

app.use('/wx', wx);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
// https://www.expressjs.com.cn/
