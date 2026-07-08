-- ============================================================
-- SynoChain AI 数据库 Schema
-- Phase 1: 完整数据库结构
-- 包含：用户、疾病库、症状库、病因库、身体部位、检查项目、药物、营养、心理、FAQ、指南
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
-- 疾病表（600+）
CREATE TABLE IF NOT EXISTS public.diseases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    meta_description TEXT,
    overview TEXT,
    common_symptoms JSONB DEFAULT '[]',
    possible_causes JSONB DEFAULT '[]',
    risk_factors JSONB DEFAULT '[]',
    diagnosis TEXT,
    lifestyle_tips JSONB DEFAULT '[]',
    when_to_seek_care TEXT,
    prevention TEXT,
    category TEXT,
    is_common BOOLEAN DEFAULT false,
    severity TEXT,
    prevalence TEXT,
    age_group TEXT,
    gender TEXT,
    related_conditions JSONB DEFAULT '[]',
    related_symptoms JSONB DEFAULT '[]',
    related_questions JSONB DEFAULT '[]',
    related_tools JSONB DEFAULT '[]',
    translations JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 症状表（800+）
CREATE TABLE IF NOT EXISTS public.symptoms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    meta_description TEXT,
    description TEXT,
    what_it_feels_like TEXT,
    possible_causes JSONB DEFAULT '[]',
    related_conditions JSONB DEFAULT '[]',
    when_to_see_doctor TEXT,
    self_care_tips JSONB DEFAULT '[]',
    severity TEXT,
    duration TEXT,
    body_part TEXT,
    related_symptoms JSONB DEFAULT '[]',
    related_questions JSONB DEFAULT '[]',
    related_tools JSONB DEFAULT '[]',
    translations JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 病因表（300+）
CREATE TABLE IF NOT EXISTS public.causes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    meta_description TEXT,
    description TEXT,
    category TEXT,
    risk_level TEXT,
    related_conditions JSONB DEFAULT '[]',
    related_symptoms JSONB DEFAULT '[]',
    related_questions JSONB DEFAULT '[]',
    translations JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 身体部位表（250+）
CREATE TABLE IF NOT EXISTS public.body_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    meta_description TEXT,
    description TEXT,
    anatomy TEXT,
    common_conditions JSONB DEFAULT '[]',
    common_symptoms JSONB DEFAULT '[]',
    related_tests JSONB DEFAULT '[]',
    category TEXT,
    translations JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 检查项目表（300+）
CREATE TABLE IF NOT EXISTS public.lab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    meta_description TEXT,
    description TEXT,
    purpose TEXT,
    procedure TEXT,
    preparation TEXT,
    normal_values TEXT,
    abnormal_results TEXT,
    cost_range TEXT,
    category TEXT,
    related_conditions JSONB DEFAULT '[]',
    related_symptoms JSONB DEFAULT '[]',
    translations JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 药物介绍表（500+）
CREATE TABLE IF NOT EXISTS public.medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    generic_name TEXT,
    meta_description TEXT,
    description TEXT,
    uses JSONB DEFAULT '[]',
    dosage TEXT,
    side_effects JSONB DEFAULT '[]',
    precautions TEXT,
    interactions TEXT,
    category TEXT,
    availability TEXT,
    related_conditions JSONB DEFAULT '[]',
    translations JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== 营养与健康指南 ==========
-- 营养项目表（600+）
CREATE TABLE IF NOT EXISTS public.nutrition_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    meta_description TEXT,
    description TEXT,
    type TEXT,
    benefits JSONB DEFAULT '[]',
    food_sources JSONB DEFAULT '[]',
    recommended_intake TEXT,
    deficiency_symptoms JSONB DEFAULT '[]',
    toxicity TEXT,
    interactions TEXT,
    related_conditions JSONB DEFAULT '[]',
    related_questions JSONB DEFAULT '[]',
    translations JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 维生素表（13种）
CREATE TABLE IF NOT EXISTS public.vitamins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    meta_description TEXT,
    description TEXT,
    chemical_name TEXT,
    benefits JSONB DEFAULT '[]',
    food_sources JSONB DEFAULT '[]',
    recommended_daily_intake TEXT,
    deficiency_symptoms JSONB DEFAULT '[]',
    toxicity TEXT,
    groups TEXT[],
    related_conditions JSONB DEFAULT '[]',
    translations JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 健康指南表（900+）
CREATE TABLE IF NOT EXISTS public.health_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    meta_description TEXT,
    description TEXT,
    introduction TEXT,
    sections JSONB DEFAULT '[]',
    key_takeaways JSONB DEFAULT '[]',
    category TEXT,
    audience TEXT,
    difficulty TEXT,
    reading_time INTEGER,
    related_conditions JSONB DEFAULT '[]',
    related_symptoms JSONB DEFAULT '[]',
    related_questions JSONB DEFAULT '[]',
    related_tools JSONB DEFAULT '[]',
    translations JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== 特定人群健康 ==========
-- 心理健康表（200+）
CREATE TABLE IF NOT EXISTS public.mental_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    meta_description TEXT,
    description TEXT,
    types TEXT[],
    symptoms JSONB DEFAULT '[]',
    causes TEXT,
    treatments JSONB DEFAULT '[]',
    coping_strategies JSONB DEFAULT '[]',
    category TEXT,
    related_conditions JSONB DEFAULT '[]',
    related_questions JSONB DEFAULT '[]',
    related_tools JSONB DEFAULT '[]',
    translations JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 女性健康表
CREATE TABLE IF NOT EXISTS public.womens_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    meta_description TEXT,
    description TEXT,
    age_group TEXT,
    topics JSONB DEFAULT '[]',
    related_conditions JSONB DEFAULT '[]',
    related_questions JSONB DEFAULT '[]',
    related_tools JSONB DEFAULT '[]',
    translations JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 男性健康表
CREATE TABLE IF NOT EXISTS public.mens_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    meta_description TEXT,
    description TEXT,
    age_group TEXT,
    topics JSONB DEFAULT '[]',
    related_conditions JSONB DEFAULT '[]',
    related_questions JSONB DEFAULT '[]',
    related_tools JSONB DEFAULT '[]',
    translations JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 儿童健康表
CREATE TABLE IF NOT EXISTS public.childrens_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    meta_description TEXT,
    description TEXT,
    age_range TEXT,
    topics JSONB DEFAULT '[]',
    development_milestones JSONB DEFAULT '[]',
    related_conditions JSONB DEFAULT '[]',
    related_questions JSONB DEFAULT '[]',
    related_tools JSONB DEFAULT '[]',
    translations JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 老年健康表
CREATE TABLE IF NOT EXISTS public.seniors_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    meta_description TEXT,
    description TEXT,
    age_group TEXT,
    topics JSONB DEFAULT '[]',
    common_concerns JSONB DEFAULT '[]',
    related_conditions JSONB DEFAULT '[]',
    related_questions JSONB DEFAULT '[]',
    related_tools JSONB DEFAULT '[]',
    translations JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 孕期健康表
CREATE TABLE IF NOT EXISTS public.pregnancy_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    meta_description TEXT,
    description TEXT,
    trimester TEXT,
    topics JSONB DEFAULT '[]',
    warning_signs JSONB DEFAULT '[]',
    related_conditions JSONB DEFAULT '[]',
    related_questions JSONB DEFAULT '[]',
    related_tools JSONB DEFAULT '[]',
    translations JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== FAQ 问答集群（1500+）==========
CREATE TABLE IF NOT EXISTS public.faq_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    question TEXT NOT NULL,
    meta_description TEXT,
    answer TEXT NOT NULL,
    category TEXT,
    related_conditions JSONB DEFAULT '[]',
    related_symptoms JSONB DEFAULT '[]',
    related_questions JSONB DEFAULT '[]',
    related_tools JSONB DEFAULT '[]',
    difficulty TEXT,
    is_common BOOLEAN DEFAULT false,
    search_volume INTEGER DEFAULT 0,
    translations JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== AI 内容生成系统 ==========
-- 关键词表（AI内容生成的输入源）
CREATE TABLE IF NOT EXISTS public.keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('disease', 'symptom', 'cause', 'body_part', 'lab_test', 'medicine', 'nutrition', 'vitamin', 'health_guide', 'mental_health', 'faq', 'womens_health', 'mens_health', 'childrens_health', 'seniors_health', 'pregnancy')),
    search_volume INTEGER DEFAULT 0,
    difficulty NUMERIC(3,1) DEFAULT 0,
    language TEXT DEFAULT 'en',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI 提示词模板表（扩展到多种类型）
CREATE TABLE IF NOT EXISTS public.ai_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('disease', 'symptom', 'cause', 'body_part', 'lab_test', 'medicine', 'nutrition', 'vitamin', 'health_guide', 'mental_health', 'faq', 'womens_health', 'mens_health', 'childrens_health', 'seniors_health', 'pregnancy')),
    template TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    json_schema TEXT,
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
    page_type TEXT NOT NULL CHECK (page_type IN ('disease', 'symptom', 'cause', 'body_part', 'lab_test', 'medicine', 'nutrition', 'vitamin', 'health_guide', 'mental_health', 'faq', 'womens_health', 'mens_health', 'childrens_health', 'seniors_health', 'pregnancy', 'blog')),
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

-- AI 工具表（100+）
CREATE TABLE IF NOT EXISTS public.ai_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    meta_description TEXT,
    description TEXT,
    type TEXT,
    inputs JSONB DEFAULT '[]',
    outputs JSONB DEFAULT '[]',
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    related_conditions JSONB DEFAULT '[]',
    related_symptoms JSONB DEFAULT '[]',
    related_questions JSONB DEFAULT '[]',
    translations JSONB DEFAULT '{}',
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
    category TEXT,
    tags TEXT[],
    cover_image TEXT,
    reading_time INTEGER,
    related_conditions JSONB DEFAULT '[]',
    related_symptoms JSONB DEFAULT '[]',
    related_questions JSONB DEFAULT '[]',
    translations JSONB DEFAULT '{}',
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
    tags TEXT[],
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

-- 关键词初始数据（扩展到多类型）
INSERT INTO public.keywords (keyword, type, search_volume, language, status) VALUES
('sinusitis', 'disease', 165000, 'en', 'pending'),
('eczema', 'disease', 110000, 'en', 'pending'),
('insomnia', 'disease', 246000, 'en', 'pending'),
('migraine', 'disease', 201000, 'en', 'pending'),
('anxiety', 'disease', 450000, 'en', 'pending'),
('diabetes', 'disease', 673000, 'en', 'pending'),
('hypertension', 'disease', 368000, 'en', 'pending'),
('asthma', 'disease', 190000, 'en', 'pending'),
('arthritis', 'disease', 181000, 'en', 'pending'),
('depression', 'disease', 409000, 'en', 'pending'),
('headache', 'symptom', 201000, 'en', 'pending'),
('fatigue', 'symptom', 165000, 'en', 'pending'),
('sore throat', 'symptom', 165000, 'en', 'pending'),
('nausea', 'symptom', 110000, 'en', 'pending'),
('dizziness', 'symptom', 90500, 'en', 'pending'),
('fever', 'symptom', 181000, 'en', 'pending'),
('cough', 'symptom', 246000, 'en', 'pending'),
('back pain', 'symptom', 135000, 'en', 'pending'),
('dehydration', 'cause', 82000, 'en', 'pending'),
('stress', 'cause', 549000, 'en', 'pending'),
('head', 'body_part', 100000, 'en', 'pending'),
('heart', 'body_part', 150000, 'en', 'pending'),
('blood test', 'lab_test', 135000, 'en', 'pending'),
('vitamin d', 'nutrition', 292000, 'en', 'pending'),
('sleep hygiene', 'health_guide', 45000, 'en', 'pending'),
('why am i tired', 'faq', 301000, 'en', 'pending'),
('why is my nose blocked', 'faq', 90500, 'en', 'pending'),
('why do i have headaches', 'faq', 152000, 'en', 'pending'),
('why am i bloated', 'faq', 82000, 'en', 'pending'),
('why can''t i sleep', 'faq', 181000, 'en', 'pending')
ON CONFLICT DO NOTHING;

-- AI 提示词模板初始数据（扩展到多种类型）
INSERT INTO public.ai_prompts (name, type, template, variables, json_schema, is_active) VALUES
('disease_prompt', 'disease',
 'You are a medical content writer. Generate a comprehensive SEO article about the disease "{{keyword}}". Output ONLY valid JSON with this exact structure: {"title": "...", "meta_description": "...", "overview": "...", "common_symptoms": ["..."], "possible_causes": ["..."], "risk_factors": ["..."], "diagnosis": "...", "lifestyle_tips": ["..."], "when_to_seek_care": "...", "prevention": "...", "faq": [{"question": "...", "answer": "..."}]}',
 '["keyword"]'::jsonb, '{"type":"object","properties":{"title":{"type":"string"},"meta_description":{"type":"string"},"overview":{"type":"string"},"common_symptoms":{"type":"array","items":{"type":"string"}},"possible_causes":{"type":"array","items":{"type":"string"}},"risk_factors":{"type":"array","items":{"type":"string"}},"diagnosis":{"type":"string"},"lifestyle_tips":{"type":"array","items":{"type":"string"}},"when_to_seek_care":{"type":"string"},"prevention":{"type":"string"},"faq":{"type":"array","items":{"type":"object","properties":{"question":{"type":"string"},"answer":{"type":"string"}}}}}', true),
('symptom_prompt', 'symptom',
 'You are a medical content writer. Generate a detailed article about the symptom "{{keyword}}". Output ONLY valid JSON with this exact structure: {"title": "...", "meta_description": "...", "description": "...", "what_it_feels_like": "...", "possible_causes": ["..."], "related_conditions": ["..."], "when_to_see_doctor": "...", "self_care_tips": ["..."], "faq": [{"question": "...", "answer": "..."}]}',
 '["keyword"]'::jsonb, '{"type":"object","properties":{"title":{"type":"string"},"meta_description":{"type":"string"},"description":{"type":"string"},"what_it_feels_like":{"type":"string"},"possible_causes":{"type":"array","items":{"type":"string"}},"related_conditions":{"type":"array","items":{"type":"string"}},"when_to_see_doctor":{"type":"string"},"self_care_tips":{"type":"array","items":{"type":"string"}},"faq":{"type":"array","items":{"type":"object","properties":{"question":{"type":"string"},"answer":{"type":"string"}}}}}', true),
('cause_prompt', 'cause',
 'You are a medical content writer. Generate an article about the cause "{{keyword}}". Output ONLY valid JSON with this exact structure: {"title": "...", "meta_description": "...", "description": "...", "category": "...", "risk_level": "...", "related_conditions": ["..."], "related_symptoms": ["..."], "faq": [{"question": "...", "answer": "..."}]}',
 '["keyword"]'::jsonb, '{"type":"object","properties":{"title":{"type":"string"},"meta_description":{"type":"string"},"description":{"type":"string"},"category":{"type":"string"},"risk_level":{"type":"string"},"related_conditions":{"type":"array","items":{"type":"string"}},"related_symptoms":{"type":"array","items":{"type":"string"}},"faq":{"type":"array","items":{"type":"object","properties":{"question":{"type":"string"},"answer":{"type":"string"}}}}}', true),
('body_part_prompt', 'body_part',
 'You are a medical content writer. Generate an article about the body part "{{keyword}}". Output ONLY valid JSON with this exact structure: {"title": "...", "meta_description": "...", "description": "...", "anatomy": "...", "common_conditions": ["..."], "common_symptoms": ["..."], "related_tests": ["..."], "faq": [{"question": "...", "answer": "..."}]}',
 '["keyword"]'::jsonb, '{"type":"object","properties":{"title":{"type":"string"},"meta_description":{"type":"string"},"description":{"type":"string"},"anatomy":{"type":"string"},"common_conditions":{"type":"array","items":{"type":"string"}},"common_symptoms":{"type":"array","items":{"type":"string"}},"related_tests":{"type":"array","items":{"type":"string"}},"faq":{"type":"array","items":{"type":"object","properties":{"question":{"type":"string"},"answer":{"type":"string"}}}}}', true),
('faq_prompt', 'faq',
 'You are a medical content writer. Generate a comprehensive answer to the question "{{keyword}}". Output ONLY valid JSON with this exact structure: {"title": "...", "meta_description": "...", "question": "...", "answer": "...", "related_conditions": ["..."], "related_symptoms": ["..."], "related_questions": ["..."], "related_tools": ["..."], "faq": [{"question": "...", "answer": "..."}]}',
 '["keyword"]'::jsonb, '{"type":"object","properties":{"title":{"type":"string"},"meta_description":{"type":"string"},"question":{"type":"string"},"answer":{"type":"string"},"related_conditions":{"type":"array","items":{"type":"string"}},"related_symptoms":{"type":"array","items":{"type":"string"}},"related_questions":{"type":"array","items":{"type":"string"}},"related_tools":{"type":"array","items":{"type":"string"}},"faq":{"type":"array","items":{"type":"object","properties":{"question":{"type":"string"},"answer":{"type":"string"}}}}}', true),
('nutrition_prompt', 'nutrition',
 'You are a medical content writer. Generate an article about "{{keyword}}". Output ONLY valid JSON with this exact structure: {"title": "...", "meta_description": "...", "description": "...", "type": "...", "benefits": ["..."], "food_sources": ["..."], "recommended_intake": "...", "deficiency_symptoms": ["..."], "toxicity": "...", "faq": [{"question": "...", "answer": "..."}]}',
 '["keyword"]'::jsonb, '{"type":"object","properties":{"title":{"type":"string"},"meta_description":{"type":"string"},"description":{"type":"string"},"type":{"type":"string"},"benefits":{"type":"array","items":{"type":"string"}},"food_sources":{"type":"array","items":{"type":"string"}},"recommended_intake":{"type":"string"},"deficiency_symptoms":{"type":"array","items":{"type":"string"}},"toxicity":{"type":"string"},"faq":{"type":"array","items":{"type":"object","properties":{"question":{"type":"string"},"answer":{"type":"string"}}}}}', true),
('lab_test_prompt', 'lab_test',
 'You are a medical content writer. Generate an article about the lab test "{{keyword}}". Output ONLY valid JSON with this exact structure: {"title": "...", "meta_description": "...", "description": "...", "purpose": "...", "procedure": "...", "preparation": "...", "normal_values": "...", "abnormal_results": "...", "cost_range": "...", "faq": [{"question": "...", "answer": "..."}]}',
 '["keyword"]'::jsonb, '{"type":"object","properties":{"title":{"type":"string"},"meta_description":{"type":"string"},"description":{"type":"string"},"purpose":{"type":"string"},"procedure":{"type":"string"},"preparation":{"type":"string"},"normal_values":{"type":"string"},"abnormal_results":{"type":"string"},"cost_range":{"type":"string"},"faq":{"type":"array","items":{"type":"object","properties":{"question":{"type":"string"},"answer":{"type":"string"}}}}}', true),
('health_guide_prompt', 'health_guide',
 'You are a medical content writer. Generate a health guide about "{{keyword}}". Output ONLY valid JSON with this exact structure: {"title": "...", "meta_description": "...", "description": "...", "introduction": "...", "sections": [{"title": "...", "content": "..."}], "key_takeaways": ["..."], "faq": [{"question": "...", "answer": "..."}]}',
 '["keyword"]'::jsonb, '{"type":"object","properties":{"title":{"type":"string"},"meta_description":{"type":"string"},"description":{"type":"string"},"introduction":{"type":"string"},"sections":{"type":"array","items":{"type":"object","properties":{"title":{"type":"string"},"content":{"type":"string"}}}},"key_takeaways":{"type":"array","items":{"type":"string"}},"faq":{"type":"array","items":{"type":"object","properties":{"question":{"type":"string"},"answer":{"type":"string"}}}}}', true),
('mental_health_prompt', 'mental_health',
 'You are a mental health expert. Generate an article about "{{keyword}}". Output ONLY valid JSON with this exact structure: {"title": "...", "meta_description": "...", "description": "...", "types": ["..."], "symptoms": ["..."], "causes": "...", "treatments": ["..."], "coping_strategies": ["..."], "faq": [{"question": "...", "answer": "..."}]}',
 '["keyword"]'::jsonb, '{"type":"object","properties":{"title":{"type":"string"},"meta_description":{"type":"string"},"description":{"type":"string"},"types":{"type":"array","items":{"type":"string"}},"symptoms":{"type":"array","items":{"type":"string"}},"causes":{"type":"string"},"treatments":{"type":"array","items":{"type":"string"}},"coping_strategies":{"type":"array","items":{"type":"string"}},"faq":{"type":"array","items":{"type":"object","properties":{"question":{"type":"string"},"answer":{"type":"string"}}}}}', true)
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
CREATE POLICY "Public can read body_parts" ON public.body_parts FOR SELECT USING (true);
CREATE POLICY "Public can read lab_tests" ON public.lab_tests FOR SELECT USING (true);
CREATE POLICY "Public can read medicines" ON public.medicines FOR SELECT USING (true);
CREATE POLICY "Public can read nutrition_items" ON public.nutrition_items FOR SELECT USING (true);
CREATE POLICY "Public can read vitamins" ON public.vitamins FOR SELECT USING (true);
CREATE POLICY "Public can read health_guides" ON public.health_guides FOR SELECT USING (true);
CREATE POLICY "Public can read mental_health" ON public.mental_health FOR SELECT USING (true);
CREATE POLICY "Public can read womens_health" ON public.womens_health FOR SELECT USING (true);
CREATE POLICY "Public can read mens_health" ON public.mens_health FOR SELECT USING (true);
CREATE POLICY "Public can read childrens_health" ON public.childrens_health FOR SELECT USING (true);
CREATE POLICY "Public can read seniors_health" ON public.seniors_health FOR SELECT USING (true);
CREATE POLICY "Public can read pregnancy_health" ON public.pregnancy_health FOR SELECT USING (true);
CREATE POLICY "Public can read faq_questions" ON public.faq_questions FOR SELECT USING (true);
CREATE POLICY "Public can read ai_tools" ON public.ai_tools FOR SELECT USING (is_active = true);
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
CREATE INDEX IF NOT EXISTS idx_diseases_category ON public.diseases(category);
CREATE INDEX IF NOT EXISTS idx_symptoms_slug ON public.symptoms(slug);
CREATE INDEX IF NOT EXISTS idx_symptoms_body_part ON public.symptoms(body_part);
CREATE INDEX IF NOT EXISTS idx_causes_slug ON public.causes(slug);
CREATE INDEX IF NOT EXISTS idx_body_parts_slug ON public.body_parts(slug);
CREATE INDEX IF NOT EXISTS idx_lab_tests_slug ON public.lab_tests(slug);
CREATE INDEX IF NOT EXISTS idx_lab_tests_category ON public.lab_tests(category);
CREATE INDEX IF NOT EXISTS idx_medicines_slug ON public.medicines(slug);
CREATE INDEX IF NOT EXISTS idx_nutrition_slug ON public.nutrition_items(slug);
CREATE INDEX IF NOT EXISTS idx_vitamins_slug ON public.vitamins(slug);
CREATE INDEX IF NOT EXISTS idx_health_guides_slug ON public.health_guides(slug);
CREATE INDEX IF NOT EXISTS idx_mental_health_slug ON public.mental_health(slug);
CREATE INDEX IF NOT EXISTS idx_faq_slug ON public.faq_questions(slug);
CREATE INDEX IF NOT EXISTS idx_faq_category ON public.faq_questions(category);
CREATE INDEX IF NOT EXISTS idx_keywords_status ON public.keywords(status);
CREATE INDEX IF NOT EXISTS idx_keywords_type ON public.keywords(type);
CREATE INDEX IF NOT EXISTS idx_generated_contents_slug ON public.generated_contents(slug);
CREATE INDEX IF NOT EXISTS idx_seo_pages_slug ON public.seo_pages(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_ai_tools_slug ON public.ai_tools(slug);