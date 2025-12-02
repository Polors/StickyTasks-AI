#!/bin/bash
# VPS 登录问题诊断脚本

echo "========== 1. 检查 .env 文件 =========="
if [ -f .env ]; then
    echo "✅ .env 文件存在"
    echo "内容（隐藏密码）："
    cat .env | sed 's/PASSWORD=.*/PASSWORD=***HIDDEN***/'
else
    echo "❌ .env 文件不存在！"
fi

echo ""
echo "========== 2. 检查数据库文件 =========="
if [ -f data/database.sqlite ]; then
    echo "✅ 数据库文件存在"
    ls -lh data/database.sqlite
else
    echo "⚠️  数据库文件不存在（这是正常的，会自动创建）"
fi

echo ""
echo "========== 3. 检查 Docker 容器状态 =========="
docker ps | grep desktopnote

echo ""
echo "========== 4. 查看容器日志（最后 30 行）=========="
docker logs desktopnote-app-1 --tail 30

echo ""
echo "========== 5. 测试 API 端点 =========="
echo "测试健康检查..."
curl -s http://localhost:8090/health || echo "❌ 健康检查失败"

echo ""
echo "测试登录 API..."
curl -s -X POST http://localhost:8090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"你的密码"}' \
  | head -c 200

echo ""
echo ""
echo "========== 诊断完成 =========="
