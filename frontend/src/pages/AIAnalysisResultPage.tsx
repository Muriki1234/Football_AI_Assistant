import React from 'react';
import { CheckCircle } from 'lucide-react';

interface Player {
  id: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  center: [number, number]; // [x, y]
}

interface AIAnalysisResultPageProps {
  analysisResult: string;
  selectedPlayerId: number | null;
  prompt: string;
  annotatedFrameUrl: string | null;
  playersData: Player[] | null;
  onBack: () => void;
}

const AIAnalysisResultPage: React.FC<AIAnalysisResultPageProps> = ({
  analysisResult,
  selectedPlayerId,
  prompt,
  annotatedFrameUrl,
  playersData,
  onBack
}) => {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => {
            console.log('返回按钮被点击');
            onBack();
          }}
          className="flex items-center space-x-2 text-green-600 hover:text-green-700 mb-8 transition-colors"
        >
          <span className="w-5 h-5">←</span>
          <span>返回</span>
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI 分析结果</h1>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-green-600 font-medium">上传视频</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-green-600 font-medium">选择帧数</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-green-600 font-medium">选择球员</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">4</span>
              </div>
              <span className="ml-2 text-green-600 font-medium">AI分析</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="result-content">
            

            <div className="analysis-section">
              <div className="frame-section mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">选择的帧图像</h2>
                {annotatedFrameUrl && (
                  <div className="relative">
                    <img 
                      src={annotatedFrameUrl} 
                      alt="Annotated Frame" 
                      className="w-full rounded-xl"
                    />
                    {selectedPlayerId && playersData && (
                      <>
                        <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-md">
                          已选择球员: {selectedPlayerId}
                        </div>
                        {playersData
                          .filter(player => player.id === selectedPlayerId)
                          .map(player => (
                            <div 
                              key={player.id}
                              className="absolute border-2 border-green-600"
                              style={{
                                left: `${player.bbox[0]}px`,
                                top: `${player.bbox[1]}px`,
                                width: `${player.bbox[2] - player.bbox[0]}px`,
                                height: `${player.bbox[3] - player.bbox[1]}px`,
                              }}
                            />
                          ))
                        }
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="result-section">
                <h3 className="text-xl font-bold text-gray-900 mb-2">AI 分析</h3>
                <div className="result-text bg-gray-50 p-4 rounded-xl">
                  {analysisResult.split('\n').map((paragraph, index) => (
                    <p key={index} className="text-gray-700">{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="action-buttons flex justify-center space-x-4 mt-8">
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg">
              分享分析结果
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg">
              保存分析结果
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisResultPage;