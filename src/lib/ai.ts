import { createClient } from '@supabase/supabase-js';

// ============================================================
// SynoChain AI 服务客户端 (Phase 2)
// 提供 OpenAI 调用与健康检测功能
// ============================================================

const OPENAI_API_KEY =
  import.meta.env?.OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4';

// ---------- 医疗免责声明常量 ----------
export const MEDICAL_DISCLAIMER =
  'This content is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read here.';

export const isAIConfigured = Boolean(OPENAI_API_KEY);

// ---------- 类型定义 ----------
export interface HealthCheckInput {
  age: number;
  gender: string;
  symptoms: string;
  duration: string;
  lifestyle?: string;
}

export interface HealthCheckResult {
  possible_factors: string[];
  related_conditions: string[];
  next_steps: string[];
  warning_signs: string[];
  disclaimer: string;
}

export interface OpenAIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ---------- 调用 OpenAI 通用方法 ----------
export async function callOpenAI(
  message: string,
  systemPrompt: string = 'You are a helpful medical assistant.'
): Promise<string> {
  // 未配置 API key 时返回 mock 响应
  if (!isAIConfigured) {
    return mockCallOpenAI(message, systemPrompt);
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenAI 返回内容为空');
    return content;
  } catch (err) {
    console.error('[AI] callOpenAI 失败，返回 mock 数据:', err);
    return mockCallOpenAI(message, systemPrompt);
  }
}

// ---------- Mock: 模拟 OpenAI 响应 ----------
function mockCallOpenAI(message: string, systemPrompt: string): string {
  console.warn('[AI] 未配置 OPENAI_API_KEY，使用 mock 响应');
  return `[Mock Response] System: ${systemPrompt}\nUser: ${message}\n\nThis is a simulated response because OPENAI_API_KEY is not configured.`;
}

// ---------- 健康检测 Prompt 构造 ----------
function buildHealthCheckPrompt(input: HealthCheckInput): string {
  return `Perform a preliminary health assessment based on the following user information. 
Return ONLY a valid JSON object, no extra text.

User Information:
- Age: ${input.age}
- Gender: ${input.gender}
- Symptoms: ${input.symptoms}
- Duration: ${input.duration}
- Lifestyle: ${input.lifestyle || 'Not specified'}

Return JSON with this exact structure:
{
  "possible_factors": ["list of possible contributing factors"],
  "related_conditions": ["list of potentially related conditions"],
  "next_steps": ["recommended next steps, e.g. rest, monitor, see a doctor"],
  "warning_signs": ["red-flag symptoms that require immediate medical attention"]
}`;
}

const HEALTH_CHECK_SYSTEM_PROMPT =
  'You are a medical assistant that performs preliminary health assessments. You must always respond with valid JSON only. Never provide a definitive diagnosis. Always recommend consulting a healthcare professional.';

// ---------- 健康检测 ----------
export async function generateHealthCheck(
  input: HealthCheckInput
): Promise<HealthCheckResult> {
  // 未配置 API key 时返回 mock 数据
  if (!isAIConfigured) {
    return mockHealthCheck(input);
  }

  try {
    const prompt = buildHealthCheckPrompt(input);
    const raw = await callOpenAI(prompt, HEALTH_CHECK_SYSTEM_PROMPT);

    // 解析 JSON（容错处理：提取首个 JSON 对象）
    const jsonStr = extractJson(raw);
    const parsed = JSON.parse(jsonStr);

    return {
      possible_factors: Array.isArray(parsed.possible_factors)
        ? parsed.possible_factors
        : [],
      related_conditions: Array.isArray(parsed.related_conditions)
        ? parsed.related_conditions
        : [],
      next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps : [],
      warning_signs: Array.isArray(parsed.warning_signs)
        ? parsed.warning_signs
        : [],
      disclaimer: MEDICAL_DISCLAIMER,
    };
  } catch (err) {
    console.error('[AI] generateHealthCheck 失败，返回 mock 数据:', err);
    return mockHealthCheck(input);
  }
}

// ---------- Mock: 模拟健康检测结果 ----------
function mockHealthCheck(input: HealthCheckInput): HealthCheckResult {
  console.warn('[AI] 未配置 OPENAI_API_KEY，使用 mock 健康检测结果');
  const symptoms = input.symptoms || 'unknown symptoms';
  return {
    possible_factors: [
      'Stress and anxiety (mock)',
      'Lack of quality sleep (mock)',
      `Possible factors related to: ${symptoms}`,
    ],
    related_conditions: [
      'Common cold (mock)',
      'Tension headache (mock)',
      'General fatigue (mock)',
    ],
    next_steps: [
      'Rest and stay hydrated',
      'Monitor your symptoms for 24-48 hours',
      'If symptoms persist or worsen, consult a healthcare professional',
    ],
    warning_signs: [
      'Severe or worsening symptoms',
      'High fever (above 39°C / 102°F)',
      'Difficulty breathing',
      'Persistent vomiting',
    ],
    disclaimer: MEDICAL_DISCLAIMER,
  };
}

// ---------- 工具函数：从文本中提取 JSON ----------
function extractJson(text: string): string {
  // 尝试直接解析
  try {
    JSON.parse(text);
    return text;
  } catch {
    // 继续尝试提取代码块或首个 JSON 对象
  }
  // 提取 ```json ... ``` 代码块
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  // 提取首个 { ... } 块
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    return objMatch[0];
  }
  throw new Error('无法从响应中提取 JSON');
}

// ---------- 保存健康检测记录到 Supabase（可选） ----------
export async function saveHealthCheck(
  input: HealthCheckInput,
  result: HealthCheckResult,
  userId?: string,
  language: string = 'en'
): Promise<boolean> {
  const supabaseUrl =
    import.meta.env?.SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseServiceKey =
    import.meta.env?.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[AI] Supabase 未配置，跳过保存健康检测记录');
    return false;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
    const { error } = await supabase.from('health_checks').insert({
      user_id: userId || null,
      age: input.age,
      gender: input.gender,
      symptoms: input.symptoms,
      duration: input.duration,
      lifestyle: input.lifestyle || null,
      possible_factors: result.possible_factors,
      related_conditions: result.related_conditions,
      next_steps: result.next_steps,
      warning_signs: result.warning_signs,
      disclaimer: result.disclaimer,
      language,
    });
    if (error) {
      console.error('[AI] 保存健康检测记录失败:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[AI] 保存健康检测记录异常:', err);
    return false;
  }
}
