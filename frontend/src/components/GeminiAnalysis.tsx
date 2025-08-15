import React, { useState } from 'react';

interface GeminiAnalysisProps {
  onAnalyzeRequest: (prompt: string) => Promise<void>;
  analysisResult: string | null;
  selectedPlayerId: number | null;
  selectedFrame: number;
  selectedSecond: number;
  selectedX: number;
  selectedY: number;
  videoUrl: string;
}

const GeminiAnalysis: React.FC<GeminiAnalysisProps> = ({
  onAnalyzeRequest,
  analysisResult,
  selectedPlayerId,
  selectedFrame,
  selectedSecond,
  selectedX,
  selectedY,
  videoUrl
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlayerId) {
      setError('请先选择一个球员');
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      await onAnalyzeRequest(`你可以接收到视频吗，如果可以，视频有几秒钟？`);
    } catch (err) {
      setError(`分析请求失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="gemini-analysis">
      <h2>Gemini AI 分析</h2>
      
      <div className="analysis-container">
        <form onSubmit={handleSubmit}>
          <div className="prompt-container">
            {error && <div className="error-message">{error}</div>}
            
            <button 
              type="submit" 
              className="analyze-button"
              disabled={!selectedPlayerId || isAnalyzing}
            >
              {isAnalyzing ? '分析中...' : '开始分析'}
            </button>
            {isAnalyzing && (
              <div className="loading-animation">
                <div className="spinner"></div>
              </div>
            )}
          </div>
        </form>
        
        <div className="result-container">
          <h3>分析结果</h3>
          {analysisResult ? (
            <div className="analysis-result">
              <pre>{analysisResult}</pre>
            </div>
          ) : (
            <div className="no-result">
              <p>{selectedPlayerId ? '请输入提示词并开始分析' : '请先选择一个球员'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeminiAnalysis;