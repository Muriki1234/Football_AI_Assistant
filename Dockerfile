FROM python:3.9-slim

# 设置时区
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

# 安装系统依赖（移除 libgl1-mesa-glx）
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1 \
    libgthread-2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
# 安装Python依赖并升级pip
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple


# 复制应用代码
COPY . .

# 创建临时目录
RUN mkdir -p /tmp/video_analysis

# 暴露端口（只是声明，不影响实际运行）
EXPOSE 8080

# 启动命令 - 使用环境变量 PORT，而不是写死 8080
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-8080} --timeout 300 --workers 1 app:app"]

