import React from 'react';
import { Play, Upload, Target, Brain, ChevronRight } from 'lucide-react';

interface HomePageProps {
  onGetStarted: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onGetStarted }) => {
  const features = [
    {
      icon: Upload,
      title: '上传视频',
      description: '上传足球比赛视频，支持多种格式'
    },
    {
      icon: Target,
      title: '选择帧数',
      description: '精确选择需要分析的关键时刻'
    },
    {
      icon: Brain,
      title: 'AI分析',
      description: '智能识别球员并生成详细分析报告'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <Play className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">足球分析师</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-700 hover:text-green-600 transition-colors">功能介绍</a>
              <a href="#demo" className="text-gray-700 hover:text-green-600 transition-colors">使用案例</a>
              <a href="#footer" className="text-gray-700 hover:text-green-600 transition-colors">联系我们</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            AI驱动的
            <span className="text-green-600 block">足球视频分析</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            上传比赛视频，选择关键时刻，让AI为每位球员生成专业的表现分析报告
          </p>
          <button
            onClick={onGetStarted}
            className="group bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center mx-auto space-x-2"
          >
            <span>开始分析</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            三步完成专业分析
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-300 hover:shadow-xl hover:scale-105">
                  <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-green-700 transition-colors">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            专业级别的分析精度
          </h2>
          <p className="text-xl text-green-100 mb-10 max-w-3xl mx-auto">
            我们的AI技术能够精确识别球员位置、动作和战术意图，为教练和分析师提供宝贵的洞察
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white">
              <div className="text-3xl font-bold mb-2">98%</div>
              <div className="text-green-100">识别准确率</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white">
              <div className="text-3xl font-bold mb-2">&lt;2s</div>
              <div className="text-green-100">分析速度</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white">
              <div className="text-3xl font-bold mb-2">22+</div>
              <div className="text-green-100">同时追踪球员</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white">
              <div className="text-3xl font-bold mb-2">50+</div>
              <div className="text-green-100">分析维度</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <Play className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white">足球分析师</span>
          </div>
          <p className="text-gray-400">&copy; 2025 足球分析师. 为足球而生的AI分析平台.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;