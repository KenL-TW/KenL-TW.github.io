#!/usr/bin/env node

/**
 * Sync blog metadata into KB project summaries and kb/index.json chunks.
 * Usage:
 *   node scripts/sync-blog-to-kb.js
 *   node scripts/sync-blog-to-kb.js --slug a2a-mcp
 *   node scripts/sync-blog-to-kb.js --ai
 *   node scripts/sync-blog-to-kb.js --slug a2a-mcp --ai --model gpt-4.1-mini
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const POSTS_PATH = path.join(ROOT, 'blog', 'posts.json');
const KB_INDEX_PATH = path.join(ROOT, 'kb', 'index.json');
const LOCAL_ENV_PATH = path.join(ROOT, '.env.local');

function loadLocalEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;

    const key = m[1];
    let value = m[2] || '';

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    value = value.replace(/\\n/g, '\n');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function toDateString(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeFileStem(slug) {
  return String(slug || '').trim().toLowerCase().replace(/-/g, '_');
}

function uniqueTags(inputTags) {
  const tags = ['blog', ...(Array.isArray(inputTags) ? inputTags : [])]
    .map((t) => String(t).trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(tags));
}

function buildKbMarkdown(post, aiSummary) {
  const tagLine = uniqueTags(post.tags).map((t) => `#${t}`).join(' ');
  const blogUrl = `https://kenl-tw.github.io/blog/post.html?slug=${encodeURIComponent(post.slug)}`;

  const oneLiner = aiSummary?.one_liner || post.excerpt || '此篇文章聚焦於實務架構與落地方法。';
  const background = aiSummary?.background || '補上這篇文章要解決的情境與痛點。';
  const method = aiSummary?.method || '補上文章中的關鍵方法、架構或流程。';
  const application = aiSummary?.application || '補上可直接落地的情境與作法。';
  const risk = aiSummary?.risk || '補上導入時需要注意的條件。';

  return [
    `# 專案：${post.title}`,
    '',
    '## 一句話摘要',
    oneLiner,
    '',
    '## 來源資訊',
    `- 發佈日期：${post.date || '未提供'}`,
    `- 文章 Slug：${post.slug}`,
    `- 原文連結：${blogUrl}`,
    `- 封面圖：${post.cover || '未提供'}`,
    `- 內容檔：${post.content || '未提供'}`,
    '',
    '## 核心重點（可持續補充）',
    `- 問題背景：${background}`,
    `- 方法框架：${method}`,
    `- 實務應用：${application}`,
    `- 風險與限制：${risk}`,
    '',
    '## 關鍵字',
    tagLine || '#blog',
    '',
  ].join('\n');
}

function buildChunk(post, kbRelPath, aiSummary) {
  const chunkId = `projects#${post.slug}-0001`;
  const text = [
    aiSummary?.one_liner || post.excerpt || post.title,
    `文章聚焦 ${post.title}，可透過原文連結查看完整內容。`,
  ].join(' ');

  return {
    path: kbRelPath.replace(/\\/g, '/'),
    chunk_id: chunkId,
    title: post.title,
    text,
    tags: uniqueTags(post.tags),
  };
}

function decodeHtmlEntities(input) {
  return String(input)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function htmlToText(html) {
  return decodeHtmlEntities(
    String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function pickOutputText(responseJson) {
  if (typeof responseJson.output_text === 'string' && responseJson.output_text.trim()) {
    return responseJson.output_text.trim();
  }

  const output = Array.isArray(responseJson.output) ? responseJson.output : [];
  const chunks = [];

  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const c of content) {
      if (typeof c?.text === 'string' && c.text.trim()) {
        chunks.push(c.text.trim());
      }
    }
  }

  return chunks.join('\n').trim();
}

function safeParseJsonBlock(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function generateAiSummary(post, args) {
  if (!args.ai) return null;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[AI] OPENAI_API_KEY not found. Fallback to template summary.');
    return null;
  }

  let sourceText = post.excerpt || post.title;
  if (post.content) {
    const contentPath = path.join(ROOT, post.content);
    if (fs.existsSync(contentPath)) {
      const html = fs.readFileSync(contentPath, 'utf8');
      sourceText = htmlToText(html);
    }
  }

  const limitedText = sourceText.slice(0, 12000);
  const prompt = [
    '請根據以下文章內容，輸出繁體中文 JSON（僅 JSON，不要額外文字）。',
    '欄位格式如下：',
    '{',
    '  "one_liner": "一句話摘要，30-60字",',
    '  "background": "問題背景，40-90字",',
    '  "method": "方法框架，40-90字",',
    '  "application": "實務應用，40-90字",',
    '  "risk": "風險與限制，30-80字"',
    '}',
    '',
    `標題：${post.title}`,
    `摘要：${post.excerpt || ''}`,
    `內文：${limitedText}`,
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: args.model,
      input: [
        {
          role: 'system',
          content: '你是知識庫整理助理。請只輸出 JSON，不要 markdown，不要註解。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    console.warn(`[AI] OpenAI request failed for slug=${post.slug}, status=${response.status}. Fallback to template summary.`);
    return null;
  }

  const responseJson = await response.json();
  const outputText = pickOutputText(responseJson);
  const parsed = safeParseJsonBlock(outputText);

  if (!parsed) {
    console.warn(`[AI] Failed to parse AI JSON for slug=${post.slug}. Fallback to template summary.`);
    return null;
  }

  return {
    one_liner: String(parsed.one_liner || '').trim(),
    background: String(parsed.background || '').trim(),
    method: String(parsed.method || '').trim(),
    application: String(parsed.application || '').trim(),
    risk: String(parsed.risk || '').trim(),
  };
}

function parseArgs(argv) {
  const args = {
    slug: null,
    ai: false,
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
  };

  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--slug' && argv[i + 1]) {
      args.slug = argv[i + 1].trim();
      i += 1;
    } else if (argv[i] === '--ai') {
      args.ai = true;
    } else if (argv[i] === '--model' && argv[i + 1]) {
      args.model = argv[i + 1].trim();
      i += 1;
    }
  }
  return args;
}

async function main() {
  loadLocalEnv(LOCAL_ENV_PATH);

  if (!fs.existsSync(POSTS_PATH)) {
    throw new Error(`Cannot find posts file: ${POSTS_PATH}`);
  }
  if (!fs.existsSync(KB_INDEX_PATH)) {
    throw new Error(`Cannot find KB index file: ${KB_INDEX_PATH}`);
  }

  const args = parseArgs(process.argv.slice(2));
  const posts = readJson(POSTS_PATH);
  const kbIndex = readJson(KB_INDEX_PATH);

  if (!Array.isArray(posts)) {
    throw new Error('blog/posts.json should be an array');
  }
  if (!Array.isArray(kbIndex.chunks)) {
    throw new Error('kb/index.json should have a chunks array');
  }

  const targets = args.slug
    ? posts.filter((p) => p.slug === args.slug)
    : posts;

  if (targets.length === 0) {
    throw new Error(args.slug
      ? `No post found for slug: ${args.slug}`
      : 'No posts found in blog/posts.json');
  }

  let createdMd = 0;
  let addedChunks = 0;
  let updatedMd = 0;
  let aiSummaries = 0;

  for (const post of targets) {
    if (!post.slug || !post.title) {
      continue;
    }

    const fileStem = normalizeFileStem(post.slug);
    const kbRelPath = path.join('kb', 'projects', `p_${fileStem}.md`);
    const kbAbsPath = path.join(ROOT, kbRelPath);

    fs.mkdirSync(path.dirname(kbAbsPath), { recursive: true });

    const aiSummary = await generateAiSummary(post, args);
    if (aiSummary) {
      aiSummaries += 1;
    }

    const markdown = buildKbMarkdown(post, aiSummary);
    if (fs.existsSync(kbAbsPath)) {
      fs.writeFileSync(kbAbsPath, markdown, 'utf8');
      updatedMd += 1;
    } else {
      fs.writeFileSync(kbAbsPath, markdown, 'utf8');
      createdMd += 1;
    }

    const chunkId = `projects#${post.slug}-0001`;
    const exists = kbIndex.chunks.some((c) => c && c.chunk_id === chunkId);
    if (!exists) {
      kbIndex.chunks.push(buildChunk(post, kbRelPath, aiSummary));
      addedChunks += 1;
    }
  }

  kbIndex.generated_at = toDateString();
  writeJson(KB_INDEX_PATH, kbIndex);

  console.log(`Processed posts: ${targets.length}`);
  console.log(`Markdown created: ${createdMd}`);
  console.log(`Markdown updated: ${updatedMd}`);
  console.log(`Chunks added: ${addedChunks}`);
  console.log(`AI summaries used: ${aiSummaries}`);
  console.log(`KB index updated_at: ${kbIndex.generated_at}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
