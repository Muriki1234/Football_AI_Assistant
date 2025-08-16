import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle, Film } from 'lucide-react';

interface FrameSelectorProps {
  videoUrl: string;
  onTimeSelected: (timeInSeconds: number) => void;
  onBack: () => void;
  onContinue: () => Promise<void>; // 父组件分析函数，返回 Promise
}

const FrameSelector: React.FC<FrameSelectorProps> = ({
  videoUrl,
  onTimeSelected,
  onBack,
  onContinue,
}) => {
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [selectedTime, setSelectedTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 处理视频加载
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;

      const handleLoadedMetadata = () => {
        setVideoDuration(video.duration);
        const middleTime = video.duration / 2;
        setSelectedTime(middleTime);
        video.currentTime = middleTime;
      };

      const handleTimeUpdate = () => {
        if (isPlaying) {
          setSelectedTime(video.currentTime);
        }
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [videoUrl, isPlaying]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setSelectedTime(time);
    if (videoRef.current) videoRef.current.currentTime = time;
    onTimeSelected(time);
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      onTimeSelected(videoRef.current.currentTime);
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 点击使用此帧进行分析
  const handleContinueClick = async () => {
    setIsLoading(true);
    setUploadProgress(0);

    // 模拟 4 秒内进度到 80%
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 80) {
          clearInterval(interval);
          return 80;
        }
        return prev + 2; // 每 100ms 增加 2%，4秒到80%
      });
    }, 100);

    try {
      // 等待父组件分析完成
      await onContinue();

      // 分析完成，显示 100%
      setUploadProgress(100);

      setTimeout(() => {
        setIsLoading(false);
      }, 300); // 给用户一点缓冲
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-green-600 hover:text-green-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回上传</span>
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">选择视频帧</h1>
          <p className="text-xl text-gray-600">选择最佳时间点进行分析</p>
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
            <div className="w-12 h-0.5 bg-green-500"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">2</span>
              </div>
              <span className="ml-2 text-green-600 font-medium">选择帧数</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-500 text-sm font-semibold">3</span>
              </div>
              <span className="ml-2 text-gray-500 font-medium">选择球员</span>
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

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              {uploadProgress === 100 ? (
                <CheckCircle className="w-10 h-10 text-green-600" />
              ) : (
                <Film className="w-10 h-10 text-green-600" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {uploadProgress === 100 ? '分析完成!' : '正在分析视频帧...'}
            </h3>
            <div className="max-w-md mx-auto mb-4">
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-gray-600 mt-2">{uploadProgress}% 已完成</p>
            </div>
            {uploadProgress === 100 && <p className="text-green-600 font-medium">正在跳转...</p>}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="aspect-w-16 aspect-h-9 mb-6">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full rounded-lg shadow-md"
                onClick={handlePlayPause}
                playsInline
              />
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span className="font-medium">当前时间点:</span>
                </div>
                <span className="text-lg font-bold">{formatTime(selectedTime)}</span>
              </div>

              <div>
                <input
                  type="range"
                  min="0"
                  max={videoDuration}
                  step="0.1"
                  value={selectedTime}
                  onChange={handleTimeChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-2 text-sm text-gray-600">
                  <span>0:00</span>
                  <span>{formatTime(videoDuration)}</span>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handlePlayPause}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors mr-4"
                >
                  {isPlaying ? '暂停' : '播放'}
                </button>
                <button
                  onClick={handleContinueClick}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg font-semibold transition-colors"
                >
                  使用此帧进行分析
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 rounded-xl p-6">
          <h4 className="font-bold text-blue-900 mb-3">选择帧数提示:</h4>
          <ul className="text-blue-800 space-y-2">
            <li>• 选择球员清晰可见的帧</li>
            <li>• 避免选择动作模糊的时刻</li>
            <li>• 尽量选择多名球员同时出现在画面中的帧</li>
            <li>• 可以使用播放按钮预览视频内容</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FrameSelector;
