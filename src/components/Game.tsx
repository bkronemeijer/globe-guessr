import { useState, useEffect } from 'react';
import Globe from './Globe';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const generateRandomLocation = () => {
  const lat = Math.random() * 180 - 90;
  const lon = Math.random() * 360 - 180;
  return { lat, lon };
};

const Game = () => {
  const [targetLocation, setTargetLocation] = useState<{ lat: number; lon: number } | undefined>(undefined);
  const [userGuess, setUserGuess] = useState<{ lat: number; lon: number } | undefined>(undefined);
  const [distance, setDistance] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (!gameStarted) {
      const newLocation = generateRandomLocation();
      setTargetLocation(newLocation);
      setUserGuess(undefined);
      setDistance(null);
    }
  }, [gameStarted]);

  const handleGuess = (lat: number, lon: number) => {
    if (!targetLocation) return;
    
    setUserGuess({ lat, lon });
    const calculatedDistance = calculateDistance(
      targetLocation.lat,
      targetLocation.lon,
      lat,
      lon
    );
    setDistance(calculatedDistance);
  };

  const startNewGame = () => {
    setGameStarted(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold mb-4 text-center">Globe Guessr</h1>
        
        {!gameStarted ? (
          <div className="text-center">
            <button
              onClick={startNewGame}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Start New Game
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-xl text-center">
                Click on the globe to guess the location!
              </p>
            </div>
            
            <div className="h-[600px] w-full">
              <Globe
                onGuess={handleGuess}
                targetLocation={targetLocation}
                userGuess={userGuess}
              />
            </div>

            {distance !== null && (
              <div className="mt-4 text-center">
                <p className="text-xl">
                  Your guess was {distance.toFixed(2)} km away from the target!
                </p>
                <button
                  onClick={startNewGame}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                >
                  Play Again
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Game; 