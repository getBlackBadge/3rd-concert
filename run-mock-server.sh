#!/bin/bash

# OpenAPI 파일 경로 설정
OPENAPI_FILE="./docs/api-spec.yaml"

# 사용할 포트 번호 설정 dev:3001, test:3005 로 쓸 예정
PORT=3005

# npm install 실행
echo "Installing dependencies from package.json..."
npm install

# Prism으로 목 서버 실행
echo "Starting Prism mock server with OpenAPI spec: $OPENAPI_FILE on port $PORT"
npx prism mock $OPENAPI_FILE -p $PORT
