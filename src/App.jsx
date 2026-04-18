import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AppPage from './pages/AppPage';
import { runProgrammer3Test, simulateSubmission } from './services/test';

function App() {
  const [testResult, setTestResult] = useState(null);
  const [isTestLoading, setIsTestLoading] = useState(false);

  useEffect(() => {
    // Seed the database with the test bounty so we have something to query
    runProgrammer3Test().catch(console.error);
  }, []);

  const handleTestSubmit = async () => {
    setIsTestLoading(true);
    setTestResult(null);
    try {
      const res = await simulateSubmission(null);
      setTestResult(res);
    } catch (e) {
      setTestResult({ error: e.message || "An error occurred" });
    }
    setIsTestLoading(false);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/app" element={<AppPage />} />
      </Routes>

      {/* --- TEMPORARY PROGRAMMER 3 TEST PANEL --- */}
      <div style={{
        position: 'fixed', bottom: 20, right: 20, 
        backgroundColor: '#1f2937', color: '#10b981', 
        padding: '16px', borderRadius: '8px', 
        zIndex: 9999, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        border: '1px solid #374151', minWidth: '250px'
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'white' }}>🤖 AI Pipeline Test</h3>
        <button 
          onClick={handleTestSubmit}
          disabled={isTestLoading}
          style={{
            backgroundColor: '#3b82f6', color: 'white', padding: '8px 16px', 
            borderRadius: '6px', border: 'none', cursor: isTestLoading ? 'wait' : 'pointer',
            width: '100%', fontWeight: 'bold'
          }}
        >
          {isTestLoading ? "Gemini is thinking..." : "Simulate Validation"}
        </button>

        {testResult && (
          <div style={{ marginTop: '12px', fontSize: '12px', backgroundColor: '#111827', padding: '8px', borderRadius: '4px' }}>
            <span style={{color: testResult.verdict === 'approved' ? '#10b981' : '#ef4444'}}>
              Verdict: {testResult.verdict?.toUpperCase() || 'ERROR'}
            </span><br/>
            <span style={{color: '#9ca3af'}}>Reason: {testResult.reason}</span>
            <pre style={{ overflowX: 'auto', margin: '8px 0 0 0', color: '#60a5fa' }}>
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
