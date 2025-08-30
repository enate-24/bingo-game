import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface AddCartelaProps {
  onSave: (cartela: any) => void;
  onCancel: () => void;
}

const AddCartela: React.FC<AddCartelaProps> = ({ onSave, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const [cardId, setCardId] = useState('');
  const [selectedNumbers, setSelectedNumbers] = useState<{ [key: string]: string }>({
    b1: '', b2: '', b3: '', b4: '', b5: '',
    i1: '', i2: '', i3: '', i4: '', i5: '',
    n1: '', n2: '', n4: '', n5: '', // n3 is FREE space
    g1: '', g2: '', g3: '', g4: '', g5: '',
    o1: '', o2: '', o3: '', o4: '', o5: ''
  });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleNumberChange = (key: string, value: string) => {
    setSelectedNumbers(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const generateRandomNumbers = () => {
    const newNumbers = { ...selectedNumbers };
    
    // B column: 1-15
    for (let i = 1; i <= 5; i++) {
      newNumbers[`b${i}`] = String(Math.floor(Math.random() * 15) + 1);
    }
    
    // I column: 16-30
    for (let i = 1; i <= 5; i++) {
      newNumbers[`i${i}`] = String(Math.floor(Math.random() * 15) + 16);
    }
    
    // N column: 31-45 (excluding n3 which is FREE)
    for (let i = 1; i <= 5; i++) {
      if (i !== 3) {
        newNumbers[`n${i}`] = String(Math.floor(Math.random() * 15) + 31);
      }
    }
    
    // G column: 46-60
    for (let i = 1; i <= 5; i++) {
      newNumbers[`g${i}`] = String(Math.floor(Math.random() * 15) + 46);
    }
    
    // O column: 61-75
    for (let i = 1; i <= 5; i++) {
      newNumbers[`o${i}`] = String(Math.floor(Math.random() * 15) + 61);
    }
    
    setSelectedNumbers(newNumbers);
  };

  const handleAddCartela = () => {
    if (cardId.trim()) {
      const cartela = {
        id: Date.now(),
        cardId: cardId,
        numbers: selectedNumbers
      };
      onSave(cartela);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-white border-b border-gray-200">
        <button className="p-2 rounded-md hover:bg-gray-100">
          <Menu size={20} className="text-black" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">Add Cartela</h1>
          
          {/* Card ID Input */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="Card ID"
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* BINGO Grid */}
          <div className="mb-8">
            {/* Column Headers */}
            <div className="grid grid-cols-5 gap-4 mb-4">
              {['B', 'I', 'N', 'G', 'O'].map((letter) => (
                <div key={letter} className="text-center font-bold text-xl text-gray-800">
                  {letter}
                </div>
              ))}
            </div>

            {/* Number Grid */}
            <div className="grid grid-cols-5 gap-4">
              {/* Row 1 */}
              <input
                type="text"
                placeholder="b1"
                value={selectedNumbers.b1}
                onChange={(e) => handleNumberChange('b1', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="i1"
                value={selectedNumbers.i1}
                onChange={(e) => handleNumberChange('i1', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="n1"
                value={selectedNumbers.n1}
                onChange={(e) => handleNumberChange('n1', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="g1"
                value={selectedNumbers.g1}
                onChange={(e) => handleNumberChange('g1', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="o1"
                value={selectedNumbers.o1}
                onChange={(e) => handleNumberChange('o1', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Row 2 */}
              <input
                type="text"
                placeholder="b2"
                value={selectedNumbers.b2}
                onChange={(e) => handleNumberChange('b2', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="i2"
                value={selectedNumbers.i2}
                onChange={(e) => handleNumberChange('i2', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="n2"
                value={selectedNumbers.n2}
                onChange={(e) => handleNumberChange('n2', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="g2"
                value={selectedNumbers.g2}
                onChange={(e) => handleNumberChange('g2', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="o2"
                value={selectedNumbers.o2}
                onChange={(e) => handleNumberChange('o2', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Row 3 - FREE space in center */}
              <input
                type="text"
                placeholder="b3"
                value={selectedNumbers.b3}
                onChange={(e) => handleNumberChange('b3', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="i3"
                value={selectedNumbers.i3}
                onChange={(e) => handleNumberChange('i3', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="w-full h-12 flex items-center justify-center bg-gray-100 border border-gray-300 rounded text-gray-800 font-semibold">
                FREE
              </div>
              <input
                type="text"
                placeholder="g3"
                value={selectedNumbers.g3}
                onChange={(e) => handleNumberChange('g3', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="o3"
                value={selectedNumbers.o3}
                onChange={(e) => handleNumberChange('o3', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Row 4 */}
              <input
                type="text"
                placeholder="b4"
                value={selectedNumbers.b4}
                onChange={(e) => handleNumberChange('b4', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="i4"
                value={selectedNumbers.i4}
                onChange={(e) => handleNumberChange('i4', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="n4"
                value={selectedNumbers.n4}
                onChange={(e) => handleNumberChange('n4', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="g4"
                value={selectedNumbers.g4}
                onChange={(e) => handleNumberChange('g4', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="o4"
                value={selectedNumbers.o4}
                onChange={(e) => handleNumberChange('o4', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Row 5 */}
              <input
                type="text"
                placeholder="b5"
                value={selectedNumbers.b5}
                onChange={(e) => handleNumberChange('b5', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="i5"
                value={selectedNumbers.i5}
                onChange={(e) => handleNumberChange('i5', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="n5"
                value={selectedNumbers.n5}
                onChange={(e) => handleNumberChange('n5', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="g5"
                value={selectedNumbers.g5}
                onChange={(e) => handleNumberChange('g5', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="o5"
                value={selectedNumbers.o5}
                onChange={(e) => handleNumberChange('o5', e.target.value)}
                className="w-full h-12 text-center border border-gray-300 rounded text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={generateRandomNumbers}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Generate
            </button>
            <button
              onClick={handleAddCartela}
              disabled={!cardId.trim()}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Add Cartela
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCartela;