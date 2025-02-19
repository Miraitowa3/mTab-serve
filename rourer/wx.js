const express = require('express');
const sha1 = require('sha1');
const config = require('../utils/config');
const axios = require('axios');
const { Msg } = require('../utils/msg');
const { getUserDataAsync, parseXMLAsync, formatMessage } = require('../utils/tool');
const router = express.Router();

let ACCESS_TOKEN = null;
let ACCESS_TOKEN_EXPIRE_TIME = null;

router.get('/', function (req, res) {
    //验证服务器有效性
    //https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Access_Overview.html

    const { signature, timestamp, nonce, echostr } = req.query;
    const arr = [timestamp, nonce, config.token].sort();
    const str = arr.join('');
    const sha1Str = sha1(str);

    if (sha1Str === signature) {
        res.send(echostr);
    } else {
        res.send('error');
    }
});

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
            appid: config.appID
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
    console.log(1111111111, data);

    sendTemplateMessage('9yG6Hc7e18y5tdrNPaPWy51T0rUr0JE__PmFUFLJKrI', {}, data.FromUserName);

    res.send('success');
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
        config.appID +
        '&secret=' +
        config.appsecret;
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

        res.send(
            Msg(200, '成功', {
                url: qrCodeUrl,
                expire_seconds: Date.now() + qrCodeData.expire_seconds * 1000 - 10 * 1000
            })
        );
    } catch (error) {
        res.send(Msg(500, '失败'));
    }
});

// 导出路由
module.exports = router;
