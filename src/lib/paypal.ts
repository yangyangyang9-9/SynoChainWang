// PayPal 服务端 API 客户端
// 用于创建订单、捕获支付等后端操作，凭证仅在服务端使用，不会泄露到前端

// 从环境变量读取 PayPal 配置（兼容 import.meta.env 与 process.env）
const PAYPAL_CLIENT_ID =
  import.meta.env.PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET =
  import.meta.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_API_BASE =
  import.meta.env.PAYPAL_API_BASE ||
  process.env.PAYPAL_API_BASE ||
  'https://api-m.sandbox.paypal.com';
const PAYPAL_ENV =
  import.meta.env.PAYPAL_ENV || process.env.PAYPAL_ENV || 'sandbox';

// 是否已配置 PayPal 凭证
export const isPayPalConfigured = Boolean(
  PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET
);

// 缓存的 access token（避免每次请求都重新获取）
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

// PayPal API 返回类型定义
export interface PayPalOrderResponse {
  id: string;
  status: string;
  links: Array<{ href: string; rel: string; method: string }>;
}

export interface PayPalCaptureResponse {
  id: string;
  status: string;
  purchase_units: Array<{
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: { value: string; currency_code: string };
      }>;
    };
  }>;
}

/**
 * 获取 PayPal access token
 * 服务端调用，使用 client_id + secret 进行 Basic 认证
 * 带缓存机制，避免频繁请求
 */
export async function getPayPalAccessToken(): Promise<string> {
  // 未配置凭证时返回 mock token
  if (!isPayPalConfigured) {
    console.warn(
      '[PayPal] 未配置 PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET，返回 mock token。请在 .env 中配置 PayPal 凭证。'
    );
    return 'mock-access-token';
  }

  // 命中缓存则直接返回（提前 60 秒过期，留出安全余量）
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  // 请求新的 access token
  const tokenEndpoint = `${PAYPAL_API_BASE}/v1/oauth2/token`;
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `[PayPal] 获取 access token 失败: ${res.status} ${errText}`
    );
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = data.access_token;
  tokenExpiresAt = now + data.expires_in * 1000;
  return cachedToken;
}

/**
 * 创建 PayPal 订单
 * @param amount 金额（数字）
 * @param description 订单描述
 * @param planSlug 方案标识，用于自定义 ID
 */
export async function createPayPalOrder(
  amount: number,
  description: string,
  planSlug: string
): Promise<PayPalOrderResponse> {
  // 未配置时返回 mock 响应
  if (!isPayPalConfigured) {
    console.warn('[PayPal] 未配置凭证，返回 mock 订单响应。');
    const mockId = `MOCK-ORDER-${Date.now()}`;
    return {
      id: mockId,
      status: 'CREATED',
      links: [
        {
          href: `https://www.sandbox.paypal.com/checkoutnow?token=${mockId}`,
          rel: 'approve',
          method: 'GET',
        },
      ],
    };
  }

  const token = await getPayPalAccessToken();
  const endpoint = `${PAYPAL_API_BASE}/v2/checkout/orders`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: planSlug,
          description,
          amount: {
            currency_code: 'USD',
            value: amount.toFixed(2),
          },
        },
      ],
      // 应用上下文
      application_context: {
        brand_name: 'SynoChain AI',
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`[PayPal] 创建订单失败: ${res.status} ${errText}`);
  }

  return (await res.json()) as PayPalOrderResponse;
}

/**
 * 捕获/确认支付
 * 在用户批准支付后调用，完成资金捕获
 * @param orderId PayPal 订单 ID
 */
export async function capturePayPalOrder(
  orderId: string
): Promise<PayPalCaptureResponse> {
  // 未配置时返回 mock 捕获响应
  if (!isPayPalConfigured) {
    console.warn('[PayPal] 未配置凭证，返回 mock 捕获响应。');
    return {
      id: orderId,
      status: 'COMPLETED',
      purchase_units: [
        {
          payments: {
            captures: [
              {
                id: `MOCK-CAPTURE-${Date.now()}`,
                status: 'COMPLETED',
                amount: { value: '0.00', currency_code: 'USD' },
              },
            ],
          },
        },
      ],
    };
  }

  const token = await getPayPalAccessToken();
  const endpoint = `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`[PayPal] 捕获订单失败: ${res.status} ${errText}`);
  }

  return (await res.json()) as PayPalCaptureResponse;
}

/**
 * 获取客户端 token（用于前端 PayPal SDK 渲染按钮时使用）
 * 通过 client_credentials 生成一个客户端专用 token
 */
export async function getClientToken(): Promise<string> {
  if (!isPayPalConfigured) {
    console.warn('[PayPal] 未配置凭证，返回 mock client token。');
    return 'mock-client-token';
  }

  const token = await getPayPalAccessToken();
  const endpoint = `${PAYPAL_API_BASE}/v1/identity/generate-client-token`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `[PayPal] 获取 client token 失败: ${res.status} ${errText}`
    );
  }

  const data = (await res.json()) as { client_token: string };
  return data.client_token;
}

// 导出配置信息（仅导出非敏感信息，供前端 SDK 使用）
export const paypalPublicConfig = {
  clientId: PAYPAL_CLIENT_ID,
  env: PAYPAL_ENV,
  isConfigured: isPayPalConfigured,
};
