import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  Mic, 
  MicOff, 
  X, 
  Sparkles, 
  Atom, 
  Pi, 
  FlaskConical, 
  Dna, 
  Code, 
  Landmark, 
  BookText, 
  GraduationCap,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { SimplicityLevel, SubjectId } from '../types';

interface DoubtInputProps {
  onSubmit: (params: {
    doubt: string;
    subject: SubjectId;
    level: SimplicityLevel;
    imageBase64?: string;
    imageMimeType?: string;
  }) => void;
  isLoading: boolean;
  prefillPrompt?: { doubt: string; subject: SubjectId; level?: SimplicityLevel };
}

const subjects: { id: SubjectId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'general', label: 'General', icon: GraduationCap },
  { id: 'physics', label: 'Physics', icon: Atom },
  { id: 'math', label: 'Mathematics', icon: Pi },
  { id: 'chemistry', label: 'Chemistry', icon: FlaskConical },
  { id: 'biology', label: 'Biology', icon: Dna },
  { id: 'cs', label: 'Computer Sci', icon: Code },
  { id: 'history', label: 'History', icon: Landmark },
  { id: 'literature', label: 'Literature', icon: BookText },
];

const levels: { id: SimplicityLevel; title: string; subtitle: string }[] = [
  { id: '10yo', title: '5th Grader / 10-Yr-Old', subtitle: 'Fun analogies, zero jargon' },
  { id: 'highschool', title: 'High School', subtitle: 'Intuitive concept & logic' },
  { id: 'college', title: 'Exam / College', subtitle: 'First-principles & rigor' },
  { id: 'feynman', title: 'Feynman Method', subtitle: 'Plain truth, zero pretense' },
];

const sampleDoubts = [
  { text: 'Why is dividing by zero mathematically impossible or undefined?', subject: 'math' as SubjectId },
  { text: 'How does an airplane fly? Is it Bernoulli or Newton?', subject: 'physics' as SubjectId },
  { text: 'Why does ice float on liquid water when most solids sink?', subject: 'chemistry' as SubjectId },
  { text: 'What is Recursion in computer science and when does it stop?', subject: 'cs' as SubjectId },
  { text: 'How does mRNA tell human cells to make spike proteins?', subject: 'biology' as SubjectId },
  { text: 'What is the intuitive difference between GDP and GNP?', subject: 'history' as SubjectId },
];

export const DoubtInput: React.FC<DoubtInputProps> = ({ onSubmit, isLoading, prefillPrompt }) => {
  const [doubtText, setDoubtText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('general');
  const [selectedLevel, setSelectedLevel] = useState<SimplicityLevel>('highschool');
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string; previewUrl: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Apply prefill prompt if passed
  useEffect(() => {
    if (prefillPrompt) {
      setDoubtText(prefillPrompt.doubt);
      setSelectedSubject(prefillPrompt.subject);
      if (prefillPrompt.level) setSelectedLevel(prefillPrompt.level);
    }
  }, [prefillPrompt]);

  // Speech Recognition setup (Web Speech API)
  const toggleSpeechRecognition = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your doubt.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setDoubtText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, or WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage({
        base64,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file),
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    if (selectedImage?.previewUrl) {
      URL.revokeObjectURL(selectedImage.previewUrl);
    }
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!doubtText.trim() && !selectedImage) || isLoading) return;

    onSubmit({
      doubt: doubtText.trim(),
      subject: selectedSubject,
      level: selectedLevel,
      imageBase64: selectedImage?.base64,
      imageMimeType: selectedImage?.mimeType,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 transition-all">
      {/* Subject Filter Bar - clean segmented buttons */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
          Select Field of Study
        </label>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
          {subjects.map((s) => {
            const Icon = s.icon;
            const isSelected = selectedSubject === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSubject(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Doubt Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={doubtText}
            onChange={(e) => setDoubtText(e.target.value)}
            placeholder="Type your question or academic doubt... (e.g. 'Why does light bend when entering water?', 'Explain eigenvalues simply', or upload a picture of your homework problem)"
            rows={4}
            className="w-full text-slate-800 placeholder-slate-400 bg-slate-50/70 border border-slate-200 rounded-xl p-4 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all resize-none leading-relaxed"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit(e);
              }
            }}
          />

          {/* Character counter & keyboard hint */}
          <div className="absolute right-3 bottom-3 flex items-center gap-2 text-xs text-slate-400 pointer-events-none">
            <span className="hidden sm:inline">Ctrl + Enter to send</span>
          </div>
        </div>

        {/* Uploaded Image Thumbnail Preview */}
        {selectedImage && (
          <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            <img
              src={selectedImage.previewUrl}
              alt="Question attachment preview"
              className="w-14 h-14 object-cover rounded-lg border border-slate-200"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 truncate">
                Homework Question Image attached
              </p>
              <p className="text-[11px] text-slate-500">
                Gemini will inspect diagrams, text, and equations from this photo.
              </p>
            </div>
            <button
              type="button"
              onClick={removeImage}
              className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Simplicity Level Segmented Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Explain In Simple Language As If I Am...
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {levels.map((lvl) => {
              const isSelected = selectedLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setSelectedLevel(lvl.id)}
                  className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 text-slate-900 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <p className={`text-xs font-semibold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                    {lvl.title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {lvl.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Media Attachments */}
          <div className="flex items-center gap-1.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Upload photo of question or textbook page"
            >
              <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>Attach Problem Image</span>
            </button>

            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                isRecording
                  ? 'bg-rose-100 text-rose-700 animate-pulse'
                  : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
              }`}
              title="Speak your doubt out loud"
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5 text-rose-600" /> : <Mic className="w-3.5 h-3.5" />}
              <span>{isRecording ? 'Listening...' : 'Voice Doubt'}</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={(!doubtText.trim() && !selectedImage) || isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs hover:shadow transition-all cursor-pointer whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Explaining Simply...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Explain Concept</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggested Quick Doubts */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>Curious students also ask:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {sampleDoubts.map((sample, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setDoubtText(sample.text);
                setSelectedSubject(sample.subject);
              }}
              className="text-left text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {sample.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
