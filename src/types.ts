export type SimplicityLevel = '10yo' | 'highschool' | 'college' | 'feynman';

export type SubjectId = 
  | 'all'
  | 'math'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'cs'
  | 'history'
  | 'literature'
  | 'general';

export interface SubjectMeta {
  id: SubjectId;
  label: string;
  iconName: string;
  color: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StepExplanation {
  step: number;
  title: string;
  explanation: string;
  whyItMatters: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  tip?: string;
  mastered?: boolean;
}

export interface DoubtExplanation {
  id: string;
  doubt: string;
  subject: SubjectId;
  level: SimplicityLevel;
  timestamp: number;
  title: string;
  oneSentenceAha: string;
  simpleAnalogy: {
    title: string;
    story: string;
    connection: string;
  };
  coreConcept: {
    summary: string;
    keyPoints: string[];
  };
  stepByStep: StepExplanation[];
  visualModel: {
    type: 'diagram' | 'flow' | 'comparison' | 'formula';
    caption: string;
    content: string; // ASCII, structured layout, or formula
  };
  commonTraps: string[];
  realWorldApplication: string;
  quickQuiz: QuizQuestion[];
  flashcards: Flashcard[];
  suggestedFollowUps: string[];
  imageUrl?: string;
}

export interface FollowUpMessage {
  id: string;
  sender: 'student' | 'tutor';
  text: string;
  timestamp: number;
}

export interface CuratedDoubt {
  id: string;
  doubt: string;
  subject: SubjectId;
  level: SimplicityLevel;
  teaser: string;
  category: string;
}

export type PracticeDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'olympiad';

export interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  hint: string;
  explanation: string;
  coreConcept: string;
}

export interface PracticeSession {
  id: string;
  topic: string;
  subject: SubjectId;
  difficulty: PracticeDifficulty;
  timeLimitMinutes: number;
  questions: PracticeQuestion[];
}

