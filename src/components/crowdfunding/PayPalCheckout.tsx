import { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Award, Copy, Sparkles } from 'lucide-react';

// PayPal SDK 类型定义
interface PayPalActions {
  order: {
    create: (config: {
      purchase_units: Array<{
        reference_id?: string;
        description?: string;
        amount: { value: string; currency_code: string };
      }>;
      application_context?: Record<string, unknown>;
    }) => Promise<string>;
    capture: () => Promise<PayPalCaptureResult>;
  };
}

interface PayPalCaptureResult {
  id: string;
  status: string;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{ id: string; status: string }>;
    };
  }>;
  payer?: {
    name?: { given_name?: string; surname?: string };
    email_address?: string;
  };
}

interface PayPalButtonInstance {
  render: (el: HTMLElement) => Promise<void>;
  close: () => void;
}

interface PayPalSDK {
  Buttons: (opts: {
    style?: {
      layout?: 'vertical' | 'horizontal';
      color?: 'gold' | 'blue' | 'silver' | 'white' | 'black';
      shape?: 'rect' | 'pill';
      label?: 'paypal' | 'pay' | 'checkout' | 'buynow';
    };
    createOrder: (data: unknown, actions: PayPalActions) => Promise<string>;
    onApprove: (data: { orderID: string }, actions: PayPalActions) => Promise<void>;
    onError?: (err: unknown) => void;
  }) => PayPalButtonInstance;
}

// 组件 Props
export interface PayPalCheckoutProps {
  planSlug: 'ai-pioneer' | 'lifetime-founder';
  amount: number;
  planName: string;
  lang?: string;
  clientId?: string;
}

// 支付状态
type PaymentStatus = 'idle' | 'loading' | 'success' | 'error';

// 支付成功后的结果
interface PaymentResult {
  transactionId: string;
  orderId: string;
  badgeToken: string;
  payerEmail?: string;
}

// 动态注入 PayPal JS SDK 脚本
function loadPayPalScript(clientId: string): Promise<PayPalSDK | null> {
  return new Promise((resolve) => {
    if (window.paypal) {
      resolve(window.paypal as unknown as PayPalSDK);
      return;
    }

    const existing = document.getElementById('paypal-sdk-script');
    if (existing) {
      existing.addEventListener('load', () => {
        resolve(window.paypal ? (window.paypal as unknown as PayPalSDK) : null);
      });
      existing.addEventListener('error', () => resolve(null));
      return;
    }

    const script = document.createElement('script');
    script.id = 'paypal-sdk-script';
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`;
    script.async = true;
    script.onload = () => {
      resolve(window.paypal ? (window.paypal as unknown as PayPalSDK) : null);
    };
    script.onerror = () => {
      console.error('[PayPalCheckout] Failed to load PayPal SDK');
      resolve(null);
    };
    document.head.appendChild(script);
  });
}

// 众筹方案描述
const PLAN_DESCRIPTIONS: Record<string, string> = {
  'ai-pioneer': 'SynoChain AI - AI Pioneer Membership (1 year)',
  'lifetime-founder': 'SynoChain AI - Lifetime Founder Membership',
};

export default function PayPalCheckout({
  planSlug,
  amount,
  planName,
  lang = 'en',
  clientId = '',
}: PayPalCheckoutProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [copied, setCopied] = useState(false);
  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  const buttonsRendered = useRef(false);
  const buttonsInstance = useRef<PayPalButtonInstance | null>(null);

  const isZh = lang === 'zh';
  const text = {
    loadingSdk: isZh ? '正在加载支付系统...' : 'Loading payment system...',
    demoPayButton: isZh ? '演示支付（未配置 PayPal）' : 'Demo Payment (PayPal not configured)',
    demoPayDesc: isZh ? '点击模拟支付流程。配置 PayPal 凭证后可启用真实支付。' : 'Click to simulate payment. Configure PayPal credentials to enable real payments.',
    secure: isZh ? '🔒 安全支付 · 由 PayPal 保护' : '🔒 Secure payment powered by PayPal',
    processing: isZh ? '正在处理支付...' : 'Processing payment...',
    successTitle: isZh ? '🎉 支付成功！' : '🎉 Payment Successful!',
    thankYou: isZh ? '感谢您成为 SynoChain AI 创始会员！' : 'Thank you for becoming a SynoChain AI Founder!',
    transactionId: isZh ? '交易号' : 'Transaction ID',
    orderId: isZh ? '订单号' : 'Order ID',
    badgeToken: isZh ? 'Founder Badge 凭证' : 'Founder Badge Token',
    copyBadge: isZh ? '复制凭证' : 'Copy token',
    copied: isZh ? '已复制!' : 'Copied!',
    errorTitle: isZh ? '支付失败' : 'Payment Failed',
    retry: isZh ? '重试' : 'Try again',
    amountLabel: isZh ? '支付金额' : 'Amount',
  };

  // 生成 Founder Badge Token
  function generateBadgeToken(orderId: string): string {
    const prefix = planSlug === 'lifetime-founder' ? 'FOUNDER-LT' : 'PIONEER';
    return `${prefix}-${orderId}`;
  }

  // 创建 PayPal 按钮配置
  function createButtonConfig() {
    return {
      style: {
        layout: 'vertical' as const,
        color: 'blue' as const,
        shape: 'rect' as const,
        label: 'paypal' as const,
      },
      // 客户端创建订单 - 使用 SDK 内置的 actions.order.create()
      createOrder: async (_data: unknown, actions: PayPalActions): Promise<string> => {
        setStatus('loading');
        try {
          const orderId = await actions.order.create({
            purchase_units: [
              {
                reference_id: planSlug,
                description: PLAN_DESCRIPTIONS[planSlug] || planName,
                amount: {
                  value: amount.toFixed(2),
                  currency_code: 'USD',
                },
              },
            ],
            application_context: {
              brand_name: 'SynoChain AI',
              user_action: 'PAY_NOW',
              shipping_preference: 'NO_SHIPPING',
            },
          });
          return orderId;
        } catch (err) {
          console.error('[PayPalCheckout] createOrder error:', err);
          setStatus('error');
          setErrorMsg(err instanceof Error ? err.message : 'Failed to create order');
          throw err;
        }
      },
      // 客户端捕获支付 - 使用 SDK 内置的 actions.order.capture()
      onApprove: async (_data: { orderID: string }, actions: PayPalActions): Promise<void> => {
        try {
          const capture = await actions.order.capture();

          if (capture.status !== 'COMPLETED') {
            throw new Error(`Payment not completed. Status: ${capture.status}`);
          }

          const transactionId =
            capture.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
            capture.id;
          const payerEmail = capture.payer?.email_address || '';

          setResult({
            transactionId,
            orderId: _data.orderID,
            badgeToken: generateBadgeToken(_data.orderID),
            payerEmail,
          });
          setStatus('success');
        } catch (err) {
          console.error('[PayPalCheckout] onApprove error:', err);
          setStatus('error');
          setErrorMsg(err instanceof Error ? err.message : 'Failed to capture payment');
        }
      },
      onError: (err: unknown) => {
        console.error('[PayPalCheckout] Payment error:', err);
        setStatus('error');
        setErrorMsg(
          err instanceof Error ? err.message : 'Payment processing error'
        );
      },
    };
  }

  // 初始化：加载 PayPal SDK
  useEffect(() => {
    let cancelled = false;

    async function init() {
      // 没有 clientId，进入演示模式
      if (!clientId) {
        if (cancelled) return;
        setDemoMode(true);
        return;
      }

      try {
        const sdk = await loadPayPalScript(clientId);
        if (cancelled) return;

        if (sdk) {
          setSdkReady(true);
        } else {
          // SDK 加载失败，回退到演示模式
          setDemoMode(true);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[PayPalCheckout] Init failed:', err);
        setDemoMode(true);
      }
    }

    init();
    return () => {
      cancelled = true;
      if (buttonsInstance.current) {
        try {
          buttonsInstance.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, [clientId]);

  // 渲染 PayPal 按钮
  useEffect(() => {
    if (!sdkReady || !window.paypal || !buttonsContainerRef.current) return;
    if (buttonsRendered.current) return;

    const paypalSdk = window.paypal as unknown as PayPalSDK;

    try {
      const buttons = paypalSdk.Buttons(createButtonConfig());

      buttons.render(buttonsContainerRef.current).then(() => {
        buttonsRendered.current = true;
        buttonsInstance.current = buttons;
      }).catch((err) => {
        console.error('[PayPalCheckout] Render failed:', err);
        setDemoMode(true);
      });
    } catch (err) {
      console.error('[PayPalCheckout] Button setup failed:', err);
      setDemoMode(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady]);

  // 演示模式支付
  async function handleDemoPayment() {
    setStatus('loading');
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockOrderId = `DEMO-${Date.now()}`;
      const mockTransactionId = `DEMO-TXN-${Date.now()}`;

      setResult({
        transactionId: mockTransactionId,
        orderId: mockOrderId,
        badgeToken: generateBadgeToken(mockOrderId),
      });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Demo payment error');
    }
  }

  // 复制 Badge Token
  function handleCopyBadge() {
    if (!result?.badgeToken) return;
    navigator.clipboard.writeText(result.badgeToken).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // 重试
  function handleRetry() {
    setStatus('idle');
    setErrorMsg('');
    setResult(null);
    buttonsRendered.current = false;
    if (buttonsInstance.current) {
      try {
        buttonsInstance.current.close();
      } catch {
        // ignore
      }
      buttonsInstance.current = null;
    }
    if (sdkReady && buttonsContainerRef.current && window.paypal) {
      const paypalSdk = window.paypal as unknown as PayPalSDK;
      try {
        const buttons = paypalSdk.Buttons(createButtonConfig());
        buttons.render(buttonsContainerRef.current).then(() => {
          buttonsRendered.current = true;
          buttonsInstance.current = buttons;
        }).catch(() => {
          setDemoMode(true);
        });
      } catch {
        setDemoMode(true);
      }
    }
  }

  // ========== 渲染分支 ==========

  // 成功状态
  if (status === 'success' && result) {
    return (
      <div className="rounded-2xl border border-health-200 bg-gradient-to-br from-health-50 via-white to-medical-50 p-8 shadow-lg animate-fade-in">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse-soft rounded-full bg-health-400 blur-2xl opacity-60"></div>
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-health-500 to-medical-500 shadow-xl">
              <Award className="h-12 w-12 text-white" strokeWidth={2.5} />
            </div>
            <Sparkles className="absolute -right-2 -top-2 h-6 w-6 text-health-500 animate-pulse" />
            <Sparkles className="absolute -left-2 bottom-2 h-5 w-5 text-medical-500 animate-pulse" />
          </div>
        </div>

        <h3 className="mt-6 text-center font-display text-2xl font-extrabold text-ink-800">
          {text.successTitle}
        </h3>
        <p className="mt-2 text-center text-sm text-ink-600">
          {text.thankYou}
        </p>

        <div className="mt-6 rounded-xl border border-health-200 bg-white/80 p-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-500">{text.amountLabel}</span>
            <span className="font-display text-lg font-bold text-medical-600">
              ${amount.toFixed(2)} USD
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-ink-500">{isZh ? '方案' : 'Plan'}</span>
            <span className="text-sm font-semibold text-ink-800">{planName}</span>
          </div>
        </div>

        <div className="mt-4 space-y-2 rounded-xl bg-ink-50 p-4">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-ink-500">{text.transactionId}</span>
            <span className="font-mono font-semibold text-ink-800">
              {result.transactionId}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-ink-500">{text.orderId}</span>
            <span className="font-mono font-semibold text-ink-800">
              {result.orderId}
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-xl border-2 border-dashed border-health-300 bg-health-50/50 p-4">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 flex-shrink-0 text-health-600" />
            <span className="text-xs font-semibold text-health-700">
              {text.badgeToken}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-white px-2 py-1.5 font-mono text-xs text-ink-800">
              {result.badgeToken}
            </code>
            <button
              onClick={handleCopyBadge}
              className="inline-flex items-center gap-1 rounded-lg bg-health-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-health-600"
            >
              <Copy className="h-3 w-3" />
              {copied ? text.copied : text.copyBadge}
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-health-700">
          <CheckCircle2 className="h-4 w-4" />
          <span>
            {isZh
              ? '确认邮件将发送至您的邮箱，请查收 Founder 专属权益。'
              : 'A confirmation email will be sent to you with Founder benefits.'}
          </span>
        </div>
      </div>
    );
  }

  // 错误状态
  if (status === 'error') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-500" />
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold text-red-800">
              {text.errorTitle}
            </h3>
            <p className="mt-1 text-sm text-red-700">{errorMsg}</p>
            <button
              onClick={handleRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              {text.retry}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 加载中状态
  if (status === 'loading') {
    return (
      <div className="rounded-2xl border border-ink-100 bg-white p-8">
        <div className="flex flex-col items-center justify-center gap-3 py-6">
          <Loader2 className="h-8 w-8 animate-spin text-medical-500" />
          <p className="text-sm text-ink-500">{text.processing}</p>
        </div>
      </div>
    );
  }

  // 默认状态
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
      {/* 金额摘要 */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-medical-50 to-health-50 p-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-400">
            {planName}
          </div>
          <div className="mt-1 font-display text-2xl font-extrabold text-ink-800">
            ${amount.toFixed(2)} <span className="text-sm font-normal text-ink-400">USD</span>
          </div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
            <path
              d="M7.5 6.5h6.2c2.3 0 3.8 1.2 3.8 3.3 0 2.2-1.6 3.4-4 3.4H9.8l-.6 3.5H6.5l1-10.2z"
              fill="#003087"
            />
            <path
              d="M9.2 9.2l-.4 4.1h2.6c1.7 0 2.9-.9 2.9-2.5 0-1.4-1-2-2.5-2H9.2z"
              fill="#009CDE"
            />
          </svg>
        </div>
      </div>

      {/* PayPal 按钮容器 或 演示模式 */}
      {demoMode ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs text-amber-700">{text.demoPayDesc}</p>
          </div>
          <button
            onClick={handleDemoPayment}
            className="w-full rounded-xl bg-[#0070ba] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#005ea6]"
          >
            {text.demoPayButton}
          </button>
        </div>
      ) : !sdkReady ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <Loader2 className="h-6 w-6 animate-spin text-medical-500" />
          <p className="text-xs text-ink-400">{text.loadingSdk}</p>
        </div>
      ) : (
        <div ref={buttonsContainerRef} className="paypal-buttons-container" />
      )}

      <p className="mt-4 text-center text-xs text-ink-400">{text.secure}</p>
    </div>
  );
}
