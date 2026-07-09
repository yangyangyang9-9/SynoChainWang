import { useState, useEffect } from 'react';
import PayPalCheckout from './PayPalCheckout';

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  benefits: string[];
  duration: string;
}

export interface CheckoutFlowProps {
  plans: Plan[];
  paypalClientId: string;
  lang?: string;
}

export default function CheckoutFlow({
  plans,
  paypalClientId,
  lang = 'en',
}: CheckoutFlowProps) {
  const [selectedSlug, setSelectedSlug] = useState<string>('');

  // 客户端读取 URL 参数
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get('plan') || '';
    if (planParam && plans.some((p) => p.slug === planParam)) {
      setSelectedSlug(planParam);
    }

    // 监听 URL 变化（浏览器前进/后退）
    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search).get('plan') || '';
      setSelectedSlug(p && plans.some((x) => x.slug === p) ? p : '');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [plans]);

  // 选择方案：更新 state 和 URL
  function handleSelectPlan(slug: string) {
    setSelectedSlug(slug);
    const url = new URL(window.location.href);
    url.searchParams.set('plan', slug);
    url.hash = 'checkout';
    window.history.pushState({}, '', url.toString());

    // 滚动到结账区域
    const checkoutEl = document.getElementById('checkout');
    if (checkoutEl) {
      checkoutEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  const selectedPlan = plans.find((p) => p.slug === selectedSlug) || null;

  return (
    <div>
      {/* 方案选择卡片 */}
      <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
        {plans.map((plan) => {
          const isSelected = plan.slug === selectedSlug;
          const cardClass = isSelected
            ? 'border-medical-500 ring-2 ring-medical-200 bg-white shadow-lg cursor-pointer'
            : 'border-ink-100 bg-white shadow-sm hover:border-medical-200 hover:shadow-md cursor-pointer';
          const durationLabel = plan.duration === 'lifetime' ? 'one-time' : '/year';
          return (
            <div
              key={plan.id}
              onClick={() => handleSelectPlan(plan.slug)}
              className={`relative block rounded-2xl border p-6 transition-all ${cardClass}`}
            >
              {isSelected && (
                <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-medical-500 text-white">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
              )}
              <h3 className="font-display text-xl font-bold text-ink-800">{plan.name}</h3>
              <div className="mt-3 flex items-end gap-1">
                <span className="font-display text-3xl font-extrabold text-ink-800">
                  ${plan.price.toFixed(2)}
                </span>
                <span className="mb-1 text-xs text-ink-400">{durationLabel}</span>
              </div>
              <p className="mt-3 text-xs text-ink-500">{plan.benefits[0]}</p>
            </div>
          );
        })}
      </div>

      {/* PayPal 结账组件 */}
      {selectedPlan ? (
        <div className="mx-auto mt-10 max-w-md">
          <PayPalCheckout
            planSlug={selectedPlan.slug as 'ai-pioneer' | 'lifetime-founder'}
            amount={selectedPlan.price}
            planName={selectedPlan.name}
            lang={lang}
            clientId={paypalClientId}
          />
        </div>
      ) : (
        <p className="mt-10 text-center text-sm text-ink-400">
          {lang === 'zh'
            ? '👆 选择上方方案以继续支付'
            : '👆 Select a plan above to continue to payment'}
        </p>
      )}
    </div>
  );
}
