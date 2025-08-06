import React, { useState } from 'react';

interface GeminiAnalysisProps {
  onAnalyzeRequest: (prompt: string) => Promise<void>;
  analysisResult: string | null;
  isAnalyzing: boolean;
  selectedPlayerId: number | null;
}

const GeminiAnalysis: React.FC<GeminiAnalysisProps> = ({
  onAnalyzeRequest,
  analysisResult,
  isAnalyzing,
  selectedPlayerId
}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('请输入分析提示词');
      return;
    }
    
    if (!selectedPlayerId) {
      setError('请先选择一个球员');
      return;
    }
    
    try {
      await onAnalyzeRequest(prompt);
    } catch (err) {
      setError(`分析请求失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  // 预设提示词列表
  const promptTemplates = [
    "分析这名球员的跑位和战术意识",
    "评估这名球员的技术动作和控球能力",
    "分析这名球员在这个时刻的防守表现",
    "这名球员在这个时刻的位置选择是否合理？"
  ];

  const applyTemplate = (template: string) => {
    setPrompt(template);
    setError(null);
  };

  return (
    <div className="gemini-analysis">
      <h2>Gemini AI 分析</h2>
      
      <div className="analysis-container">
        <form onSubmit={handleSubmit}>
          <div className="prompt-container">
            <label htmlFor="prompt">分析提示词:</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={handlePromptChange}
              placeholder="请输入您想要AI分析的内容..."
              rows={4}
              disabled={isAnalyzing || !selectedPlayerId}
            />
            
            <div className="templates">
              <p>提示词模板:</p>
              <div className="template-buttons">
                {promptTemplates.map((template, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    disabled={isAnalyzing}
                  >
                    模板 {index + 1}
                  </button>
                ))}
              </div>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button 
              type="submit" 
              className="analyze-button"
              disabled={isAnalyzing || !selectedPlayerId || !prompt.trim()}
            >
              {isAnalyzing ? '分析中...' : '开始分析'}
            </button>
          </div>
        </form>
        
        <div className="result-container">
          <h3>分析结果</h3>
          {isAnalyzing ? (
            <div className="loading">
              <p>Gemini AI 正在分析中，请稍候...</p>
              <div className="loading-spinner"></div>
            </div>
          ) : analysisResult ? (
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