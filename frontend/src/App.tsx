import React, { useState } from 'react';
import './styles/App.css';
import './index.css'; // 确保Tailwind CSS样式在App.css之后加载，以便覆盖冲突的样式
import FrameAnalysis from './pages/FrameAnalysis';
import HomePage from './pages/HomePage';
import AIAnalysisResultPage from './pages/AIAnalysisResultPage';

// 定义页面类型
type PageType = 'HOME' | 'FRAME_ANALYSIS' | 'AI_RESULT';

// 定义分析结果数据接口
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

const App: React.FC = () => {
  // 当前页面状态
  const [currentPage, setCurrentPage] = useState<PageType>('HOME');
  
  // 分析结果数据
  const [analysisResultData, setAnalysisResultData] = useState<AnalysisResultData>({
    analysisResult: '',
    selectedPlayerId: null,
    prompt: '',
    annotatedFrameUrl: null,
    videoUrl: '',
    playersData: null
  });

  // 页面导航处理函数
  const handleGetStarted = () => {
    setCurrentPage('FRAME_ANALYSIS');
  };

  const handleBackToFrameAnalysis = () => {
    setCurrentPage('FRAME_ANALYSIS');
  };

  const handleShowAnalysisResult = (data: AnalysisResultData) => {
    setAnalysisResultData(data);
    setCurrentPage('AI_RESULT');
  };

  // 根据当前页面渲染不同的组件
  const renderPage = () => {
    switch (currentPage) {
      case 'HOME':
        return <HomePage onGetStarted={handleGetStarted} />;
      case 'FRAME_ANALYSIS':
        return <FrameAnalysis onShowResult={handleShowAnalysisResult} />;
      case 'AI_RESULT':
        return (
          <AIAnalysisResultPage
            analysisResult={analysisResultData.analysisResult}
            selectedPlayerId={analysisResultData.selectedPlayerId}
            prompt={analysisResultData.prompt}
            annotatedFrameUrl={analysisResultData.annotatedFrameUrl}
            playersData={analysisResultData.playersData}
            onBack={handleBackToFrameAnalysis}
          />
        );
      default:
        return <HomePage onGetStarted={handleGetStarted} />;
    }
  };

  return (
    <div className="app">
      {renderPage()}
    </div>
  );
};

export default App;