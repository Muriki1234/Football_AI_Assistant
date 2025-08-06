import React, { useState, useRef } from 'react';

interface VideoUploaderProps {
  onVideoSelected: (file: File) => void;
  onTimeSelected: (timeInSeconds: number) => void;
  isLoading: boolean;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ 
  onVideoSelected, 
  onTimeSelected, 
  isLoading 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [selectedTime, setSelectedTime] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      onVideoSelected(file);
      
      // 创建视频URL用于预览
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      
      // 重置时间选择
      setSelectedTime(0);
    }
  };

  const handleVideoLoad = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
      // 默认选择视频中间时间点
      const middleTime = videoRef.current.duration / 2;
      setSelectedTime(middleTime);
      onTimeSelected(middleTime);
    }
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(event.target.value);
    setSelectedTime(time);
    onTimeSelected(time);
    
    // 更新视频当前时间
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-uploader">
      <h2>上传视频</h2>
      
      <div className="upload-container">
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          disabled={isLoading}
          id="video-upload"
        />
        <label htmlFor="video-upload" className="upload-button">
          选择视频文件
        </label>
        
        {selectedFile && (
          <div className="file-info">
            已选择: {selectedFile.name} ({Math.round(selectedFile.size / 1024 / 1024 * 10) / 10} MB)
          </div>
        )}
      </div>

      {videoUrl && (
        <div className="video-preview-container">
          <h3>视频预览</h3>
          <video 
            ref={videoRef}
            src={videoUrl} 
            controls 
            onLoadedMetadata={handleVideoLoad}
            style={{ maxWidth: '100%', maxHeight: '300px' }}
          />
          
          {videoDuration > 0 && (
            <div className="time-selector">
              <h3>选择时间点: {formatTime(selectedTime)}</h3>
              <input
                type="range"
                min="0"
                max={videoDuration}
                step="0.1"
                value={selectedTime}
                onChange={handleTimeChange}
                disabled={isLoading}
                style={{ width: '100%' }}
              />
              <div className="time-labels">
                <span>0:00</span>
                <span>{formatTime(videoDuration)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoUploader;