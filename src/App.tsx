import React from 'react';
import './App.css';
import PoseDetector from './components/PoseDetector/PoseDetector';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Pose Detector</h1>
        <p>A web-based application for real-time human pose detection.</p>
      </header>
      <main>
        <ErrorBoundary>
          <PoseDetector width={640} height={480} />
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default App;
