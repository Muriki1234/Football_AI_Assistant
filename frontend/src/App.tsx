import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import './styles/App.css';
import './index.css'; // Tailwind 样式
import FrameAnalysis from './pages/FrameAnalysis';
import HomePage from './pages/HomePage';
import AIAnalysisResultPage from './pages/AIAnalysisResultPage';

// 页面类型
type PageType = 'HOME' | 'FRAME_ANALYSIS' | 'AI_RESULT';

// 分析结果数据接口
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
  videoUrl?: string;
  playersData: Player[] | null;
}

// FrameAnalysis 状态接口（用于状态提升）
interface FrameAnalysisState {
  selectedVideo: File | null;
  videoUrl: string;
  selectedTime: number;
  annotatedFrameUrl: string | null;
  playersData: Player[];
  selectedPlayerId: number | null;
  selectedPlayerCoordinates: { x: number; y: number } | null;
  geminiResult: string | null;
}

const App: React.FC = () => {
  // 当前页面状态
  const [currentPage, setCurrentPage] = useState<PageType>('HOME');

  // FrameAnalysis 初始步骤状态
  const [frameAnalysisInitialStep, setFrameAnalysisInitialStep] = useState<'UPLOAD' | 'SELECT_FRAME' | 'SELECT_PLAYER' | 'AI_ANALYSIS' | undefined>(undefined);

  // FrameAnalysis 状态提升
  const [frameAnalysisState, setFrameAnalysisState] = useState<FrameAnalysisState>({
    selectedVideo: null,
    videoUrl: '',
    selectedTime: 0,
    annotatedFrameUrl: null,
    playersData: [],
    selectedPlayerId: null,
    selectedPlayerCoordinates: null,
    geminiResult: null,
  });

  // 分析结果数据
  const [analysisResultData, setAnalysisResultData] = useState<AnalysisResultData>({
    analysisResult: '',
    selectedPlayerId: null,
    prompt: '',
    annotatedFrameUrl: null,
    videoUrl: '',
    playersData: null
  });

  // 首页点击开始
  const handleGetStarted = () => {
    setFrameAnalysisInitialStep('UPLOAD');
    setCurrentPage('FRAME_ANALYSIS');
  };

  // 从 AI 分析页面返回选择球员
  const handleBackToPlayerSelection = () => {
    setFrameAnalysisInitialStep('SELECT_PLAYER');
    setCurrentPage('FRAME_ANALYSIS');
  };

  // 显示分析结果页面
  const handleShowAnalysisResult = (data: AnalysisResultData) => {
    setAnalysisResultData(data);
    setCurrentPage('AI_RESULT');
  };

  // 接收 FrameAnalysis 内部状态变化
  const handleFrameAnalysisStateChange = (state: FrameAnalysisState) => {
    setFrameAnalysisState(state);
  };

  // 渲染页面
  const renderPage = () => {
    switch (currentPage) {
      case 'HOME':
        return (
          <>
            <HomePage onGetStarted={handleGetStarted} />
            <footer className="text-center py-4 text-gray-500 text-sm">
              Made in <a href="https://mc.tencent.com/HRVjVcS5" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">CodeBuddy</a> | 
              Powered by <a href="https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/?from=csdn-hackathon-2025" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">CloudBase</a>
            </footer>
          </>
        );
      case 'FRAME_ANALYSIS':
        return (
          <FrameAnalysis
            onShowResult={handleShowAnalysisResult}
            initialStep={frameAnalysisInitialStep}
            initialState={frameAnalysisState}
            onStateChange={handleFrameAnalysisStateChange}
          />
        );
      case 'AI_RESULT':
        return (
          <AIAnalysisResultPage
            analysisResult={analysisResultData.analysisResult}
            selectedPlayerId={analysisResultData.selectedPlayerId}
            prompt={analysisResultData.prompt}
            annotatedFrameUrl={analysisResultData.annotatedFrameUrl}
            playersData={analysisResultData.playersData}
            onBackToPlayerSelection={handleBackToPlayerSelection}
          />
        );
      default:
        return <HomePage onGetStarted={handleGetStarted} />;
    }
  };

  return (
    <BrowserRouter>
      <div className="app">
        {renderPage()}
      </div>
    </BrowserRouter>
  );
};

export default App;
