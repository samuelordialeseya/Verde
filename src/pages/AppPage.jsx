import React from 'react';
import { Link } from 'react-router-dom';

const AppPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-4xl w-full flex flex-col items-center space-y-8">
        <h1 className="text-4xl font-bold mb-4">Core MVP Interface</h1>
        
        <div className="w-full h-64 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer">
          <p className="text-slate-400 font-medium">Build your amazing features here</p>
        </div>

        <Link 
          to="/" 
          className="text-slate-400 hover:text-white transition-colors flex items-center gap-2"
        >
          ← Return to Landing Page
        </Link>
      </div>
    </div>
  );
};

export default AppPage;
