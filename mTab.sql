-- 创建数据库 mTab
CREATE DATABASE IF NOT EXISTS mTab;
USE mTab;

-- 创建 users 表
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY, -- 用户唯一 ID
    username VARCHAR(255) UNIQUE,      -- 用户名（用于账号密码登录）
    password_hash VARCHAR(255),        -- 密码哈希值（用于账号密码登录）
    email VARCHAR(255) UNIQUE,         -- 邮箱（可选，用于账号密码登录）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- 更新时间
);

-- 创建 wechat_users 表
CREATE TABLE wechat_users (
    id INT AUTO_INCREMENT PRIMARY KEY, -- 微信用户记录 ID
    user_id INT UNIQUE,               -- 关联到 users 表的 id
    openid VARCHAR(255) UNIQUE,       -- 微信用户的唯一标识
    unionid VARCHAR(255) UNIQUE,      -- 微信开放平台的唯一标识（可选）
    nickname VARCHAR(255),            -- 微信昵称
    avatar_url VARCHAR(255),          -- 微信头像
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE -- 外键关联到 users 表
);



-- 创建 sessions 表
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY, -- 会话记录 ID
    user_id INT,                       -- 关联到 users 表的 id
    session_token VARCHAR(255) UNIQUE, -- 会话令牌
    expires_at TIMESTAMP,              -- 会话过期时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE -- 外键关联到 users 表
);

-- 创建 login_logs 表
CREATE TABLE login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY, -- 登录日志记录 ID
    user_id INT,                       -- 关联到 users 表的 id
    login_method ENUM('password', 'wechat'), -- 登录方式
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 登录时间
    ip_address VARCHAR(45),            -- 登录 IP 地址
    user_agent VARCHAR(255),           -- 用户代理（浏览器信息）
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE -- 外键关联到 users 表
);
