#!/bin/bash

# DocuMind API 测试脚本
# 用于测试REST API接口的基本功能

BASE_URL="http://localhost:3000"

echo "========================================="
echo "DocuMind API 测试"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 测试健康检查
echo "1. 测试健康检查 GET /health"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ 健康检查通过${NC}"
    echo "$body" | jq '.'
else
    echo -e "${RED}✗ 健康检查失败 (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# 测试创建实体
echo "2. 测试创建实体 POST /api/entities"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/entities" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "entity-test-001",
    "type": "document",
    "title": "测试文档",
    "status": "active",
    "documentUrl": "https://larksuite.com/docx/test001",
    "metadata": {
      "author": "Test User",
      "tags": ["test", "api"]
    }
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ 创建实体成功${NC}"
    echo "$body" | jq '.'
else
    echo -e "${RED}✗ 创建实体失败 (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# 测试获取实体详情
echo "3. 测试获取实体详情 GET /api/entities/entity-test-001"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/entities/entity-test-001")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ 获取实体详情成功${NC}"
    echo "$body" | jq '.'
else
    echo -e "${RED}✗ 获取实体详情失败 (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# 测试查询实体列表
echo "4. 测试查询实体列表 GET /api/entities?page=1&page_size=5"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/entities?page=1&page_size=5")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ 查询实体列表成功${NC}"
    echo "$body" | jq '.'
else
    echo -e "${RED}✗ 查询实体列表失败 (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# 测试搜索
echo "5. 测试搜索 GET /api/search?q=测试"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/search?q=测试")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ 搜索成功${NC}"
    echo "$body" | jq '.'
else
    echo -e "${RED}✗ 搜索失败 (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# 测试统计信息
echo "6. 测试统计信息 GET /api/stats"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/stats")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ 获取统计信息成功${NC}"
    echo "$body" | jq '.'
else
    echo -e "${RED}✗ 获取统计信息失败 (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# 测试批量创建
echo "7. 测试批量创建 POST /api/entities/batch"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/entities/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "entities": [
      {
        "id": "entity-test-002",
        "type": "document",
        "title": "批量测试文档1",
        "status": "active"
      },
      {
        "id": "entity-test-003",
        "type": "document",
        "title": "批量测试文档2",
        "status": "active"
      }
    ]
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ 批量创建成功${NC}"
    echo "$body" | jq '.'
else
    echo -e "${RED}✗ 批量创建失败 (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

echo "========================================="
echo "测试完成"
echo "========================================="
