/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RotateCcw, 
  Play, 
  Timer, 
  Pause,
  ChevronLeft,
  Zap,
  Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  GameMode, 
  GameStatus, 
  Block, 
  GRID_COLS, 
  GRID_ROWS, 
  INITIAL_ROWS, 
  TIME_LIMIT 
} from './types';
import { cn } from './lib/utils';

const generateId = () => Math.random().toString(36).substring(2, 9);

const getRandomValue = () => Math.floor(Math.random() * 9) + 1;

const generateTarget = (blocks: Block[]) => {
  if (blocks.length === 0) return 10;
  const count = Math.floor(Math.random() * 3) + 2;
  const shuffled = [...blocks].sort(() => 0.5 - Math.random());
  const sum = shuffled.slice(0, count).reduce((acc, b) => acc + b.value, 0);
  return Math.max(10, Math.min(sum, 45));
};

export default function App() {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [mode, setMode] = useState<GameMode>(GameMode.CLASSIC);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [targetSum, setTargetSum] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [isPaused, setIsPaused] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentSum = blocks
    .filter(b => selectedIds.includes(b.id))
    .reduce((acc, b) => acc + b.value, 0);

  const addRow = useCallback(() => {
    setBlocks(prev => {
      const isGameOver = prev.some(b => b.row === 0);
      if (isGameOver) {
        setStatus(GameStatus.GAMEOVER);
        return prev;
      }

      const shifted = prev.map(b => ({ ...b, row: b.row - 1 }));
      const newRow: Block[] = Array.from({ length: GRID_COLS }).map((_, col) => ({
        id: generateId(),
        value: getRandomValue(),
        row: GRID_ROWS - 1,
        col,
      }));

      return [...shifted, ...newRow];
    });
  }, []);

  const initGame = (selectedMode: GameMode) => {
    const initialBlocks: Block[] = [];
    for (let r = GRID_ROWS - INITIAL_ROWS; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        initialBlocks.push({
          id: generateId(),
          value: getRandomValue(),
          row: r,
          col: c,
        });
      }
    }
    setBlocks(initialBlocks);
    setTargetSum(generateTarget(initialBlocks));
    setScore(0);
    setSelectedIds([]);
    setMode(selectedMode);
    setStatus(GameStatus.PLAYING);
    setTimeLeft(TIME_LIMIT);
    setIsPaused(false);
  };

  const toggleBlock = (id: string) => {
    if (status !== GameStatus.PLAYING || isPaused) return;
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (currentSum === targetSum && targetSum > 0) {
      const removedIds = [...selectedIds];
      setScore(prev => prev + targetSum * removedIds.length);
      
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FF4D4D', '#FFF500', '#1A1A1A']
      });

      setBlocks(prev => {
        const remaining = prev.filter(b => !removedIds.includes(b.id));
        const newBlocks: Block[] = [];
        for (let c = 0; c < GRID_COLS; c++) {
          const colBlocks = remaining
            .filter(b => b.col === c)
            .sort((a, b) => b.row - a.row);
          
          colBlocks.forEach((b, idx) => {
            newBlocks.push({ ...b, row: GRID_ROWS - 1 - idx });
          });
        }
        return newBlocks;
      });

      setSelectedIds([]);
      
      if (mode === GameMode.CLASSIC) {
        addRow();
      } else {
        setTimeLeft(TIME_LIMIT);
      }
    } else if (currentSum > targetSum) {
      setSelectedIds([]);
    }
  }, [currentSum, targetSum, selectedIds, mode, addRow]);

  useEffect(() => {
    if (status === GameStatus.PLAYING && blocks.length > 0) {
      setTargetSum(generateTarget(blocks));
    }
  }, [blocks.length, status]);

  useEffect(() => {
    if (status === GameStatus.PLAYING && mode === GameMode.TIME && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            addRow();
            return TIME_LIMIT;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, mode, isPaused, addRow]);

  useEffect(() => {
    if (status === GameStatus.PLAYING && blocks.some(b => b.row < 0)) {
      setStatus(GameStatus.GAMEOVER);
    }
  }, [blocks, status]);

  if (status === GameStatus.MENU) {
    return (
      <div className="min-h-screen bg-bg text-ink flex flex-col items-center justify-center p-6 font-sans overflow-hidden relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-12 max-w-md w-full z-10"
        >
          <div className="space-y-4">
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 10 }}
              transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
              className="inline-block p-4 bg-primary text-white rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-4"
            >
              <Zap className="w-12 h-12 fill-current" />
            </motion.div>
            <motion.h1 
              className="text-7xl font-display tracking-tight text-ink uppercase leading-none"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              SUM<span className="text-primary">BLOCK</span>
            </motion.h1>
            <p className="text-ink font-bold uppercase tracking-widest text-sm bg-primary/10 inline-block px-4 py-1 rounded-full">Math Puzzle Mania</p>
          </div>

          <div className="grid gap-6">
            <button 
              onClick={() => initGame(GameMode.CLASSIC)}
              className="group relative bg-primary text-white font-bold py-6 px-8 rounded-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-ink overflow-hidden"
            >
              <div className="flex flex-col items-start">
                <span className="text-3xl font-display uppercase">Classic</span>
                <span className="text-xs font-bold opacity-80">Slow & Steady</span>
              </div>
              <Play className="w-10 h-10 fill-current" />
            </button>

            <button 
              onClick={() => initGame(GameMode.TIME)}
              className="group relative bg-ink text-white font-bold py-6 px-8 rounded-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-between shadow-[8px_8px_0px_0px_rgba(255,77,77,1)] border-4 border-primary overflow-hidden"
            >
              <div className="flex flex-col items-start">
                <span className="text-3xl font-display uppercase">Time Attack</span>
                <span className="text-xs font-bold opacity-80">Beat the Clock</span>
              </div>
              <Timer className="w-10 h-10 text-primary" />
            </button>
          </div>

          <div className="pt-12 border-t-4 border-ink/10">
            <h3 className="text-ink text-xs font-black uppercase tracking-widest mb-6">How to Play</h3>
            <div className="grid grid-cols-3 gap-4 text-[11px] text-ink font-black tracking-wider uppercase">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-white border-4 border-ink flex items-center justify-center mx-auto text-primary text-xl">1</div>
                <p>Pick Numbers</p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-white border-4 border-ink flex items-center justify-center mx-auto text-primary text-xl">+</div>
                <p>Match Sum</p>
              </div>
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-white border-4 border-ink flex items-center justify-center mx-auto text-primary text-xl">!</div>
                <p>Don't Overflow</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col font-sans select-none touch-none overflow-hidden relative">
      {/* HUD */}
      <header className="p-4 md:p-6 flex items-center justify-between bg-white border-b-4 border-ink sticky top-0 z-20 shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setStatus(GameStatus.MENU)}
            className="p-2 hover:bg-primary/10 rounded-xl transition-colors text-ink border-2 border-transparent hover:border-ink"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-ink/60">Score</span>
            <span className="text-3xl font-display tabular-nums text-ink">{score.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary animate-bounce">Target</span>
          <div className="relative">
            <motion.span 
              key={targetSum}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-6xl font-display text-primary drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]"
            >
              {targetSum}
            </motion.span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {mode === GameMode.TIME && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-ink/60">Next Row</span>
              <div className="flex items-center gap-2">
                <Timer className={cn("w-5 h-5", timeLeft <= 3 ? "text-primary animate-ping" : "text-ink")} />
                <span className={cn("text-2xl font-display tabular-nums", timeLeft <= 3 ? "text-primary" : "text-ink")}>
                  {timeLeft}s
                </span>
              </div>
            </div>
          )}
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="p-3 bg-white border-4 border-ink rounded-2xl transition-all active:scale-90 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            {isPaused ? <Play className="w-8 h-8 fill-ink" /> : <Pause className="w-8 h-8 fill-ink" />}
          </button>
        </div>
      </header>

      {/* Game Board */}
      <main className="flex-1 relative flex items-center justify-center p-4">
        <div 
          className="grid gap-2 w-full max-w-md aspect-[6/10] relative p-3 border-8 border-ink rounded-3xl bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
          style={{ 
            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`
          }}
        >
          <AnimatePresence mode="popLayout">
            {blocks.map((block) => (
              <motion.button
                key={block.id}
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  gridRowStart: block.row + 1,
                  gridColumnStart: block.col + 1,
                }}
                exit={{ scale: 0, opacity: 0, rotate: 45 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                onClick={() => toggleBlock(block.id)}
                className={cn(
                  "relative w-full h-full rounded-xl flex items-center justify-center text-3xl font-display transition-all duration-150 border-4",
                  selectedIds.includes(block.id) 
                    ? "bg-ink text-white scale-95 border-primary z-10 shadow-[4px_4px_0px_0px_rgba(255,77,77,1)]" 
                    : "bg-primary border-ink text-white hover:bg-primary/90 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                )}
              >
                {block.value}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Current Selection Floating Indicator */}
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white border-4 border-ink px-10 py-5 rounded-3xl flex items-center gap-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-30"
          >
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-ink/60">Sum</span>
              <span className={cn("text-4xl font-display", currentSum > targetSum ? "text-primary" : "text-ink")}>
                {currentSum}
              </span>
            </div>
            <div className="h-12 w-1 bg-ink/10 rounded-full" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-ink/60">Goal</span>
              <span className="text-4xl font-display text-primary">{targetSum}</span>
            </div>
          </motion.div>
        )}
      </main>

      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-bg/90 backdrop-blur-sm z-40 flex items-center justify-center"
          >
            <div className="text-center space-y-8">
              <h2 className="text-8xl font-display text-ink uppercase">Paused</h2>
              <button 
                onClick={() => setIsPaused(false)}
                className="bg-primary text-white font-black py-6 px-20 rounded-3xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 mx-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-ink text-2xl uppercase"
              >
                <Play className="w-8 h-8 fill-current" />
                Resume
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {status === GameStatus.GAMEOVER && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-primary z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-sm w-full text-center space-y-10"
            >
              <div className="space-y-4">
                <h2 className="text-8xl font-display text-white uppercase leading-none drop-shadow-[8px_8px_0px_rgba(0,0,0,1)]">Game Over</h2>
                <p className="text-ink font-black tracking-widest text-lg uppercase">You hit the roof!</p>
              </div>

              <div className="bg-white border-8 border-ink rounded-3xl p-10 space-y-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-between items-center">
                  <span className="text-ink/60 font-black uppercase tracking-widest text-sm">Score</span>
                  <span className="text-5xl font-display text-ink">{score.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ink/60 font-black uppercase tracking-widest text-sm">Mode</span>
                  <span className="text-2xl font-display text-primary uppercase">{mode}</span>
                </div>
              </div>

              <div className="grid gap-6">
                <button 
                  onClick={() => initGame(mode)}
                  className="bg-white text-ink font-black py-6 px-8 rounded-3xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-ink text-xl uppercase"
                >
                  <RotateCcw className="w-6 h-6" />
                  Try Again
                </button>
                <button 
                  onClick={() => setStatus(GameStatus.MENU)}
                  className="bg-ink text-white font-black py-6 px-8 rounded-3xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 shadow-[8px_8px_0px_0px_rgba(255,77,77,1)] border-4 border-primary text-xl uppercase"
                >
                  Main Menu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer / Progress */}
      <footer className="p-6 bg-white border-t-4 border-ink">
        <div className="max-w-md mx-auto flex justify-between items-center text-xs font-black uppercase tracking-widest text-ink">
          <span>{mode} Mode</span>
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={cn("w-3 h-3 rounded-full border-2 border-ink", i < (score / 1000) ? "bg-primary" : "bg-white")} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <span>Lvl {Math.floor(score / 5000) + 1}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
