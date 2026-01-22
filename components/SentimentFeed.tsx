import React, { useEffect, useState } from 'react';
import { fetchMarketSentiment, SentimentAnalysis } from '../services/geminiService';

const SentimentFeed: React.FC = () => {
  const [data, setData] = useState<SentimentAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSentiment = async () => {
    setLoading(true);
    const sentimentData = await fetchMarketSentiment();
    setData(sentimentData);
    setLoading(false);
  };

  useEffect(() => {
    loadSentiment();
    const interval = setInterval(loadSentiment, 3600000); // Update every hour
    return () => clearInterval(interval);
  }, []);

  const getSentimentColor = (s?: string) => {
    if (s === 'Bullish') return 'text-green-400 border-green-500/30 bg-green-500/10';
    if (s === 'Bearish') return 'text-red-400 border-red-500/30 bg-red-500/10';
    return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
  };

  if (loading) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 animate-pulse h-full">
        <div className="h-6 bg-slate-700 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-700 rounded w-full"></div>
          <div className="h-4 bg-slate-700 rounded w-5/6"></div>
          <div className="h-4 bg-slate-700 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700">
        <h3 className="text-white font-bold flex items-center space-x-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 4v4h4" />
          </svg>
          <span>Market Sentiment Hub</span>
        </h3>
        <button 
          onClick={loadSentiment}
          className="text-slate-500 hover:text-indigo-400 transition-colors"
          title="Refresh sentiment"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="flex-1 space-y-4">
        <div className={`p-3 rounded-md border text-center font-bold text-sm tracking-wide ${getSentimentStyles(data?.sentiment)}`}>
          CURRENT SENTIMENT: {data?.sentiment?.toUpperCase()}
        </div>

        <div className="text-sm text-slate-300 leading-relaxed italic">
          "{data?.summary}"
        </div>

        {data?.sources && data.sources.length > 0 && (
          <div className="pt-4 border-t border-slate-700/50">
            <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest">Grounded Sources</p>
            <div className="space-y-1.5">
              {data.sources.map((src, idx) => (
                <a 
                  key={idx} 
                  href={src.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-xs text-indigo-400 hover:text-indigo-300 truncate transition-colors underline decoration-indigo-500/30"
                >
                  {idx + 1}. {src.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 text-[10px] text-slate-500 border-t border-slate-700/30">
        Aggregating: @ThuanCapital, CMC, CG & Social Feeds.
      </div>
    </div>
  );
};

function getSentimentStyles(s?: string) {
  if (s === 'Bullish') return 'bg-green-500/10 text-green-400 border-green-500/30';
  if (s === 'Bearish') return 'bg-red-500/10 text-red-400 border-red-500/30';
  return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
}

export default SentimentFeed;
