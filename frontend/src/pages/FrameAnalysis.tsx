import React, { useState, useEffect, useCallback } from 'react';
import VideoUpload from '../components/VideoUpload';
import FrameSelector from '../components/FrameSelector';
import PlayerDetection from '../components/PlayerDetection';
import GeminiAnalysis from '../components/GeminiAnalysis';
import { analyzeFrame, analyzeWithGemini, checkHealth } from '../services/api';
import '../styles/StepIndicator.css';

interface Player {
  id: number;
  bbox: [number, number, number, number];
  center: [number, number];
}

// 定义分析结果数据接口
interface AnalysisResultData {
  analysisResult: string;
  selectedPlayerId: number | null;
  prompt: string;
  annotatedFrameUrl: string | null;
  playersData: Player[] | null;
  videoUrl: string;
}

// 定义组件Props
interface FrameAnalysisProps {
  onShowResult: (data: AnalysisResultData) => void;
}

// 定义步骤枚举
type AnalysisStep = 'UPLOAD' | 'SELECT_FRAME' | 'SELECT_PLAYER' | 'AI_ANALYSIS';

const FrameAnalysis: React.FC<FrameAnalysisProps> = ({ onShowResult }) => {
  const frameLoadingStyles = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .frame-loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background-color: rgba(255, 255, 255, 0.9);
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .frame-loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(22, 163, 74, 0.3);
      border-top: 4px solid #16a34a;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    .frame-loading-text {
      margin-top: 1rem;
      font-size: 1rem;
      color: #16a34a;
      font-weight: 500;
    }
  `;
  // 当前步骤状态
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('UPLOAD');
  
  // 视频和时间状态
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<number>(0);
  
  // 分析状态
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isGeminiAnalyzing, setIsGeminiAnalyzing] = useState<boolean>(false);
  
  // 分析结果
  const [annotatedFrameUrl, setAnnotatedFrameUrl] = useState<string | null>(null);
  const [playersData, setPlayersData] = useState<Player[]>([]);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  
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

  // 处理视频上传
  const handleVideoUpload = (data: { file: File; videoUrl: string }) => {
    setSelectedVideo(data.file);
    setAnnotatedFrameUrl(null);
    setPlayersData([]);
    setSelectedPlayerId(null);
    setSelectedPlayerCoordinates(null);
    setGeminiResult(null);
    setError(null);
    
    // 创建视频URL供预览使用
    const url = URL.createObjectURL(data.file);
    setVideoUrl(url);
    
    // 进入下一步：选择帧
    setCurrentStep('SELECT_FRAME');
  };

  // 处理时间选择
  const handleTimeSelected = useCallback((timeInSeconds: number) => {
    setSelectedTime(timeInSeconds);
  }, []);
  
  // 处理返回上一步
  const handleBack = () => {
    console.log('Current step before back:', currentStep);
    setCurrentStep((prevStep) => {
      let nextStep = prevStep;
      if (prevStep === 'SELECT_FRAME') {
        nextStep = 'UPLOAD';
      } else if (prevStep === 'SELECT_PLAYER') {
        nextStep = 'SELECT_FRAME';
      } else if (prevStep === 'AI_ANALYSIS') {
        nextStep = 'SELECT_PLAYER';
      }
      console.log('Next step:', nextStep);
      return nextStep;
    });
  };
  
  // 处理继续到AI分析步骤
  const handleContinueToAIAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setCurrentStep('AI_ANALYSIS');
      setIsAnalyzing(false);
    }, 2000); // 模拟2秒的加载时间
  };

  // 处理球员选择
  const handlePlayerSelected = (playerId: number, coordinates: { x: number, y: number }) => {
    setSelectedPlayerId(playerId);
    setSelectedPlayerCoordinates(coordinates);
    setGeminiResult(null);
  };

  // 分析视频帧
  const handleAnalyzeFrame = useCallback(async () => {
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
        setSelectedPlayerId(null);
        setSelectedPlayerCoordinates(null);
        setGeminiResult(null);
        // 移除此处跳转逻辑，保留在handleGeminiAnalysis中跳转
      } else {
        setError(result.error || '分析失败');
      }
    } catch (err) {
      setError(`分析请求失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedVideo, selectedTime, setError, setAnnotatedFrameUrl, setPlayersData, setImageDimensions, setSelectedPlayerId, setSelectedPlayerCoordinates, setGeminiResult, setIsAnalyzing, onShowResult]);
  
  // 当进入分析步骤时自动分析帧
  useEffect(() => {
    if (currentStep === 'AI_ANALYSIS' && selectedVideo) {
      handleAnalyzeFrame();
    }
  }, [currentStep, handleAnalyzeFrame, selectedVideo]);

  // 图像加载完成后停留在选择球员步骤
  useEffect(() => {
    if (annotatedFrameUrl && currentStep === 'SELECT_FRAME') {
      setCurrentStep('SELECT_PLAYER');
    }
  }, [annotatedFrameUrl, currentStep]);

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
        
        // 导航到分析结果页面
        if (result.analysis && annotatedFrameUrl) {
          onShowResult({
            analysisResult: result.analysis,
            selectedPlayerId: selectedPlayerId,
            prompt: prompt,
            annotatedFrameUrl: annotatedFrameUrl,
            playersData: playersData,
            videoUrl: videoUrl,
          });
        }
      } else {
        setError(result.error || 'Gemini分析失败');
      }
    } catch (err) {
      setError(`Gemini分析请求失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsGeminiAnalyzing(false);
    }
  };

  // 清理视频URL
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  // 渲染基于当前步骤的内容
  const renderContent = () => {
    switch (currentStep) {
      case 'UPLOAD':
        return (
          <VideoUpload 
            onVideoUpload={handleVideoUpload}
            onBack={() => {}} // 在上传步骤没有返回操作
            showBackButton={false} // 不显示返回按钮
          />
        );
      
      case 'SELECT_FRAME':
        return (
          <FrameSelector 
            videoUrl={videoUrl}
            onTimeSelected={handleTimeSelected}
            onBack={handleBack}
            onContinue={handleContinueToAIAnalysis}
          />
        );
      
      case 'AI_ANALYSIS':
        return (
          <div className="main-content">
            <div className="results-section">
              <PlayerDetection 
                annotatedFrameUrl={annotatedFrameUrl}
                playersData={playersData}
                imageDimensions={imageDimensions}
                onPlayerSelected={handlePlayerSelected}
                isAnalyzing={isAnalyzing}
                onBack={handleBack}
              />
              
              <GeminiAnalysis 
                onAnalyzeRequest={handleGeminiAnalysis}
                analysisResult={geminiResult}
                selectedPlayerId={selectedPlayerId}
                selectedFrame={Math.floor(selectedTime * 30)}
                videoUrl={videoUrl}
                selectedSecond={selectedTime}
                selectedX={selectedPlayerCoordinates?.x || 0}
                selectedY={selectedPlayerCoordinates?.y || 0}
              />
            </div>
          </div>
        );
      
      case 'SELECT_PLAYER':
        return (
          <FrameSelector 
            videoUrl={videoUrl}
            onTimeSelected={handleTimeSelected}
            onBack={handleBack}
            onContinue={handleContinueToAIAnalysis}
          />
        );
      
      default:
        return null;
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
      
      {renderContent()}
      
      {currentStep === 'AI_ANALYSIS' && (
        <footer>
          <p>© 2023 足球视频分析系统 - React版</p>
        </footer>
      )}
    </div>
  );
};

export default FrameAnalysis;