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

interface AnalysisResultData {
  analysisResult: string;
  selectedPlayerId: number | null;
  prompt: string;
  annotatedFrameUrl: string | null;
  playersData: Player[] | null;
  videoUrl: string;
}

type AnalysisStep = 'UPLOAD' | 'SELECT_FRAME' | 'SELECT_PLAYER' | 'AI_ANALYSIS';

interface FrameAnalysisProps {
  onShowResult: (data: AnalysisResultData) => void;
  initialStep?: AnalysisStep;
  initialState?: {
    selectedVideo: File | null;
    videoUrl: string;
    selectedTime: number;
    annotatedFrameUrl: string | null;
    playersData: Player[];
    selectedPlayerId: number | null;
    selectedPlayerCoordinates: { x: number; y: number } | null;
    geminiResult: string | null;
  };
  onStateChange?: (state: any) => void;
}

const FrameAnalysis: React.FC<FrameAnalysisProps> = ({
  onShowResult,
  initialStep,
  initialState,
  onStateChange,
}) => {
  const [currentStep, setCurrentStep] = useState<AnalysisStep>(initialStep || 'UPLOAD');

  // 状态
  const [selectedVideo, setSelectedVideo] = useState<File | null>(initialState?.selectedVideo || null);
  const [videoUrl, setVideoUrl] = useState<string>(initialState?.videoUrl || '');
  const [selectedTime, setSelectedTime] = useState<number>(initialState?.selectedTime || 0);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isGeminiAnalyzing, setIsGeminiAnalyzing] = useState<boolean>(false);

  const [annotatedFrameUrl, setAnnotatedFrameUrl] = useState<string | null>(initialState?.annotatedFrameUrl || null);
  const [playersData, setPlayersData] = useState<Player[]>(initialState?.playersData || []);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(initialState?.selectedPlayerId || null);
  const [selectedPlayerCoordinates, setSelectedPlayerCoordinates] = useState<{ x: number, y: number } | null>(initialState?.selectedPlayerCoordinates || null);

  const [geminiResult, setGeminiResult] = useState<string | null>(initialState?.geminiResult || null);
  const [error, setError] = useState<string | null>(null);

  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // 检查后端健康
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

  // 同步状态到 App.tsx
  useEffect(() => {
    onStateChange?.({
      selectedVideo,
      videoUrl,
      selectedTime,
      annotatedFrameUrl,
      playersData,
      selectedPlayerId,
      selectedPlayerCoordinates,
      geminiResult,
    });
  }, [selectedVideo, videoUrl, selectedTime, annotatedFrameUrl, playersData, selectedPlayerId, selectedPlayerCoordinates, geminiResult]);

  // 上传视频
  const handleVideoUpload = (data: { file: File; videoUrl: string }) => {
    setSelectedVideo(data.file);
    setAnnotatedFrameUrl(null);
    setPlayersData([]);
    setSelectedPlayerId(null);
    setSelectedPlayerCoordinates(null);
    setGeminiResult(null);
    setError(null);

    const url = URL.createObjectURL(data.file);
    setVideoUrl(url);
    setCurrentStep('SELECT_FRAME');
  };

  // 选择时间点
  const handleTimeSelected = useCallback((timeInSeconds: number) => {
    setSelectedTime(timeInSeconds);
  }, []);

  // 返回上一步
  const handleBack = () => {
    setCurrentStep((prevStep) => {
      if (prevStep === 'UPLOAD') {
        window.location.href = '/';
        return prevStep;
      } else if (prevStep === 'SELECT_FRAME') {
        return 'UPLOAD';
      } else if (prevStep === 'SELECT_PLAYER') {
        return 'SELECT_FRAME';
      } else if (prevStep === 'AI_ANALYSIS') {
        return 'SELECT_PLAYER';
      }
      return prevStep;
    });
  };

  // 调用后端分析帧
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

        setCurrentStep('SELECT_PLAYER');
      } else {
        setError(result.error || '分析失败');
      }
    } catch (err) {
      setError(`分析请求失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedVideo, selectedTime]);

  // 选择球员
  const handlePlayerSelected = (playerId: number, coordinates: { x: number, y: number }) => {
    setSelectedPlayerId(playerId);
    setSelectedPlayerCoordinates(coordinates);
    setGeminiResult(null);
  };

  // 继续进入 AI 分析
  const handleContinueToAIAnalysis = () => {
    if (!selectedPlayerId) {
      setError('请先选择一名球员');
      return;
    }
    setCurrentStep('AI_ANALYSIS');
  };

  // 调用 Gemini 分析
  const handleGeminiAnalysis = async (prompt: string) => {
    if (!selectedVideo || !selectedPlayerCoordinates) {
      setError('请先选择视频和球员');
      return;
    }

    setIsGeminiAnalyzing(true);
    setGeminiResult(null);
    setError(null);

    try {
      const result = await analyzeWithGemini(selectedVideo, selectedTime, selectedPlayerCoordinates, prompt);

      if (result.success) {
        setGeminiResult(result.analysis);

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

  // 清理 videoUrl
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  // 渲染不同步骤
  const renderContent = () => {
    switch (currentStep) {
      case 'UPLOAD':
        return <VideoUpload onVideoUpload={handleVideoUpload} onBack={handleBack} showBackButton={true} />;
      case 'SELECT_FRAME':
        return <FrameSelector videoUrl={videoUrl} onTimeSelected={handleTimeSelected} onBack={handleBack} onContinue={handleAnalyzeFrame} />;
      case 'SELECT_PLAYER':
        return (
          <div>
            <PlayerDetection
              annotatedFrameUrl={annotatedFrameUrl}
              playersData={playersData}
              imageDimensions={imageDimensions}
              onPlayerSelected={handlePlayerSelected}
              isAnalyzing={isAnalyzing}
              onBack={handleBack}
              onContinue={handleContinueToAIAnalysis}
            />
            {selectedPlayerId && selectedPlayerCoordinates && (
              <GeminiAnalysis
                onAnalyzeRequest={handleGeminiAnalysis}
                analysisResult={geminiResult}
                selectedPlayerId={selectedPlayerId}
                selectedFrame={Math.floor(selectedTime * 30)}
                videoUrl={videoUrl}
                selectedSecond={selectedTime}
                selectedX={selectedPlayerCoordinates.x}
                selectedY={selectedPlayerCoordinates.y}
                isAnalyzing={isGeminiAnalyzing}
              />
            )}
          </div>
        );
      case 'AI_ANALYSIS':
        return (
          <GeminiAnalysis
            onAnalyzeRequest={handleGeminiAnalysis}
            analysisResult={geminiResult}
            selectedPlayerId={selectedPlayerId}
            selectedFrame={Math.floor(selectedTime * 30)}
            videoUrl={videoUrl}
            selectedSecond={selectedTime}
            selectedX={selectedPlayerCoordinates?.x || 0}
            selectedY={selectedPlayerCoordinates?.y || 0}
            isAnalyzing={isGeminiAnalyzing}
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
