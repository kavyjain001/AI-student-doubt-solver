import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  Sparkles, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Award, 
  Flame, 
  Lightbulb, 
  ArrowRight,
  BookOpen,
  Sliders,
  AlertTriangle,
  Flag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SubjectId, PracticeDifficulty, PracticeQuestion, PracticeSession } from '../types';
import { requestPracticeSession } from '../lib/gemini-client';

interface PracticeScreenProps {
  onAskAboutMissedQuestion: (questionText: string, subject: SubjectId) => void;
}

const presetTopics: { label: string; topic: string; subject: SubjectId }[] = [
  { label: "Newton's 3 Laws", topic: "Newton's Laws of Motion & Friction", subject: 'physics' },
  { label: "Quadratic Equations", topic: "Quadratic Equations & Roots", subject: 'math' },
  { label: "Cell Respiration", topic: "Cellular Respiration & ATP Production", subject: 'biology' },
  { label: "Chemical Bonding", topic: "Ionic, Covalent and Hydrogen Bonds", subject: 'chemistry' },
  { label: "Binary Search Trees", topic: "Binary Search Trees & Traversal", subject: 'cs' },
  { label: "Ohm's Law & Circuits", topic: "Ohm's Law, Voltage, Current & Resistors", subject: 'physics' },
  { label: "Calculus Derivatives", topic: "Calculus Derivatives & Rate of Change", subject: 'math' },
  { label: "French Revolution", topic: "Causes and Impact of the French Revolution", subject: 'history' },
];

export const PracticeScreen: React.FC<PracticeScreenProps> = ({ onAskAboutMissedQuestion }) => {
  // Configuration State
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState<SubjectId>('physics');
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>('intermediate');
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(5); // 0 = untimed
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Session State
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  
  // Timer State
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);
  const [isTestSubmitted, setIsTestSubmitted] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  // Countdown timer effect during active session
  useEffect(() => {
    if (!session || isTestSubmitted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeSpentSeconds((prev) => prev + 1);

      if (secondsRemaining !== null) {
        setSecondsRemaining((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session, isTestSubmitted, secondsRemaining]);

  // Start new practice session
  const handleStartSession = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await requestPracticeSession({
        topic: topic.trim(),
        subject,
        difficulty,
        numQuestions,
      });

      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions generated. Please try a different topic keyword.');
      }

      const newSession: PracticeSession = {
        id: `session_${Date.now()}`,
        topic: data.topic,
        subject: data.subject,
        difficulty: data.difficulty,
        timeLimitMinutes,
        questions: data.questions,
      };

      setSession(newSession);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setRevealedHints({});
      setFlaggedQuestions({});
      setTimeSpentSeconds(0);
      setIsTestSubmitted(false);
      setSecondsRemaining(timeLimitMinutes > 0 ? timeLimitMinutes * 60 : null);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to generate practice session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isTestSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  const toggleHint = (qIndex: number) => {
    setRevealedHints((prev) => ({
      ...prev,
      [qIndex]: !prev[qIndex],
    }));
  };

  const toggleFlag = (qIndex: number) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [qIndex]: !prev[qIndex],
    }));
  };

  const handleSubmitTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTestSubmitted(true);

    if (session) {
      const correctCount = session.questions.filter(
        (q, idx) => userAnswers[idx] === q.correctIndex
      ).length;
      const scorePct = (correctCount / session.questions.length) * 100;

      if (scorePct >= 70) {
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch (e) {}
      }
    }
  };

  const handleResetToConfig = () => {
    setSession(null);
    setIsTestSubmitted(false);
    setUserAnswers({});
    setRevealedHints({});
    setFlaggedQuestions({});
    setSecondsRemaining(null);
    setTimeSpentSeconds(0);
  };

  // Helper formatting for seconds to MM:SS
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ==========================================
  // RENDER 1: RESULTS SCORECARD VIEW
  // ==========================================
  if (session && isTestSubmitted) {
    const correctCount = session.questions.filter(
      (q, idx) => userAnswers[idx] === q.correctIndex
    ).length;
    const totalCount = session.questions.length;
    const scorePct = Math.round((correctCount / totalCount) * 100);

    return (
      <div className="space-y-6">
        {/* Scorecard Header Banner */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <span className="font-semibold uppercase tracking-wider text-indigo-600">
                  {session.subject}
                </span>
                <span aria-hidden="true">·</span>
                <span>{session.difficulty} difficulty</span>
                <span aria-hidden="true">·</span>
                <span>Practice Completed</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
                Practice Scorecard: {session.topic}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Completed in <span className="font-semibold font-mono tabular-nums">{formatTimer(timeSpentSeconds)}</span>. Review missed questions below or ask Clarity to explain any difficult concept.
              </p>
            </div>

            {/* Score Ring / Pill */}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 self-start sm:self-auto shrink-0">
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-serif font-bold text-indigo-600 tabular-nums">
                  {scorePct}%
                </p>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                  {correctCount} of {totalCount} Correct
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleResetToConfig}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Practice Another Topic</span>
            </button>

            <button
              onClick={() => {
                setIsTestSubmitted(false);
                setUserAnswers({});
                setCurrentQuestionIndex(0);
                setTimeSpentSeconds(0);
                setSecondsRemaining(session.timeLimitMinutes > 0 ? session.timeLimitMinutes * 60 : null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Same Questions</span>
            </button>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="space-y-4">
          <h3 className="text-base font-serif font-bold text-slate-900 px-1">
            Question-by-Question Diagnostic Review
          </h3>

          {session.questions.map((q, qIdx) => {
            const chosen = userAnswers[qIdx];
            const isCorrect = chosen === q.correctIndex;
            const wasAnswered = chosen !== undefined;

            return (
              <div
                key={q.id || qIdx}
                className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {qIdx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Concept: {q.coreConcept}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Correct (+1)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{wasAnswered ? 'Incorrect' : 'Unanswered'}</span>
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm sm:text-base font-serif font-medium text-slate-900 leading-snug">
                  {q.question}
                </p>

                {/* Options display */}
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    let borderClass = 'border-slate-200 bg-white text-slate-700';

                    if (optIdx === q.correctIndex) {
                      borderClass = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-medium';
                    } else if (optIdx === chosen && optIdx !== q.correctIndex) {
                      borderClass = 'border-rose-400 bg-rose-50/70 text-rose-950 line-through';
                    } else {
                      borderClass = 'border-slate-100 bg-slate-50/50 text-slate-400';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-lg border text-xs sm:text-sm flex items-center justify-between gap-3 ${borderClass}`}
                      >
                        <span>{opt}</span>
                        {optIdx === q.correctIndex && (
                          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Correct Answer</span>
                          </span>
                        )}
                        {optIdx === chosen && optIdx !== q.correctIndex && (
                          <span className="text-xs font-semibold text-rose-700 flex items-center gap-1">
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>Your Answer</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pedagogical Explanation Callout */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-700 space-y-1.5">
                  <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span>Why this is correct:</span>
                  </p>
                  <p className="leading-relaxed">{q.explanation}</p>
                </div>

                {/* Ask Clarity action if student struggled */}
                {!isCorrect && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        onAskAboutMissedQuestion(
                          `In ${session.topic}, why is this true: "${q.question}"? The answer is "${q.options[q.correctIndex]}". Please explain with a simple analogy.`,
                          session.subject
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200/60 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ask Clarity to Explain This Missed Concept</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 2: ACTIVE PRACTICE TEST IN PROGRESS
  // ==========================================
  if (session && !isTestSubmitted) {
    const currentQ = session.questions[currentQuestionIndex];
    const totalQ = session.questions.length;
    const chosenAnswer = userAnswers[currentQuestionIndex];
    const isFlagged = !!flaggedQuestions[currentQuestionIndex];
    const isHintVisible = !!revealedHints[currentQuestionIndex];
    const answeredCount = Object.keys(userAnswers).length;

    return (
      <div className="space-y-6">
        {/* Test Navigation Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider text-indigo-600">
                {session.subject}
              </span>
              <span aria-hidden="true">·</span>
              <span>{session.difficulty} level</span>
            </div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-slate-900 mt-0.5 truncate max-w-md">
              {session.topic}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Countdown Timer if timed */}
            {secondsRemaining !== null && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono tabular-nums text-xs font-semibold ${
                  secondsRemaining < 60
                    ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(secondsRemaining)} left</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmitTest}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Submit Test ({answeredCount}/{totalQ})
            </button>
          </div>
        </div>

        {/* Stepper Question Selector Strip */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-3 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {session.questions.map((_, idx) => {
              const isAnswered = userAnswers[idx] !== undefined;
              const isCurrent = idx === currentQuestionIndex;
              const flagged = flaggedQuestions[idx];

              let buttonStyle = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
              if (isCurrent) {
                buttonStyle = 'bg-indigo-600 text-white shadow-xs font-bold';
              } else if (isAnswered) {
                buttonStyle = 'bg-indigo-100 text-indigo-800 font-semibold';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer relative ${buttonStyle}`}
                >
                  <span>{idx + 1}</span>
                  {flagged && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 absolute -top-0.5 -right-0.5 ring-2 ring-white" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-xs font-medium text-slate-500 tabular-nums">
            Question {currentQuestionIndex + 1} of {totalQ}
          </div>
        </div>

        {/* Current Question Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Question {currentQuestionIndex + 1}
              </span>
              <p className="text-xs text-indigo-600 font-medium">
                Focus: {currentQ.coreConcept}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggleFlag(currentQuestionIndex)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                isFlagged
                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
              title="Flag question for review"
            >
              <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>{isFlagged ? 'Flagged' : 'Flag'}</span>
            </button>
          </div>

          <p className="text-base sm:text-lg lg:text-xl font-serif font-bold text-slate-900 leading-snug">
            {currentQ.question}
          </p>

          {/* Options */}
          <div className="space-y-3 pt-2">
            {currentQ.options.map((opt, optIdx) => {
              const isSelected = chosenAnswer === optIdx;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Progressive Hint Drawer */}
          <div className="pt-2">
            {!isHintVisible ? (
              <button
                type="button"
                onClick={() => toggleHint(currentQuestionIndex)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/70 px-3 py-1.5 rounded-lg border border-amber-200/60 transition-colors cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>Need a hint? (Thinking prompt)</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    <span>Conceptual Hint:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleHint(currentQuestionIndex)}
                    className="text-[11px] text-amber-700 hover:underline cursor-pointer"
                  >
                    Hide hint
                  </button>
                </div>
                <p>{currentQ.hint}</p>
              </div>
            )}
          </div>

          {/* Bottom Step Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentQuestionIndex < totalQ - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitTest}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <span>Finish & Submit Test</span>
                <Award className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 3: CONFIGURATION SETUP VIEW
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Practice Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold mb-2">
            <span>Adaptive Question Arena</span>
            <span aria-hidden="true">·</span>
            <span>Custom Difficulty & Time</span>
            <span aria-hidden="true">·</span>
            <span>Detailed Conceptual Feedback</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Targeted Academic Practice Arena
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            Specify any topic, choose your question difficulty, and set a timer. Clarity generates conceptual multiple-choice drills with progressive hints and comprehensive explanations.
          </p>
        </div>

        {/* Error notification if generation failed */}
        {errorMessage && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Practice Setup Form */}
        <form onSubmit={handleStartSession} className="mt-6 space-y-6">
          {/* Topic Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              1. What topic do you want to practice?
            </label>
            <div className="relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. 'Newtonian Gravity & Orbits', 'Enzyme Kinetics', 'Graph Traversal Algorithms', 'Stoichiometry'..."
                className="w-full text-slate-800 placeholder-slate-400 bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
                required
              />
            </div>

            {/* Quick Topic Presets */}
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium">Quick Pick:</span>
              {presetTopics.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTopic(item.topic);
                    setSubject(item.subject);
                  }}
                  className="text-left text-xs bg-slate-100 hover:bg-slate-200/80 text-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Field Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              2. Field of Study
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {[
                { id: 'physics', label: 'Physics' },
                { id: 'math', label: 'Mathematics' },
                { id: 'chemistry', label: 'Chemistry' },
                { id: 'biology', label: 'Biology' },
                { id: 'cs', label: 'Computer Science' },
                { id: 'history', label: 'History' },
                { id: 'general', label: 'General / Other' },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSubject(sub.id as SubjectId)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    subject === sub.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3 Parameter Controls (Difficulty, Number of Questions, Time Limit) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 border-t border-slate-100">
            {/* Difficulty Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                3. Difficulty Level
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'beginner', title: 'Beginner', desc: 'Core fundamentals & intuitive' },
                  { id: 'intermediate', title: 'Intermediate', desc: 'High School & standard exam' },
                  { id: 'advanced', title: 'Advanced', desc: 'College & multi-step problems' },
                  { id: 'olympiad', title: 'Olympiad / AP', desc: 'Deep master challenges' },
                ].map((diff) => (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => setDifficulty(diff.id as PracticeDifficulty)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                      difficulty === diff.id
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-medium'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-semibold">{diff.title}</p>
                    <p className="text-[11px] text-slate-500">{diff.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Questions */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                4. Number of Questions
              </label>
              <div className="space-y-1.5">
                {[
                  { count: 3, label: '3 Questions', desc: 'Quick Sprint (~3-5 mins)' },
                  { count: 5, label: '5 Questions', desc: 'Standard Practice (~5-8 mins)' },
                  { count: 10, label: '10 Questions', desc: 'Full Exam Drill (~12-15 mins)' },
                ].map((qCount) => (
                  <button
                    key={qCount.count}
                    type="button"
                    onClick={() => setNumQuestions(qCount.count)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                      numQuestions === qCount.count
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-medium'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-semibold">{qCount.label}</p>
                    <p className="text-[11px] text-slate-500">{qCount.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Limit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                5. Timer & Pressure
              </label>
              <div className="space-y-1.5">
                {[
                  { minutes: 3, label: '3 Minutes', desc: 'Fast blitz challenge' },
                  { minutes: 5, label: '5 Minutes', desc: 'Standard pace' },
                  { minutes: 10, label: '10 Minutes', desc: 'Relaxed test tempo' },
                  { minutes: 0, label: 'Untimed', desc: 'No timer countdown' },
                ].map((timeOpt) => (
                  <button
                    key={timeOpt.minutes}
                    type="button"
                    onClick={() => setTimeLimitMinutes(timeOpt.minutes)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                      timeLimitMinutes === timeOpt.minutes
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-medium'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-semibold">{timeOpt.label}</p>
                    <p className="text-[11px] text-slate-500">{timeOpt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Generating tailored questions with intelligent hints & explanations.
            </div>

            <button
              type="submit"
              disabled={!topic.trim() || isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs hover:shadow transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating {numQuestions} Questions...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Practice Session</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
