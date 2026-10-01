import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Level definitions for system instructions
const levelDescriptions: Record<string, string> = {
  '10yo': 'Explain to a 10-year-old child (elementary school). Use delightful everyday analogies (like toys, cooking, playgrounds, animals, video games), zero complex jargon, simple active sentences, and intuitive stories.',
  'highschool': 'Explain to a high school student (ages 14-17). Balance intuitive conceptual mental models with real scientific/academic terms. Explain the core intuition first before showing the step-by-step logic and practical everyday examples.',
  'college': 'Explain to a university / AP prep student. Be mathematically and conceptually rigorous while remaining exceptionally clear. Emphasize first principles, underlying mechanisms, edge cases, and avoid hand-waving.',
  'feynman': 'Use the Feynman Technique: Strip away all academic pretension and buzzwords. Explain the fundamental truth so simply that anyone could recreate the concept from scratch. Identify gaps and misconceptions clearly.',
};

// 1. Solve Student Doubt & Explain Concept
app.post('/api/solve-doubt', async (req: Request, res: Response) => {
  try {
    const { doubt, subject = 'general', level = 'highschool', imageBase64, imageMimeType = 'image/jpeg' } = req.body;

    if (!doubt && !imageBase64) {
      return res.status(400).json({ error: 'Please provide a student doubt or an image of the question.' });
    }

    const levelGuidance = levelDescriptions[level] || levelDescriptions['highschool'];

    const systemInstruction = `You are "Clarity", an extraordinary educational mentor and master concept explainer.
Your mission is to resolve student doubts and demystify complex concepts so thoroughly that the student has a joyful "Aha!" realization.

Pedagogical Principles:
1. Target Simplicity: ${levelGuidance}
2. Core Intuition First: Always give the 1-sentence intuitive punchline before any details.
3. The Analogy is King: Give an accurate, relatable, vivid real-world comparison.
4. Step-by-Step Logic: Break down the process sequentially. For each step, explain *why* it happens, not just *that* it happens.
5. Watch out for traps: Highlight the exact mistakes or confusions students usually fall into.
6. Check for Understanding: Provide 2 interactive multiple-choice questions with clear explanations.
7. Active Recall Flashcards: Generate 2-3 concise revision flashcards for memory retention.
8. Diagram/Visual Model: Provide a clear ASCII or structured text flow diagram demonstrating the core mechanism.

Ensure all outputs are formatted as valid JSON adhering to the provided schema.`;

    const promptText = `Student's Subject: ${subject}
Student's Simplicity Preference: ${level}
Student's Doubt / Question: "${doubt || 'Please explain the concept or problem shown in the image.'}"

Break this concept down into crystal-clear simple terms according to the pedagogical principles.`;

    const contents: any[] = [];
    if (imageBase64) {
      // Strip data url prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      contents.push({
        parts: [
          {
            inlineData: {
              mimeType: imageMimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      });
    } else {
      contents.push(promptText);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Clear, engaging title of the concept or doubt',
            },
            oneSentenceAha: {
              type: Type.STRING,
              description: 'The core intuitive punchline in one memorable sentence',
            },
            simpleAnalogy: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'Short catchy analogy title, e.g. "The Water Pipe and Voltage"' },
                story: { type: Type.STRING, description: 'The vivid relatable real-world story' },
                connection: { type: Type.STRING, description: 'How this story directly connects to the real concept' },
              },
              required: ['title', 'story', 'connection'],
            },
            coreConcept: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING, description: 'Plain English summary of the concept' },
                keyPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '3-4 bullet takeaways',
                },
              },
              required: ['summary', 'keyPoints'],
            },
            stepByStep: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  whyItMatters: { type: Type.STRING },
                },
                required: ['step', 'title', 'explanation', 'whyItMatters'],
              },
            },
            visualModel: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: 'diagram, flow, or comparison' },
                caption: { type: Type.STRING },
                content: { type: Type.STRING, description: 'ASCII or structured text diagram showing the flow or relationship' },
              },
              required: ['type', 'caption', 'content'],
            },
            commonTraps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 common misconceptions or traps students stumble upon',
            },
            realWorldApplication: {
              type: Type.STRING,
              description: 'Concrete real-world example of where this is used in technology, nature, or daily life',
            },
            quickQuiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctIndex: { type: Type.INTEGER, description: '0-based index of correct option' },
                  explanation: { type: Type.STRING, description: 'Why this answer is right and why others are wrong' },
                },
                required: ['question', 'options', 'correctIndex', 'explanation'],
              },
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING, description: 'Question or key prompt' },
                  back: { type: Type.STRING, description: 'Simple, direct answer or takeaway' },
                  tip: { type: Type.STRING, description: 'Quick mnemonic or hint' },
                },
                required: ['front', 'back'],
              },
            },
            suggestedFollowUps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 natural questions a curious student might ask next',
            },
          },
          required: [
            'title',
            'oneSentenceAha',
            'simpleAnalogy',
            'coreConcept',
            'stepByStep',
            'visualModel',
            'commonTraps',
            'realWorldApplication',
            'quickQuiz',
            'flashcards',
            'suggestedFollowUps',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    
    // Assign unique IDs to flashcards
    if (Array.isArray(parsed.flashcards)) {
      parsed.flashcards = parsed.flashcards.map((fc: any, idx: number) => ({
        ...fc,
        id: `fc_${Date.now()}_${idx}`,
        mastered: false,
      }));
    }

    const result = {
      id: `doubt_${Date.now()}`,
      doubt: doubt || 'Image problem',
      subject,
      level,
      timestamp: Date.now(),
      ...parsed,
    };

    return res.json(result);
  } catch (error: any) {
    console.error('Error in /api/solve-doubt:', error);
    return res.status(500).json({
      error: 'Failed to generate explanation. ' + (error?.message || 'Please check your connection and try again.'),
    });
  }
});

// 2. Text-to-Speech (TTS) using gemini-3.8-flash-lite-tts
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Kore' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS.' });
    }

    // Trim text to a comfortable audio length (max 400 words)
    const cleanedText = text.replace(/[*#`_~\[\]]/g, ' ').slice(0, 800);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanedText,
              speechMetadata: {
                style: 'Warm, patient, crystal clear educator',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(502).json({ error: 'No audio returned from speech model.' });
    }

    return res.json({
      audioData: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.error('Error in /api/tts:', error);
    return res.status(500).json({
      error: 'TTS generation unavailable. ' + (error?.message || ''),
    });
  }
});

// 3. Ask Follow-up Doubt in context
app.post('/api/follow-up', async (req: Request, res: Response) => {
  try {
    const { initialConceptTitle, originalDoubt, level = 'highschool', followUpQuestion, conversationHistory = [] } = req.body;

    if (!followUpQuestion) {
      return res.status(400).json({ error: 'Follow-up question is required.' });
    }

    const levelGuidance = levelDescriptions[level] || levelDescriptions['highschool'];

    const systemInstruction = `You are "Clarity", answering a follow-up doubt from a student who is currently learning about "${initialConceptTitle}".
The original student doubt was: "${originalDoubt}".
Maintain the chosen simplicity level: ${levelGuidance}.

Instructions:
- Address the follow-up doubt directly and kindly.
- Be concise (2-3 paragraphs maximum).
- Include a practical quick example or mini-analogy.
- End with 1 suggested check question or encouraging reflection.`;

    const contents = [
      ...conversationHistory.map((msg: any) => ({
        role: msg.sender === 'student' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      })),
      {
        role: 'user',
        parts: [{ text: followUpQuestion }],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });

    return res.json({
      reply: response.text || 'I understand your doubt. Let us look at it from another angle!',
    });
  } catch (error: any) {
    console.error('Error in /api/follow-up:', error);
    return res.status(500).json({ error: 'Failed to answer follow-up. ' + (error?.message || '') });
  }
});

// 4. Generate Practice Problems on Demand
app.post('/api/practice-problems', async (req: Request, res: Response) => {
  try {
    const { conceptTitle, level = 'highschool', subject = 'general' } = req.body;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Generate 2 realistic practice problems testing deep conceptual understanding of "${conceptTitle}" in ${subject} for level: ${level}.
Include progressive hints so the student can think through it step-by-step before seeing the complete solution.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              scenario: { type: Type.STRING },
              problemText: { type: Type.STRING },
              hints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              solution: { type: Type.STRING },
              keyLesson: { type: Type.STRING },
            },
            required: ['scenario', 'problemText', 'hints', 'solution', 'keyLesson'],
          },
        },
      },
    });

    const problems = JSON.parse(response.text || '[]');
    return res.json({ problems });
  } catch (error: any) {
    console.error('Error in /api/practice-problems:', error);
    return res.status(500).json({ error: 'Failed to generate practice problems.' });
  }
});

// 5. Generate Practice Exam / Test Session
app.post('/api/generate-practice-session', async (req: Request, res: Response) => {
  try {
    const { topic, subject = 'general', difficulty = 'intermediate', numQuestions = 5 } = req.body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'Please specify a topic to practice.' });
    }

    const count = Math.min(10, Math.max(3, Number(numQuestions) || 5));

    const difficultyGuidance: Record<string, string> = {
      beginner: 'Beginner / Fundamental level: straightforward conceptual questions testing core definitions and basic intuition.',
      intermediate: 'Intermediate / High School level: realistic exam-style questions requiring applying concepts to scenarios, calculating basic values, or distinguishing common misconceptions.',
      advanced: 'Advanced / College level: challenging questions requiring multi-step thinking, edge-case analysis, and deeper first-principles understanding.',
      olympiad: 'Olympiad / AP Prep / Master level: deep critical-thinking problems that combine multiple concepts, tricky distractors, and rigorous logic.',
    };

    const prompt = `Generate exactly ${count} high-quality, conceptual practice multiple-choice questions for the following topic:
Topic: "${topic.trim()}"
Subject: ${subject}
Difficulty: ${difficulty} (${difficultyGuidance[difficulty] || difficultyGuidance.intermediate})

Guidelines:
1. Each question must test understanding, not pure rote memorization.
2. Provide 4 distinct, plausible options.
3. Include an insightful, progressive hint that prompts the student to think through the problem without giving away the direct answer.
4. Provide a crystal-clear explanation for why the correct option is right and why the other options are common traps.
5. Specify the core concept tested in one short phrase.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctIndex: { type: Type.INTEGER },
              hint: { type: Type.STRING },
              explanation: { type: Type.STRING },
              coreConcept: { type: Type.STRING },
            },
            required: ['question', 'options', 'correctIndex', 'hint', 'explanation', 'coreConcept'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    const questions = parsed.map((q: any, idx: number) => ({
      ...q,
      id: q.id || `pq_${Date.now()}_${idx}`,
    }));

    return res.json({
      topic: topic.trim(),
      subject,
      difficulty,
      questions,
    });
  } catch (error: any) {
    console.error('Error in /api/generate-practice-session:', error);
    return res.status(500).json({ error: 'Failed to generate practice session. ' + (error?.message || '') });
  }
});

// Production static assets or Vite Dev Middleware
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Clarity Student AI Tutor server running on http://0.0.0.0:${PORT}`);
});
