import React from 'react';
import './styles/App.css';
import FrameAnalysis from './pages/FrameAnalysis';

const App: React.FC = () => {
  return (
    <div className="app">
      <FrameAnalysis />
    </div>
  );
};

export default App;