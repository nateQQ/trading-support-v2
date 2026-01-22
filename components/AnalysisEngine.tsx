import React, { useState } from 'react';
import { analyzeCharts } from '../services/geminiService';
import { AnalysisResult, TradeDirection } from '../types';

const PREDEFINED_TOKENS = ['SUI', 'SOL', 'BERA'];

const AnalysisEngine: React.FC = () => {
  const [token, setToken] = useState<string>(PREDEFINED_TOKENS[0]);
  const [file15m, setFile15m] = useState<File | null>(null);
  const [file1h, setFile1h] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<'Bull' | 'Bear' | 'Neutral' | null>(null);

  const handleAnalyze = async () => {
    if (!file15m || !file1h) {
      setError("Please upload screenshots for both 15m and 1h timeframes.");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeCharts(file15m, file1h, token);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getDirectionColor = (dir: TradeDirection) => {
    switch (dir) {
      case TradeDirection.LONG: return 'text-green-400 border-green-500/50 bg-green-500/10';
      case TradeDirection.SHORT: return 'text-red-400 border-red-500/50 bg-red-500/10';
      default: return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
    }
  };

  const toggleSentiment = () => {
    if (!sentiment) setSentiment('Neutral');
    else if (sentiment === 'Neutral') setSentiment('Bull');
    else if (sentiment === 'Bull') setSentiment('Bear');
    else setSentiment('Neutral');
  };

  const getSentimentStyles = () => {
    switch(sentiment) {
      case 'Bull': return 'bg-green-600 text-white border-green-400 shadow-green-500/20';
      case 'Bear': return 'bg-red-600 text-white border-red-400 shadow-red-500/20';
      case 'Neutral': return 'bg-slate-600 text-slate-100 border-slate-400 shadow-slate-500/20';
      default: return 'bg-slate-700 text-slate-400 border-transparent hover:bg-slate-600';
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 border-b border-indigo-500/30 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Technical Analysis Engine</h2>
          <p className="text-indigo-200 text-sm">Upload charts to analyze MACD patterns and generate signals.</p>
        </div>
        <button 
          onClick={toggleSentiment}
          className={`px-4 py-2 rounded-md font-bold text-sm border-b-2 transition-all flex items-center space-x-2 ${getSentimentStyles()}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span>{sentiment ? `Sentiment: ${sentiment}` : 'Show Sentiment'}</span>
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Input Section */}
        <div className="flex flex-col h-full space-y-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Select Token</label>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_TOKENS.map(t => (
                  <button
                    key={t}
                    onClick={() => setToken(t)}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      token === t 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
                <input 
                  type="text" 
                  placeholder="Other..." 
                  className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500 w-24 text-center text-sm"
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold">15m Chart (Entry)</label>
                <div className={`border-2 border-dashed rounded-lg p-4 h-32 text-center cursor-pointer hover:bg-slate-700/50 transition-colors ${file15m ? 'border-green-500/50 bg-green-500/5' : 'border-slate-600'}`}>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setFile15m(e.target.files?.[0] || null)}
                    className="hidden" 
                    id="file15m"
                  />
                  <label htmlFor="file15m" className="cursor-pointer flex flex-col items-center justify-center h-full">
                     {file15m ? (
                       <>
                          <svg className="w-8 h-8 text-green-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <span className="text-xs text-green-300 truncate w-full px-2">{file15m.name}</span>
                       </>
                     ) : (
                       <>
                          <svg className="w-8 h-8 text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className="text-xs text-slate-400">Click to Upload</span>
                       </>
                     )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold">1H Chart (Trend)</label>
                <div className={`border-2 border-dashed rounded-lg p-4 h-32 text-center cursor-pointer hover:bg-slate-700/50 transition-colors ${file1h ? 'border-green-500/50 bg-green-500/5' : 'border-slate-600'}`}>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setFile1h(e.target.files?.[0] || null)}
                    className="hidden" 
                    id="file1h"
                  />
                  <label htmlFor="file1h" className="cursor-pointer flex flex-col items-center justify-center h-full">
                    {file1h ? (
                       <>
                          <svg className="w-8 h-8 text-green-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <span className="text-xs text-green-300 truncate w-full px-2">{file1h.name}</span>
                       </>
                     ) : (
                       <>
                          <svg className="w-8 h-8 text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className="text-xs text-slate-400">Click to Upload</span>
                       </>
                     )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-700/50">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !file15m || !file1h}
              className={`w-full py-4 rounded-lg font-bold text-lg shadow-lg flex justify-center items-center space-x-2 transition-all ${
                isAnalyzing 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-500/50 active:scale-[0.98]'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Analyzing Market Data...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <span>Generate Signal</span>
                </>
              )}
            </button>
            
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results Section */}
        <div className="relative min-h-[450px]">
          {!result && !isAnalyzing && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-lg bg-slate-800/50">
                <div className="p-6 bg-slate-900 rounded-full mb-4 shadow-inner">
                  <svg className="w-12 h-12 text-indigo-500/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <p className="font-medium">Waiting for Chart Uploads</p>
                <p className="text-xs text-slate-600 mt-2 max-w-[200px] text-center">Signals will be calculated once 15m and 1h charts are provided.</p>
             </div>
          )}

          {result && (
            <div className="h-full flex flex-col space-y-4 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                 <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                   <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                   <span>Signal for {token}</span>
                 </h3>
                 <span className={`px-3 py-1 rounded text-xs font-bold uppercase border shadow-sm ${getDirectionColor(result.direction)}`}>
                    Action: {result.direction}
                 </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div className="p-3 bg-slate-900/80 rounded border border-slate-700/50">
                    <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Entry Target</div>
                    <div className="text-xl font-mono text-white mt-1">{result.entryPrice}</div>
                 </div>
                 <div className="p-3 bg-slate-900/80 rounded border border-slate-700/50">
                    <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Take Profit</div>
                    <div className="text-xl font-mono text-green-400 mt-1">{result.targetPrice}</div>
                 </div>
                 <div className="p-3 bg-slate-900/80 rounded border border-slate-700/50">
                    <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">PnL Projection</div>
                    <div className="text-lg font-medium text-white mt-1">{result.pnlProjection}</div>
                 </div>
                 <div className="p-3 bg-slate-900/80 rounded border border-slate-700/50">
                    <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Confidence</div>
                    <div className={`text-lg font-medium mt-1 ${result.confidence === 'High' ? 'text-green-400' : result.confidence === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {result.confidence}
                    </div>
                 </div>
              </div>

              <div className="p-4 bg-slate-700/20 rounded-lg border border-slate-700/50 flex-1 flex flex-col">
                 <div className="text-indigo-400 text-[10px] uppercase font-bold mb-2 tracking-widest">Analysis Rationale</div>
                 <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line flex-1">
                   {result.rationale}
                 </p>
                 <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 italic">Trend Discovery: {result.trend}</span>
                    <div className="flex space-x-1">
                       <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                       <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                       <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisEngine;