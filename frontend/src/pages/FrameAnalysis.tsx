import React, { useState, useEffect } from 'react';
import VideoUploader from '../components/VideoUploader';
import PlayerDetection from '../components/PlayerDetection';
import GeminiAnalysis from '../components/GeminiAnalysis';
import { analyzeFrame, analyzeWithGemini, checkHealth } from '../services/api';

interface Player {
  id: number;
  bbox: [number, number, number, number];
  center: [number, number];
}

const FrameAnalysis: React.FC = () => {
  // 视频和时间状态
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedTime, setSelectedTime] = useState<number>(0);
  
  // 分析状态
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isGeminiAnalyzing, setIsGeminiAnalyzing] = useState<boolean>(false);
  
  // 分析结果
  const [annotatedFrameUrl, setAnnotatedFrameUrl] = useState<string | null>(null);
  const [playersData, setPlayersData] = useState<Player[]>([]);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  // 视频时长状态，用于显示视频总时长
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [videoDuration, setVideoDuration] = useState<number>(0);
  
  // 选中的球员
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [selectedPlayerCoordinates, setSelectedPlayerCoordinates] = useState<{ x: number, y: number } | null>(null);
  
  // Gemini分析结果
  const [geminiResult, setGeminiResult] = useState<string | null>(null);
  
  // 错误状态
  const [error, setError] = useState<string | null>(null);
  
  // 服务器状态
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // 检查服务器状态
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const health = await checkHealth();
        setServerStatus(health.status === 'healthy' ? 'online' : 'offline');
      } catch (err) {
        setServerStatus('offline');
        setError('无法连接到服务器，请确保Flask后端正在运行');
      }
    };
    
    checkServerStatus();
  }, []);

  // 处理视频选择
  const handleVideoSelected = (file: File) => {
    setSelectedVideo(file);
    setAnnotatedFrameUrl(null);
    setPlayersData([]);
    setSelectedPlayerId(null);
    setSelectedPlayerCoordinates(null);
    setGeminiResult(null);
    setError(null);
  };

  // 处理时间选择
  const handleTimeSelected = (timeInSeconds: number) => {
    setSelectedTime(timeInSeconds);
  };

  // 处理球员选择
  const handlePlayerSelected = (playerId: number, coordinates: { x: number, y: number }) => {
    setSelectedPlayerId(playerId);
    setSelectedPlayerCoordinates(coordinates);
    setGeminiResult(null);
  };

  // 分析视频帧
  const handleAnalyzeFrame = async () => {
    if (!selectedVideo) {
      setError('请先选择视频文件');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await analyzeFrame(selectedVideo, selectedTime);
      
      if (result.success) {
        setAnnotatedFrameUrl(result.annotated_frame_url);
        setPlayersData(result.players_data || []);
        setImageDimensions(result.image_dimensions || { width: 0, height: 0 });
        setVideoDuration(result.video_duration || 0);
        setSelectedPlayerId(null);
        setSelectedPlayerCoordinates(null);
        setGeminiResult(null);
      } else {
        setError(result.error || '分析失败');
      }
    } catch (err) {
      setError(`分析请求失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Gemini AI分析
  const handleGeminiAnalysis = async (prompt: string) => {
    if (!selectedVideo || !selectedPlayerCoordinates) {
      setError('请先选择视频和球员');
      return;
    }
    
    setIsGeminiAnalyzing(true);
    setGeminiResult(null);
    setError(null);
    
    try {
      const result = await analyzeWithGemini(
        selectedVideo,
        selectedTime,
        selectedPlayerCoordinates,
        prompt
      );
      
      if (result.success) {
        setGeminiResult(result.analysis);
      } else {
        setError(result.error || 'Gemini分析失败');
      }
    } catch (err) {
      setError(`Gemini分析请求失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsGeminiAnalyzing(false);
    }
  };

  return (
    <div className="frame-analysis-page">
      <header>
        <h1>足球视频分析系统</h1>
        <div className={`server-status ${serverStatus}`}>
          服务器状态: {serverStatus === 'online' ? '在线' : serverStatus === 'checking' ? '检查中...' : '离线'}
        </div>
      </header>
      
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>关闭</button>
        </div>
      )}
      
      <div className="main-content">
        <div className="upload-section">
          <VideoUploader 
            onVideoSelected={handleVideoSelected}
            onTimeSelected={handleTimeSelected}
            isLoading={isAnalyzing}
          />
          
          <button 
            className="analyze-button"
            onClick={handleAnalyzeFrame}
            disabled={!selectedVideo || isAnalyzing}
          >
            {isAnalyzing ? '分析中...' : '分析视频帧'}
          </button>
        </div>
        
        <div className="results-section">
          <PlayerDetection 
            annotatedFrameUrl={annotatedFrameUrl}
            playersData={playersData}
            imageDimensions={imageDimensions}
            onPlayerSelected={handlePlayerSelected}
            isAnalyzing={isGeminiAnalyzing}
          />
          
          <GeminiAnalysis 
            onAnalyzeRequest={handleGeminiAnalysis}
            analysisResult={geminiResult}
            isAnalyzing={isGeminiAnalyzing}
            selectedPlayerId={selectedPlayerId}
          />
        </div>
      </div>
      
      <footer>
        <p>© 2023 足球视频分析系统 - React版</p>
      </footer>
    </div>
  );
};

export default FrameAnalysis;