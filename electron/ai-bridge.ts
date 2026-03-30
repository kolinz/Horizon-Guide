/**
 * electron/ai-bridge.ts
 *
 * AI接続ブリッジ。メインプロセス側で動作し、
 * Dify / Gemini / Claude / GPT への API 呼び出しを担う。
 *
 * 前提: Node.js v24（fetch・AbortController・crypto.randomUUID がグローバル利用可能）
 */

import { ipcMain } from 'electron'
import keytar from 'keytar'
import { insertAIHistory } from './db/queries/aiHistory'
import type { AIConfig } from '../src/types'

// ──────────────────────────────────────────────
// 定数
// ──────────────────────────────────────────────

const KEYTAR_SERVICE = 'horizon-guide'
const TIMEOUT_MS     = 30_000   // 30秒タイムアウト

const SYSTEM_PROMPT =
  'あなたは学習設計の専門家AIです。' +
  '以下のコンテキストをもとに、学習者のキャリアゴール達成と' +
  'ウェルビーイング向上を支援してください。' +
  '回答は日本語で、具体的かつ簡潔にお願いします。' +
  'コンテキストに【学習者プロフィール】が含まれている場合は、' +
  'その属性・専攻分野に合わせて助言のトーン・用語・具体例を調整してください。' +
  '例：専門職大学生・情報学 → 実践的な演習・資格・就職を意識した表現／' +
  '社会人 → 業務との両立・スキルアップ・転職を意識した表現／' +
  '高校生 → 進路選択・受験準備を意識した平易な表現。'

const ANALYZE_PROMPT = `以下のウェルビーイングゴール・キャリアゴール・学習タイムラインをもとに、
総合的な助言をしてください。

{context}

【助言してほしい観点】
1. WBゴール・キャリアゴールと現在の学習進捗の整合性
2. アウトプットが不足している学習があれば具体的に指摘
3. 今後の学習計画で追加・修正を推奨する内容
4. キャリアゴール達成に向けた優先アクション（3つ以内）

日本語で、具体的かつ簡潔に回答してください。`

// ──────────────────────────────────────────────
// 型
// ──────────────────────────────────────────────

interface CallResult {
  text: string
  provider: string
  modelOrEndpoint: string
}

// ──────────────────────────────────────────────
// AI設定の取得（main.ts のメモリストアから注入）
// ──────────────────────────────────────────────

let _getAIConfig: (() => AIConfig | null) | null = null

/** main.ts から設定取得関数を注入する */
export function setAIConfigGetter(fn: () => AIConfig | null): void {
  _getAIConfig = fn
}

function getAIConfig(): AIConfig | null {
  return _getAIConfig ? _getAIConfig() : null
}

// ──────────────────────────────────────────────
// SSEパーサー：ReadableStream → テキスト結合
// ──────────────────────────────────────────────

/**
 * Dify SSEストリームをパースして全テキストを返す。
 * Dify は `data: {...}` 形式で JSON を送信する。
 */
async function parseDifyStream(response: Response): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Response body is null')

  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? '' // 末尾の不完全行をバッファに残す

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue

        const jsonStr = trimmed.slice(5).trim()
        if (!jsonStr || jsonStr === '[DONE]') continue

        try {
          const chunk = JSON.parse(jsonStr)
          // Dify streaming event types
          if (chunk.event === 'message' && typeof chunk.answer === 'string') {
            fullText += chunk.answer
          } else if (chunk.event === 'agent_message' && typeof chunk.answer === 'string') {
            fullText += chunk.answer
          } else if (chunk.event === 'error') {
            throw new Error(`Dify stream error: ${chunk.message ?? 'unknown'}`)
          }
        } catch (parseErr) {
          // JSON パース失敗は無視（不完全チャンクの可能性）
          if (parseErr instanceof SyntaxError) continue
          throw parseErr
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return fullText.trim()
}

/**
 * Gemini SSEストリームをパースして全テキストを返す。
 * Gemini は `data: {...}` 形式の JSON 配列を送信する。
 */
async function parseGeminiStream(response: Response): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Response body is null')

  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue

        const jsonStr = trimmed.slice(5).trim()
        if (!jsonStr || jsonStr === '[DONE]') continue

        try {
          const chunk = JSON.parse(jsonStr)
          // Gemini レスポンス構造: candidates[0].content.parts[0].text
          const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text
          if (typeof text === 'string') {
            fullText += text
          }
        } catch {
          // 不完全 JSON は無視
          continue
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return fullText.trim()
}

// ──────────────────────────────────────────────
// Dify 呼び出し
// ──────────────────────────────────────────────

async function callDify(
  userMessage: string,
  context: string,
  config: AIConfig
): Promise<CallResult> {
  if (!config.dify?.endpoint) {
    throw new Error('Dify エンドポイントが設定されていません')
  }

  const apiKey = await keytar.getPassword(KEYTAR_SERVICE, 'dify')
  if (!apiKey) {
    throw new Error('Dify APIキーが設定されていません。設定画面から登録してください。')
  }

  const endpoint = config.dify.endpoint.replace(/\/$/, '')
  const url = `${endpoint}/v1/chat-messages`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: { timeline_context: context },
      query: userMessage,
      response_mode: 'streaming',
      user: 'horizon-guide-user',
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(`Dify API エラー (${response.status}): ${errorBody.slice(0, 200)}`)
  }

  const text = await parseDifyStream(response)
  return { text, provider: 'dify', modelOrEndpoint: endpoint }
}

// ──────────────────────────────────────────────
// Gemini 呼び出し
// ──────────────────────────────────────────────

async function callGemini(
  userMessage: string,
  context: string,
  config: AIConfig
): Promise<CallResult> {
  const model = config.llm?.model ?? 'gemini-2.0-flash'

  const apiKey = await keytar.getPassword(KEYTAR_SERVICE, 'gemini')
  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません。設定画面から登録してください。')
  }

  const fullPrompt = context
    ? `${context}\n\n${userMessage}`
    : userMessage

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}` +
    `:streamGenerateContent?alt=sse&key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        { role: 'user', parts: [{ text: fullPrompt }] },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(`Gemini API エラー (${response.status}): ${errorBody.slice(0, 200)}`)
  }

  const text = await parseGeminiStream(response)
  return { text, provider: 'llm', modelOrEndpoint: model }
}

// ──────────────────────────────────────────────
// Claude (Anthropic) 呼び出し
// ──────────────────────────────────────────────

async function callClaude(
  userMessage: string,
  context: string,
  config: AIConfig
): Promise<CallResult> {
  const model = config.llm?.model ?? 'claude-3-5-haiku-20241022'

  const apiKey = await keytar.getPassword(KEYTAR_SERVICE, 'claude')
  if (!apiKey) {
    throw new Error('Claude APIキーが設定されていません。設定画面から登録してください。')
  }

  const fullPrompt = context
    ? `${context}\n\n${userMessage}`
    : userMessage

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: fullPrompt }],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(`Claude API エラー (${response.status}): ${errorBody.slice(0, 200)}`)
  }

  const data = await response.json() as {
    content: Array<{ type: string; text: string }>
  }
  const text = data.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')

  return { text, provider: 'llm', modelOrEndpoint: model }
}

// ──────────────────────────────────────────────
// OpenAI GPT 呼び出し
// ──────────────────────────────────────────────

async function callOpenAI(
  userMessage: string,
  context: string,
  config: AIConfig
): Promise<CallResult> {
  const model = config.llm?.model ?? 'gpt-4o-mini'

  const apiKey = await keytar.getPassword(KEYTAR_SERVICE, 'openai')
  if (!apiKey) {
    throw new Error('OpenAI APIキーが設定されていません。設定画面から登録してください。')
  }

  const fullPrompt = context
    ? `${context}\n\n${userMessage}`
    : userMessage

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: fullPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(`OpenAI API エラー (${response.status}): ${errorBody.slice(0, 200)}`)
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>
  }
  const text = data.choices[0]?.message?.content ?? ''

  return { text, provider: 'llm', modelOrEndpoint: model }
}

// ──────────────────────────────────────────────
// ローカルLLM呼び出し（Ollama等 OpenAI互換API）
// ──────────────────────────────────────────────

async function callLocalLLM(
  userMessage: string,
  context: string,
  config: AIConfig
): Promise<CallResult> {
  if (!config.local?.endpoint) {
    throw new Error('ローカルLLMのエンドポイントが設定されていません')
  }
  if (!config.local?.model) {
    throw new Error('ローカルLLMのモデル名が設定されていません')
  }

  const endpoint = config.local.endpoint.replace(/\/$/, '')
  const model = config.local.model
  const fullPrompt = context ? `${context}

${userMessage}` : userMessage

  // Ollama /api/chat か OpenAI互換 /v1/chat/completions かを自動判別
  const isOllamaNative = endpoint.includes('/api/chat') ||
    (!endpoint.includes('/v1/') && !endpoint.endsWith('/chat/completions'))

  let response: Response

  if (isOllamaNative) {
    // Ollama ネイティブAPI形式
    const url = endpoint.endsWith('/api/chat') ? endpoint : `${endpoint}/api/chat`
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: fullPrompt },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      throw new Error(`ローカルLLM エラー (${response.status}): ${errorBody.slice(0, 200)}`)
    }

    const data = await response.json() as {
      message?: { content: string }
      error?: string
    }
    if (data.error) throw new Error(`Ollama エラー: ${data.error}`)
    const text = data.message?.content ?? ''
    return { text, provider: 'local', modelOrEndpoint: `${endpoint}/${model}` }

  } else {
    // OpenAI互換API形式（LM Studio・llama.cpp等）
    const url = endpoint.endsWith('/chat/completions')
      ? endpoint
      : `${endpoint}/v1/chat/completions`
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: fullPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      throw new Error(`ローカルLLM エラー (${response.status}): ${errorBody.slice(0, 200)}`)
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>
    }
    const text = data.choices[0]?.message?.content ?? ''
    return { text, provider: 'local', modelOrEndpoint: `${endpoint}/${model}` }
  }
}

// ──────────────────────────────────────────────
// プロバイダー振り分け
// ──────────────────────────────────────────────

async function callAI(userMessage: string, context: string): Promise<CallResult> {
  const config = getAIConfig()

  if (!config) {
    throw new Error(
      'AI接続が設定されていません。設定画面から接続先を設定してください。'
    )
  }

  switch (config.provider) {
    case 'dify':
      return callDify(userMessage, context, config)

    case 'llm': {
      const service = config.llm?.service ?? 'gemini'
      if (service === 'gemini') return callGemini(userMessage, context, config)
      if (service === 'claude') return callClaude(userMessage, context, config)
      if (service === 'openai') return callOpenAI(userMessage, context, config)
      throw new Error(`未対応のLLMサービス: ${service}`)
    }

    case 'local':
      return callLocalLLM(userMessage, context, config)

    default:
      throw new Error(`未対応のプロバイダー: ${config.provider}`)
  }
}

// ──────────────────────────────────────────────
// IPCハンドラー登録
// ──────────────────────────────────────────────

/**
 * ai-bridge の IPC ハンドラーを登録する。
 * main.ts の app.whenReady() 内で呼ぶこと。
 *
 * 注意: main.ts に既に仮実装の 'chat-ai' / 'analyze-ai' ハンドラーがある場合、
 * ipcMain.removeHandler() で除去してから登録し直す。
 */
export function registerAIHandlers(): void {
  // 既存の仮ハンドラーを除去（Step 3 の main.ts で仮実装済みのため）
  ipcMain.removeHandler('chat-ai')
  ipcMain.removeHandler('analyze-ai')

  // ── chat-ai ──────────────────────────────────
  ipcMain.handle(
    'chat-ai',
    async (_event, { message, context }: { message: string; context: string }) => {
      try {
        const result = await callAI(message, context)

        // ai_history に記録（ベストエフォート）
        try {
          insertAIHistory({
            id: crypto.randomUUID(),
            mode: 'chat',
            userMessage: message,
            aiResponse: result.text,
            provider: result.provider as 'llm' | 'dify' | 'langflow',
            modelOrEndpoint: result.modelOrEndpoint,
            timestamp: new Date().toISOString(),
          })
        } catch (logErr) {
          console.error('[ai-bridge] history insert failed:', logErr)
        }

        return result.text
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[ai-bridge] chat-ai error:', msg)
        // エラーメッセージをそのままレンダラーへ返す
        return `⚠️ エラーが発生しました\n\n${msg}`
      }
    }
  )

  // ── analyze-ai ────────────────────────────────
  ipcMain.handle(
    'analyze-ai',
    async (_event, { context }: { context: string }) => {
      try {
        // Analyze mode は固定プロンプトを userMessage として使用
        const analyzeMessage = ANALYZE_PROMPT.replace('{context}', context)

        // Analyze mode ではコンテキストをプロンプト内に埋め込み済みのため
        // callAI には空コンテキストを渡す（二重付与を防ぐ）
        const result = await callAI(analyzeMessage, '')

        try {
          insertAIHistory({
            id: crypto.randomUUID(),
            mode: 'analyze',
            userMessage: null,
            aiResponse: result.text,
            provider: result.provider as 'llm' | 'dify' | 'langflow',
            modelOrEndpoint: result.modelOrEndpoint,
            timestamp: new Date().toISOString(),
          })
        } catch (logErr) {
          console.error('[ai-bridge] history insert failed:', logErr)
        }

        return result.text
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[ai-bridge] analyze-ai error:', msg)
        return `⚠️ エラーが発生しました\n\n${msg}`
      }
    }
  )
}
