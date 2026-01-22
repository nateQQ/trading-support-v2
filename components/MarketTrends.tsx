import React, { useEffect, useState } from 'react';
import { MarketCoin } from '../types';
import { fetchTopCoins } from '../services/marketService';

const STABLECOINS = ['usdt', 'usdc', 'dai', 'fdusd', 'tusd', 'pyusd', 'usdp', 'busd', 'usde'];

const MarketTrends: React.FC = () => {
  const [coins, setCoins] = useState<MarketCoin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchTopCoins();
      // Filter out stablecoins
      const filtered = data.filter(coin => !STABLECOINS.includes(coin.symbol.toLowerCase()));
      setCoins(filtered);
      setLoading(false);
    };
    loadData();
    const interval = setInterval(loadData, 300000); 
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-4 bg-slate-800 rounded-lg h-full">
        <div className="h-6 bg-slate-700 rounded w-1/3"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-slate-700 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  const upCount = coins.filter(c => c.price_change_percentage_24h > 0).length;
  const downCount = coins.filter(c => c.price_change_percentage_24h <= 0).length;
  const overallTrend = upCount >= downCount ? 'Bullish' : 'Bearish';

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg flex flex-col h-full border border-slate-700">
      <div className="p-4 border-b border-slate-700 bg-slate-900/50 rounded-t-lg">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-white">Market Monitor</h2>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${overallTrend === 'Bullish' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
             {overallTrend}
          </span>
        </div>
        
        {/* Summary Header */}
        <div className="flex items-center space-x-4 bg-slate-800/80 p-2 rounded-md border border-slate-700/50">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-bold text-green-400">{upCount} Up</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <span className="text-sm font-bold text-red-400">{downCount} Down</span>
          </div>
          <div className="text-[10px] text-slate-500 ml-auto uppercase tracking-tighter">Excl. Stables</div>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 p-2 scrollbar-thin">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs uppercase bg-slate-700/50 text-slate-400 sticky top-0 backdrop-blur-sm">
            <tr>
              <th className="px-3 py-2 rounded-tl-md">Asset</th>
              <th className="px-3 py-2 text-right">Price</th>
              <th className="px-3 py-2 text-right rounded-tr-md">24h %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {coins.map((coin) => (
              <tr key={coin.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="px-3 py-3 font-medium flex items-center space-x-2">
                  <img src={coin.image} alt={coin.symbol} className="w-5 h-5 rounded-full" />
                  <span>{coin.symbol.toUpperCase()}</span>
                </td>
                <td className="px-3 py-3 text-right">
                  ${coin.current_price < 1 ? coin.current_price.toFixed(4) : coin.current_price.toLocaleString()}
                </td>
                <td className={`px-3 py-3 text-right font-medium ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {coin.price_change_percentage_24h.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-3 border-t border-slate-700 bg-slate-900/30 text-[10px] text-slate-500 rounded-b-lg">
        Updates automatically from live market data.
      </div>
    </div>
  );
};

export default MarketTrends;