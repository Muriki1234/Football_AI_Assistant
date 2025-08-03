"""
enhanced_features_with_tracking.py - 足球视频分析增强功能模块
包含球路检测、小地图生成、数据分析功能和多目标跟踪
"""

import cv2
import numpy as np
from collections import deque, defaultdict
import supervision as sv
import json
import os

class BallTracker:
    """球轨迹追踪器"""
    def __init__(self, max_trail_length=50):
        self.ball_trail = deque(maxlen=max_trail_length)
        self.ball_positions = []
        
    def update(self, ball_position):
        """更新球的位置"""
        if ball_position is not None:
            self.ball_trail.append(ball_position)
            self.ball_positions.append(ball_position)
    
    def draw_trajectory(self, frame):
        """在帧上绘制球的轨迹"""
        if len(self.ball_trail) > 1:
            points = np.array(list(self.ball_trail), dtype=np.int32)
            for i in range(1, len(points)):
                # 渐变色效果：越新的点越亮
                alpha = i / len(points)
                color = (0, int(255 * alpha), int(255 * (1 - alpha)))
                cv2.line(frame, tuple(points[i-1]), tuple(points[i]), color, 3)
        return frame

class PlayerTracker:
    """球员轨迹追踪器"""
    def __init__(self, max_trail_length=30, feature_memory_size=100):
        self.player_trails = defaultdict(lambda: deque(maxlen=max_trail_length))
        self.player_colors = {}
        # 球员特征记忆，用于重识别
        self.player_features = {}
        self.player_last_positions = {}
        self.player_velocities = {}
        self.feature_memory_size = feature_memory_size
        self.inactive_players = {}  # 存储暂时离开画面的球员信息
        self.inactive_timeout = 300  # 帧数，超过这个时间不再尝试匹配
        self.selected_player_id = None  # 当前选中的球员ID
        
    def generate_color(self, player_id):
        """为每个球员生成唯一颜色"""
        if player_id not in self.player_colors:
            # 使用HSV色彩空间生成不同的颜色
            hue = (player_id * 50) % 180
            color_hsv = np.array([[[hue, 255, 255]]], dtype=np.uint8)
            color_bgr = cv2.cvtColor(color_hsv, cv2.COLOR_HSV2BGR)[0][0]
            self.player_colors[player_id] = tuple(map(int, color_bgr))
        return self.player_colors[player_id]
    
    def update(self, player_id, position, frame=None, bbox=None):
        """更新球员位置和特征"""
        self.player_trails[player_id].append(position)
        
        # 更新位置和速度
        if player_id in self.player_last_positions:
            last_pos = self.player_last_positions[player_id]
            velocity = (position[0] - last_pos[0], position[1] - last_pos[1])
            self.player_velocities[player_id] = velocity
        
        self.player_last_positions[player_id] = position
        
        # 如果提供了帧和边界框，提取并存储特征
        if frame is not None and bbox is not None:
            x1, y1, x2, y2 = map(int, bbox)
            if x1 >= 0 and y1 >= 0 and x2 < frame.shape[1] and y2 < frame.shape[0]:
                player_img = frame[y1:y2, x1:x2]
                if player_img.size > 0:
                    # 简单的特征：颜色直方图
                    feature = self._extract_feature(player_img)
                    if player_id not in self.player_features:
                        self.player_features[player_id] = []
                    
                    # 保持特征列表在指定大小内
                    if len(self.player_features[player_id]) >= self.feature_memory_size:
                        self.player_features[player_id].pop(0)
                    
                    self.player_features[player_id].append(feature)
        
        # 如果球员在非活动列表中，移除
        if player_id in self.inactive_players:
            del self.inactive_players[player_id]
    
    def _extract_feature(self, img):
        """提取球员图像的特征（简单的颜色直方图）"""
        if img.size == 0:
            return None
        
        # 调整大小以标准化
        img = cv2.resize(img, (64, 128))
        
        # 转换为HSV颜色空间
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # 计算颜色直方图
        h_hist = cv2.calcHist([hsv], [0], None, [16], [0, 180])
        s_hist = cv2.calcHist([hsv], [1], None, [16], [0, 256])
        v_hist = cv2.calcHist([hsv], [2], None, [8], [0, 256])
        
        # 归一化
        h_hist = cv2.normalize(h_hist, h_hist, 0, 1, cv2.NORM_MINMAX)
        s_hist = cv2.normalize(s_hist, s_hist, 0, 1, cv2.NORM_MINMAX)
        v_hist = cv2.normalize(v_hist, v_hist, 0, 1, cv2.NORM_MINMAX)
        
        # 合并特征
        feature = np.concatenate([h_hist, s_hist, v_hist]).flatten()
        return feature
    
    def mark_inactive(self, player_id, frame_id):
        """标记球员为非活动状态"""
        if player_id in self.player_last_positions and player_id in self.player_features:
            self.inactive_players[player_id] = {
                'last_position': self.player_last_positions[player_id],
                'velocity': self.player_velocities.get(player_id, (0, 0)),
                'features': self.player_features[player_id],
                'last_seen': frame_id
            }
    
    def predict_position(self, player_id, frames_elapsed):
        """预测球员的位置"""
        if player_id not in self.inactive_players:
            return None
        
        info = self.inactive_players[player_id]
        last_pos = info['last_position']
        velocity = info['velocity']
        
        # 简单线性预测
        predicted_x = last_pos[0] + velocity[0] * min(frames_elapsed, 10)  # 限制预测范围
        predicted_y = last_pos[1] + velocity[1] * min(frames_elapsed, 10)
        
        return (int(predicted_x), int(pedicted_y))
    
    def match_new_detection(self, position, feature, frame_id, max_distance=200):
        """尝试将新检测匹配到之前的球员"""
        best_match = None
        min_distance = float('inf')
        
        # 检查所有非活动球员
        for player_id, info in list(self.inactive_players.items()):
            # 如果球员已经超时，从非活动列表中移除
            if frame_id - info['last_seen'] > self.inactive_timeout:
                del self.inactive_players[player_id]
                continue
            
            # 预测位置
            frames_elapsed = frame_id - info['last_seen']
            predicted_pos = self.predict_position(player_id, frames_elapsed)
            
            if predicted_pos:
                # 计算空间距离
                dist = np.sqrt((position[0] - predicted_pos[0])**2 + (position[1] - predicted_pos[1])**2)
                
                # 如果特征可用，计算特征相似度
                feature_similarity = 0
                if feature is not None and info['features']:
                    for stored_feature in info['features']:
                        if stored_feature is not None:
                            # 计算直方图相似度
                            similarity = cv2.compareHist(
                                np.array(feature, dtype=np.float32),
                                np.array(stored_feature, dtype=np.float32),
                                cv2.HISTCMP_CORREL
                            )
                            feature_similarity = max(feature_similarity, similarity)
                
                # 综合距离和特征相似度的分数
                # 距离越小越好，相似度越大越好
                combined_score = dist * (1.0 - feature_similarity * 0.5)
                
                if combined_score < min_distance and dist < max_distance:
                    min_distance = combined_score
                    best_match = player_id
        
        return best_match
    
    def select_player(self, player_id):
        """选择一个球员，使其标记亮起"""
        self.selected_player_id = player_id
    
    def is_player_selected(self, player_id):
        """检查球员是否被选中"""
        return self.selected_player_id == player_id
    
    def handle_click(self, click_position, tracked_players, threshold=30):
        """处理点击事件，如果点击位置接近某个球员，则选择该球员
        
        参数:
        click_position - 点击位置 (x, y)
        tracked_players - 字典，键为球员ID，值为球员位置 (x, y)
        threshold - 点击位置与球员位置的最大距离阈值
        
        返回:
        被选中的球员ID，如果没有球员被选中则返回None
        """
        closest_player = None
        min_distance = float('inf')
        
        for player_id, position in tracked_players.items():
            # 计算点击位置与球员位置的距离
            dist = np.sqrt((click_position[0] - position[0])**2 + (click_position[1] - position[1])**2)
            
            if dist < min_distance and dist < threshold:
                min_distance = dist
                closest_player = player_id
        
        # 如果点击了当前选中的球员，则取消选择
        if closest_player == self.selected_player_id:
            self.selected_player_id = None
        else:
            self.selected_player_id = closest_player
        
        return self.selected_player_id
    
    def draw_trails(self, frame):
        """绘制所有球员的轨迹 - 现在禁用此功能"""
        # 不再绘制轨迹线，直接返回原始帧
        return frame

class MinimapGenerator:
    """小地图生成器"""
    def __init__(self, field_width=300, field_height=200):
        self.field_width = field_width
        self.field_height = field_height
        self.create_field_template()
        
    def create_field_template(self):
        """创建足球场模板"""
        self.field = np.zeros((self.field_height, self.field_width, 3), dtype=np.uint8)
        self.field[:] = (34, 139, 34)  # 绿色背景
        
        # 球场边界
        cv2.rectangle(self.field, (15, 15), (self.field_width-15, self.field_height-15), (255, 255, 255), 2)
        
        # 中线
        cv2.line(self.field, (self.field_width//2, 15), (self.field_width//2, self.field_height-15), (255, 255, 255), 2)
        
        # 中圈
        cv2.circle(self.field, (self.field_width//2, self.field_height//2), 30, (255, 255, 255), 2)
        
        # 球门
        goal_width = 40
        goal_height = 15
        cv2.rectangle(self.field, (15, self.field_height//2 - goal_height//2), 
                     (15 + goal_width, self.field_height//2 + goal_height//2), (255, 255, 255), 2)
        cv2.rectangle(self.field, (self.field_width - 15 - goal_width, self.field_height//2 - goal_height//2), 
                     (self.field_width - 15, self.field_height//2 + goal_height//2), (255, 255, 255), 2)
    
    def map_coordinates(self, x, y, frame_width, frame_height):
        """将视频坐标映射到小地图坐标"""
        map_x = int((x / frame_width) * (self.field_width - 30) + 15)
        map_y = int((y / frame_height) * (self.field_height - 30) + 15)
        return map_x, map_y
    
    def update_minimap(self, tracked_players, ball_position, frame_width, frame_height, player_tracker):
        """更新小地图"""
        minimap = self.field.copy()
        
        # 绘制球员 - 移除ID标签
        for player_id, pos in tracked_players.items():
            map_x, map_y = self.map_coordinates(pos[0], pos[1], frame_width, frame_height)
            # 使用统一的蓝色表示球员
            player_color = (255, 0, 0)  # BGR格式，蓝色
            cv2.circle(minimap, (map_x, map_y), 3, player_color, -1)
        
        # 绘制球
        if ball_position:
            map_x, map_y = self.map_coordinates(ball_position[0], ball_position[1], frame_width, frame_height)
            cv2.circle(minimap, (map_x, map_y), 4, (255, 255, 0), -1)
        
        return minimap

def enhanced_annotate_video(input_path, output_path, results, model_key, selected_player_id=None):
    """增强的视频标注函数 - 包含多目标跟踪
    
    参数:
    input_path - 输入视频路径
    output_path - 输出视频路径
    results - 检测结果
    model_key - 模型键
    selected_player_id - 可选，指定要高亮显示的球员ID
    
    返回:
    output_path - 输出视频路径
    tracking_data_path - 跟踪数据JSON文件路径
    """
    cap = cv2.VideoCapture(input_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # 视频编写器配置
    fourcc = cv2.VideoWriter_fourcc(*"H264")
    out = cv2.VideoWriter(output_path, fourcc, fps, (w, h))
    
    if not out.isOpened():
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(output_path, fourcc, fps, (w, h))

    if not out.isOpened():
        raise Exception("无法初始化视频编写器")

    # 初始化跟踪器 - 极大增加lost_track_buffer以保持ID更长时间
    byte_tracker = sv.ByteTrack(
        track_activation_threshold=0.15,  # 进一步降低激活阈值，更容易创建新轨迹
        lost_track_buffer=300,  # 极大增加缓冲区，保持ID更长时间（从150增加到300）
        minimum_matching_threshold=0.6,  # 进一步降低匹配阈值，更容易匹配到现有轨迹
        frame_rate=fps
    )
    
    # 初始化追踪器和小地图
    ball_tracker = BallTracker()
    player_tracker = PlayerTracker()
    if selected_player_id is not None:
        player_tracker.select_player(selected_player_id)
    minimap_gen = MinimapGenerator()
    
    # 自定义标注器
    box_annotator = sv.BBoxAnnotator()
    label_annotator = sv.LabelAnnotator()

    frame_id = 0
    tracking_stats = {
        "total_tracks": 0,
        "active_tracks": 0,
        "ball_detections": 0
    }
    
    # 用于存储跟踪数据的列表
    tracking_data = []
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        time_off = frame_id / fps
        idx = min(range(len(results["time_offset"])),
                  key=lambda i: abs(results["time_offset"][i] - time_off))
        preds = results[model_key][idx]["predictions"]

        # 转换为 supervision 格式
        rf_fmt = {"predictions": preds, "image": {"width": w, "height": h}}
        detections = sv.Detections.from_inference(rf_fmt)
        
        # 分离球、球员和裁判检测
        player_detections = []
        referee_detections = []
        ball_position = None
        
        for i, pred in enumerate(preds):
            center_x = int(pred["x"])
            center_y = int(pred["y"])
            
            if pred["class"] == "ball":
                ball_position = (center_x, center_y)
                tracking_stats["ball_detections"] += 1
            # 检查是否为裁判 - 通过类别名称或颜色特征
            elif "referee" in pred.get("class", "").lower() or (
                  # 检查边框颜色是否为橙色 - 如果Roboflow已经用橙色标记了裁判
                  "color" in pred and pred["color"] == "orange"):
                referee_detections.append(i)
            else:
                player_detections.append(i)

        # 只对球员进行跟踪
        tracked_players = {}
        frame_players = []
        
        if player_detections:
            player_det = sv.Detections(
                xyxy=detections.xyxy[player_detections],
                confidence=detections.confidence[player_detections],
                class_id=detections.class_id[player_detections] if detections.class_id is not None else None
            )
            
            # 使用ByteTrack进行跟踪
            tracks = byte_tracker.update_with_detections(player_det)
            
            # 更新统计信息
            tracking_stats["active_tracks"] = len(tracks)
            if len(tracks) > 0 and tracks.tracker_id is not None and len(tracks.tracker_id) > 0:
                tracking_stats["total_tracks"] = max