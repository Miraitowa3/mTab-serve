-- 创建数据库
CREATE DATABASE IF NOT EXISTS mTab;
USE mTab;

-- 用户表 (users)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,          -- 用户ID
    username VARCHAR(50) UNIQUE,               -- 用户名（唯一）
    email VARCHAR(100) UNIQUE,                 -- 邮箱（唯一）
    phone VARCHAR(20) UNIQUE,                  -- 手机号（唯一）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- 更新时间
);

-- 微信登录信息表 (wechat_users)
CREATE TABLE IF NOT EXISTS wechat_users (
    id INT AUTO_INCREMENT PRIMARY KEY,          -- 微信登录信息ID
    user_id INT,                                -- 关联的用户ID
    app_type ENUM('wechat_web', 'wechat_app', 'wechat_miniprogram') NOT NULL, -- 应用类型
    openid VARCHAR(100) NOT NULL,               -- 微信用户的唯一标识（针对单个应用）
    unionid VARCHAR(100),                       -- 微信开放平台唯一标识（跨应用唯一）
    nickname VARCHAR(100),                      -- 微信昵称
    avatar_url VARCHAR(255),                    -- 微信头像URL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 更新时间
    UNIQUE KEY (app_type, openid),              -- 同一个应用下 openid 唯一
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 账号密码登录信息表 (local_auth)
CREATE TABLE IF NOT EXISTS local_auth (
    id INT AUTO_INCREMENT PRIMARY KEY,          -- 账号密码登录信息ID
    user_id INT,                                -- 关联的用户ID
    password_hash VARCHAR(255) NOT NULL,       -- 密码哈希值
    salt VARCHAR(50) NOT NULL,                  -- 密码盐值
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 登录日志表 (login_logs)
CREATE TABLE IF NOT EXISTS login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,          -- 登录日志ID
    user_id INT,                                -- 关联的用户ID
    login_type ENUM('wechat', 'local') NOT NULL, -- 登录方式：微信或账号密码
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 登录时间
    ip_address VARCHAR(50),                     -- 登录IP地址
    device_info VARCHAR(255),                   -- 设备信息
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 示例数据（可选）
-- 插入一个用户
INSERT INTO users (username, email, phone) VALUES ('testuser', 'test@example.com', '12345678901');

-- 插入微信登录信息
INSERT INTO wechat_users (user_id, app_type, openid, unionid, nickname, avatar_url)
VALUES (1, 'wechat_web', 'openid123', 'unionid123', '微信昵称', 'https://example.com/avatar.jpg');

-- 插入账号密码登录信息
INSERT INTO local_auth (user_id, password_hash, salt)
VALUES (1, 'hashedpassword123', 'randomsalt123');

-- 插入登录日志
INSERT INTO login_logs (user_id, login_type, ip_address, device_info)
VALUES (1, 'wechat', '192.168.1.1', 'iPhone 12');
