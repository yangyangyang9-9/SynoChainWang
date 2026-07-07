import { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Award, Copy, Sparkles } from 'lucide-react';

// PayPal SDK 类型定义（最小化，仅覆盖本组件使用的部分）
interface PayPalSDK {
  Buttons: {
    Driver: new (opts: {
      fundingSource?: string;
      style?: {
        layout?: 'vertical' | 'horizontal';
        color?: 'gold' | 'blue' | 'silver' | 'white' | 'black';
        shape?: 'rect' | 'pill';
        label?: 'paypal' | 'pay' | 'checkout' | 'buynow';
      };
      createOrder: () => Promise<string>;
      onApprove: (data: { orderID: string }) => Promise<void>;
      onError: (err: unknown) => void;
    }) => { render: (el: HTMLElement) => Promise<void> };
  };
}

// 组件 Props
export interface PayPalCheckoutProps {
  planSlug: 'ai-pioneer' | 'lifetime-founder';
  amount: number;
  planName: string;
  lang?: string;
}

// 支付状态
type PaymentStatus = 'idle' | 'loading' | 'success' | 'error';

// 支付成功后的结果
interface PaymentResult {
  transactionId: string;
  orderId: string;
  badgeToken: string;
}

// 动态注入 PayPal JS SDK 脚本
function loadPayPalScript(clientId: string): Promise<PayPalSDK | null> {
  return new Promise((resolve) => {
    // 已存在则直接使用
    if (window.paypal) {
      resolve(window.paypal as unknown as PayPalSDK);
      return;
    }

    // 已存在相同脚本则等待
    const existing = document.getElementById('paypal-sdk-script');
    if (existing) {
      existing.addEventListener('load', () => {
        resolve(window.paypal ? (window.paypal as unknown as PayPalSDK) : null);
      });
      return;
    }

    const script = document.createElement('script');
    script.id = 'paypal-sdk-script';
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
    script.async = true;
    script.onload = () => {
      resolve(window.paypal ? (window.paypal as unknown as PayPalSDK) : null);
    };
    script.onerror = () => {
      console.error('[PayPalCheckout] 加载 PayPal SDK 失败');
      resolve(null);
    };
    document.head.appendChild(script);
  });
}

export default function PayPalCheckout({
  planSlug,
  amount,
  planName,
  lang = 'en',
}: PayPalCheckoutProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [copied, setCopied] = useState(false);
  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  const buttonsRendered = useRef(false);

  // 文案（根据语言切换）
  const isZh = lang === 'zh';
  const text = {
    loadingSdk: isZh ? '正在加载支付系统...' : 'Loading payment system...',
    payButton: isZh ? '使用 PayPal 支付' : 'Pay with PayPal',
    secure: isZh ? '🔒 安全支付 · 由 PayPal 保护' : '🔒 Secure payment powered by PayPal',
    processing: isZh ? '正在处理支付...' : 'Processing payment...',
    successTitle: isZh ? '🎉 支付成功！' : '🎉 Payment Successful!',
    thankYou: isZh
      ? '感谢您成为 SynoChain AI 创始会员！'
      : 'Thank you for becoming a SynoChain AI Founder!',
    transactionId: isZh ? '交易号' : 'Transaction ID',
    orderId: isZh ? '订单号' : 'Order ID',
    badgeToken: isZh ? 'Founder Badge 凭证' : 'Founder Badge Token',
    copyBadge: isZh ? '复制凭证' : 'Copy token',
    copied: isZh ? '已复制!' : 'Copied!',
    errorTitle: isZh ? '支付失败' : 'Payment Failed',
    retry: isZh ? '重试' : 'Try again',
    sdkError: isZh
      ? '无法加载 PayPal 支付系统，请检查网络后刷新页面。'
      : 'Failed to load PayPal SDK. Please check your network and refresh.',
    amountLabel: isZh ? '支付金额' : 'Amount',
  };

  // 初始化：获取 client token 并加载 SDK
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // 从后端获取 clientId
        const res = await fetch('/api/paypal?action=token');
        const data = await res.json();

        if (!data.success || !data.clientId) {
          throw new Error('No clientId returned');
        }

        // 未配置 PayPal 时，后端返回 mock，前端仍尝试加载（会失败但可演示）
        const sdk = await loadPayPalScript(data.clientId);
        if (cancelled) return;

        if (sdk) {
          setSdkReady(true);
        } else {
          setStatus('error');
          setErrorMsg(text.sdkError);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[PayPalCheckout] 初始化失败:', err);
        setStatus('error');
        setErrorMsg(text.sdkError);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 渲染 PayPal 按钮
  useEffect(() => {
    if (!sdkReady || !window.paypal || !buttonsContainerRef.current) return;
    if (buttonsRendered.current) return;

    const paypalSdk = window.paypal as unknown as PayPalSDK;

    try {
      const buttons = new paypalSdk.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal',
        },
        // 创建订单：调用我们的后端 API（后端再调用 PayPal）
        createOrder: async () => {
          setStatus('loading');
          const res = await fetch('/api/paypal?action=create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planSlug, amount }),
          });
          const data = await res.json();
          if (!data.success) {
            throw new Error(data.error || 'Failed to create order');
          }
          // 返回 PayPal 订单 ID
          return data.orderId;
        },
        // 用户批准后：捕获支付
        onApprove: async (approvalData) => {
          const res = await fetch('/api/paypal?action=capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: approvalData.orderID,
              planSlug,
              email: '', // 邮箱可选，可后续收集
            }),
          });
          const data = await res.json();
          if (!data.success) {
            throw new Error(data.error || 'Failed to capture payment');
          }
          setResult({
            transactionId: data.transactionId,
            orderId: data.orderId,
            badgeToken: data.badgeToken,
          });
          setStatus('success');
        },
        onError: (err) => {
          console.error('[PayPalCheckout] 支付错误:', err);
          setStatus('error');
          setErrorMsg(
            err instanceof Error ? err.message : 'Payment processing error'
          );
        },
      });

      buttons.render(buttonsContainerRef.current);
      buttonsRendered.current = true;
    } catch (err) {
      console.error('[PayPalCheckout] 渲染按钮失败:', err);
      setStatus('error');
      setErrorMsg(text.sdkError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady]);

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
    // 重新触发渲染
    if (sdkReady && buttonsContainerRef.current) {
      const paypalSdk = window.paypal as unknown as PayPalSDK;
      const buttons = new paypalSdk.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal',
        },
        createOrder: async () => {
          setStatus('loading');
          const res = await fetch('/api/paypal?action=create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planSlug, amount }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error);
          return data.orderId;
        },
        onApprove: async (approvalData) => {
          const res = await fetch('/api/paypal?action=capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: approvalData.orderID,
              planSlug,
              email: '',
            }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error);
          setResult({
            transactionId: data.transactionId,
            orderId: data.orderId,
            badgeToken: data.badgeToken,
          });
          setStatus('success');
        },
        onError: (err) => {
          console.error('[PayPalCheckout] 支付错误:', err);
          setStatus('error');
          setErrorMsg(
            err instanceof Error ? err.message : 'Payment processing error'
          );
        },
      });
      buttons.render(buttonsContainerRef.current);
      buttonsRendered.current = true;
    }
  }

  // ========== 渲染分支 ==========

  // 成功状态：感谢页面 + Founder Badge 动画
  if (status === 'success' && result) {
    return (
      <div className="rounded-2xl border border-health-200 bg-gradient-to-br from-health-50 via-white to-medical-50 p-8 shadow-lg animate-fade-in">
        {/* Founder Badge 动画 */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse-soft rounded-full bg-health-400 blur-2xl opacity-60"></div>
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-health-500 to-medical-500 shadow-xl">
              <Award className="h-12 w-12 text-white" strokeWidth={2.5} />
            </div>
            {/* 闪光装饰 */}
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

        {/* 方案信息 */}
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

        {/* 订单详情 */}
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

        {/* Badge Token */}
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

        {/* 成功提示 */}
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

  // 默认状态：渲染 PayPal 按钮
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

      {/* PayPal 按钮容器 */}
      {!sdkReady ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <Loader2 className="h-6 w-6 animate-spin text-medical-500" />
          <p className="text-xs text-ink-400">{text.loadingSdk}</p>
        </div>
      ) : (
        <div ref={buttonsContainerRef} className="paypal-buttons-container" />
      )}

      {/* 安全提示 */}
      <p className="mt-4 text-center text-xs text-ink-400">{text.secure}</p>
    </div>
  );
}
