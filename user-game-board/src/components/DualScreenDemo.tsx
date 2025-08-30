import React from 'react';

const DualScreenDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Dual-Screen Bingo System Demo
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Operator Interface Preview */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-slate-800 text-white p-4">
              <h2 className="text-xl font-bold">Operator Interface (Primary Screen)</h2>
            </div>
            <div className="p-6">
              <div className="bg-slate-900 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-yellow-400 font-bold text-lg">GAME 188</div>
                  <div className="bg-green-500 text-white px-3 py-1 rounded text-sm">ACTIVE</div>
                </div>
                
                <div className="grid grid-cols-5 gap-2 mb-4">
                  <div className="bg-orange-500 text-white p-2 text-center font-bold">B</div>
                  <div className="bg-orange-500 text-white p-2 text-center font-bold">I</div>
                  <div className="bg-orange-500 text-white p-2 text-center font-bold">N</div>
                  <div className="bg-orange-500 text-white p-2 text-center font-bold">G</div>
                  <div className="bg-orange-500 text-white p-2 text-center font-bold">O</div>
                </div>
                
                <div className="grid grid-cols-15 gap-1">
                  {Array.from({ length: 75 }, (_, i) => i + 1).map((num) => (
                    <div
                      key={num}
                      className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded ${
                        num <= 25 ? 'bg-green-600 text-white' : 'bg-red-800 text-white'
                      }`}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <button className="w-full bg-green-600 text-white py-2 rounded font-semibold">
                  ▶ Auto Call ON
                </button>
                <button className="w-full bg-purple-600 text-white py-2 rounded font-semibold">
                  🎲 Shuffle Numbers
                </button>
                <button className="w-full bg-red-600 text-white py-2 rounded font-semibold">
                  ⏹ Finish Game
                </button>
              </div>
            </div>
          </div>

          {/* Public Display Preview */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-900 to-purple-900 text-white p-4">
              <h2 className="text-xl font-bold">Public Display (Secondary Screen)</h2>
            </div>
            <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="text-3xl font-bold text-yellow-400">BINGO</div>
                <div className="bg-green-500 text-black px-4 py-2 rounded text-lg font-bold">
                  GAME IS ACTIVE
                </div>
              </div>
              
              <div className="flex gap-6">
                <div className="flex-1">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-yellow-400 mb-2">CURRENT NUMBER</div>
                    <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto">
                      <div className="text-4xl font-bold text-black">42</div>
                    </div>
                    <div className="text-lg font-bold text-yellow-400 mt-2">G-42</div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="text-lg font-bold text-yellow-400 mb-2">BINGO BOARD</div>
                  <div className="grid grid-cols-15 gap-1">
                    {Array.from({ length: 75 }, (_, i) => i + 1).map((num) => (
                      <div
                        key={num}
                        className={`w-4 h-4 flex items-center justify-center text-xs font-bold rounded ${
                          num <= 25 ? 'bg-green-400' : 'bg-gray-600'
                        } ${num === 42 ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}
                      >
                        {num > 99 ? '' : num}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 bg-black bg-opacity-30 p-3 rounded">
                <div className="flex justify-between text-sm">
                  <span>Numbers Called: 25</span>
                  <span>Remaining: 50</span>
                  <span>Progress: 33%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Technical Specifications</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-blue-600">Primary Screen Features</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Comprehensive game control panel</li>
                <li>• Auto-call toggle with interval adjustment</li>
                <li>• Manual number calling interface</li>
                <li>• Shuffle functionality with animation</li>
                <li>• Player management tools</li>
                <li>• Real-time game statistics</li>
                <li>• Sound controls and settings</li>
                <li>• Dual-screen status monitoring</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4 text-purple-600">Secondary Screen Features</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Large, prominent current number display</li>
                <li>• Complete bingo board with called numbers</li>
                <li>• High-contrast design for distance viewing</li>
                <li>• Real-time game progress indicators</li>
                <li>• Animated number calling effects</li>
                <li>• Game status and time display</li>
                <li>• Winner celebration animations</li>
                <li>• Automatic synchronization</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-green-600">Automatic Display Detection</h3>
            <p className="text-gray-700 mb-4">
              The system automatically detects when a second display is connected and provides options to:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li>• Open public display window on secondary screen</li>
              <li>• Maintain real-time synchronization between displays</li>
              <li>• Handle display disconnection gracefully</li>
              <li>• Optimize layouts for different screen resolutions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DualScreenDemo;