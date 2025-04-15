const { verifyJWT } = require('../utils/jwt');
const whiteList = ['/wx/qrcode', '/wx/login', '/user/sendVerifyCode', '/user/register', '/user/login'];
const prefix = ['/api', '/wx', '/user'];
// 检查Token是否过期的中间件
const startsWithPrefix = (url) => {
    return prefix.some((prefix) => url.startsWith(prefix));
};
const checkTokenExpiration = (req, res, next) => {
    if (!startsWithPrefix(req.url)) {
        next();
    } else {
        if (whiteList.includes(req.url)) {
            next();
        } else {
            try {
                // 1. 从请求头获取token
                const token = req.headers.authorization?.split(' ')[1];

                if (!token) {
                    return res.status(401).json({
                        code: 401,
                        message: '未提供认证令牌'
                    });
                }

                const [flag, decoded] = verifyJWT(token);

                if (flag) {
                    req.user = decoded.uid;
                    next();
                } else {
                    res.status(401).json({
                        code: 401,
                        message: '未提供认证令牌'
                    });
                }
            } catch (error) {
                console.error('Token验证错误:', error);
                return res.status(500).json({
                    code: 500,
                    message: '服务器内部错误'
                });
            }
        }
    }
};

module.exports = checkTokenExpiration;
