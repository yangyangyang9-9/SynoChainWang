import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// 众筹统计类型
export interface CrowdfundingStats {
  total_raised: number;
  supporter_count: number;
  goal: number;
  days_remaining: number;
}

// 众筹方案类型
export interface CrowdfundingPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  benefits: string[];
  duration: string;
}

// 资金用途类型
export interface FundAllocation {
  id: string;
  name: string;
  percentage: number;
  description: string;
  usage: string[];
  icon: string;
  sort_order: number;
}

// 默认数据（Supabase 未配置时使用）
export const defaultStats: CrowdfundingStats = {
  total_raised: 128532,
  supporter_count: 2438,
  goal: 200000,
  days_remaining: 67,
};

export const defaultPlans: CrowdfundingPlan[] = [
  {
    id: '1',
    name: 'AI Pioneer',
    slug: 'ai-pioneer',
    price: 29,
    benefits: [
      'AI Health Assistant 免费使用1年',
      '手机App优先体验',
      'Beta测试资格',
      'Founder Badge',
      '项目更新邮件',
    ],
    duration: '1 year',
  },
  {
    id: '2',
    name: 'Lifetime Founder',
    slug: 'lifetime-founder',
    price: 199,
    benefits: [
      'AI Health Assistant 永久使用',
      '所有未来基础功能免费',
      'Founder NFT / 数字证书',
      '新功能优先体验',
      '社区投票权',
    ],
    duration: 'lifetime',
  },
];

export const defaultFundAllocation: FundAllocation[] = [
  {
    id: '1',
    name: 'Servers',
    percentage: 35,
    description: 'AI computing infrastructure',
    usage: ['GPU服务器', 'AI推理', '数据处理'],
    icon: 'server',
    sort_order: 1,
  },
  {
    id: '2',
    name: 'AI Training',
    percentage: 35,
    description: 'Medical AI knowledge system',
    usage: ['疾病数据库', '医学文献整理', '多语言模型优化'],
    icon: 'cpu',
    sort_order: 2,
  },
  {
    id: '3',
    name: 'App Development',
    percentage: 20,
    description: 'iOS / Android Apps',
    usage: ['iOS App', 'Android App', '跨平台适配'],
    icon: 'smartphone',
    sort_order: 3,
  },
  {
    id: '4',
    name: 'Operations',
    percentage: 10,
    description: 'Security & maintenance',
    usage: ['安全维护', '服务器监控', '客服支持'],
    icon: 'shield',
    sort_order:  4,
  },
];

// 获取众筹统计
export async function getCrowdfundingStats(): Promise<CrowdfundingStats> {
  if (!supabase) return defaultStats;
  try {
    const { data, error } = await supabase
      .from('crowdfunding_stats')
      .select('*')
      .eq('id', 1)
      .single();
    if (error || !data) return defaultStats;
    return data as CrowdfundingStats;
  } catch {
    return defaultStats;
  }
}

// 获取众筹方案
export async function getCrowdfundingPlans(): Promise<CrowdfundingPlan[]> {
  if (!supabase) return defaultPlans;
  try {
    const { data, error } = await supabase
      .from('crowdfunding_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error || !data) return defaultPlans;
    return data as CrowdfundingPlan[];
  } catch {
    return defaultPlans;
  }
}

// 获取资金用途
export async function getFundAllocation(): Promise<FundAllocation[]> {
  if (!supabase) return defaultFundAllocation;
  try {
    const { data, error } = await supabase
      .from('fund_allocation')
      .select('*')
      .order('sort_order');
    if (error || !data) return defaultFundAllocation;
    return data as FundAllocation[];
  } catch {
    return defaultFundAllocation;
  }
}
