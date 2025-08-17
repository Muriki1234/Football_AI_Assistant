#!/bin/bash

# 安装 CloudBase CLI（如果未安装）
if ! command -v tcb &> /dev/null; then
    npm install -g @cloudbase/cli
fi

# 登录 CloudBase
tcb login

# 构建前端
cd frontend
npm run build
cd ..

# 部署到 CloudBase
tcb framework deploy
