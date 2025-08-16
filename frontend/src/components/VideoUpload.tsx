import React, { useState, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';

interface VideoUploadProps {
  onVideoUpload: (data: { file: File; videoUrl: string }) => void;
  onBack: () => void;
  showBackButton: boolean;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ 
  onVideoUpload, 
  onBack, 
  showBackButton 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 支持的视频格式
  const supportedFormats = ['mp4', 'avi', 'mov', 'wmv', 'flv'];
 

  const validateFile = (file: File): string | null => {
    console.log('验证文件:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    // 检查文件类型
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !supportedFormats.includes(fileExtension)) {
      return `不支持的文件格式。请上传 ${supportedFormats.join(', ').toUpperCase()} 格式的视频文件`;
    }

    // 检查 MIME 类型
    if (!file.type.startsWith('video/')) {
      console.warn('文件 MIME 类型不是视频类型:', file.type);
    }

    // 检查文件大小


    if (file.size === 0) {
      return '文件为空，请选择有效的视频文件';
    }

    return null;
  };

const handleFileSelect = async (file: File) => {
  setError(null);
  setIsValidating(true);

  try {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setIsValidating(false);
      return;
    }

    setSelectedFile(file);

    // 验证视频可播放性（延长超时，且不立刻 revoke）
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);

    const validateVideo = new Promise<void>((resolve, reject) => {
      let timeoutId: NodeJS.Timeout;

      video.onloadedmetadata = () => {
        console.log('视频验证成功:', {
          duration: video.duration,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        });
        clearTimeout(timeoutId);
        resolve();
      };

      video.onerror = () => {
        console.error('视频验证失败');
        clearTimeout(timeoutId);
        reject(new Error('无法播放此视频文件，请检查文件是否损坏'));
      };

      // 延长超时
      timeoutId = setTimeout(() => {
        console.warn('视频验证超时，但保留文件供后端分析');
        resolve(); // 不 reject，允许继续
      }, 12000);

      video.src = url;
    });

    await validateVideo;
    console.log('文件验证完成，准备上传');

    // 等到文件被替换或组件卸载时再 revoke
    if (fileInputRef.current) {
      fileInputRef.current.onchange = () => {
        URL.revokeObjectURL(url);
      };
    }

  } catch (err) {
    console.error('文件验证错误:', err);
    setError(err instanceof Error ? err.message : '文件验证失败');
    // 不清空 selectedFile，允许继续上传
  } finally {
    setIsValidating(false);
  }
};


  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    console.log('拖放文件:', files.map(f => ({ name: f.name, type: f.type, size: f.size })));
    
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log('文件输入变化:', files[0]);
      handleFileSelect(files[0]);
    }
  };

  const handleContinue = () => {
    if (!selectedFile) {
      setError('请先选择视频文件');
      return;
    }

    console.log('继续处理，上传文件:', selectedFile);
    
    try {
      const videoUrl = URL.createObjectURL(selectedFile);
      onVideoUpload({ file: selectedFile, videoUrl });
    } catch (err) {
      console.error('创建视频URL失败:', err);
      setError('处理视频文件失败');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {showBackButton && (
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-green-600 hover:text-green-700 mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回主页</span>
          </button>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">上传足球视频</h1>
          <p className="text-xl text-gray-600">支持格式: {supportedFormats.map(f => f.toUpperCase()).join(', ')}</p>
        </div>

 {/* Progress Bar */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">1</span>
                              </div>
              <span className="ml-2 text-green-600 font-medium">上传视频</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-500 text-sm font-semibold">2</span>
              </div>
              <span className="ml-2 text-gray-500 font-medium">选择帧数</span>
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
        {/* 调试信息 */}
        {selectedFile && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">文件信息 (调试)</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>文件名:</strong> {selectedFile.name}</div>
              <div><strong>大小:</strong> {formatFileSize(selectedFile.size)}</div>
              <div><strong>类型:</strong> {selectedFile.type}</div>
              <div><strong>修改时间:</strong> {new Date(selectedFile.lastModified).toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* 文件上传区域 */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-8 ${
            dragActive
              ? 'border-green-400 bg-green-50'
              : selectedFile
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setDragActive(true)}
          onDragLeave={() => setDragActive(false)}
        >
          {isValidating ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
              <p className="text-gray-600">验证视频文件...</p>
            </div>
          ) : selectedFile ? (
            <div className="flex flex-col items-center">
              <div className="bg-green-100 rounded-full p-3 mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-800 mb-2">
                {selectedFile.name}
              </p>
              <p className="text-gray-600 mb-4">
                {formatFileSize(selectedFile.size)}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-green-600 hover:text-green-700 underline"
              >
                选择其他文件
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="bg-gray-100 rounded-full p-3 mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-lg text-gray-700 mb-2">
                拖放视频文件到这里，或点击选择文件
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                选择文件
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={supportedFormats.map(f => `.${f}`).join(',')}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}


        {/* 操作按钮 */}
        <div className="flex justify-center mt-8">
          <button
            onClick={handleContinue}
            disabled={!selectedFile || isValidating}
            className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
              selectedFile && !isValidating
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isValidating ? '验证中...' : '继续分析'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoUpload;