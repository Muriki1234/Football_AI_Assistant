// API服务模块 - 与Flask后端通信
const API_BASE_URL = 'http://localhost:5001'; // Flask默认端口

export const analyzeFrame = async (videoFile: File, timeInSeconds: number) => {
  const formData = new FormData();
  formData.append('video', videoFile);
  formData.append('time_in_seconds', timeInSeconds.toString());

  const response = await fetch(`${API_BASE_URL}/analyze_frame`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Frame analysis failed');
  }

  return response.json();
};

export const analyzeWithGemini = async (
  videoFile: File,
  timeInSeconds: number,
  playerCoordinates: {x: number, y: number},
  prompt: string
) => {
  const formData = new FormData();
  formData.append('video', videoFile);
  formData.append('time_in_seconds', timeInSeconds.toString());
  formData.append('player_coordinates', JSON.stringify(playerCoordinates));
  formData.append('prompt', prompt);

  const response = await fetch(`${API_BASE_URL}/analyze_with_gemini`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Gemini analysis failed');
  }

  return response.json();
};

export const checkHealth = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
};