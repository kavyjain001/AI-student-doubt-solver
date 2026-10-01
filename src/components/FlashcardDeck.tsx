import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, RotateCw, Lightbulb, Layers } from 'lucide-react';
import { Flashcard } from '../types';

interface FlashcardDeckProps {
  cards: Flashcard[];
  onToggleMastered?: (cardId: string, mastered: boolean) => void;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards, onToggleMastered }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!cards || cards.length === 0) return null;

  const currentCard = cards[currentIndex] || cards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const toggleMastered = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleMastered) {
      onToggleMastered(currentCard.id, !currentCard.mastered);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 sm:p-7">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">
            Active Recall Flashcards
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 tabular-nums">
          <span>Card {currentIndex + 1} of {cards.length}</span>
        </div>
      </div>

      {/* Progress pill line */}
      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-5">
        <div
          className="bg-indigo-600 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* 3D Flip Card Container */}
      <div
        onClick={toggleFlip}
        className="relative min-h-[220px] sm:min-h-[240px] w-full bg-white rounded-xl border border-slate-200 p-6 sm:p-8 flex flex-col justify-between shadow-2xs hover:border-indigo-300 transition-all cursor-pointer group select-none"
      >
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-indigo-600">
            {isFlipped ? 'Answer & Explanation' : 'Question / Prompt'}
          </span>
          <span className="flex items-center gap-1 group-hover:text-slate-600 transition-colors">
            <RotateCw className="w-3.5 h-3.5" />
            <span>Click to flip</span>
          </span>
        </div>

        {/* Card Content */}
        <div className="my-auto py-4 text-center">
          {!isFlipped ? (
            <p className="text-base sm:text-lg font-serif font-medium text-slate-900 leading-snug">
              {currentCard.front}
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm sm:text-base font-medium text-slate-800 leading-relaxed">
                {currentCard.back}
              </p>
              {currentCard.tip && (
                <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/50">
                  <Lightbulb className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span>Tip: {currentCard.tip}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Card Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={toggleMastered}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
              currentCard.mastered
                ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${currentCard.mastered ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>{currentCard.mastered ? 'Mastered' : 'Mark Mastered'}</span>
          </button>

          <span className="text-xs text-slate-400">
            {isFlipped ? 'Flip back' : 'Reveal answer'}
          </span>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between mt-4">
        <button
          type="button"
          onClick={handlePrev}
          disabled={cards.length <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={cards.length <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <span>Next Card</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
