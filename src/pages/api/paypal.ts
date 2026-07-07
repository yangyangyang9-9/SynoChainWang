import type { APIRoute } from 'astro';
import {
  createPayPalOrder,
  capturePayPalOrder,
  getClientToken,
  isPayPalConfigured,
  paypalPublicConfig,
} from '../../lib/paypal';

// 此 API 路由需要服务端运行时，不能预渲染
export const prerender = false;

// 众筹方案描述映射
const PLAN_DESCRIPTIONS: Record<string, string> = {
  'ai-pioneer': 'SynoChain AI - AI Pioneer Membership (1 year)',
  'lifetime-founder': 'SynoChain AI - Lifetime Founder Membership',
};

// 统一的 JSON 响应工具函数
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// 生成 Founder Badge Token（用于权益发放）
function generateBadgeToken(orderId: string, planSlug: string): string {
  const prefix = planSlug === 'lifetime-founder' ? 'FOUNDER-LT' : 'PIONEER';
  return `${prefix}-${orderId}`;
}

// GET: 获取客户端 token（供前端 PayPal SDK 使用）
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'token') {
      const clientToken = await getClientToken();
      return jsonResponse({
        success: true,
        clientToken,
        clientId: paypalPublicConfig.clientId,
        env: paypalPublicConfig.env,
        isConfigured: isPayPalConfigured,
      });
    }

    // 未知 action
    return jsonResponse(
      { success: false, error: 'Unknown action. Use ?action=token' },
      400
    );
  } catch (error) {
    console.error('[PayPal API] GET 错误:', error);
    return jsonResponse(
      { success: false, error: 'Failed to get PayPal token' },
      500
    );
  }
};

// POST: 创建订单或捕获支付
export const POST: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const body = await request.json().catch(() => ({}));

    // 创建订单
    if (action === 'create') {
      const { planSlug, amount } = body as {
        planSlug: 'ai-pioneer' | 'lifetime-founder';
        amount: number;
      };

      // 参数校验
      if (!planSlug || !PLAN_DESCRIPTIONS[planSlug]) {
        return jsonResponse(
          {
            success: false,
            error: "Invalid planSlug. Must be 'ai-pioneer' or 'lifetime-founder'",
          },
          400
        );
      }
      if (typeof amount !== 'number' || amount <= 0) {
        return jsonResponse(
          { success: false, error: 'Invalid amount' },
          400
        );
      }

      const description = PLAN_DESCRIPTIONS[planSlug];
      const order = await createPayPalOrder(amount, description, planSlug);

      // 从 links 中提取批准链接（用户需跳转至此 URL 完成支付批准）
      const approvalUrl =
        order.links.find((l) => l.rel === 'approve')?.href || '';

      return jsonResponse({
        success: true,
        orderId: order.id,
        approvalUrl,
        status: order.status,
      });
    }

    // 捕获支付
    if (action === 'capture') {
      const { orderId, planSlug, email } = body as {
        orderId: string;
        planSlug: string;
        email: string;
      };

      if (!orderId) {
        return jsonResponse(
          { success: false, error: 'orderId is required' },
          400
        );
      }
      if (!planSlug || !PLAN_DESCRIPTIONS[planSlug]) {
        return jsonResponse(
          {
            success: false,
            error: "Invalid planSlug. Must be 'ai-pioneer' or 'lifetime-founder'",
          },
          400
        );
      }

      const capture = await capturePayPalOrder(orderId);

      // 提取交易 ID
      const transactionId =
        capture.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
        capture.id;

      // 支付是否完成
      const isCompleted = capture.status === 'COMPLETED';

      if (!isCompleted) {
        return jsonResponse(
          {
            success: false,
            error: `Payment not completed. Status: ${capture.status}`,
            status: capture.status,
          },
          400
        );
      }

      // 生成 Founder Badge Token
      const badgeToken = generateBadgeToken(orderId, planSlug);

      // TODO: 在此处可写入数据库（如 Supabase），记录订单、邮箱、方案、badgeToken
      // 示例：await supabase.from('founders').insert({ email, plan_slug: planSlug, order_id: orderId, transaction_id: transactionId, badge_token: badgeToken })
      console.log(
        `[PayPal] 支付成功: planSlug=${planSlug}, email=${email}, orderId=${orderId}, transactionId=${transactionId}`
      );

      return jsonResponse({
        success: true,
        transactionId,
        orderId,
        badgeToken,
        planSlug,
        email,
        status: capture.status,
      });
    }

    // 未知 action
    return jsonResponse(
      {
        success: false,
        error: "Unknown action. Use ?action=create or ?action=capture",
      },
      400
    );
  } catch (error) {
    console.error('[PayPal API] POST 错误:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to process PayPal request';
    return jsonResponse({ success: false, error: message }, 500);
  }
};
