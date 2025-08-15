 import React, { useState } from 'react';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import '../styles/PlayerDetection.css';

interface Player {
  id: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  center: [number, number]; // [x, y]
}

interface PlayerDetectionProps {
  annotatedFrameUrl: string | null;
  playersData: Player[] | null;
  imageDimensions: { width: number; height: number };
  onPlayerSelected: (playerId: number, coordinates: { x: number, y: number }) => void;
  isAnalyzing: boolean;
  onBack?: () => void; // 添加返回按钮回调
}

const PlayerDetection: React.FC<PlayerDetectionProps> = (props) => {
  // 添加淡入动画的样式
  const fadeInAnimation = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(-5px); }
    }
    
    @keyframes loading {
      0% { width: 0%; }
      100% { width: 100%; }
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .new-loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background-color: rgba(255, 255, 255, 0.9);
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .new-loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(22, 163, 74, 0.3);
      border-top: 4px solid #16a34a;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    .new-loading-text {
      margin-top: 1rem;
      font-size: 1rem;
      color: #16a34a;
      font-weight: 500;
    }
  `;
  const { 
    annotatedFrameUrl,
    playersData,
    imageDimensions,
    onPlayerSelected,
    isAnalyzing,
    onBack
  } = props;
  
  console.log('PlayerDetection props:', {
    annotatedFrameUrl,
    playersData,
    imageDimensions,
    isAnalyzing
  });
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const handlePlayerClick = (playerId: number) => {
    if (!playersData) return;
    
    // 如果点击的是已选中的球员，则取消选中
    if (selectedPlayerId === playerId) {
      setSelectedPlayerId(null);
      return;
    }
    
    const player = playersData.find(p => p.id === playerId);
    if (player) {
      setSelectedPlayerId(playerId);
      onPlayerSelected(playerId, { 
        x: player.center[0], 
        y: player.center[1] 
      });
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageLoaded || isAnalyzing || !playersData) return;
    
    // 获取点击坐标
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 计算实际图像上的坐标（考虑缩放）
    const scaleX = imageDimensions.width / rect.width;
    const scaleY = imageDimensions.height / rect.height;
    const imageX = x * scaleX;
    const imageY = y * scaleY;
    
    // 查找最近的球员
    let closestPlayer: Player | null = null;
    let minDistance = Number.MAX_VALUE;
    
    for (const player of playersData) {
      const [centerX, centerY] = player.center;
      const distance = Math.sqrt(
        Math.pow(centerX - imageX, 2) + Math.pow(centerY - imageY, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPlayer = player;
      }
    }
    
    console.log(`Clicked at (${imageX}, ${imageY}), closest player distance: ${minDistance}`);
    // 如果点击位置在某个球员附近（30像素内），选择该球员
    if (closestPlayer && minDistance < 30) {
      handlePlayerClick(closestPlayer.id);
    }
  };

  // 调试信息 - 显示当前角标记样式
  console.log('角标记样式:', {
    size: {
      calculation: '球员框尺寸的10%',
      minSize: '3px',
      maxSize: '8px',
      selectedMultiplier: '1.2倍'
    },
    borderWidth: '1px',
    colors: {
      normal: '#00FF00',
      selected: '#FF8C00'
    },
    shape: 'L形角标记 - 完全镂空',
    adaptive: '根据球员框大小自动调整'
  });

  return (
    <div className="player-detection">
      <style>{fadeInAnimation}</style>
      <button
  onClick={() => {
    if (onBack) {
      onBack();
    } else {
      window.location.pathname = '/frameselector';
    }
  }}
  className="flex items-center space-x-2 text-green-600 hover:text-green-700 mb-8 transition-colors"
>
  <ArrowLeft className="w-5 h-5" />
  <span>返回选择帧数</span>
</button>
      
      {/* Progress Bar */}
      <div className="flex items-center justify-center mb-12">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <span className="ml-2 text-green-600 font-medium">上传视频</span>
          </div>
          <div className="w-12 h-0.5 bg-green-500"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <span className="ml-2 text-green-600 font-medium">选择帧数</span>
          </div>
          <div className="w-12 h-0.5 bg-green-500"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
               <span className="text-white text-sm font-semibold">3</span>
            </div>
            <span className="ml-2 text-green-600 font-medium">选择球员</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-300"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-500 text-sm font-semibold">4</span>
            </div>
            <span className="ml-2 text-gray-500">AI分析</span>
          </div>
        </div>
      </div>
      
      <h2>检测结果</h2>
      
      {annotatedFrameUrl ? (
        <div className="detection-container">
          {isAnalyzing && (
            <div className="loading-bar">
              <div className="loading-progress"></div>
            </div>
          )}
          <div className="frame-container">
            <img 
              src={annotatedFrameUrl} 
              alt="Annotated Frame" 
              onClick={handleImageClick}
              onLoad={() => {
                setImageLoaded(true);
                console.log("Image loaded with dimensions:", imageDimensions);
              }}
              style={{ cursor: isAnalyzing ? 'wait' : 'pointer' }}
            />
            
            {/* 球员框层 */}
            <div className="player-boxes-layer">
              {playersData && playersData.length > 0 && playersData.map(player => {
                const [x1, y1, x2, y2] = player.bbox;
                const isSelected = selectedPlayerId === player.id;
                
                // 计算相对于图像实际显示尺寸的坐标
                const imgElement = document.querySelector('.frame-container img') as HTMLImageElement;
                let displayX1 = x1;
                let displayY1 = y1;
                let displayWidth = x2 - x1;
                let displayHeight = y2 - y1;
                
                if (imgElement) {
                  const scaleX = imgElement.offsetWidth / imageDimensions.width;
                  const scaleY = imgElement.offsetHeight / imageDimensions.height;
                  displayX1 = x1 * scaleX;
                  displayY1 = y1 * scaleY;
                  displayWidth = (x2 - x1) * scaleX;
                  displayHeight = (y2 - y1) * scaleY;
                }
                
                // 定义边框样式 - 增强选中时的放大效果
                const scaleFactor = isSelected ? 1.25 : 1;
                
                return (
                  <div
                    key={`player-box-${player.id}`}
                    style={{
                      position: 'absolute',
                      left: `${displayX1}px`,
                      top: `${displayY1}px`,
                      width: `${displayWidth}px`,
                      height: `${displayHeight}px`,
                      backgroundColor: 'transparent',
                      pointerEvents: 'auto',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      transform: `scale(${scaleFactor})`,
                      zIndex: isSelected ? 30 : 20
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayerClick(player.id);
                    }}
                  >
                    {/* 计算角标记大小 - 根据球员框尺寸的百分比 */}
                    {(() => {
                      // 计算角标记大小为宽度和高度的10%，但不小于3px且不大于8px
                      const cornerSize = Math.max(
                        3,
                        Math.min(
                          8,
                          Math.min(displayWidth, displayHeight) * 0.1
                        )
                      );
                      
                      // 选中状态稍微放大
                      const selectedCornerSize = cornerSize * 1.2;
                      
                      // 最终使用的尺寸
                      const finalSize = isSelected ? selectedCornerSize : cornerSize;
                      
                      return (
                        <>
                          {/* 左上角标记 - 只有左边和上边 */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: `${finalSize}px`,
                            height: `${finalSize}px`,
                            border: 'none',
                            borderTop: `${isSelected ? '2px' : '1px'} solid ${isSelected ? '#FF8C00' : '#00FF00'}`,
                            borderLeft: `${isSelected ? '2px' : '1px'} solid ${isSelected ? '#FF8C00' : '#00FF00'}`,
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                          }}></div>
                          
                          {/* 右上角标记 - 只有右边和上边 */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: `${finalSize}px`,
                            height: `${finalSize}px`,
                            border: 'none',
                            borderTop: `${isSelected ? '2px' : '1px'} solid ${isSelected ? '#FF8C00' : '#00FF00'}`,
                            borderRight: `${isSelected ? '2px' : '1px'} solid ${isSelected ? '#FF8C00' : '#00FF00'}`,
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                          }}></div>
                          
                          {/* 左下角标记 - 只有左边和下边 */}
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: `${finalSize}px`,
                            height: `${finalSize}px`,
                            border: 'none',
                            borderBottom: `${isSelected ? '2px' : '1px'} solid ${isSelected ? '#FF8C00' : '#00FF00'}`,
                            borderLeft: `${isSelected ? '2px' : '1px'} solid ${isSelected ? '#FF8C00' : '#00FF00'}`,
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                          }}></div>
                          
                          {/* 右下角标记 - 只有右边和下边 */}
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: `${finalSize}px`,
                            height: `${finalSize}px`,
                            border: 'none',
                            borderBottom: `${isSelected ? '2px' : '1px'} solid ${isSelected ? '#FF8C00' : '#00FF00'}`,
                            borderRight: `${isSelected ? '2px' : '1px'} solid ${isSelected ? '#FF8C00' : '#00FF00'}`,
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                          }}></div>
                        </>
                      );
                    })()}
                    
                    {isSelected && (
                      <div 
                        className="player-label"
                        style={{
                          backgroundColor: 'rgba(255, 140, 0, 0.85)',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                          transform: 'translateY(-5px)',
                          animation: 'fadeIn 0.3s ease-out',
                          border: '3px solid orange'
                        }}
                      >
                        球员 #{player.id}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="image-overlay">
              {isAnalyzing && (
            <div className="new-loading-container">
              <div className="new-loading-spinner"></div>
              <p className="new-loading-text">正在分析视频，请稍候...</p>
            </div>
          )}
            </div>
          </div>
          
                      <div className="players-list">
                        <h3>检测到的球员</h3>
                        {!playersData ? (
                          <p>等待分析结果...</p>
                        ) : playersData.length === 0 ? (
                          <p>未检测到球员</p>
                        ) : (
                          <ul>
                            {playersData.map(player => (
                              <li 
                                key={player.id}
                                className={selectedPlayerId === player.id ? 'selected' : ''}
                                onClick={() => handlePlayerClick(player.id)}
                              >
                                {selectedPlayerId === player.id && (
                                  <span className="selection-indicator"></span>
                                )}
                                球员 #{player.id} 
                                <span className="coordinates">
                                  位置: ({player.center[0]}, {player.center[1]})
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="instructions">
                          <p>点击图像或列表中的球员进行选择</p>
                          <p>选择球员后可进行AI分析</p>
                        </div>
                      </div>
        </div>
      ) : (
        <div className="no-detection">
          <p>请先上传视频并进行分析</p>
        </div>
      )}
    </div>
  );
};

export default PlayerDetection;