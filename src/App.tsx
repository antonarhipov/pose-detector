import React from 'react';
import './App.css';
import PoseDetector from './components/PoseDetector/PoseDetector';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Pose Detector</h1>
        <p>A web-based application for real-time human pose detection.</p>
      </header>
      <main>
        <PoseDetector width={640} height={480} />
      </main>
    </div>
  );
}

export default App;
