import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 如果你想开始测量应用的性能，可以传递一个函数
// 来记录结果（例如: reportWebVitals(console.log)）
// 或发送到分析端点。了解更多: https://bit.ly/CRA-vitals
reportWebVitals();