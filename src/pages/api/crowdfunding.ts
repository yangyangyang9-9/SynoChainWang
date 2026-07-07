import type { APIRoute } from 'astro';
import { getCrowdfundingStats, getCrowdfundingPlans } from '../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'stats') {
      const stats = await getCrowdfundingStats();
      return new Response(
        JSON.stringify({ success: true, data: stats }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'plans') {
      const plans = await getCrowdfundingPlans();
      return new Response(
        JSON.stringify({ success: true, data: plans }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 默认返回所有数据
    const [stats, plans] = await Promise.all([
      getCrowdfundingStats(),
      getCrowdfundingPlans(),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        data: { stats, plans },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Crowdfunding API error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch crowdfunding data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { tier, email, paymentMethod } = body;

    if (!tier || !email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Tier and email are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 模拟支付处理（实际项目中接入 Stripe/PayPal）
    const orderId = `SC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const badgeToken = `BADGE-${orderId}`;

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        badgeToken,
        message: 'Thank you for becoming a Founder! Confirmation email sent.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Support API error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to process support' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
