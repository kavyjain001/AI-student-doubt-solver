import { DoubtExplanation, SimplicityLevel, SubjectId, FollowUpMessage, PracticeDifficulty, PracticeQuestion } from '../types';

export async function requestDoubtExplanation(params: {
  doubt: string;
  subject: SubjectId;
  level: SimplicityLevel;
  imageBase64?: string;
  imageMimeType?: string;
}): Promise<DoubtExplanation> {
  const response = await fetch('/api/solve-doubt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server error (${response.status})`);
  }

  return response.json();
}

export async function requestTtsAudio(text: string, voiceName: 'Kore' | 'Puck' | 'Zephyr' = 'Kore'): Promise<string> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceName }),
  });

  if (!response.ok) {
    throw new Error('TTS service failed');
  }

  const data = await response.json();
  return `data:${data.mimeType};base64,${data.audioData}`;
}

export async function sendFollowUpDoubt(params: {
  initialConceptTitle: string;
  originalDoubt: string;
  level: SimplicityLevel;
  followUpQuestion: string;
  conversationHistory: FollowUpMessage[];
}): Promise<string> {
  const response = await fetch('/api/follow-up', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to get follow-up answer');
  }

  const data = await response.json();
  return data.reply;
}

export async function requestPracticeProblems(params: {
  conceptTitle: string;
  level: SimplicityLevel;
  subject: SubjectId;
}) {
  const response = await fetch('/api/practice-problems', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to generate practice problems');
  }

  const data = await response.json();
  return data.problems;
}

export async function requestPracticeSession(params: {
  topic: string;
  subject: SubjectId;
  difficulty: PracticeDifficulty;
  numQuestions: number;
}): Promise<{
  topic: string;
  subject: SubjectId;
  difficulty: PracticeDifficulty;
  questions: PracticeQuestion[];
}> {
  const response = await fetch('/api/generate-practice-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate practice session');
  }

  return response.json();
}

// LocalStorage helpers for saved doubts and flashcard revisions
const STORAGE_KEY = 'clarity_saved_doubts_v1';

export function getSavedDoubts(): DoubtExplanation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load saved doubts', e);
    return [];
  }
}

export function saveDoubtToStorage(explanation: DoubtExplanation): void {
  try {
    const current = getSavedDoubts();
    const exists = current.some((d) => d.id === explanation.id || d.title === explanation.title);
    if (!exists) {
      const updated = [explanation, ...current];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error('Failed to save doubt', e);
  }
}

export function removeDoubtFromStorage(id: string): void {
  try {
    const current = getSavedDoubts();
    const updated = current.filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to remove doubt', e);
  }
}

export function updateFlashcardMastery(doubtId: string, cardId: string, mastered: boolean): void {
  try {
    const current = getSavedDoubts();
    const updated = current.map((d) => {
      if (d.id === doubtId) {
        return {
          ...d,
          flashcards: d.flashcards.map((fc) => (fc.id === cardId ? { ...fc, mastered } : fc)),
        };
      }
      return d;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update flashcard', e);
  }
}
