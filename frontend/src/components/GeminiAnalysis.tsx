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
  isAnalyzing: boolean;   // ✅ 来自父组件
}

const GeminiAnalysis: React.FC<GeminiAnalysisProps> = ({
  onAnalyzeRequest,
  analysisResult,
  selectedPlayerId,
  selectedFrame,
  selectedSecond,
  selectedX,
  selectedY,
  videoUrl,
  isAnalyzing
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlayerId) {
      setError('请先选择一个球员');
      return;
    }

    try {
      let targetName = playerName || '目标球员';

      let prompt = `请基于用户上传的视频数据，分析其中的一个球员，它位于第 ${selectedFrame} 帧（视频时间：${selectedSecond} 秒），在视频中的 x ${selectedX} y ${selectedY} 位置。`;

      // 如果有用户输入的姓名，用姓名替换所有“球员”
      prompt = prompt.replace(/球员/g, targetName);

      if (jerseyNumber) {
        prompt += ` ${targetName} 身穿 ${jerseyNumber} 号球衣。`;
      }

      if (playerName) {
        prompt += ` 该球员姓名：${playerName}。`;
      }
      if (position) {
        prompt += ` 场上位置：${position}。`;
      }

      // 后续分析内容
      prompt += `
生成一份简体中文的全面分析报告，包括：
1. ${targetName} 动态行为分析：描述跑动、传球、防守、射门等动作特点。
2. 关键事件：识别 ${targetName} 参与的关键事件，如角球、射门、助攻、防守拦截等。
3. 整体战术分析：分析 ${targetName} 在比赛中的战术作用、位置选择和与队友的配合。
4. ${targetName} 特点：${position ? '惯用脚、技术优势与弱点等' : '技术优势与弱点等'}。
5. 针对性建议：提出可改进或优化的方面，但不涉及具体帧或时间点。

注意事项：
- 报告标题统一为“${targetName}视频分析报告”，不包含秒数或具体位置描述。
- 保持语言专业、流畅、逻辑清晰，条理分明。
- 避免提及视频时长、画面角度或其他局限性。
`;

      await onAnalyzeRequest(prompt);
    } catch (err) {
      setError(`分析请求失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  const [jerseyNumber, setJerseyNumber] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');

  return (
    <div className="gemini-analysis">
      <h2 className="text-xl font-bold mb-4">Gemini AI 分析</h2>
      <div className="mb-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <input
            type="text"
            placeholder="球衣号码（可选）"
            className="p-2 border rounded"
            value={jerseyNumber}
            onChange={(e) => setJerseyNumber(e.target.value)}
          />
          <input
            type="text"
            placeholder="场上位置（可选）"
            className="p-2 border rounded"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
          <input
            type="text"
            placeholder="球员姓名（可选）"
            className="p-2 border rounded"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">可提高AI分析的精准度</p>
      </div>
      <form onSubmit={handleSubmit}>
        <button 
          type="submit" 
          className="analyze-button"
          disabled={!selectedPlayerId || isAnalyzing}
        >
          {isAnalyzing ? '分析中...' : '开始分析'}
        </button>

        <div className="mt-2 text-gray-600 italic">
          {selectedPlayerId ? '点击“开始分析”生成报告' : '请先选择一个球员'}
        </div>

       
      </form>

      {error && (
        <div className="text-red-500 mt-2">
          {error}
        </div>
      )}
    </div>
  );
};
export default GeminiAnalysis;