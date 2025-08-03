# 足球视频分析应用

这是一个使用 Flask、OpenCV 和 Google Gemini AI 的足球视频分析应用程序。该应用程序可以分析足球视频中的特定帧，检测球员、裁判和足球，并使用 Gemini AI 提供球员位置和表现的深度分析。

## 功能特点

- 上传足球视频并选择特定时间点进行分析
- 使用计算机视觉检测球员、裁判和足球
- 交互式界面，可点击选择特定球员
- 使用 Google Gemini AI 分析球员位置和表现
- 将分析结果保存到 Supabase 数据库
- 支持两种球员坐标格式：
  - [x, y] - 点坐标
  - {x, y, width, height} - 边界框
- 详细的错误处理和友好的用户提示
- 分析过程中的实时加载指示器

## 安装要求

- Python 3.8+
- Flask
- OpenCV
- NumPy
- Roboflow (用于对象检测)
- Google Generative AI Python SDK
- Supabase Python 客户端
- Pillow (PIL)

## 设置步骤

1. 克隆仓库：

```bash
git clone <repository-url>
cd video_app
```

2. 安装依赖：

```bash
pip install -r requirements.txt
```

3. 设置环境变量：

```bash
# Linux/macOS
export GEMINI_API_KEY="your_gemini_api_key"
export SUPABASE_URL="your_supabase_url"
export SUPABASE_KEY="your_supabase_key"
export ROBOFLOW_API_KEY="your_roboflow_api_key"

# Windows
set GEMINI_API_KEY=your_gemini_api_key
set SUPABASE_URL=your_supabase_url
set SUPABASE_KEY=your_supabase_key
set ROBOFLOW_API_KEY=your_roboflow_api_key
```

或者，你可以在 `app.py` 文件中直接设置这些值（不推荐用于生产环境）。

## 获取 API 密钥

### Google Gemini API

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登录你的 Google 账户
3. 创建一个 API 密钥
4. 复制 API 密钥并设置为环境变量 `GEMINI_API_KEY`

### Roboflow API

1. 注册 [Roboflow](https://roboflow.com/) 账户
2. 创建一个新项目或使用现有项目
3. 在项目设置中找到 API 密钥
4. 复制 API 密钥并设置为环境变量 `ROBOFLOW_API_KEY`

### Supabase API

1. 注册 [Supabase](https://supabase.com/) 账户
2. 创建一个新项目
3. 在项目设置中找到 URL 和 API 密钥
4. 复制 URL 和 API 密钥，并设置为环境变量 `SUPABASE_URL` 和 `SUPABASE_KEY`

## 运行应用

```bash
python app.py
```

应用将在 http://127.0.0.1:5000/ 上运行。

## 使用说明

1. 打开浏览器访问 http://127.0.0.1:5000/frame_analysis
2. 上传足球视频文件
3. 使用时间滑块选择要分析的视频时间点
4. 点击"分析当前时间点"按钮
5. 在分析结果中，点击球员框选择特定球员
6. 点击"AI分析球员位置"按钮，使用 Gemini AI 分析选中的球员

## 数据库结构

应用使用 Supabase 数据库存储分析结果。数据库应包含以下表：

- `analysis_results`：存储视频分析结果
- `player_detections`：存储检测到的球员信息

## 许可证

[MIT License](LICENSE)