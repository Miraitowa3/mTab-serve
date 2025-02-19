// 获取二维码并展示
async function getQRCode() {
    try {
        const response = await fetch('http://snows.free.idcfengye.com/wx/qrcode');
        const data = await response.json();
        const qrcodeDiv = document.getElementById('qrcode');
        qrcodeDiv.innerHTML = `<img src="${data.qrCodeUrl}" alt="微信登录二维码">`;
    } catch (error) {
        console.error('获取二维码失败:', error);
    }
}

// 检查登录状态
async function checkLoginStatus() {
    try {
        const response = await fetch('http://snows.free.idcfengye.com/wx/cc');
        const data = await response.json();
        if (data.success) {
            // 登录成功，显示用户信息
            document.getElementById('user-info').style.display = 'block';
            document.getElementById('user-data').textContent = JSON.stringify(data.userInfo, null, 2);
            clearInterval(checkInterval); // 停止轮询
        }
    } catch (error) {
        console.error('检查登录状态失败:', error);
    }
}

// 初始化
getQRCode();
// const checkInterval = setInterval(checkLoginStatus, 3000); // 每3秒检查一次登录状态
