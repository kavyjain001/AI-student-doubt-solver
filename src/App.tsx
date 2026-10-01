/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { DoubtInput } from './components/DoubtInput';
import { ExplanationCard } from './components/ExplanationCard';
import { ConceptExplorer } from './components/ConceptExplorer';
import { InteractiveSandboxes } from './components/InteractiveSandboxes';
import { PracticeScreen } from './components/PracticeScreen';
import { SavedDoubtLibrary } from './components/SavedDoubtLibrary';
import { DoubtExplanation, SimplicityLevel, SubjectId } from './types';
import { 
  requestDoubtExplanation, 
  getSavedDoubts, 
  saveDoubtToStorage, 
  removeDoubtFromStorage 
} from './lib/gemini-client';
import { Sparkles, AlertCircle, ArrowUpRight, GraduationCap } from 'lucide-react';

// Default welcome explanation demonstrating the full power of Clarity on first load
const sampleInitialExplanation: DoubtExplanation = {
  id: 'doubt_default_zero_division',
  doubt: 'Why is dividing by zero mathematically undefined or impossible?',
  subject: 'math',
  level: 'highschool',
  timestamp: Date.now(),
  title: 'Why Dividing by Zero Breaks the Rules of Mathematics',
  oneSentenceAha: 'Division is just asking "how many times can you subtract this number until you hit zero?" — and if you subtract zero, you will subtract forever and never finish.',
  simpleAnalogy: {
    title: 'The Cookie Jar with Zero-Ounce Scoops',
    story: 'Imagine you have a jar with 10 chocolate chip cookies, and you want to share them among friends. If you give 2 cookies to each friend, you can serve 5 friends (10 ÷ 2 = 5). But if you have a magic scoop that dishes out exactly 0 cookies per friend, how many friends can you serve until the jar is empty? You scoop 0 cookies for friend #1, friend #2, friend #1,000,000... the jar STILL has 10 cookies! You can never empty the jar.',
    connection: 'Because no finite number of zeroes can ever sum up to 10, there is no single answer to 10 ÷ 0. In algebra, division must have exactly one consistent answer, so mathematicians classify it as "undefined".',
  },
  coreConcept: {
    summary: 'In mathematics, division is the inverse operation of multiplication. For a / b = c to be true, it must be true that b * c = a. When b is zero, this equation becomes 0 * c = a. If a is not zero, no number c can ever make 0 * c nonzero.',
    keyPoints: [
      'Multiplication Inverse: If 12 ÷ 3 = 4, then 4 × 3 = 12. If 12 ÷ 0 = c, then c × 0 = 12, which is impossible because anything times zero is zero.',
      'Limits and Infinity: As you divide by numbers closer to zero (10 ÷ 0.1 = 100, 10 ÷ 0.001 = 10,000), the answer grows toward infinity from the positive side, but negative infinity from the negative side.',
      'Two Contradicting Directions: Approaching from positive numbers yields +∞, while approaching from negative numbers yields -∞. A limit with two conflicting answers does not exist.',
    ],
  },
  stepByStep: [
    {
      step: 1,
      title: 'Define division as repeated subtraction',
      explanation: 'To compute 15 ÷ 5, you count how many times you can subtract 5 until reaching 0: 15 - 5 - 5 - 5 = 0 (3 times).',
      whyItMatters: 'It shows arithmetic is grounded in counting physical operations.',
    },
    {
      step: 2,
      title: 'Attempt repeated subtraction with zero',
      explanation: 'Try computing 10 ÷ 0: 10 - 0 = 10; 10 - 0 = 10... You can repeat this infinite times without ever changing the remaining number.',
      whyItMatters: 'The counting process never terminates or converges to an end state.',
    },
    {
      step: 3,
      title: 'Check the multiplication inverse rule',
      explanation: 'If 10 ÷ 0 = X, then X × 0 must equal 10. But by definition of zero in arithmetic, any number multiplied by zero equals zero.',
      whyItMatters: 'Allowing division by zero would destroy mathematical consistency and allow proving that 1 = 2.',
    },
  ],
  visualModel: {
    type: 'flow',
    caption: 'Why 10 / x diverges as x approaches 0 from both sides',
    content: `
  x approaching 0 from Right (+):
  10 / 1.0     = 10
  10 / 0.1     = 100
  10 / 0.001   = 10,000
  10 / 0.00001 = 1,000,000  ---> Approaches +∞

  x approaching 0 from Left (-):
  10 / (-1.0)     = -10
  10 / (-0.1)     = -100
  10 / (-0.001)   = -10,000
  10 / (-0.00001) = -1,000,000 ---> Approaches -∞

  Conclusion: +∞ ≠ -∞  ===> Limit Does Not Exist (UNDEFINED)
    `,
  },
  commonTraps: [
    'Assuming "10 ÷ 0 = 0" (Dividing something into zero groups does not leave you with zero things).',
    'Assuming "10 ÷ 0 = Infinity" (Infinity is a concept, not a real number, and approaching from negative numbers gives -∞).',
    'Confusing 0 ÷ 5 (which is 0) with 5 ÷ 0 (which is undefined).',
  ],
  realWorldApplication: 'Computer software crashes (like "DivideByZeroException") happen because processors would get stuck in infinite hardware loops if CPU engineers did not write specific hardware traps to catch it.',
  quickQuiz: [
    {
      question: 'Why is 10 ÷ 0 not equal to 0?',
      options: [
        'Because if 10 ÷ 0 = 0, then 0 × 0 would have to equal 10, which is false.',
        'Because 10 is too large to fit into 0.',
        'Because calculators run out of battery.',
        'Because zero is an imaginary number.',
      ],
      correctIndex: 0,
      explanation: 'Division must reverse multiplication. If 10 / 0 = 0, then multiplying both sides by 0 would require 0 * 0 = 10, which contradicts 0 * 0 = 0.',
    },
    {
      question: 'What is 0 ÷ 7?',
      options: [
        'Undefined',
        '0 (You have 0 cookies divided among 7 friends, so each gets 0)',
        '7',
        'Infinity',
      ],
      correctIndex: 1,
      explanation: '0 divided by any non-zero number is 0! 0 * 7 = 0 holds true perfectly.',
    },
  ],
  flashcards: [
    {
      id: 'fc_sample_1',
      front: 'Why is dividing by zero considered "undefined"?',
      back: 'Because division is the inverse of multiplication, and no number multiplied by 0 can ever equal a non-zero number.',
      tip: 'Remember: a / 0 = c implies 0 * c = a.',
      mastered: false,
    },
    {
      id: 'fc_sample_2',
      front: 'What is the difference between 0 ÷ 8 and 8 ÷ 0?',
      back: '0 ÷ 8 = 0 (valid, each gets 0). 8 ÷ 0 = Undefined (impossible, 0 * c can never equal 8).',
      tip: 'Zero in the numerator is fine; zero in the denominator is illegal!',
      mastered: false,
    },
  ],
  suggestedFollowUps: [
    'What is 0 divided by 0? Is that also undefined or indeterminate?',
    'How do calculus limits let us divide by numbers that get infinitely close to zero?',
    'Why would allowing division by zero prove that 1 equals 2?',
  ],
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('ask');
  const [currentExplanation, setCurrentExplanation] = useState<DoubtExplanation | null>(sampleInitialExplanation);
  const [savedDoubts, setSavedDoubts] = useState<DoubtExplanation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [prefillPrompt, setPrefillPrompt] = useState<{ doubt: string; subject: SubjectId; level?: SimplicityLevel } | undefined>(undefined);

  // Load saved doubts from localStorage
  useEffect(() => {
    const saved = getSavedDoubts();
    setSavedDoubts(saved);
  }, []);

  const handleSolveDoubt = async (params: {
    doubt: string;
    subject: SubjectId;
    level: SimplicityLevel;
    imageBase64?: string;
    imageMimeType?: string;
  }) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const explanation = await requestDoubtExplanation(params);
      setCurrentExplanation(explanation);
      setCurrentTab('ask');
      // Scroll to explanation smoothly
      window.scrollTo({ top: 350, behavior: 'smooth' });
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Something went wrong while explaining this concept. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSaveCurrent = () => {
    if (!currentExplanation) return;
    const isAlreadySaved = savedDoubts.some((d) => d.id === currentExplanation.id || d.title === currentExplanation.title);

    if (isAlreadySaved) {
      removeDoubtFromStorage(currentExplanation.id);
      setSavedDoubts((prev) => prev.filter((d) => d.id !== currentExplanation.id));
    } else {
      saveDoubtToStorage(currentExplanation);
      setSavedDoubts((prev) => [currentExplanation, ...prev]);
    }
  };

  const handleRemoveSaved = (id: string) => {
    removeDoubtFromStorage(id);
    setSavedDoubts((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSelectCuratedConcept = (doubt: string, subject: SubjectId, level: SimplicityLevel) => {
    setPrefillPrompt({ doubt, subject, level });
    handleSolveDoubt({ doubt, subject, level });
  };

  const isCurrentSaved = !!currentExplanation && savedDoubts.some(
    (d) => d.id === currentExplanation.id || d.title === currentExplanation.title
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Top Bar Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        savedCount={savedDoubts.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Error notification banner if any */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: ASK / DOUBT SOLVER */}
        {currentTab === 'ask' && (
          <div className="space-y-8">
            {/* Hero / Pitch Banner */}
            <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-10 shadow-sm border border-slate-800 relative overflow-hidden">
              <div className="relative z-10 max-w-3xl">
                {/* Zero-Pill Metadata */}
                <div className="flex items-center gap-2 text-xs text-indigo-300 mb-2">
                  <span>Clarity AI Educational Engine</span>
                  <span aria-hidden="true">·</span>
                  <span>Feynman Technique & Analogies</span>
                  <span aria-hidden="true">·</span>
                  <span>Multimodal Homework Solver</span>
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-balance leading-tight">
                  Never stay stuck on a homework doubt again.
                </h1>

                <p className="text-sm sm:text-base text-slate-300 mt-3 max-w-2xl font-sans leading-relaxed">
                  Type any tricky concept, ask why a formula works, or attach a photo of your problem. Clarity explains it in crystal-clear simple language with vivid everyday analogies, step-by-step logic, and interactive concept checks.
                </p>
              </div>

              {/* Decorative background SVG accents */}
              <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden md:flex items-center justify-center">
                <GraduationCap className="w-64 h-64 text-indigo-400 -mr-10" />
              </div>
            </div>

            {/* Input Component */}
            <DoubtInput
              onSubmit={handleSolveDoubt}
              isLoading={isLoading}
              prefillPrompt={prefillPrompt}
            />

            {/* Loading Indicator with Step Progression */}
            {isLoading && (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs">
                <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <h3 className="text-base font-serif font-semibold text-slate-900">
                  Deconstructing your doubt into simple first principles...
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Finding real-world analogies, drafting intuitive step-by-step logic, and building interactive recall flashcards.
                </p>
              </div>
            )}

            {/* Render Current Active Explanation */}
            {!isLoading && currentExplanation && (
              <ExplanationCard
                explanation={currentExplanation}
                isSaved={isCurrentSaved}
                onToggleSave={handleToggleSaveCurrent}
              />
            )}
          </div>
        )}

        {/* TAB 2: CONCEPT EXPLORER */}
        {currentTab === 'explore' && (
          <ConceptExplorer onSelectConcept={handleSelectCuratedConcept} />
        )}

        {/* TAB 3: PRACTICE ARENA */}
        {currentTab === 'practice' && (
          <PracticeScreen
            onAskAboutMissedQuestion={(questionText, subj) => {
              setPrefillPrompt({ doubt: questionText, subject: subj, level: 'highschool' });
              handleSolveDoubt({ doubt: questionText, subject: subj, level: 'highschool' });
            }}
          />
        )}

        {/* TAB 4: INTERACTIVE SANDBOXES */}
        {currentTab === 'sandboxes' && (
          <InteractiveSandboxes
            onAskAboutSimulation={(doubt, subject, level) => {
              setPrefillPrompt({ doubt, subject, level });
              handleSolveDoubt({ doubt, subject, level });
            }}
          />
        )}

        {/* TAB 4: STUDY DECK / SAVED DOUBTS */}
        {currentTab === 'saved' && (
          <SavedDoubtLibrary
            savedDoubts={savedDoubts}
            onOpenDoubt={(doubt) => {
              setCurrentExplanation(doubt);
              setCurrentTab('ask');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onRemoveDoubt={handleRemoveSaved}
          />
        )}
      </main>

      {/* Refined Academic Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-slate-900 text-sm">Clarity</span>
            <span aria-hidden="true">·</span>
            <span>Simple explanations for curious student minds</span>
          </div>

          <div className="flex items-center gap-6">
            <span>Powered by Gemini 3.8 Flash</span>
            <span aria-hidden="true">·</span>
            <span>Feynman Learning Model</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400">© 2026 Clarity Tutor</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
