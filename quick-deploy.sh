#!/bin/bash
# 快速部署脚本 - 在 VPS 上运行

echo "========== 停止容器 =========="
docker compose down

echo ""
echo "========== 重新构建（不使用缓存）=========="
docker compose build --no-cache

echo ""
echo "========== 启动容器 =========="
docker compose up -d

echo ""
echo "========== 等待 5 秒 =========="
sleep 5

echo ""
echo "========== 查看日志 =========="
docker compose logs --tail 50

echo ""
echo "========== 部署完成 =========="
echo "请访问: http://192.3.180.201:8090"
