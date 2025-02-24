const crypto = require('crypto');

// 生成 RSA 密钥对
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048, // 密钥长度
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});

module.exports = {
    publicKey,
    privateKey
};
