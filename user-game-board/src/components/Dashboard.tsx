import React, { useState, useEffect } from 'react';
import { Eye, DollarSign, TrendingUp, PieChart, Banknote } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface DashboardProps {
  gameStats: any;
  gameData: any[];
}

const Dashboard: React.FC<DashboardProps> = ({ gameStats, gameData }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-slate-800 p-6 rounded-lg">
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`${color} text-2xl`} size={24} />
        <h3 className="text-gray-300 text-sm">{title}</h3>
      </div>
      <div className="text-white text-xl font-bold">*** Birr</div>
      <button className="mt-2">
        <Eye className="text-gray-400" size={16} />
      </button>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="text-center text-white mb-8">
        <h1 className="text-3xl font-bold">User ONE</h1>
        <p className="text-xl text-gray-300">Balance 0.00</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Daily Profit"
          value="*** Birr"
          icon={DollarSign}
          color="text-red-500"
        />
        <StatCard
          title="Daily Total"
          value="*** Birr"
          icon={TrendingUp}
          color="text-red-500"
        />
        <StatCard
          title="Weekly Total"
          value="*** Birr"
          icon={PieChart}
          color="text-red-500"
        />
        <StatCard
          title="Weekly Profit"
          value="*** Birr"
          icon={Banknote}
          color="text-red-500"
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="15 Day Profit"
          value="*** Birr"
          icon={Banknote}
          color="text-red-500"
        />
        <StatCard
          title="Today House Jackpot"
          value="*** Birr"
          icon={Banknote}
          color="text-red-500"
        />
        <StatCard
          title="Today Players Jackpot"
          value="*** Birr"
          icon={Banknote}
          color="text-red-500"
        />
        <div className="bg-pink-600 p-6 rounded-lg flex items-center justify-center">
          <button className="text-white font-semibold">
            Go to Jackpot Data
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
          Game Analytics
        </button>
      </div>

      {/* Chart Area */}
      <div className="bg-slate-800 p-6 rounded-lg">
        <div className="h-64 flex items-end justify-between gap-2">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className="bg-green-500 w-12"
                style={{ height: `${Math.random() * 200 + 50}px` }}
              />
              <span className="text-xs text-gray-400">
                2025-{String(8 - i).padStart(2, '0')}-{String(31 - i).padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-2 text-green-500">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            profit
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-white">
          <thead className="bg-slate-700">
            <tr>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Games</th>
              <th className="p-4 text-left">Players Bet</th>
              <th className="p-4 text-left">Players Won</th>
              <th className="p-4 text-left">House Profit</th>
            </tr>
          </thead>
          <tbody>
            {gameData.map((row, index) => (
              <tr key={index} className="border-t border-slate-600">
                <td className="p-4">{row.date}</td>
                <td className="p-4">{row.games}</td>
                <td className="p-4">{row.playersBet}</td>
                <td className="p-4">{row.playersWon}</td>
                <td className="p-4">{row.houseProfit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
          Adjust House Cut
        </button>
      </div>
    </div>
  );
};

export default Dashboard;