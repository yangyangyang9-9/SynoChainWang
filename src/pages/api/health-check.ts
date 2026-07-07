import type { APIRoute } from 'astro';
import { generateHealthCheck, MEDICAL_DISCLAIMER } from '../../lib/ai';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { symptoms, age, gender, duration, lifestyle, language = 'en' } = body;

    if (!symptoms) {
      return new Response(
        JSON.stringify({ error: 'Symptoms description is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 调用 AI 健康检测
    const result = await generateHealthCheck({
      symptoms,
      age,
      gender,
      duration,
      lifestyle,
    });

    // 构造回复文本
    const reply = buildReplyText(result);

    return new Response(
      JSON.stringify({
        reply,
        possible_factors: result.possible_factors,
        related_conditions: result.related_conditions,
        next_steps: result.next_steps,
        warning_signs: result.warning_signs,
        disclaimer: MEDICAL_DISCLAIMER,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Health check API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process health check',
        reply: 'Sorry, I encountered an error while analyzing your symptoms. Please try again later.',
        disclaimer: MEDICAL_DISCLAIMER,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

function buildReplyText(result: any): string {
  const parts: string[] = [];

  if (result.possible_factors && result.possible_factors.length > 0) {
    parts.push(`Based on your symptoms, here are some possible factors to consider.`);
  }

  if (result.warning_signs && result.warning_signs.length > 0) {
    parts.push(`⚠️ Please be aware of warning signs that require immediate medical attention.`);
  }

  parts.push(MEDICAL_DISCLAIMER);

  return parts.join(' ');
}
