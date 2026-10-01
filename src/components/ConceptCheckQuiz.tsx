import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, RotateCcw, Award, HelpCircle } from 'lucide-react';
import { QuizQuestion } from '../types';

interface ConceptCheckQuizProps {
  questions: QuizQuestion[];
  conceptTitle: string;
}

export const ConceptCheckQuiz: React.FC<ConceptCheckQuizProps> = ({ questions, conceptTitle }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});

  if (!questions || questions.length === 0) return null;

  const handleSelect = (qIdx: number, optionIdx: number) => {
    if (submitted[qIdx]) return; // lock once answered
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optionIdx }));
    setSubmitted((prev) => ({ ...prev, [qIdx]: true }));

    // Check if this was correct
    const isCorrect = optionIdx === questions[qIdx].correctIndex;
    
    // Check if all answered and all correct
    const newAnswers = { ...selectedAnswers, [qIdx]: optionIdx };
    const allAnswered = questions.every((_, idx) => newAnswers[idx] !== undefined);
    const allCorrect = allAnswered && questions.every((q, idx) => newAnswers[idx] === q.correctIndex);

    if (allCorrect) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 },
        });
      } catch (e) {
        // ignore
      }
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted({});
  };

  const answeredCount = Object.keys(submitted).length;
  const correctCount = questions.filter((q, idx) => selectedAnswers[idx] === q.correctIndex).length;

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 sm:p-7">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <span>Quick Concept Check</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Test whether this explanation clicked with 2 quick questions.
          </p>
        </div>

        {answeredCount > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700 tabular-nums">
              Score: {correctCount}/{questions.length}
            </span>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {questions.map((q, qIdx) => {
          const isAnswered = submitted[qIdx];
          const chosenOption = selectedAnswers[qIdx];
          const isCorrect = chosenOption === q.correctIndex;

          return (
            <div key={qIdx} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
              <p className="text-sm font-semibold text-slate-800 mb-3.5 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs shrink-0 mt-0.5">
                  {qIdx + 1}
                </span>
                <span>{q.question}</span>
              </p>

              <div className="space-y-2">
                {q.options.map((option, optIdx) => {
                  let buttonClass = 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700';

                  if (isAnswered) {
                    if (optIdx === q.correctIndex) {
                      buttonClass = 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-medium';
                    } else if (optIdx === chosenOption) {
                      buttonClass = 'border-rose-400 bg-rose-50/70 text-rose-900 font-medium';
                    } else {
                      buttonClass = 'border-slate-100 bg-slate-50/50 text-slate-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelect(qIdx, optIdx)}
                      className={`w-full text-left p-3 rounded-lg border text-xs sm:text-sm transition-all flex items-center justify-between gap-3 ${buttonClass} cursor-pointer disabled:cursor-default`}
                    >
                      <span>{option}</span>
                      {isAnswered && optIdx === q.correctIndex && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      {isAnswered && optIdx === chosenOption && optIdx !== q.correctIndex && (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback explanation box once answered */}
              {isAnswered && (
                <div
                  className={`mt-3.5 p-3 rounded-lg text-xs leading-relaxed ${
                    isCorrect
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                      : 'bg-rose-50 text-rose-800 border border-rose-200/60'
                  }`}
                >
                  <p className="font-semibold mb-0.5">
                    {isCorrect ? 'Correct!' : 'Not quite right:'}
                  </p>
                  <p>{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
