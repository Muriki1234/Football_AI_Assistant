import os
try:
    import cv2
    print("OpenCV导入成功")
except Exception as e:
    print(f"OpenCV导入失败: {e}")
    cv2 = None
import numpy as np
import json
from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
from roboflow import Roboflow
from supabase import create_client, Client
import tempfile
import shutil
from datetime import datetime
import google.generativeai as genai

from dotenv import load_dotenv
load_dotenv()

# 配置Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# 使用临时文件夹代替永久存储
TEMP_FOLDER = tempfile.mkdtemp()
app = Flask(__name__)

# 配置CORS - Railway域名通常是 *.railway.app
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:3000",
            "https://*.railway.app",
            "https://*.tcloudbaseapp.com",
            "https://cloud1-2g1ltb323fb30dca-1374423658.tcloudbaseapp.com"  # 您的前端域名
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# 增加文件上传大小限制 (Railway支持更大文件)
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB

# Roboflow 模型配置
API_KEY = os.getenv("ROBOFLOW_API_KEY")
MODEL_ID = "football-players-detection-3zvbc-lkn9q"
MODEL_VERSION = 1

if API_KEY:
    rf = Roboflow(api_key=API_KEY)
    project = rf.workspace().project(MODEL_ID)
    model = project.version(MODEL_VERSION).model
else:
    model = None
    print("Warning: ROBOFLOW_API_KEY not found")

# Supabase 配置
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BUCKET_NAME = "videos"

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None
    print("Warning: Supabase credentials not found")

def cleanup_file(file_path):
    """安全删除文件"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"已删除临时文件: {file_path}")
    except Exception as e:
        print(f"删除文件时出错: {e}")

def upload_to_supabase(file_path: str, target_name: str) -> str:
    """上传文件到 Supabase 并返回公共链接"""
    try:
        with open(file_path, "rb") as f:
            try:
                supabase.storage.from_(BUCKET_NAME).remove([target_name])
            except Exception as e:
                print(f"删除文件时出错（可能文件不存在）: {e}")
                pass
            
            res = supabase.storage.from_(BUCKET_NAME).upload(
                path=target_name,
                file=f
            )
        
        if hasattr(res, 'error') and res.error:
            raise Exception(f"上传 Supabase 失败: {res.error}")
        
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{target_name}"
        print(f"文件上传成功: {public_url}")
        return public_url
    
    except Exception as e:
        print(f"上传过程中出错: {e}")
        raise e

@app.route("/test_post", methods=["POST"])
def test_post():
    return {"message": "Hello World"}, 200

@app.route("/frame_analysis")
def frame_analysis():
    """渲染单帧分析页面"""
    return render_template("frame_analysis.html")

@app.route("/", methods=["GET"])
def index():
    """主页 - 重定向到单帧分析页面"""
    return render_template("frame_analysis.html")

@app.route("/analyze_frame", methods=["POST"])
def analyze_frame():
    """分析视频的单帧"""
    try:
        print("=== analyze_frame 开始 ===")
        print(f"请求方法: {request.method}")
        print(f"Content-Type: {request.content_type}")
        print(f"文件数量: {len(request.files)}")
        print(f"表单数据: {list(request.form.keys())}")
        
        if request.method == "POST":
            file = request.files.get("video")
            if not file:
                print("❌ 错误: 没有收到视频文件")
                return jsonify({"error": "No file uploaded"}), 400

            print(f"✅ 收到文件: {file.filename}")
            print(f"✅ 文件大小: {file.content_length if hasattr(file, 'content_length') else '未知'}")
            
            # 检查环境变量
            if not API_KEY:
                print("❌ 错误: ROBOFLOW_API_KEY 未设置")
                return jsonify({"error": "ROBOFLOW_API_KEY not configured"}), 500
                
            if not SUPABASE_URL or not SUPABASE_KEY:
                print("❌ 错误: Supabase配置不完整")
                return jsonify({"error": "Supabase configuration incomplete"}), 500
                
            print("✅ 环境变量检查通过")

            # 生成唯一的文件名
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{timestamp}_{file.filename}"
            
            # 使用临时文件路径
            temp_input_path = os.path.join(TEMP_FOLDER, filename)
            print(f"✅ 临时文件路径: {temp_input_path}")
            
            try:
                file.save(temp_input_path)
                print("✅ 文件保存成功")
            except Exception as save_error:
                print(f"❌ 文件保存失败: {str(save_error)}")
                return jsonify({"error": f"文件保存失败: {str(save_error)}", "success": False}), 500

            try:
                # 打开视频并获取基本信息
                print("🎬 开始处理视频...")
                cap = cv2.VideoCapture(temp_input_path)
                
                if not cap.isOpened():
                    print("❌ 无法打开视频文件")
                    cleanup_file(temp_input_path)
                    return jsonify({"error": "无法打开视频文件，请检查文件格式", "success": False}), 500
                
                fps = cap.get(cv2.CAP_PROP_FPS)
                total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                video_duration = cap.get(cv2.CAP_PROP_FRAME_COUNT) / fps if fps > 0 else 0
                print(f"✅ 视频信息: 帧率={fps:.2f}fps, 时长={video_duration:.2f}秒, 总帧数={total_frames}")
                
                # 获取请求中指定的时间戳
                time_in_seconds = request.form.get("time_in_seconds")
                requested_time = 0.0
                
                if time_in_seconds:
                    try:
                        requested_time = float(time_in_seconds)
                        # 确保时间在有效范围内
                        requested_time = max(0.0, min(requested_time, video_duration))
                        print(f"✅ 前端请求的时间: {requested_time:.3f}秒")
                    except ValueError:
                        print(f"⚠️ 无效的时间值: {time_in_seconds}，使用默认值")
                        requested_time = video_duration / 2
                else:
                    # 默认使用中间时间
                    requested_time = video_duration / 2
                    print(f"✅ 未指定时间，使用默认中间时间: {requested_time:.3f}秒")
                
                # 使用时间戳定位
                cap.set(cv2.CAP_PROP_POS_MSEC, requested_time * 1000)
                actual_time = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000
                actual_frame = int(cap.get(cv2.CAP_PROP_POS_FRAMES))
                print(f"✅ 实际定位到: 时间={actual_time:.3f}秒, 帧={actual_frame}")
                
                # 读取帧
                ret, frame = cap.read()
                if not ret:
                    print("❌ 无法提取视频帧")
                    cap.release()
                    cleanup_file(temp_input_path)
                    return jsonify({"error": "Failed to extract frame from video"}), 500
                
                print("✅ 视频帧提取成功")
                
                # 保存帧为图像文件
                frame_path = os.path.join(TEMP_FOLDER, f"{timestamp}_frame.jpg")
                cv2.imwrite(frame_path, frame)
                print(f"✅ 帧图像保存: {frame_path}")
                
                # 调用Roboflow API分析单帧
                print("🤖 开始Roboflow分析...")
                try:
                    prediction = model.predict(frame_path, confidence=40, overlap=30).json()
                    print(f"✅ Roboflow分析完成，检测到 {len(prediction.get('predictions', []))} 个对象")
                except Exception as roboflow_error:
                    print(f"❌ Roboflow分析失败: {str(roboflow_error)}")
                    cap.release()
                    cleanup_file(temp_input_path)
                    cleanup_file(frame_path)
                    return jsonify({"error": f"AI分析失败: {str(roboflow_error)}", "success": False}), 500
                
                # 处理预测结果
                h, w = frame.shape[:2]
                print(f"✅ 图像尺寸: {w}x{h}")
                
                # 创建带有标注的图像
                annotated_frame = frame.copy()
                
                # 存储检测到的球员信息，用于前端交互
                players_data = []
                
                # 绘制检测结果
                print("🎨 开始绘制检测结果...")
                for pred in prediction['predictions']:
                    # 获取边界框坐标
                    x = pred['x']
                    y = pred['y']
                    width = pred['width']
                    height = pred['height']
                    
                    # 计算边界框的左上角和右下角坐标
                    x1 = int(x - width/2)
                    y1 = int(y - height/2)
                    x2 = int(x + width/2)
                    y2 = int(y + height/2)
                    
                    # 确保坐标在图像范围内
                    x1 = max(0, x1)
                    y1 = max(0, y1)
                    x2 = min(w, x2)
                    y2 = min(h, y2)
                    
                    # 根据类别选择颜色和标签
                    if pred['class'] == 'ball':
                        # 球的特殊标记 - 使用渐变光晕效果
                        center = (int(x), int(y))
                        
                        # 1. 绘制外部光晕效果
                        for r in range(20, 10, -1):
                            alpha = (20 - r) / 10  # 渐变透明度
                            color = (0, int(255 * alpha), int(255 * alpha))  # 渐变黄色
                            overlay = annotated_frame.copy()
                            cv2.circle(overlay, center, r, color, 2)
                            cv2.addWeighted(overlay, 0.3, annotated_frame, 0.7, 0, annotated_frame)
                        
                        # 2. 绘制主圆圈 - 明亮的黄色
                        cv2.circle(annotated_frame, center, 12, (0, 255, 255), 2)
                        
                        # 3. 绘制内部圆圈 - 白色高光
                        cv2.circle(annotated_frame, center, 8, (255, 255, 255), -1)
                        
                        # 4. 绘制中心点 - 黄色
                        cv2.circle(annotated_frame, center, 4, (0, 200, 255), -1)
                        
                        label = "Ball"
                        
                    elif pred['class'] == 'referee':
                        # 裁判员使用轻量级角标记设计 - 与球员相同但颜色为紫色
                        label = "Referee"
                        
                        # 使用鲜艳紫色作为主色调
                        corner_color = (255, 0, 255)  # 鲜艳紫色/品红色
                        
                        # 只添加角标记 - 不绘制填充矩形和完整边框
                        corner_length = min(20, (x2-x1)//3, (y2-y1)//3)  # 角标记长度
                        thickness = 2  # 角标记粗细
                        
                        # 左上角
                        cv2.line(annotated_frame, (x1, y1), (x1 + corner_length, y1), corner_color, thickness)
                        cv2.line(annotated_frame, (x1, y1), (x1, y1 + corner_length), corner_color, thickness)
                        
                        # 右上角
                        cv2.line(annotated_frame, (x2, y1), (x2 - corner_length, y1), corner_color, thickness)
                        cv2.line(annotated_frame, (x2, y1), (x2, y1 + corner_length), corner_color, thickness)
                        
                        # 左下角
                        cv2.line(annotated_frame, (x1, y2), (x1 + corner_length, y2), corner_color, thickness)
                        cv2.line(annotated_frame, (x1, y2), (x1, y2 - corner_length), corner_color, thickness)
                        
                        # 右下角
                        cv2.line(annotated_frame, (x2, y2), (x2 - corner_length, y2), corner_color, thickness)
                        cv2.line(annotated_frame, (x2, y2), (x2, y2 - corner_length), corner_color, thickness)
                        
                    else:
                        # 球员使用轻量级角标记设计 - 不使用填充边界框
                        label = "Player"
                        
                        # 使用橙色作为主色调
                        corner_color = (255, 128, 0)  # 橙色
                        
                        # 只添加角标记 - 不绘制填充矩形和完整边框
                        corner_length = min(20, (x2-x1)//3, (y2-y1)//3)  # 角标记长度
                        thickness = 2  # 角标记粗细
                        
                        # 左上角
                        cv2.line(annotated_frame, (x1, y1), (x1 + corner_length, y1), corner_color, thickness)
                        cv2.line(annotated_frame, (x1, y1), (x1, y1 + corner_length), corner_color, thickness)
                        
                        # 右上角
                        cv2.line(annotated_frame, (x2, y1), (x2 - corner_length, y1), corner_color, thickness)
                        cv2.line(annotated_frame, (x2, y1), (x2, y1 + corner_length), corner_color, thickness)
                        
                        # 左下角
                        cv2.line(annotated_frame, (x1, y2), (x1 + corner_length, y2), corner_color, thickness)
                        cv2.line(annotated_frame, (x1, y2), (x1, y2 - corner_length), corner_color, thickness)
                        
                        # 右下角
                        cv2.line(annotated_frame, (x2, y2), (x2 - corner_length, y2), corner_color, thickness)
                        cv2.line(annotated_frame, (x2, y2), (x2, y2 - corner_length), corner_color, thickness)
                        
                        # 添加小型ID标签在边界框顶部
                        player_id = len(players_data) + 1
                        id_text = f"P{player_id}"
                        text_size = cv2.getTextSize(id_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)[0]
                        text_x = x1 + (x2 - x1 - text_size[0]) // 2  # 居中
                        text_y = y1 - 5  # 边界框上方
                        
                        # 确保文本在图像内
                        if text_y < 15:
                            text_y = y1 + 15
                        
                        # 绘制文本背景
                        cv2.rectangle(annotated_frame, 
                                     (text_x - 2, text_y - text_size[1] - 2),
                                     (text_x + text_size[0] + 2, text_y + 2),
                                     (0, 0, 0), -1)
                        
                        # 绘制文本
                        cv2.putText(annotated_frame, id_text, (text_x, text_y), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                        
                        # 存储球员信息用于前端交互
                        player_id = len(players_data) + 1  # 简单的ID分配
                        players_data.append({
                            "id": player_id,
                            "bbox": [x1, y1, x2, y2],
                            "center": [int(x), int(y)]
                        })
                
                print(f"✅ 检测结果绘制完成，球员数量: {len(players_data)}")
                
                # 保存标注后的图像
                annotated_frame_path = os.path.join(TEMP_FOLDER, f"{timestamp}_annotated_frame.jpg")
                cv2.imwrite(annotated_frame_path, annotated_frame)
                print(f"✅ 标注图像保存: {annotated_frame_path}")
                
                # 上传到Supabase
                print("☁️ 开始上传到Supabase...")
                try:
                    supabase_path = f"frame_analysis/{timestamp}_annotated_frame.jpg"
                    public_url = upload_to_supabase(annotated_frame_path, supabase_path)
                    print(f"✅ Supabase上传成功: {public_url}")
                except Exception as upload_error:
                    print(f"❌ Supabase上传失败: {str(upload_error)}")
                    cap.release()
                    cleanup_file(temp_input_path)
                    cleanup_file(frame_path)
                    cleanup_file(annotated_frame_path)
                    return jsonify({"error": f"图像上传失败: {str(upload_error)}", "success": False}), 500
                
                # 构建响应数据
                response_data = {
                    "time_in_seconds": actual_time,
                    "annotated_frame_url": public_url,
                    "predictions": prediction['predictions'],
                    "players_data": players_data,
                    "image_dimensions": {"width": w, "height": h},
                    "success": True,
                    "video_duration": video_duration,
                    "gemini_analysis": "请使用Gemini AI分析功能上传整个视频进行分析"
                }
                
                print("✅ analyze_frame 处理完成，返回成功响应")
                return jsonify(response_data)
                
            except Exception as processing_error:
                print(f"❌ 视频处理过程中出错: {str(processing_error)}")
                import traceback
                print("详细错误堆栈:")
                print(traceback.format_exc())
                return jsonify({
                    "error": f"视频处理失败: {str(processing_error)}",
                    "success": False
                }, 500)
            
            finally:
                # 清理临时文件
                print("🧹 开始清理临时文件...")
                cleanup_file(temp_input_path)
                if 'frame_path' in locals():
                    cleanup_file(frame_path)
                if 'annotated_frame_path' in locals():
                    cleanup_file(annotated_frame_path)
                if 'cap' in locals():
                    cap.release()
                print("✅ 临时文件清理完成")
                
    except Exception as e:
        print(f"❌ analyze_frame 发生顶级异常: {str(e)}")
        import traceback
        print("完整错误堆栈:")
        print(traceback.format_exc())
        return jsonify({
            "error": f"处理失败: {str(e)}",
            "success": False
        }), 500

@app.route("/gemini_analysis")
def gemini_analysis():
    """渲染Gemini AI分析页面"""
    return render_template("frame_analysis.html")

@app.route("/analyze_with_gemini", methods=["POST"])
def analyze_with_gemini():
    """使用Gemini AI分析视频中特定时间点的特定球员"""
    file = request.files.get("video")
    if not file:
        return jsonify({"error": "No file uploaded", "success": False}), 400

    time_in_seconds = request.form.get("time_in_seconds")
    player_coordinates_str = request.form.get("player_coordinates")
    prompt = request.form.get("prompt")

    if not time_in_seconds or not player_coordinates_str or not prompt:
        return jsonify({
            "error": "缺少必要参数：时间点、球员坐标或提示词",
            "success": False
        }), 400

    try:
        player_coordinates = json.loads(player_coordinates_str)
        time_in_seconds = float(time_in_seconds)
    except (ValueError, json.JSONDecodeError) as e:
        return jsonify({"error": f"参数格式错误: {str(e)}", "success": False}), 400

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    temp_input_path = os.path.join(TEMP_FOLDER, filename)
    file.save(temp_input_path)

    try:
        gemini_model = genai.GenerativeModel("gemini-1.5-flash")

        # 读取视频二进制内容
        with open(temp_input_path, "rb") as video_file:
            video_bytes = video_file.read()

        user_text = f"{prompt}\n时间点: {time_in_seconds} 秒\n球员坐标: {player_coordinates}"

        # 传二进制视频
        response = gemini_model.generate_content(
            contents=[
                {"role": "user", "parts": [
                    {"text": user_text},
                    {"inline_data": {"mime_type": "video/mp4", "data": video_bytes}}
                ]}
            ]
        )

        analysis_result = response.text if hasattr(response, "text") else str(response)

        analysis_filename = f"{timestamp}_analysis.txt"
        analysis_path = os.path.join(TEMP_FOLDER, analysis_filename)
        with open(analysis_path, "w", encoding="utf-8") as f:
            f.write(analysis_result)

        supabase_path = f"gemini_analysis/{analysis_filename}"
        try:
            analysis_url = upload_to_supabase(analysis_path, supabase_path)
        except Exception as e:
            print(f"上传分析结果失败: {e}")
            analysis_url = None

        result = {
            "success": True,
            "analysis": analysis_result,
            "timestamp": timestamp
        }
        if analysis_url:
            result["analysis_url"] = analysis_url

        return jsonify(result)

    except Exception as e:
        print(f"Gemini AI分析过程中出错: {e}")
        return jsonify({"error": f"分析失败: {str(e)}", "success": False}), 500

    finally:
        cleanup_file(temp_input_path)
        if 'analysis_path' in locals():
            cleanup_file(analysis_path)


# @app.route("/health")
# def health_check():
#     """健康检查端点"""
#     return jsonify({
#         "status": "healthy", 
#         "temp_folder": TEMP_FOLDER,
#         "gemini_enabled": True
#     })

# 应用关闭时清理临时文件夹
import atexit
def cleanup_temp_folder():
    """应用关闭时清理临时文件夹"""
    try:
        shutil.rmtree(TEMP_FOLDER, ignore_errors=True)
        print(f"已清理临时文件夹: {TEMP_FOLDER}")
    except Exception as e:
        print(f"清理临时文件夹时出错: {e}")

atexit.register(cleanup_temp_folder)

# 云托管适配
@app.route("/health")
def health_check():
    """健康检查端点"""
    return jsonify({
        "status": "healthy", 
        "temp_folder": TEMP_FOLDER,
        "gemini_enabled": bool(GEMINI_API_KEY),
        "roboflow_enabled": bool(API_KEY),
        "supabase_enabled": bool(supabase),
        "platform": "Railway"
    })

# Railway适配
if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5001))  # Railway会设置PORT环境变量
    app.run(host='0.0.0.0', port=port, debug=False)