-- 设置管理员用户
-- 将指定的 openId 用户设置为管理员角色

UPDATE users 
SET role = 'admin', updatedAt = NOW() 
WHERE openId = 'ou_3866bac2d064091ea8e3bfb7e10b33ed';

-- 如果用户不存在，则插入一个管理员用户
INSERT INTO users (openId, name, role, loginMethod, createdAt, updatedAt, lastSignedIn)
SELECT 'ou_3866bac2d064091ea8e3bfb7e10b33ed', 'Admin', 'admin', 'feishu', NOW(), NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE openId = 'ou_3866bac2d064091ea8e3bfb7e10b33ed'
);
