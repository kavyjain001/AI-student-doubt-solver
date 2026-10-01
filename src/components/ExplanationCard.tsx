import React, { useState, useRef, useEffect } from 'react';
import { 
  Bookmark, 
  BookmarkCheck, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  HelpCircle, 
  AlertTriangle, 
  Globe, 
  Send, 
  ArrowRight,
  Share2,
  Check,
  RotateCcw,
  MessageSquare
} from 'lucide-react';
import { DoubtExplanation, FollowUpMessage } from '../types';
import { ConceptCheckQuiz } from './ConceptCheckQuiz';
import { FlashcardDeck } from './FlashcardDeck';
import { requestTtsAudio, sendFollowUpDoubt } from '../lib/gemini-client';

interface ExplanationCardProps {
  explanation: DoubtExplanation;
  isSaved: boolean;
  onToggleSave: () => void;
  onAskFollowUpPrompt?: (prompt: string) => void;
}

export const ExplanationCard: React.FC<ExplanationCardProps> = ({
  explanation,
  isSaved,
  onToggleSave,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Follow-up state
  const [followUpInput, setFollowUpInput] = useState('');
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [followUpMessages, setFollowUpMessages] = useState<FollowUpMessage[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop audio if explanation changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingAudio(false);
    setAudioUrl(null);
    setFollowUpMessages([]);
    setFollowUpInput('');
  }, [explanation.id]);

  // Audio Narrator (Gemini TTS with browser speech fallback)
  const toggleAudioNarration = async () => {
    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlayingAudio(true);
      return;
    }

    // Generate speech
    setIsLoadingAudio(true);
    const script = `${explanation.title}. ${explanation.oneSentenceAha}. In simple terms: ${explanation.simpleAnalogy.story}. ${explanation.coreConcept.summary}`;

    try {
      const generatedAudioUrl = await requestTtsAudio(script, 'Kore');
      setAudioUrl(generatedAudioUrl);
      const audio = new Audio(generatedAudioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        setIsPlayingAudio(false);
        fallbackBrowserSpeech(script);
      };
      await audio.play();
      setIsPlayingAudio(true);
    } catch (e) {
      console.warn('Gemini TTS fallback to browser SpeechSynthesis:', e);
      fallbackBrowserSpeech(script);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const fallbackBrowserSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const handleCopy = () => {
    const textToCopy = `# ${explanation.title}\n\nCore Idea: ${explanation.oneSentenceAha}\n\nAnalogy: ${explanation.simpleAnalogy.story}\n\nSummary: ${explanation.coreConcept.summary}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendFollowUp = async (textToSend?: string) => {
    const question = (textToSend || followUpInput).trim();
    if (!question || isAskingFollowUp) return;

    const studentMsg: FollowUpMessage = {
      id: `msg_${Date.now()}`,
      sender: 'student',
      text: question,
      timestamp: Date.now(),
    };

    setFollowUpMessages((prev) => [...prev, studentMsg]);
    setFollowUpInput('');
    setIsAskingFollowUp(true);

    try {
      const reply = await sendFollowUpDoubt({
        initialConceptTitle: explanation.title,
        originalDoubt: explanation.doubt,
        level: explanation.level,
        followUpQuestion: question,
        conversationHistory: [...followUpMessages, studentMsg],
      });

      const tutorMsg: FollowUpMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'tutor',
        text: reply,
        timestamp: Date.now(),
      };
      setFollowUpMessages((prev) => [...prev, tutorMsg]);
    } catch (e: any) {
      const errorMsg: FollowUpMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'tutor',
        text: 'Sorry, I had trouble answering that follow-up. Please try asking again!',
        timestamp: Date.now(),
      };
      setFollowUpMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAskingFollowUp(false);
    }
  };

  return (
    <article className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
      {/* Top Header Bar */}
      <div className="p-6 sm:p-8 border-b border-slate-100 bg-linear-to-b from-slate-50/50 to-white">
        {/* Zero-Pill Metadata Line */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3">
          <span className="font-semibold uppercase tracking-wider text-indigo-600">
            {explanation.subject}
          </span>
          <span aria-hidden="true">·</span>
          <span>Level: {explanation.level}</span>
          <span aria-hidden="true">·</span>
          <span>Verified Student Explanation</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-slate-900 tracking-tight text-balance">
              {explanation.title}
            </h2>
            <p className="text-sm text-slate-500 mt-1 italic">
              Original doubt: &ldquo;{explanation.doubt}&rdquo;
            </p>
          </div>

          {/* Action Bar (Audio Narration, Save, Share) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleAudioNarration}
              disabled={isLoadingAudio}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                isPlayingAudio
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Listen to explanation aloud"
            >
              {isLoadingAudio ? (
                <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : isPlayingAudio ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>{isPlayingAudio ? 'Pause Narration' : 'Listen'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleSave}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title={isSaved ? 'Remove from Study Deck' : 'Save to Study Deck'}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4 text-amber-600" /> : <Bookmark className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="p-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              title="Copy explanation"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* Section 1: The One-Sentence "Aha!" Insight */}
        <div className="relative p-5 sm:p-6 rounded-xl bg-linear-to-r from-indigo-50/70 via-indigo-50/30 to-purple-50/50 border border-indigo-100">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>The Core Intuition in One Sentence</span>
          </div>
          <p className="text-base sm:text-lg font-serif font-medium text-slate-900 leading-snug">
            &ldquo;{explanation.oneSentenceAha}&rdquo;
          </p>
        </div>

        {/* Section 2: The Real-Life Analogy */}
        <div className="bg-amber-50/40 border border-amber-200/70 rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>The Everyday Analogy: {explanation.simpleAnalogy.title}</span>
          </div>
          <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-sans mb-3">
            {explanation.simpleAnalogy.story}
          </p>
          <div className="text-xs text-amber-900/90 font-medium bg-amber-100/60 p-3 rounded-lg border border-amber-200/50">
            <strong>How it connects:</strong> {explanation.simpleAnalogy.connection}
          </div>
        </div>

        {/* Section 3: Step-by-Step Breakdown */}
        {explanation.stepByStep && explanation.stepByStep.length > 0 && (
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span>Step-by-Step Logic</span>
              <span className="text-xs text-slate-400 font-normal">
                (Why each part happens)
              </span>
            </h3>

            <div className="space-y-3">
              {explanation.stepByStep.map((s, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-colors flex gap-4"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {s.step || idx + 1}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h4 className="text-sm font-semibold text-slate-900">
                      {s.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {s.explanation}
                    </p>
                    {s.whyItMatters && (
                      <p className="text-xs text-indigo-700 bg-indigo-50/60 px-2.5 py-1 rounded-md inline-block">
                        <span className="font-semibold">Key takeaway:</span> {s.whyItMatters}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Conceptual Visual Model / Diagram */}
        {explanation.visualModel && explanation.visualModel.content && (
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
              Visual Mental Model
            </h3>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-5 text-slate-200 overflow-x-auto shadow-inner">
              <pre className="font-mono text-xs sm:text-sm leading-relaxed whitespace-pre font-normal text-emerald-400">
                {explanation.visualModel.content}
              </pre>
            </div>
            {explanation.visualModel.caption && (
              <p className="text-xs text-slate-500 mt-2 italic text-center">
                {explanation.visualModel.caption}
              </p>
            )}
          </div>
        )}

        {/* Section 5: Common Traps & Exam Pitfalls */}
        {explanation.commonTraps && explanation.commonTraps.length > 0 && (
          <div className="p-5 rounded-xl border border-rose-200 bg-rose-50/50">
            <h3 className="text-sm font-bold text-rose-800 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Common Student Traps & Misconceptions</span>
            </h3>
            <ul className="space-y-2">
              {explanation.commonTraps.map((trap, idx) => (
                <li key={idx} className="text-xs sm:text-sm text-rose-950 flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>{trap}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 6: Real-World Application */}
        {explanation.realWorldApplication && (
          <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Where you see this in the real world:</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {explanation.realWorldApplication}
            </p>
          </div>
        )}

        {/* Section 7: Interactive Micro-Quiz Check */}
        {explanation.quickQuiz && explanation.quickQuiz.length > 0 && (
          <ConceptCheckQuiz
            questions={explanation.quickQuiz}
            conceptTitle={explanation.title}
          />
        )}

        {/* Section 8: Active Recall Flashcards */}
        {explanation.flashcards && explanation.flashcards.length > 0 && (
          <FlashcardDeck cards={explanation.flashcards} />
        )}

        {/* Section 9: Follow-up Doubt Conversation Desk */}
        <div className="pt-6 border-t border-slate-200">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <span>Still have a doubt? Ask a follow-up question</span>
          </div>

          {/* Suggested follow-up prompt chips */}
          {explanation.suggestedFollowUps && explanation.suggestedFollowUps.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2">Natural follow-ups students ask:</p>
              <div className="flex flex-wrap gap-1.5">
                {explanation.suggestedFollowUps.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendFollowUp(prompt)}
                    className="text-left text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up messages thread */}
          {followUpMessages.length > 0 && (
            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto pr-1">
              {followUpMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-xl text-xs sm:text-sm ${
                    msg.sender === 'student'
                      ? 'bg-slate-100 text-slate-900 ml-8 text-right'
                      : 'bg-indigo-50/80 text-slate-800 mr-8 border border-indigo-100'
                  }`}
                >
                  <p className="font-semibold text-[11px] uppercase tracking-wider mb-1 text-slate-500">
                    {msg.sender === 'student' ? 'Your Follow-up' : 'Clarity AI Tutor'}
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Input field for follow-up */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={followUpInput}
              onChange={(e) => setFollowUpInput(e.target.value)}
              placeholder="e.g. 'Can you explain step 2 again with another example?'"
              className="flex-1 text-xs sm:text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendFollowUp();
              }}
            />
            <button
              type="button"
              onClick={() => handleSendFollowUp()}
              disabled={!followUpInput.trim() || isAskingFollowUp}
              className="inline-flex items-center gap-1.5 px-4 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap"
            >
              {isAskingFollowUp ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Ask</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
