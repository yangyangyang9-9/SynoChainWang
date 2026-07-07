// ============================================================
// SynoChain AI SEO 页面生成脚本 (Phase 2)
// 功能：读取未发布的 SEO 页面，生成页面路径与 Schema.org JSON-LD
// 用法：node scripts/generate-pages.js
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------- 简易 .env 加载器 ----------
function loadEnvFile() {
  try {
    const envPath = resolve(__dirname, '..', '.env');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // 没有 .env 文件，忽略
  }
}

loadEnvFile();

// ---------- 配置 ----------
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// 页面类型 -> 路由前缀映射
const PAGE_ROUTE_MAP = {
  disease: '/conditions',
  symptom: '/symptoms',
  question: '/questions',
};

// ---------- 日志工具 ----------
const log = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
};

// ---------- 生成页面 URL 路径 ----------
function buildPagePath(pageType, slug, locale = 'en') {
  const prefix = PAGE_ROUTE_MAP[pageType] || '/conditions';
  const path = locale && locale !== 'en' ? `/${locale}${prefix}/${slug}` : `${prefix}/${slug}`;
  return path;
}

// ---------- 生成 MedicalWebPage Schema.org JSON-LD ----------
function buildMedicalWebPageSchema(page, content) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: page.seo_title || content?.title || '',
    description: page.meta_description || content?.meta_description || '',
    url: buildPagePath(page.page_type, page.slug, page.locale),
    inLanguage: page.locale || 'en',
    about: {
      '@type': 'MedicalCondition',
      name: content?.title || page.seo_title || '',
    },
    lastReviewed: new Date().toISOString().split('T')[0],
  };
}

// ---------- 生成 FAQ Schema.org JSON-LD ----------
function buildFaqSchema(faq = []) {
  if (!Array.isArray(faq) || faq.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

// ---------- 组合完整 schema_data ----------
function buildSchemaData(page, content) {
  const schema = {
    medicalWebPage: buildMedicalWebPageSchema(page, content),
  };
  const faqSchema = buildFaqSchema(content?.faq);
  if (faqSchema) {
    schema.faq = faqSchema;
  }
  return schema;
}

// ---------- Mock 模式 ----------
async function runMock() {
  log.warn('未检测到 SUPABASE_URL / SUPABASE_SERVICE_KEY，使用 mock 模式演示流程');

  const mockPages = [
    {
      id: 'mock-page-1',
      content_id: 'mock-content-1',
      page_type: 'disease',
      slug: 'sinusitis',
      locale: 'en',
      seo_title: 'Sinusitis - Complete Guide',
      meta_description: 'Learn about sinusitis causes, symptoms and treatments.',
      is_published: false,
    },
    {
      id: 'mock-page-2',
      content_id: 'mock-content-2',
      page_type: 'symptom',
      slug: 'headache',
      locale: 'en',
      seo_title: 'Headache - Causes & When to See a Doctor',
      meta_description: 'Understand headache causes and self-care tips.',
      is_published: false,
    },
    {
      id: 'mock-page-3',
      content_id: 'mock-content-3',
      page_type: 'question',
      slug: 'how-to-lower-blood-pressure',
      locale: 'en',
      seo_title: 'How to Lower Blood Pressure - FAQ',
      meta_description: 'Frequently asked questions about lowering blood pressure.',
      is_published: false,
    },
  ];

  const mockContents = {
    'mock-content-1': {
      title: 'Sinusitis - Complete Guide',
      meta_description: 'Learn about sinusitis causes, symptoms and treatments.',
      faq: [{ question: 'What is sinusitis?', answer: 'Inflammation of the sinuses.' }],
    },
    'mock-content-2': {
      title: 'Headache - Causes & When to See a Doctor',
      meta_description: 'Understand headache causes and self-care tips.',
      faq: [{ question: 'When is a headache serious?', answer: 'When it is sudden and severe.' }],
    },
    'mock-content-3': {
      title: 'How to Lower Blood Pressure - FAQ',
      meta_description: 'Frequently asked questions about lowering blood pressure.',
      faq: [
        { question: 'What foods lower blood pressure?', answer: 'Fruits, vegetables, low-sodium foods.' },
      ],
    },
  };

  log.info(`找到 ${mockPages.length} 个未发布的 SEO 页面（mock）`);

  for (const page of mockPages) {
    const content = mockContents[page.content_id];
    const path = buildPagePath(page.page_type, page.slug, page.locale);
    log.info('----------------------------------------');
    log.info(`页面: ${page.seo_title}`);
    log.success(`生成页面路径: ${path}`);
    const schema = buildSchemaData(page, content);
    log.info(`MedicalWebPage Schema: ${JSON.stringify(schema.medicalWebPage)}`);
    if (schema.faq) {
      log.info(`FAQ Schema: ${JSON.stringify(schema.faq)}`);
    }
    log.info(`[模拟] 保存 schema_data 到 seo_pages 表`);
  }
  log.success('Mock 流程完成');
}

// ---------- 生产模式 ----------
async function runProduction() {
  log.info('使用 Supabase 生产模式');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // 查询未发布的 SEO 页面
  const { data: pages, error } = await supabase
    .from('seo_pages')
    .select('id, content_id, page_type, slug, locale, seo_title, meta_description, is_published')
    .eq('is_published', false)
    .order('generated_at', { ascending: true });

  if (error) {
    log.error(`查询 seo_pages 失败: ${error.message}`);
    process.exit(1);
  }

  if (!pages || pages.length === 0) {
    log.info('没有待生成的 SEO 页面');
    return;
  }

  log.info(`找到 ${pages.length} 个未发布的 SEO 页面`);

  let successCount = 0;
  let failCount = 0;

  for (const page of pages) {
    log.info('----------------------------------------');
    log.info(`处理页面: ${page.seo_title} (id=${page.id})`);

    try {
      // 读取关联的生成内容
      let content = null;
      if (page.content_id) {
        const { data: contentData, error: contentError } = await supabase
          .from('generated_contents')
          .select('title, meta_description, summary, content, faq')
          .eq('id', page.content_id)
          .single();
        if (contentError) {
          log.warn(`读取 generated_contents 失败: ${contentError.message}`);
        } else {
          content = contentData;
        }
      }

      const path = buildPagePath(page.page_type, page.slug, page.locale);
      log.success(`生成页面路径: ${path}`);

      const schemaData = buildSchemaData(page, content);
      log.info(`MedicalWebPage Schema: ${JSON.stringify(schemaData.medicalWebPage)}`);
      if (schemaData.faq) {
        log.info(`FAQ Schema: ${JSON.stringify(schemaData.faq)}`);
      }

      // 更新 seo_pages 的 schema_data
      const { error: updateError } = await supabase
        .from('seo_pages')
        .update({ schema_data: schemaData })
        .eq('id', page.id);

      if (updateError) {
        log.warn(`更新 schema_data 失败: ${updateError.message}`);
      } else {
        log.success(`Schema 数据已保存 (id=${page.id})`);
      }
      successCount++;
    } catch (err) {
      log.error(`页面 "${page.seo_title}" 处理失败: ${err.message}`);
      failCount++;
    }
  }

  log.info('========== 任务完成 ==========');
  log.info(`成功: ${successCount} / 失败: ${failCount} / 总计: ${pages.length}`);
}

// ---------- 入口 ----------
async function main() {
  log.info('SynoChain AI SEO 页面生成脚本启动');

  const isConfigured = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
  if (!isConfigured) {
    await runMock();
  } else {
    await runProduction();
  }
}

main().catch((err) => {
  log.error(`脚本异常退出: ${err.message}`);
  process.exit(1);
});
