const express = require('express');
const sha1 = require('sha1');
const { wxConfig } = require('../utils/config');
const Db = require('../utils/Db');
const axios = require('axios');
const { Msg } = require('../utils/msg');
const { generateJWT, verifyJWT } = require('../utils/jwt');
const { getUserDataAsync, parseXMLAsync, formatMessage } = require('../utils/tool');
const router = express.Router();
const moment = require('moment');
let ACCESS_TOKEN = null;
let ACCESS_TOKEN_EXPIRE_TIME = null;

router.get('/', function (req, res) {
    //验证服务器有效性
    //https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Access_Overview.html

    const { signature, timestamp, nonce, echostr } = req.query;
    const arr = [timestamp, nonce, wxConfig.token].sort();
    const str = arr.join('');
    const sha1Str = sha1(str);

    if (sha1Str === signature) {
        res.send(echostr);
    } else {
        res.send('error');
    }
});
async function generateId(length = 10) {
    const { nanoid } = await import('nanoid');
    return nanoid(length);
}

//发送模板信息
const sendTemplateMessage = async (template_id, dat, openid) => {
    const options = {
        method: 'POST',
        url: 'https://api.weixin.qq.com/cgi-bin/message/template/send',
        params: { access_token: ACCESS_TOKEN },
        headers: { 'content-type': 'application/json' },
        data: {
            touser: openid,
            template_id: template_id,
            data: dat,
            appid: wxConfig.appID
        }
    };
    axios
        .request(options)
        .then(function (response) {
            console.log(response.data);
        })
        .catch(function (error) {
            console.error(error);
        });
};
router.post('/', async function (req, res) {
    const xmlData = await getUserDataAsync(req);
    const data = formatMessage(await parseXMLAsync(xmlData));
    if (
        (data.MsgType === 'event' && data.Event === 'SCAN' && data.Ticket) ||
        (data.MsgType === 'event' && data.Event === 'subscribe' && data.Ticket)
    ) {
        let user = await Db.select(req, `SELECT * FROM wechat_users WHERE openid='${data.FromUserName}'`);

        if (!user) {
            // 创建新用户
            const insertId = await Db.insert(req, 'users', {
                created_at: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                username: 'mTab' + (await generateId(7))
            });

            await Db.insert(req, 'wechat_users', { openid: data.FromUserName, user_id: insertId });
            user = [
                {
                    user_id: insertId
                }
            ];
        }

        let sessions = await Db.select(req, `SELECT * FROM sessions WHERE ticket='${data.Ticket}'`);
        if (!sessions[0].user_id) {
            await Db.update(
                req,
                'sessions',
                { user_id: user[0].user_id, login: '1' },
                ` WHERE id = ${sessions[0].id}`
            );
        }

        res.send('sucess');
    } else {
        res.send('');
    }
});
router.post('/login', async function (req, res) {
    const { ticket } = req.body;
    const sessions = await Db.select(req, `SELECT * FROM sessions WHERE ticket='${ticket}'`);
    if (sessions && sessions[0].user_id) {
        // // 生成会话令牌
        const token = generateJWT({
            uid: sessions[0].user_id
        });
        const [status, { exp }] = verifyJWT(token);
        if (status) {
            await Db.update(
                req,
                'sessions',
                {
                    token,
                    expires_at: moment(exp * 1000).format('YYYY-MM-DD HH:mm:ss')
                },
                ` WHERE id = ${sessions[0].id}`
            );
        }

        // 记录登录日志
        await Db.insert(req, 'login_logs', {
            user_id: sessions[0].user_id,
            login_method: 'wechat',
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
            login_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        });
        const user = await Db.select(
            req,
            `SELECT * FROM wechat_users WHERE user_id='${sessions[0].user_id}'`
        );
        await sendTemplateMessage('A1OwgajrfK49gnj8dnHK4Ae3FN022p-mSDbWCfNGBEU', {}, user[0].openid);

        res.send(Msg(200, '请求成功', { token, sucess: true }));
    } else {
        res.send(Msg(200, '请求成功', { sucess: false }));
    }
});

// 生成临时二维码
async function createTempQRCode(accessToken, sceneId) {
    const url = `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${accessToken}`;
    const data = {
        expire_seconds: 60, // 7 天有效期
        action_name: 'QR_STR_SCENE',
        action_info: {
            scene: {
                scene_id: sceneId
            }
        }
    };
    const response = await axios.post(url, data);
    return response.data;
}
async function getAccessToken() {
    if (ACCESS_TOKEN != null && ACCESS_TOKEN_EXPIRE_TIME > Date.now()) {
        return ACCESS_TOKEN;
    }

    const api =
        'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' +
        wxConfig.appID +
        '&secret=' +
        wxConfig.appsecret;
    const { data: result, status } = await axios.get(api);

    if (status === 200 && !result.errcode) {
        ACCESS_TOKEN = result.access_token;
        ACCESS_TOKEN_EXPIRE_TIME = Date.now() + result.expires_in * 1000 - 10000;
    }

    return ACCESS_TOKEN;
}

// 路由：生成二维码
router.get('/qrcode', async (req, res) => {
    try {
        const accessToken = await getAccessToken();
        const qrCodeData = await createTempQRCode(accessToken, 123); // 临时二维码
        const qrCodeUrl = `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(
            qrCodeData.ticket
        )}`;
        await Db.insert(req, 'sessions', {
            ticket: qrCodeData.ticket,
            login: '0'
        });
        res.send(
            Msg(200, '请求成功', {
                url: qrCodeUrl,
                ticket: qrCodeData.ticket,
                expire_seconds: Date.now() + qrCodeData.expire_seconds * 1000 - 10 * 1000
            })
        );
    } catch (error) {
        res.send(Msg(500, '请求失败'));
    }
});

// 导出路由
module.exports = router;
