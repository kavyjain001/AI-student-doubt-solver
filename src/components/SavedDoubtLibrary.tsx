import React, { useState } from 'react';
import { Bookmark, Trash2, ArrowRight, BookOpen, Layers, Search } from 'lucide-react';
import { DoubtExplanation, SubjectId } from '../types';

interface SavedDoubtLibraryProps {
  savedDoubts: DoubtExplanation[];
  onOpenDoubt: (doubt: DoubtExplanation) => void;
  onRemoveDoubt: (id: string) => void;
}

export const SavedDoubtLibrary: React.FC<SavedDoubtLibraryProps> = ({
  savedDoubts,
  onOpenDoubt,
  onRemoveDoubt,
}) => {
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState<SubjectId>('all');

  const filtered = savedDoubts.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.doubt.toLowerCase().includes(search.toLowerCase()) ||
      item.oneSentenceAha.toLowerCase().includes(search.toLowerCase());

    const matchesSubject = filterSubject === 'all' || item.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

  const totalFlashcards = savedDoubts.reduce((acc, d) => acc + (d.flashcards?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
              My Study Deck & Saved Doubts
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Your personal library of resolved questions, conceptual models, and flashcards for exam revision.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 tabular-nums">
              {savedDoubts.length} Doubts · {totalFlashcards} Flashcards
            </div>
          </div>
        </div>

        {/* Filters */}
        {savedDoubts.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search saved doubts..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* Doubts List */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold uppercase tracking-wider text-indigo-600">
                      {item.subject}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Level: {item.level}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveDoubt(item.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                    title="Remove from saved deck"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-base font-serif font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                  &ldquo;{item.oneSentenceAha}&rdquo;
                </p>

                <p className="text-[11px] text-slate-400 mt-2 italic">
                  Analogy: {item.simpleAnalogy?.title}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 tabular-nums">
                  {item.flashcards?.length || 0} Flashcards
                </span>

                <button
                  type="button"
                  onClick={() => onOpenDoubt(item)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  <span>Review Explanation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-serif font-semibold text-slate-800">
            {savedDoubts.length === 0 ? 'Your Study Deck is empty' : 'No matching doubts found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {savedDoubts.length === 0
              ? 'When Clarity explains a concept, tap the bookmark icon to save it here for fast pre-exam revision.'
              : 'Try clearing your search keyword.'}
          </p>
        </div>
      )}
    </div>
  );
};
