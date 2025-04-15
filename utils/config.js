exports.wxConfig = {
    appID: 'wxeff32d8f2e0a7fbb',
    appsecret: '9ff8432313eb0ef5bd355324ed745eb3',
    token: 'ewrerqwerqwer'
};
// 数据库连接参数
exports.dbConfig = {
    host: 'localhost', //主机名
    user: 'root', //用户名
    // password: 'Snow100107@', //密码
    password: '123456', //密码

    port: 3306,
    database: 'mTab', //库名
    connectionLimit: 10 // 连接池大小
};
exports.emailConfig = {
    host: 'smtp.qq.com', // 例如 'gmail', 'hotmail'
    port: 465, // SMTP端口，465为SSL端口
    secure: true, // true for 465, false for other ports
    auth: {
        user: 'snows_l@qq.com', // 你的邮箱地址
        pass: 'ihaowucezjbibgdd' // 你的邮箱密码或应用专用密码
    }
};
