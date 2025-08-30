import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface CartelaListProps {
  cartelas: any[];
  onAddCartela: () => void;
  onNewGame: () => void;
}

const CartelaList: React.FC<CartelaListProps> = ({ cartelas, onAddCartela, onNewGame }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Generate numbers 1-140 for the grid
  const numbers = Array.from({ length: 140 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-white border-b border-gray-200">
        <button className="p-2 rounded-md hover:bg-gray-100">
          <Menu size={20} className="text-black" />
        </button>
        <h1 className="text-xl font-bold text-black">Cartela List for one</h1>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 p-6">
        <button
          onClick={onNewGame}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-semibold transition-colors"
        >
          New Game
        </button>
        <button
          onClick={onAddCartela}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-semibold transition-colors"
        >
          Add Cartela
        </button>
      </div>

      {/* Responsive Number Grid */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-14 lg:grid-cols-16 xl:grid-cols-20 gap-2">
          {numbers.map((number) => (
            <button
              key={number}
              className="aspect-square bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded flex items-center justify-center transition-colors min-h-[40px] sm:min-h-[48px]"
            >
              {number}
            </button>
          ))}
        </div>
      </div>

      {/* Cartela List */}
      {cartelas.length > 0 && (
        <div className="px-6 pb-6">
          <h2 className="text-lg font-bold text-black mb-4">Saved Cartelas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cartelas.map((cartela) => (
              <div key={cartela.id} className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold text-black mb-2">Card ID: {cartela.cardId}</h3>
                <div className="grid grid-cols-5 gap-1 text-xs">
                  <div className="text-center font-bold">B</div>
                  <div className="text-center font-bold">I</div>
                  <div className="text-center font-bold">N</div>
                  <div className="text-center font-bold">G</div>
                  <div className="text-center font-bold">O</div>
                  
                  {/* Display the cartela numbers in a mini grid */}
                  {[1, 2, 3, 4, 5].map((row) => (
                    ['b', 'i', 'n', 'g', 'o'].map((col) => (
                      <div key={`${col}${row}`} className="bg-white p-1 text-center border rounded text-xs">
                        {col === 'n' && row === 3 ? 'FREE' : cartela.numbers[`${col}${row}`] || ''}
                      </div>
                    ))
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartelaList;