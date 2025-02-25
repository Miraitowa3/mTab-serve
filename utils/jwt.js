const { privateKey, publicKey } = require('./generateKey');
const jwt = require('jsonwebtoken');
// 封装生成 JWT 的方法
function generateJWT(payload, options = { algorithm: 'RS256', expiresIn: 60 * 60 * 2 }) {
    // 默认使用 RS256 算法
    if (!options.algorithm) {
        options.algorithm = 'RS256';
    }

    // 生成 JWT
    try {
        const token = jwt.sign(payload, privateKey, options);
        return token;
    } catch (error) {
        console.error('Error generating JWT:', error);
        throw error;
    }
}

// 封装验证 JWT 的方法
function verifyJWT(token) {
    try {
        const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
        return [true, decoded];
    } catch (error) {
        return [false, error];
    }
}
// 导出两个方法
module.exports = {
    generateJWT,
    verifyJWT
};
