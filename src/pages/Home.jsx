import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { executeDummyServiceCall } from '../services/api';

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const handleTestService = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await executeDummyServiceCall({ action: 'ping_backend' });
      setResponse(res);
    } catch (error) {
      console.error("Service execution failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 p-4">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Hackathon Skeleton
          </span>
        </h1>
        
        <p className="text-lg text-slate-600">
          Vite • React • Tailwind • Firebase architecture ready.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4">
          <button 
            onClick={handleTestService}
            disabled={loading}
            className="px-6 py-3 min-w-[200px] text-white font-medium bg-blue-600 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {loading ? "Processing..." : "Test App Contract"}
          </button>
          
          <Link 
            to="/app" 
            className="px-6 py-3 min-w-[200px] font-medium text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            Enter Main App →
          </Link>
        </div>

        {response && (
          <div className="mt-8 p-6 text-left bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Service Output</h3>
            <pre className="text-sm text-green-600 font-mono bg-slate-50 p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
