const express = require('express');
const router = express.Router();
const { Msg } = require('../utils/msg');
const Db = require('../utils/Db');
const SendEmail = require('../utils/SendEmail');
const { generateVerificationCode } = require('../utils/tool');
const moment = require('moment');
const { generateJWT, verifyJWT } = require('../utils/jwt');

//发送邮箱验证码
router.post('/sendVerifyCode', async (req, res) => {
    const { email } = req.body;
    const code = generateVerificationCode();

    let data = await Db.select(req, `SELECT * FROM captcha WHERE email='${email}'`);
    if (!data) {
        // 邮件内容

        let [status, data] = await SendEmail.sendSimpleEmail({
            from: 'snows_l@qq.com', // 发件人地址
            to: email, // 收件人地址
            subject: '验证码', // 邮件主题
            text: `您的验证码是: ${code}` // 邮件内容
        });

        if (status) {
            await Db.insert(req, 'captcha', {
                email,
                code,
                expires_at: new Date().getTime() + 60 * 1000 + ''
            });

            res.send(Msg(200, '请求验证码发送成功,请进入邮箱查看成功', ''));
        } else {
            res.send(Msg(500, '验证码发送失败,请稍后再试', ''));
        }
    } else {
        if (data[0].user_id) {
            res.send(Msg(500, '此邮箱已注册', ''));
        } else {
            let [status, data] = await SendEmail.sendSimpleEmail({
                from: 'snows_l@qq.com', // 发件人地址
                to: email, // 收件人地址
                subject: '验证码', // 邮件主题
                text: `您的验证码是: ${code}` // 邮件内容
            });
            if (status) {
                await Db.update(
                    req,
                    'captcha',
                    { code, expires_at: new Date().getTime() + 60 * 1000 },
                    ` WHERE email = '${email}'`
                );
                res.send(Msg(200, '请求验证码发送成功,请进入邮箱查看成功', ''));
            } else {
                res.send(Msg(500, '验证码发送失败,请稍后再试', ''));
            }
        }
    }
});
router.post('/register', async (req, res) => {
    const { email, password, code, username } = req.body;
    const data = await Db.select(req, `SELECT * FROM captcha WHERE email='${email}'`);

    if (!data) {
        res.send(Msg(500, '请发送验证码', ''));
    } else {
        if (data[0].user_id) {
            res.send(Msg(500, '此邮箱已注册', ''));
        } else {
            if (data[0].code != code) {
                res.send(Msg(500, '验证码错误', ''));
            } else {
                if (data[0].expires_at * 1 < new Date().getTime()) {
                    res.send(Msg(500, '验证码已过期', ''));
                } else {
                    const user = await Db.select(req, `SELECT * FROM users WHERE username='${username}'`);
                    if (!user) {
                        const insertId = await Db.insert(req, 'users', {
                            created_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                            updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                            username: username,
                            password_hash: password,
                            email: email
                        });
                        await Db.update(req, 'captcha', { user_id: insertId }, ` WHERE email = '${email}'`);
                        res.send(Msg(200, '注册成功', ''));
                    } else {
                        res.send(Msg(500, '用户名已存在', ''));
                    }
                }
            }
        }
    }
});
router.post('/update', async (req, res) => {
    let data = req.body;

    const [{ count }] = await Db.select(
        req,
        `SELECT COUNT(*) as count FROM user_info WHERE user_id='${req.user}'`
    );

    if (count >= 5) {
        await Db.delete(
            req,
            `DELETE FROM user_info WHERE user_id='${req.user}' ORDER BY create_time ASC LIMIT 1`
        );
    }
    const create_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    await Db.insert(req, 'user_info', {
        create_time: create_time,
        config: JSON.stringify(data),
        user_id: req.user
    });
    res.send(
        Msg(200, '成功', {
            create_time: create_time
        })
    );
});
router.get('/config', async (req, res) => {
    let data;
    if (req.query.id) {
        data = await Db.select(req, `SELECT * FROM user_info WHERE id='${req.query.id}'`);
    } else {
        data = await Db.select(
            req,
            `SELECT * FROM user_info WHERE user_id='${req.user}' ORDER BY create_time DESC LIMIT 1`
        );
    }

    if (data && data.length > 0) {
        res.send(
            Msg(200, '成功', {
                id: data[0].id,
                config: JSON.parse(data[0].config),
                create_time: data[0].create_time
            })
        );
    } else {
        res.send(Msg(500, '未找到配置信息', {}));
    }
});
router.get('/history', async (req, res) => {
    const data = await Db.select(
        req,
        `SELECT * FROM user_info WHERE user_id='${req.user}' ORDER BY create_time DESC`
    );
    if (data && data.length > 0) {
        res.send(
            Msg(
                200,
                '成功',
                data.map((item) => ({
                    id: item.id,
                    create_time: item.create_time
                }))
            )
        );
    } else {
        res.send(Msg(500, '失败', {}));
    }
});
router.post('/delhistory', async (req, res) => {
    let { id } = req.body;
    if (id) {
        await Db.delete(req, `DELETE FROM user_info WHERE id='${id}'`);
        res.send(Msg(200, '成功', {}));
    } else {
        res.send(Msg(500, '失败', {}));
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const data = await Db.select(req, `SELECT * FROM users WHERE email='${email}'`);
    if (data) {
        if (data[0].password_hash === password) {
            // 记录登录日志

            await Db.insert(req, 'login_logs', {
                user_id: data[0].id,
                login_method: 'password',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
                login_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
            });
            // // 生成会话令牌
            const token = generateJWT({
                uid: data[0].id
            });

            res.send(
                Msg(200, '登录成功', {
                    token,
                    userInfo: { username: data[0].username, email: data[0].email }
                })
            );
        } else {
            res.send(Msg(500, '密码错误', ''));
        }
    } else {
        res.send(Msg(500, '账号不存在', ''));
    }
});
module.exports = router;
