import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import ErrorBoundary from './ErrorBoundary';

const ROWS = 6;
const COLS = 7;
const EMPTY = null;
const PLAYER_1 = '1';
const PLAYER_2 = '2';

// Debounce function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const App = () => {
  const [board, setBoard] = useState(Array(ROWS).fill().map(() => Array(COLS).fill(EMPTY)));
  const [currentPlayer, setCurrentPlayer] = useState(PLAYER_1);
  const [winner, setWinner] = useState(null);
  const [winningCells, setWinningCells] = useState([]);
  const [dropAnimation, setDropAnimation] = useState({ col: null, row: null });
  const [isAnimating, setIsAnimating] = useState(false);

  // Reset animation state after animation completes
  useEffect(() => {
    if (dropAnimation.col !== null) {
      const timer = setTimeout(() => {
        setDropAnimation({ col: null, row: null });
        setIsAnimating(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [dropAnimation]);

  const checkWin = (row, col, player) => {
    // Define the four directions to check: horizontal, vertical, and two diagonals
    const directions = [
      { dr: 0, dc: 1 },  // horizontal
      { dr: 1, dc: 0 },  // vertical
      { dr: 1, dc: 1 },  // diagonal down-right
      { dr: 1, dc: -1 }, // diagonal down-left
    ];

    // For each direction, check both ways from the current position
    for (const { dr, dc } of directions) {
      let count = 1;  // Start at 1 for the current piece
      const positions = [{ row, col }];  // Start with current position

      // Check in positive direction
      for (let i = 1; i < 4; i++) {
        const newRow = row + (dr * i);
        const newCol = col + (dc * i);
        
        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && 
            board[newRow][newCol] === player) {
          count++;
          positions.push({ row: newRow, col: newCol });
        } else {
          break;
        }
      }

      // Check in negative direction
      for (let i = 1; i < 4; i++) {
        const newRow = row - (dr * i);
        const newCol = col - (dc * i);
        
        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && 
            board[newRow][newCol] === player) {
          count++;
          positions.push({ row: newRow, col: newCol });
        } else {
          break;
        }
      }

      // If we found 4 or more in a row, we have a winner
      if (count >= 4) {
        console.log('Win detected!', positions);
        return positions;
      }
    }

    return null;
  };

  const [isDropping, setIsDropping] = useState(false);
  const [message, setMessage] = useState('');

  const handleDrop = useCallback(async (col) => {
    if (isDropping || winner || isAnimating || board[0][col] !== EMPTY) {
      if (board[0][col] !== EMPTY) {
        setMessage('Column is full!');
        setTimeout(() => setMessage(''), 2000);
      }
      return;
    }

    try {
      setIsDropping(true);
      setIsAnimating(true);

      // Find the lowest empty row in the selected column
      let row = ROWS - 1;
      while (row >= 0 && board[row][col] !== EMPTY) {
        row--;
      }

      if (row < 0) return; // Safety check

      // Create new board with the piece
      const newBoard = board.map(row => [...row]);
      newBoard[row][col] = currentPlayer;

      // Start animation and update board
      setDropAnimation({ col, row });
      setBoard(newBoard);
      
      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 600));

      // Check for win
      const winningPositions = checkWin(row, col, currentPlayer);
      console.log('Checking win:', { row, col, currentPlayer, winningPositions });
      
      if (winningPositions && winningPositions.length >= 4) {
        console.log('Win detected!', winningPositions);
        setWinner(currentPlayer);
        setWinningCells(winningPositions);
        setMessage(`Player ${currentPlayer} wins!`);
        setIsDropping(false);
        return;
      }

      // Check for draw
      const isDraw = newBoard[0].every(cell => cell !== EMPTY);
      if (isDraw) {
        setMessage("It's a draw!");
        setWinner('draw');
      } else {
        setCurrentPlayer(currentPlayer === PLAYER_1 ? PLAYER_2 : PLAYER_1);
      }
    } catch (error) {
      console.error('Error during piece drop:', error);
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsDropping(false);
      setIsAnimating(false);
    }
  }, [board, currentPlayer, isDropping, winner, isAnimating, checkWin]);

  // Debounced version of handleDrop
  const dropPiece = useCallback(
    debounce((col) => handleDrop(col), 300),
    [handleDrop]
  );

  const resetGame = () => {
    setBoard(Array(ROWS).fill().map(() => Array(COLS).fill(EMPTY)));
    setCurrentPlayer(PLAYER_1);
    setWinner(null);
    setWinningCells([]);
    setDropAnimation({ col: null, row: null });
  };

  const getCellClasses = (row, col) => {
    const isWinning = winningCells.some(cell => cell.row === row && cell.col === col);
    const isAnimating = dropAnimation.col === col && dropAnimation.row === row;
    
    return `w-12 h-12 md:w-16 md:h-16 rounded-full border-4 
      ${isWinning ? 'border-green-500 shadow-lg shadow-green-500/50' : 'border-blue-800'}
      ${board[row][col] === PLAYER_1 
        ? isWinning 
          ? 'bg-red-600 animate-pulse scale-110' 
          : 'bg-red-500' 
        : board[row][col] === PLAYER_2 
          ? isWinning 
            ? 'bg-yellow-600 animate-pulse scale-110' 
            : 'bg-yellow-500' 
          : 'bg-white'}
      ${isWinning ? 'ring-4 ring-green-400 ring-opacity-50' : ''}
      ${isAnimating ? 'animate-drop' : ''}
      transform transition-all duration-300`;
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-blue-100 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold text-blue-800 mb-8">Connect Four</h1>
        
        <div className="bg-blue-600 p-4 rounded-lg shadow-lg relative">
          {/* Column buttons */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {board[0].map((_, col) => (
              <button
                key={col}
                onClick={() => dropPiece(col)}
                disabled={winner || isDropping || isAnimating || board[0][col] !== EMPTY}
                className={`w-12 h-12 md:w-16 md:h-16 bg-blue-500 rounded-full 
                  transition-all duration-200 transform
                  ${!winner && !isDropping && !isAnimating && board[0][col] === EMPTY 
                    ? 'hover:bg-blue-400 hover:scale-105' 
                    : 'opacity-50 cursor-not-allowed'}`}
              />
            ))}
          </div>
          
          {/* Game board */}
          <div className="grid grid-cols-7 gap-2 bg-blue-700 p-4 rounded-lg">
            {board.map((row, rowIndex) => (
              <React.Fragment key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <div key={`${rowIndex}-${colIndex}`} className={getCellClasses(rowIndex, colIndex)} />
                ))}
              </React.Fragment>
            ))}
          </div>

          {/* Column hover indicators */}
          <div className="absolute top-0 left-0 right-0 grid grid-cols-7 gap-2 pointer-events-none">
            {board[0].map((_, col) => (
              <div
                key={`indicator-${col}`}
                className={`h-2 rounded-b ${
                  !winner && !isDropping && board[0][col] === EMPTY
                    ? currentPlayer === PLAYER_1 
                      ? 'bg-red-500/50'
                      : 'bg-yellow-500/50'
                    : 'bg-transparent'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Game status and controls */}
        <div className="mt-8 text-center">
          {message ? (
            <div className="text-2xl font-bold text-blue-800 mb-4 animate-bounce">
              {message}
            </div>
          ) : (
            <div className="text-xl text-blue-800 mb-4">
              Player {currentPlayer}'s turn
              <div className={`w-4 h-4 rounded-full inline-block ml-2 ${
                currentPlayer === PLAYER_1 ? 'bg-red-500' : 'bg-yellow-500'
              }`} />
            </div>
          )}
          
          <button
            onClick={resetGame}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg
              transition-colors duration-200 shadow-md transform hover:scale-105 active:scale-95"
          >
            Restart Game
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;