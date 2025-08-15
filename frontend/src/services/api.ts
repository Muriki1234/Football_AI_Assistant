// API服务模块 - 与Flask后端通信
const API_BASE_URL = 'http://localhost:5001'; // Flask默认端口

// 通用的错误处理函数
const handleApiError = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', response.status, errorText);
    throw new Error(`API请求失败 (${response.status}): ${errorText}`);
  }
  return response;
};

// 验证视频文件类型
const validateVideoFile = (file: File) => {
  const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'];
  if (!validTypes.includes(file.type)) {
    throw new Error(`不支持的文件类型: ${file.type}. 请上传 MP4, AVI, MOV, WMV 或 FLV 格式的视频文件`);
  }
  
  // 检查文件大小 (限制为 100MB)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    throw new Error('文件大小不能超过 100MB');
  }
};

export const analyzeFrame = async (videoFile: File, timeInSeconds: number) => {
  try {
    // 验证文件
    validateVideoFile(videoFile);
    
    console.log('开始分析帧:', {
      fileName: videoFile.name,
      fileSize: videoFile.size,
      fileType: videoFile.type,
      timeInSeconds
    });

    const formData = new FormData();
    
    // 确保文件名正确传递
    formData.append('video', videoFile, videoFile.name);
    formData.append('time_in_seconds', timeInSeconds.toString());

    // 打印FormData内容用于调试
    console.log('FormData entries:');
    const entries = Array.from(formData.entries());
    entries.forEach(([key, value]) => {
      if (value instanceof File) {
        console.log(`${key}:`, {
          name: value.name,
          size: value.size,
          type: value.type
        });
      } else {
        console.log(`${key}:`, value);
      }
    });

    const response = await fetch(`${API_BASE_URL}/analyze_frame`, {
      method: 'POST',
      body: formData,
      // 不要手动设置 Content-Type，让浏览器自动设置
      // 这样可以正确包含 boundary 参数
    });

    await handleApiError(response);
    const result = await response.json();
    
    console.log('分析帧响应:', result);
    return result;
    
  } catch (error) {
    console.error('分析帧错误:', error);
    throw error;
  }
};

export const analyzeWithGemini = async (
  videoFile: File,
  timeInSeconds: number,
  playerCoordinates: {x: number, y: number},
  prompt: string
) => {
  try {
    // 验证文件
    validateVideoFile(videoFile);
    
    console.log('开始Gemini分析:', {
      fileName: videoFile.name,
      fileSize: videoFile.size,
      fileType: videoFile.type,
      timeInSeconds,
      playerCoordinates,
      promptLength: prompt.length
    });

    const formData = new FormData();
    
    // 确保所有参数正确传递
    formData.append('video', videoFile, videoFile.name);
    formData.append('time_in_seconds', timeInSeconds.toString());
    formData.append('player_coordinates', JSON.stringify(playerCoordinates));
    formData.append('prompt', prompt);

    // 打印FormData内容用于调试
    console.log('FormData entries:');
    const entriesArray = Array.from(formData.entries());
    entriesArray.forEach(([key, value]) => {
      if (value instanceof File) {
        console.log(`${key}:`, {
          name: value.name,
          size: value.size,
          type: value.type
        });
      } else {
        console.log(`${key}:`, value);
      }
    });

    const response = await fetch(`${API_BASE_URL}/analyze_with_gemini`, {
      method: 'POST',
      body: formData,
      // 移除手动设置的headers，让浏览器自动处理
    });

    await handleApiError(response);
    const result = await response.json();
    
    console.log('Gemini分析响应:', result);
    return result;
    
  } catch (error) {
    console.error('Gemini分析错误:', error);
    throw error;
  }
};

export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    await handleApiError(response);
    return response.json();
  } catch (error) {
    console.error('健康检查错误:', error);
    throw error;
  }
};