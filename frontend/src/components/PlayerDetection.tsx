import React, { useState } from 'react';

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
}

const PlayerDetection: React.FC<PlayerDetectionProps> = (props) => {
  const { 
    annotatedFrameUrl,
    playersData,
    imageDimensions,
    onPlayerSelected,
    isAnalyzing
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
      <style>
        {`
        @keyframes pulse {
          0% { opacity: 0.7; }
          50% { opacity: 1; border-color: #00FF00; }
          100% { opacity: 0.7; }
        }
        `}
      </style>
      <h2>检测结果</h2>
      
      {annotatedFrameUrl ? (
        <div className="detection-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div 
            className="frame-container" 
            style={{ 
              position: 'relative', 
              display: 'inline-block',
              maxWidth: '100%',
              border: '2px solid green' // 调试边框
            }}
          >
            <img 
              src={annotatedFrameUrl} 
              alt="Annotated Frame" 
              onClick={handleImageClick}
              onLoad={() => {
                setImageLoaded(true);
                console.log("Image loaded with dimensions:", imageDimensions);
              }}
              style={{ 
                display: 'block',
                maxWidth: '100%', 
                cursor: isAnalyzing ? 'wait' : 'pointer',
                border: '1px solid #ccc'
              }}
            />
            
            {/* 球员框层 */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}>
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
                
                // 定义边框颜色和样式
                const borderColor = isSelected ? '#FF8C00' : '#FFFFFF'; // 选中时为橙色，未选中为白色
                const borderWidth = isSelected ? 3 : 2;
                const scaleFactor = isSelected ? 1.08 : 1;
                
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
                      zIndex: 20,
                      pointerEvents: 'auto',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease-out',
                      transform: `scale(${scaleFactor})`,
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
                            borderTop: `1px solid ${isSelected ? '#FF8C00' : '#00FF00'}`,
                            borderLeft: `1px solid ${isSelected ? '#FF8C00' : '#00FF00'}`,
                            transition: 'all 0.25s ease-out',
                            boxShadow: isSelected ? '0 0 2px rgba(255, 140, 0, 0.8)' : 'none'
                          }}></div>
                          
                          {/* 右上角标记 - 只有右边和上边 */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: `${finalSize}px`,
                            height: `${finalSize}px`,
                            border: 'none',
                            borderTop: `1px solid ${isSelected ? '#FF8C00' : '#00FF00'}`,
                            borderRight: `1px solid ${isSelected ? '#FF8C00' : '#00FF00'}`,
                            transition: 'all 0.25s ease-out',
                            boxShadow: isSelected ? '0 0 2px rgba(255, 140, 0, 0.8)' : 'none'
                          }}></div>
                          
                          {/* 左下角标记 - 只有左边和下边 */}
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: `${finalSize}px`,
                            height: `${finalSize}px`,
                            border: 'none',
                            borderBottom: `1px solid ${isSelected ? '#FF8C00' : '#00FF00'}`,
                            borderLeft: `1px solid ${isSelected ? '#FF8C00' : '#00FF00'}`,
                            transition: 'all 0.25s ease-out',
                            boxShadow: isSelected ? '0 0 2px rgba(255, 140, 0, 0.8)' : 'none'
                          }}></div>
                          
                          {/* 右下角标记 - 只有右边和下边 */}
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: `${finalSize}px`,
                            height: `${finalSize}px`,
                            border: 'none',
                            borderBottom: `1px solid ${isSelected ? '#FF8C00' : '#00FF00'}`,
                            borderRight: `1px solid ${isSelected ? '#FF8C00' : '#00FF00'}`,
                            transition: 'all 0.25s ease-out',
                            boxShadow: isSelected ? '0 0 2px rgba(255, 140, 0, 0.8)' : 'none'
                          }}></div>
                        </>
                      );
                    })()}
                    
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: '-30px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(255, 140, 0, 0.7)', // 半透明背景
                        color: 'white',
                        padding: '4px 10px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        whiteSpace: 'nowrap',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        pointerEvents: 'none', // 允许点击穿透
                        zIndex: 10, // 确保不会阻挡其他元素
                        backdropFilter: 'blur(1px)', // 轻微模糊效果，增强可读性
                        opacity: 0.85 // 整体透明度
                      }}>
                        球员 #{player.id}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="image-overlay">
              {isAnalyzing && <div className="loading-overlay">分析中...</div>}
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
                              style={{
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                            >
                              {selectedPlayerId === player.id && (
                                <span style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  border: '2px solid #00FF00',
                                  borderRadius: '4px',
                                  pointerEvents: 'none',
                                  animation: 'pulse 1.5s infinite'
                                }}></span>
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