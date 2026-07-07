import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Send, Loader2, AlertTriangle, RefreshCw, Stethoscope } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    possible_factors?: string[];
    related_conditions?: string[];
    next_steps?: string[];
    warning_signs?: string[];
  };
}

interface HealthCheckInput {
  age: string;
  gender: string;
  symptoms: string;
  duration: string;
  lifestyle: string;
}

const suggestedQuestions = [
  'I have a persistent headache and feel tired',
  'My throat has been sore for 3 days',
  'I feel anxious and have trouble sleeping',
  'I have lower back pain after exercise',
];

export default function AIHealthChecker({ lang = 'en' }: { lang?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [healthData, setHealthData] = useState<HealthCheckInput>({
    age: '',
    gender: '',
    symptoms: '',
    duration: '',
    lifestyle: '',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 简单聊天模式
  async function handleSendChat(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMsg: Message = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: messageText,
          language: lang,
        }),
      });
      const data = await res.json();

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.reply || data.summary || 'I understand your concern. Let me analyze that for you.',
        metadata: {
          possible_factors: data.possible_factors,
          related_conditions: data.related_conditions,
          next_steps: data.next_steps,
          warning_signs: data.warning_signs,
        },
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again later.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // 详细健康检测模式
  async function handleHealthCheck(e: FormEvent) {
    e.preventDefault();
    if (!healthData.symptoms.trim()) return;

    const summary = `Health Check: ${healthData.symptoms} (Duration: ${healthData.duration || 'N/A'}, Age: ${healthData.age || 'N/A'}, Gender: ${healthData.gender || 'N/A'})`;
    await handleSendChat(summary);
    setShowForm(false);
    setHealthData({ age: '', gender: '', symptoms: '', duration: '', lifestyle: '' });
  }

  function handleReset() {
    setMessages([]);
    setInput('');
  }

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink-100 bg-gradient-to-r from-medical-500 to-health-500 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-white">AI Health Assistant</h3>
            <div className="flex items-center gap-1.5 text-xs text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
              Online · Powered by Medical AI
            </div>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/90 transition-colors hover:bg-white/10"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-ink-50/50 p-4 sm:p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-medical-100 to-health-100">
              <Stethoscope className="h-8 w-8 text-medical-600" />
            </div>
            <h4 className="font-display text-lg font-semibold text-ink-800">How can I help you today?</h4>
            <p className="mt-2 max-w-sm text-sm text-ink-500">
              Describe your symptoms or health concerns. I'll analyze them and provide guidance.
            </p>

            {/* 建议问题 */}
            <div className="mt-6 grid w-full max-w-lg gap-2 sm:grid-cols-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSendChat(q)}
                  className="rounded-xl border border-ink-100 bg-white px-4 py-3 text-left text-sm text-ink-600 transition-all hover:border-medical-200 hover:bg-medical-50 hover:text-medical-700"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* 详细检测按钮 */}
            <button
              onClick={() => setShowForm(!showForm)}
              className="mt-4 text-sm font-medium text-medical-600 hover:text-medical-700 underline-offset-2 hover:underline"
            >
              Or fill a detailed health check form →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <ChatMessage key={idx} message={msg} />
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-ink-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI is analyzing your symptoms...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* 详细表单 */}
        {showForm && messages.length === 0 && (
          <form onSubmit={handleHealthCheck} className="mt-4 space-y-4 rounded-xl border border-medical-100 bg-white p-6">
            <h4 className="font-display text-base font-semibold text-ink-800">Detailed Health Check</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-ink-600">Age</label>
                <input
                  type="number"
                  value={healthData.age}
                  onChange={(e) => setHealthData({ ...healthData, age: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-medical-500 focus:outline-none focus:ring-1 focus:ring-medical-500"
                  placeholder="e.g. 30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-600">Gender</label>
                <select
                  value={healthData.gender}
                  onChange={(e) => setHealthData({ ...healthData, gender: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-medical-500 focus:outline-none focus:ring-1 focus:ring-medical-500"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600">Symptoms *</label>
              <textarea
                required
                value={healthData.symptoms}
                onChange={(e) => setHealthData({ ...healthData, symptoms: e.target.value })}
                className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-medical-500 focus:outline-none focus:ring-1 focus:ring-medical-500"
                rows={3}
                placeholder="Describe your symptoms in detail..."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-ink-600">Duration</label>
                <input
                  type="text"
                  value={healthData.duration}
                  onChange={(e) => setHealthData({ ...healthData, duration: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-medical-500 focus:outline-none focus:ring-1 focus:ring-medical-500"
                  placeholder="e.g. 3 days"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-600">Lifestyle</label>
                <input
                  type="text"
                  value={healthData.lifestyle}
                  onChange={(e) => setHealthData({ ...healthData, lifestyle: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-medical-500 focus:outline-none focus:ring-1 focus:ring-medical-500"
                  placeholder="e.g. office worker, low exercise"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full">
              <Send className="h-4 w-4" />
              Submit Health Check
            </button>
          </form>
        )}
      </div>

      {/* 免责声明 */}
      <div className="border-t border-ink-100 bg-amber-50 px-4 py-2">
        <p className="flex items-start gap-1.5 text-xs text-amber-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          This AI assistant provides general health information only and is not a substitute for professional medical advice.
        </p>
      </div>

      {/* Input */}
      <div className="border-t border-ink-100 bg-white p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendChat();
              }
            }}
            rows={1}
            placeholder="Describe your symptoms... e.g. I have a headache and feel tired"
            className="max-h-32 flex-1 resize-none rounded-xl border border-ink-200 px-3 py-3 text-sm focus:border-medical-500 focus:outline-none focus:ring-1 focus:ring-medical-500"
          />
          <button
            onClick={() => handleSendChat()}
            disabled={!input.trim() || loading}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-medical-500 text-white transition-colors hover:bg-medical-600 disabled:cursor-not-allowed disabled:bg-ink-300"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-medical-500 px-4 py-3 text-sm text-white shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] rounded-2xl rounded-tl-sm border border-ink-100 bg-white px-4 py-3 text-sm text-ink-700 shadow-sm">
        <p className="font-medium text-ink-800">{message.content}</p>

        {message.metadata?.possible_factors && message.metadata.possible_factors.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-medical-600">Possible Factors</p>
            <ul className="mt-1 space-y-1">
              {message.metadata.possible_factors.map((f, i) => (
                <li key={i} className="flex items-start gap-1.5 text-ink-600">
                  <span className="mt-0.5 text-medical-500">•</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {message.metadata?.related_conditions && message.metadata.related_conditions.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-health-600">Related Conditions</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {message.metadata.related_conditions.map((c, i) => (
                <span key={i} className="rounded-full bg-health-50 px-2.5 py-0.5 text-xs text-health-700">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {message.metadata?.next_steps && message.metadata.next_steps.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-medical-600">Recommended Next Steps</p>
            <ul className="mt-1 space-y-1">
              {message.metadata.next_steps.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-ink-600">
                  <span className="mt-0.5 text-health-500">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {message.metadata?.warning_signs && message.metadata.warning_signs.length > 0 && (
          <div className="mt-3 rounded-lg bg-amber-50 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              Warning Signs - See a Doctor
            </p>
            <ul className="mt-1 space-y-1">
              {message.metadata.warning_signs.map((w, i) => (
                <li key={i} className="text-xs text-amber-700">
                  • {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
