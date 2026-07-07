-- ============================================================
-- SynoChain AI 数据库 Schema
-- Phase 1: 完整数据库结构
-- 包含：用户、疾病库、关键词、AI提示词、生成内容、SEO页面、众筹
-- ============================================================

-- ========== 用户系统 ==========
-- 用户资料表（扩展 Supabase auth.users）
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    preferred_language TEXT DEFAULT 'en',
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== 众筹系统 ==========
-- 众筹方案表
CREATE TABLE IF NOT EXISTS public.crowdfunding_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    benefits JSONB NOT NULL DEFAULT '[]',
    duration TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Founder 会员表
CREATE TABLE IF NOT EXISTS public.founder_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.crowdfunding_plans(id),
    tier TEXT NOT NULL CHECK (tier IN ('ai-pioneer', 'lifetime-founder')),
    badge_token TEXT UNIQUE,
    nft_token_id TEXT,
    payment_amount NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 众筹进度表
CREATE TABLE IF NOT EXISTS public.crowdfunding_stats (
    id INTEGER PRIMARY KEY DEFAULT 1,
    total_raised NUMERIC(12,2) DEFAULT 0,
    supporter_count INTEGER DEFAULT 0,
    goal NUMERIC(12,2) DEFAULT 200000,
    days_remaining INTEGER DEFAULT 67,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== 疾病库系统 ==========
-- 疾病表
CREATE TABLE IF NOT EXISTS public.diseases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    overview TEXT,
    causes TEXT,
    symptoms TEXT,
    treatments TEXT,
    prevention TEXT,
    translations JSONB DEFAULT '{}',
    category TEXT,
    is_common BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 症状表
CREATE TABLE IF NOT EXISTS public.symptoms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disease_id UUID REFERENCES public.diseases(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    severity TEXT,
    translations JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 病因表
CREATE TABLE IF NOT EXISTS public.causes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disease_id UUID REFERENCES public.diseases(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    translations JSONB DEFAULT '{}'
);

-- 治疗方案表
CREATE TABLE IF NOT EXISTS public.treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disease_id UUID REFERENCES public.diseases(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    treatment_type TEXT,
    translations JSONB DEFAULT '{}'
);

-- ========== AI 内容生成系统 ==========
-- 关键词表（AI内容生成的输入源）
CREATE TABLE IF NOT EXISTS public.keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('disease', 'symptom', 'question')),
    search_volume INTEGER DEFAULT 0,
    difficulty NUMERIC(3,1) DEFAULT 0,
    language TEXT DEFAULT 'en',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI 提示词模板表
CREATE TABLE IF NOT EXISTS public.ai_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('disease', 'symptom', 'question', 'faq')),
    template TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 生成内容表（AI生成的文章）
CREATE TABLE IF NOT EXISTS public.generated_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword_id UUID REFERENCES public.keywords(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    slug TEXT UNIQUE,
    title TEXT NOT NULL,
    meta_description TEXT,
    summary TEXT,
    content TEXT NOT NULL,
    faq JSONB DEFAULT '[]',
    language TEXT DEFAULT 'en',
    ai_model TEXT DEFAULT 'gpt-4',
    token_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEO 页面表（自动生成的静态页面索引）
CREATE TABLE IF NOT EXISTS public.seo_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES public.generated_contents(id) ON DELETE CASCADE,
    page_type TEXT NOT NULL CHECK (page_type IN ('disease', 'symptom', 'question')),
    slug TEXT UNIQUE NOT NULL,
    locale TEXT DEFAULT 'en',
    seo_title TEXT NOT NULL,
    meta_description TEXT,
    schema_data JSONB DEFAULT '{}',
    is_published BOOLEAN DEFAULT false,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== AI 健康助手系统 ==========
-- AI 对话表
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI 消息表
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI 健康检测记录
CREATE TABLE IF NOT EXISTS public.health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    age INTEGER,
    gender TEXT,
    symptoms TEXT,
    duration TEXT,
    lifestyle TEXT,
    possible_factors JSONB DEFAULT '[]',
    related_conditions JSONB DEFAULT '[]',
    next_steps JSONB DEFAULT '[]',
    warning_signs JSONB DEFAULT '[]',
    disclaimer TEXT,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== 博客与社区 ==========
-- 博客文章表
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    translations JSONB DEFAULT '{}',
    category TEXT,
    cover_image TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 社区帖子表
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    upvotes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== 资金用途表 ==========
CREATE TABLE IF NOT EXISTS public.fund_allocation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    description TEXT,
    usage JSONB DEFAULT '[]',
    icon TEXT,
    sort_order INTEGER DEFAULT 0
);

-- ============================================================
-- 初始数据
-- ============================================================

-- 众筹方案初始数据
INSERT INTO public.crowdfunding_plans (name, slug, price, benefits, duration, sort_order) VALUES
('AI Pioneer', 'ai-pioneer', 29.00,
 '["AI Health Assistant 免费使用1年","手机App优先体验","Beta测试资格","Founder Badge","项目更新邮件"]'::jsonb,
 '1 year', 1),
('Lifetime Founder', 'lifetime-founder', 199.00,
 '["AI Health Assistant 永久使用","所有未来基础功能免费","Founder NFT / 数字证书","新功能优先体验","社区投票权"]'::jsonb,
 'lifetime', 2)
ON CONFLICT (slug) DO NOTHING;

-- 众筹进度初始数据
INSERT INTO public.crowdfunding_stats (id, total_raised, supporter_count, goal, days_remaining)
VALUES (1, 128532, 2438, 200000, 67)
ON CONFLICT (id) DO NOTHING;

-- 资金用途初始数据
INSERT INTO public.fund_allocation (name, percentage, description, usage, icon, sort_order) VALUES
('服务器', 35.00, 'AI computing infrastructure',
 '["GPU服务器","AI推理","数据处理"]'::jsonb, 'server', 1),
('AI训练', 35.00, 'Medical AI knowledge system',
 '["疾病数据库","医学文献整理","多语言模型优化"]'::jsonb, 'cpu', 2),
('App开发', 20.00, 'iOS / Android Apps',
 '["iOS App","Android App","跨平台适配"]'::jsonb, 'smartphone', 3),
('运营', 10.00, 'Security & maintenance',
 '["安全维护","服务器监控","客服支持"]'::jsonb, 'shield', 4)
ON CONFLICT DO NOTHING;

-- 关键词初始数据
INSERT INTO public.keywords (keyword, type, search_volume, language, status) VALUES
('sinusitis', 'disease', 165000, 'en', 'pending'),
('eczema', 'disease', 110000, 'en', 'pending'),
('insomnia', 'disease', 246000, 'en', 'pending'),
('migraine', 'disease', 201000, 'en', 'pending'),
('anxiety', 'disease', 450000, 'en', 'pending'),
('diabetes', 'disease', 673000, 'en', 'pending'),
('nose blocked', 'symptom', 90500, 'en', 'pending'),
('headache', 'symptom', 201000, 'en', 'pending'),
('fatigue', 'symptom', 165000, 'en', 'pending'),
('sore throat', 'symptom', 165000, 'en', 'pending')
ON CONFLICT DO NOTHING;

-- AI 提示词模板初始数据
INSERT INTO public.ai_prompts (name, type, template, variables, is_active) VALUES
('disease_article', 'disease',
 'You are a medical content writer. Generate a comprehensive SEO article about the disease "{{keyword}}". Include: 1) Overview 2) Causes 3) Symptoms 4) Treatment options 5) Prevention. Use clear, accessible language. Add medical disclaimer.',
 '["keyword"]'::jsonb, true),
('symptom_article', 'symptom',
 'You are a medical content writer. Generate a detailed article about the symptom "{{keyword}}". Include: 1) What it feels like 2) Possible causes 3) Related conditions 4) When to see a doctor 5) Self-care tips. Add medical disclaimer.',
 '["keyword"]'::jsonb, true),
('faq_article', 'question',
 'You are a medical content writer. Generate FAQs about "{{keyword}}". Create 8-10 common questions with detailed answers. Add medical disclaimer.',
 '["keyword"]'::jsonb, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 行级安全策略
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- 公共可读策略（SEO 内容）
CREATE POLICY "Public can read diseases" ON public.diseases FOR SELECT USING (true);
CREATE POLICY "Public can read symptoms" ON public.symptoms FOR SELECT USING (true);
CREATE POLICY "Public can read causes" ON public.causes FOR SELECT USING (true);
CREATE POLICY "Public can read treatments" ON public.treatments FOR SELECT USING (true);
CREATE POLICY "Public can read crowdfunding_plans" ON public.crowdfunding_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read crowdfunding_stats" ON public.crowdfunding_stats FOR SELECT USING (true);
CREATE POLICY "Public can read fund_allocation" ON public.fund_allocation FOR SELECT USING (true);
CREATE POLICY "Public can read generated_contents" ON public.generated_contents FOR SELECT USING (status = 'published');
CREATE POLICY "Public can read seo_pages" ON public.seo_pages FOR SELECT USING (is_published = true);
CREATE POLICY "Public can read blog_posts" ON public.blog_posts FOR SELECT USING (published_at IS NOT NULL);
CREATE POLICY "Public can read keywords" ON public.keywords FOR SELECT USING (true);
CREATE POLICY "Public can read ai_prompts" ON public.ai_prompts FOR SELECT USING (is_active = true);

-- 用户私有策略
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can read own memberships" ON public.founder_memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read own conversations" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own messages" ON public.ai_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own messages" ON public.ai_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = conversation_id AND user_id = auth.uid())
);

-- ============================================================
-- 索引
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_diseases_slug ON public.diseases(slug);
CREATE INDEX IF NOT EXISTS idx_symptoms_slug ON public.symptoms(slug);
CREATE INDEX IF NOT EXISTS idx_symptoms_disease ON public.symptoms(disease_id);
CREATE INDEX IF NOT EXISTS idx_keywords_status ON public.keywords(status);
CREATE INDEX IF NOT EXISTS idx_generated_contents_slug ON public.generated_contents(slug);
CREATE INDEX IF NOT EXISTS idx_seo_pages_slug ON public.seo_pages(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
