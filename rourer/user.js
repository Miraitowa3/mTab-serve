const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { Msg } = require('../utils/msg');
const Db = require('../utils/Db');
// 生成随机验证码
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
// 创建Nodemailer传输器
const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com', // 例如 'gmail', 'hotmail'
    port: 465, // SMTP端口，465为SSL端口
    secure: true, // true for 465, false for other ports
    auth: {
        user: 'snows_l@qq.com', // 你的邮箱地址
        pass: 'ihaowucezjbibgdd' // 你的邮箱密码或应用专用密码
    }
});

router.post('/sendVerifyCode', async (req, res) => {
    const { email } = req.body;
    let data = await Db.select(req, `SELECT * FROM captcha WHERE email='${email}'`);
    if (!data) {
        // 邮件内容
        const code = generateVerificationCode();
        const mailOptions = {
            from: 'snows_l@qq.com', // 发件人地址
            to: email, // 收件人地址
            subject: '验证码', // 邮件主题
            text: `您的验证码是: ${code}` // 邮件内容
        };

        // 发送邮件
        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                console.log('Error occurred:', error);
            } else {
                await Db.insert(req, 'captcha', { email, code });
                res.send(Msg(200, '请求验证码发送成功,请进入邮箱查看成功', ''));
            }
        });
    } else {
        if (data[0].user_id) {
            res.send(Msg(500, '此邮箱已注册', ''));
        } else {
            // 邮件内容
            const code = generateVerificationCode();
            const mailOptions = {
                from: 'snows_l@qq.com', // 发件人地址
                to: email, // 收件人地址
                subject: '验证码', // 邮件主题
                text: `您的验证码是: ${code}` // 邮件内容
            };

            // 发送邮件
            transporter.sendMail(mailOptions, async (error, info) => {
                if (error) {
                    console.log('Error occurred:', error);
                } else {
                    await Db.update(req, 'captcha', { code }, ` WHERE email = '${email}'`);
                    res.send(Msg(200, '请求验证码发送成功,请进入邮箱查看成功', ''));
                }
            });
        }
    }
});
module.exports = router;
