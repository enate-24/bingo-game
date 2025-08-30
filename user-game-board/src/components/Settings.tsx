import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    houseCut: 10,
    maxBet: 1000,
    minBet: 1,
    autoCall: false,
    soundEffects: true,
    gameSpeed: 'normal'
  });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Game Settings</h1>
      
      <div className="bg-slate-800 p-6 rounded-lg space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* House Cut */}
          <div>
            <label className="block text-white mb-2">House Cut (%)</label>
            <input
              type="range"
              min="1"
              max="50"
              value={settings.houseCut}
              onChange={(e) => handleSettingChange('houseCut', parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-gray-300 text-sm">{settings.houseCut}%</span>
          </div>

          {/* Max Bet */}
          <div>
            <label className="block text-white mb-2">Maximum Bet (Birr)</label>
            <input
              type="number"
              value={settings.maxBet}
              onChange={(e) => handleSettingChange('maxBet', parseInt(e.target.value))}
              className="bg-gray-700 text-white px-3 py-2 rounded w-full"
            />
          </div>

          {/* Min Bet */}
          <div>
            <label className="block text-white mb-2">Minimum Bet (Birr)</label>
            <input
              type="number"
              value={settings.minBet}
              onChange={(e) => handleSettingChange('minBet', parseInt(e.target.value))}
              className="bg-gray-700 text-white px-3 py-2 rounded w-full"
            />
          </div>

          {/* Game Speed */}
          <div>
            <label className="block text-white mb-2">Game Speed</label>
            <select
              value={settings.gameSpeed}
              onChange={(e) => handleSettingChange('gameSpeed', e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded w-full"
            >
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
            </select>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-4">
          <label className="flex items-center gap-3 text-white">
            <input
              type="checkbox"
              checked={settings.autoCall}
              onChange={(e) => handleSettingChange('autoCall', e.target.checked)}
              className="rounded"
            />
            Auto Call Numbers
          </label>

          <label className="flex items-center gap-3 text-white">
            <input
              type="checkbox"
              checked={settings.soundEffects}
              onChange={(e) => handleSettingChange('soundEffects', e.target.checked)}
              className="rounded"
            />
            Sound Effects
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded">
            Save Settings
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded">
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;