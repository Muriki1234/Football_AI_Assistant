import React, { useRef, useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface Player {
  id: number;
  bbox: [number, number, number, number]; 
  center: [number, number]; 
}

interface AIAnalysisResultPageProps {
  analysisResult: string;
  selectedPlayerId: number | null;
  prompt: string;
  annotatedFrameUrl: string | null;
  playersData: Player[] | null;
  onBackToPlayerSelection: () => void; // 返回选择球员
}

const AIAnalysisResultPage: React.FC<AIAnalysisResultPageProps> = ({
  analysisResult,
  selectedPlayerId,
  prompt,
  annotatedFrameUrl,
  playersData,
  onBackToPlayerSelection
}) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgSize, setImgSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    if (imgRef.current) {
      const updateSize = () => {
        setImgSize({
          width: imgRef.current?.clientWidth || 0,
          height: imgRef.current?.clientHeight || 0
        });
      };
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, [annotatedFrameUrl]);

  const originalWidth = playersData && playersData.length > 0 ? 1920 : 0;
  const originalHeight = playersData && playersData.length > 0 ? 1080 : 0;

  const scaleX = originalWidth ? imgSize.width / originalWidth : 1;
  const scaleY = originalHeight ? imgSize.height / originalHeight : 1;

  const handleCopyResult = () => {
    navigator.clipboard.writeText(analysisResult)
      .then(() => alert('分析结果已复制到剪贴板'))
      .catch(() => alert('复制失败'));
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 返回选择球员 */}
      {/* <button
        onClick={onBackToPlayerSelection} // 调用 App.tsx 的 handleBackToPlayerSelection
        className="flex items-center space-x-2 text-green-600 hover:text-green-700 mb-8 transition-colors"
      >
        <span className="w-5 h-5">←</span>
        <span>返回选择球员</span>
      </button> */}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI 分析结果</h1>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            {['上传视频', '选择帧数', '选择球员', 'AI分析'].map((step, idx) => (
              <React.Fragment key={idx}>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    {idx < 3 ? <CheckCircle className="w-5 h-5 text-white" /> : <span className="text-white text-sm font-semibold">4</span>}
                  </div>
                  <span className="ml-2 text-green-600 font-medium">{step}</span>
                </div>
                {idx < 3 && <div className="w-12 h-0.5 bg-gray-300"></div>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="result-content">
            <div className="analysis-section">
              <div className="frame-section mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">选择的帧图像</h2>
                {annotatedFrameUrl && (
                  <div className="relative inline-block">
                    <img
                      ref={imgRef}
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
                              className="absolute border-1 border-sky-500 animate-pulse"
                              style={{
                                left: player.bbox[0] * scaleX,
                                top: player.bbox[1] * scaleY,
                                width: (player.bbox[2] - player.bbox[0]) * scaleX,
                                height: (player.bbox[3] - player.bbox[1]) * scaleY,
                                boxShadow: "0 0 20px 5px rgb(51, 0, 255)"
                              }}
                            />
                          ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="result-section">
                <h3 className="text-xl font-bold text-gray-900 mb-2">AI 分析</h3>
                <div className="result-text bg-gray-50 p-4 rounded-xl">
                  {analysisResult.split('\\n').map((paragraph, index) => (
                    <p key={index} className="text-gray-700">{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="action-buttons flex justify-center space-x-4 mt-8">
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
              onClick={handleCopyResult}
            >
              复制结果
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
              onClick={handleBackToHome}
            >
              返回主页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisResultPage;
