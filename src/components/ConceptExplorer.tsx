import React, { useState } from 'react';
import { Search, Sparkles, ArrowRight, Atom, Pi, FlaskConical, Dna, Code, Landmark, BookText } from 'lucide-react';
import { SubjectId, SimplicityLevel, CuratedDoubt } from '../types';

interface ConceptExplorerProps {
  onSelectConcept: (doubt: string, subject: SubjectId, level: SimplicityLevel) => void;
}

const curatedDoubts: CuratedDoubt[] = [
  // Physics
  {
    id: 'phys-1',
    doubt: 'Why does time slow down near the speed of light (Special Relativity)?',
    subject: 'physics',
    level: 'highschool',
    category: 'Physics & Cosmos',
    teaser: 'If the cosmic speed limit of light is constant for everyone, time itself has to stretch like rubber so the math works!',
  },
  {
    id: 'phys-2',
    doubt: 'How does an airplane fly? Is lift caused by Bernoulli or Newton’s 3rd Law?',
    subject: 'physics',
    level: 'highschool',
    category: 'Physics & Flight',
    teaser: 'The truth is both! Wings push tons of air downward, causing an equal upward push, while airfoil shape accelerates air over the top.',
  },
  {
    id: 'phys-3',
    doubt: 'What is Quantum Entanglement and why did Einstein call it "spooky action at a distance"?',
    subject: 'physics',
    level: 'college',
    category: 'Quantum Physics',
    teaser: 'Like a pair of shoes placed in two separate boxes: opening one instantly tells you the other shoe without any signal traveling.',
  },

  // Mathematics
  {
    id: 'math-1',
    doubt: 'Why is dividing any number by zero mathematically undefined or impossible?',
    subject: 'math',
    level: '10yo',
    category: 'Foundational Math',
    teaser: 'If you have 10 cookies and share them with 0 friends, how many does each friend get? The question breaks the rules of arithmetic.',
  },
  {
    id: 'math-2',
    doubt: 'What actually is a Derivative in Calculus, stripped of all fancy notation?',
    subject: 'math',
    level: 'highschool',
    category: 'Calculus',
    teaser: 'A speedometer in your car: it tells you how fast you are going at this exact freeze-frame millisecond, not your trip average.',
  },
  {
    id: 'math-3',
    doubt: 'Why does negative times negative equal a positive number?',
    subject: 'math',
    level: '10yo',
    category: 'Algebra',
    teaser: 'Imagine a video of someone walking backward: if you rewind the backward walk, they appear to be walking forward!',
  },

  // Chemistry
  {
    id: 'chem-1',
    doubt: 'Why does ice float on water when almost all other frozen liquids sink?',
    subject: 'chemistry',
    level: 'highschool',
    category: 'Chemistry & Molecules',
    teaser: 'Water molecules form an open hexagonal lattice when freezing, leaving empty space that makes ice less dense than liquid water.',
  },
  {
    id: 'chem-2',
    doubt: 'What is pH really measuring and why is pH 3 ten times more acidic than pH 4?',
    subject: 'chemistry',
    level: 'highschool',
    category: 'Acids & Bases',
    teaser: 'It’s a negative logarithmic count of hydrogen ions—each drop of 1 number means 10 times more corrosive loose protons!',
  },

  // Biology
  {
    id: 'bio-1',
    doubt: 'How does an mRNA vaccine actually train our immune system without making us sick?',
    subject: 'biology',
    level: 'highschool',
    category: 'Immune System',
    teaser: 'It’s like giving our cellular security guards a blueprint photo of the villain’s jacket, without ever inviting the villain inside.',
  },
  {
    id: 'bio-2',
    doubt: 'How does CRISPR gene editing find and cut a specific sequence in DNA?',
    subject: 'biology',
    level: 'college',
    category: 'Genetics',
    teaser: 'A molecular "Find and Replace" tool guided by a short RNA scout that pairs with exact letters in the 3-billion-letter DNA book.',
  },

  // Computer Science
  {
    id: 'cs-1',
    doubt: 'What is Recursion in computer programming and how does the base case stop stack overflow?',
    subject: 'cs',
    level: 'highschool',
    category: 'Algorithms',
    teaser: 'Russian nesting dolls: you keep opening smaller dolls until you hit the solid baby doll (the base case), then assemble back up.',
  },
  {
    id: 'cs-2',
    doubt: 'What is the intuitive difference between P and NP in computational complexity?',
    subject: 'cs',
    level: 'feynman',
    category: 'Computer Science Theory',
    teaser: 'Solving a Sudoku puzzle from scratch (P) vs. glancing at a completed puzzle and verifying if it has any duplicates (NP).',
  },
];

export const ConceptExplorer: React.FC<ConceptExplorerProps> = ({ onSelectConcept }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<SubjectId>('all');

  const filtered = curatedDoubts.filter((item) => {
    const matchesSearch = 
      item.doubt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.teaser.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject = selectedFilter === 'all' || item.subject === selectedFilter;

    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6">
      {/* Explorer Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
          Curated Student Concept Library
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
          Explore classic academic doubts that every student wrestles with. Click any question to have Clarity explain it simply with custom analogies and quizzes.
        </p>

        {/* Search & Subject Filters */}
        <div className="mt-5 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts by keywords (e.g. 'relativity', 'vaccine', 'recursion', 'derivative')..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {[
              { id: 'all', label: 'All Subjects' },
              { id: 'physics', label: 'Physics' },
              { id: 'math', label: 'Math' },
              { id: 'chemistry', label: 'Chemistry' },
              { id: 'biology', label: 'Biology' },
              { id: 'cs', label: 'Computer Science' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedFilter(cat.id as SubjectId)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  selectedFilter === cat.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Concept Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectConcept(item.doubt, item.subject, item.level)}
            className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              {/* Zero-Pill Metadata */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2">
                <span className="font-semibold uppercase tracking-wider text-indigo-600">
                  {item.category}
                </span>
                <span aria-hidden="true">·</span>
                <span>Level: {item.level}</span>
              </div>

              <h3 className="text-base font-serif font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                {item.doubt}
              </h3>

              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-sans line-clamp-3">
                {item.teaser}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explain this to me</span>
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
          <p className="text-sm font-semibold text-slate-700">No concepts found matching &ldquo;{searchQuery}&rdquo;</p>
          <p className="text-xs text-slate-500 mt-1">
            Try searching a different subject or type your custom doubt directly in the Doubt Solver!
          </p>
        </div>
      )}
    </div>
  );
};
