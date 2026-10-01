import React from 'react';
import { Bookmark, Sparkles, BookOpen, Compass, Cpu, Target } from 'lucide-react';
import { PomodoroTimer } from './PomodoroTimer';

export type NavTab = 'ask' | 'explore' | 'practice' | 'sandboxes' | 'saved';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange, savedCount }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Brand title, one line wordmark */}
        <button
          onClick={() => onTabChange('ask')}
          className="text-left group flex items-center gap-2 cursor-pointer focus:outline-none"
        >
          <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-display font-bold text-lg shadow-sm">
            C
          </span>
          <span className="font-display font-bold text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
            Clarity
          </span>
        </button>

        {/* Zone 2: 5 clean nav links, single line text with subtle hover underlines */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => onTabChange('ask')}
            className={`cursor-pointer pb-1 transition-colors relative whitespace-nowrap ${
              currentTab === 'ask'
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                : 'hover:text-slate-900'
            }`}
          >
            Doubt Solver
          </button>
          <button
            onClick={() => onTabChange('explore')}
            className={`cursor-pointer pb-1 transition-colors relative whitespace-nowrap ${
              currentTab === 'explore'
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                : 'hover:text-slate-900'
            }`}
          >
            Concept Library
          </button>
          <button
            onClick={() => onTabChange('practice')}
            className={`cursor-pointer pb-1 transition-colors relative whitespace-nowrap ${
              currentTab === 'practice'
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                : 'hover:text-slate-900'
            }`}
          >
            Practice Arena
          </button>
          <button
            onClick={() => onTabChange('sandboxes')}
            className={`cursor-pointer pb-1 transition-colors relative whitespace-nowrap ${
              currentTab === 'sandboxes'
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                : 'hover:text-slate-900'
            }`}
          >
            Interactive Models
          </button>
          <button
            onClick={() => onTabChange('saved')}
            className={`cursor-pointer pb-1 transition-colors relative whitespace-nowrap ${
              currentTab === 'saved'
                ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                : 'hover:text-slate-900'
            }`}
          >
            Study Deck
            {savedCount > 0 && (
              <span className="ml-1.5 text-xs bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full tabular-nums">
                {savedCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions (Pomodoro Timer + Ask Doubt) */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <PomodoroTimer />
          <button
            onClick={() => onTabChange('ask')}
            className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap cursor-pointer items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask a Doubt</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar row */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 bg-white px-1 py-2 text-xs font-medium text-slate-600">
        <button
          onClick={() => onTabChange('ask')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 ${currentTab === 'ask' ? 'text-indigo-600 font-semibold' : ''}`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Solver</span>
        </button>
        <button
          onClick={() => onTabChange('explore')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 ${currentTab === 'explore' ? 'text-indigo-600 font-semibold' : ''}`}
        >
          <Compass className="w-4 h-4" />
          <span>Concepts</span>
        </button>
        <button
          onClick={() => onTabChange('practice')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 ${currentTab === 'practice' ? 'text-indigo-600 font-semibold' : ''}`}
        >
          <Target className="w-4 h-4" />
          <span>Practice</span>
        </button>
        <button
          onClick={() => onTabChange('sandboxes')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 ${currentTab === 'sandboxes' ? 'text-indigo-600 font-semibold' : ''}`}
        >
          <Cpu className="w-4 h-4" />
          <span>Models</span>
        </button>
        <button
          onClick={() => onTabChange('saved')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 ${currentTab === 'saved' ? 'text-indigo-600 font-semibold' : ''}`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Deck</span>
        </button>
      </div>
    </header>
  );
};

