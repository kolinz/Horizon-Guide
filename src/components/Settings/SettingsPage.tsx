import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Target, Leaf, Cpu, Download, Database, Globe,
  CheckCircle2, XCircle, Loader2, Sparkles, RefreshCw,
  ChevronRight, AlertTriangle, FlaskConical, Shield,
} from 'lucide-react'
import { useGoalStore } from '../../stores/goalStore'
import { ResetConfirmModal } from '../Modals/ResetConfirmModal'
import { useAIStore } from '../../stores/aiStore'
import type { AIConfig, LearningType, LearningLocation, LearningModality } from '../../types'

// ─────────────────────────────────────────────────────
// 型
// ─────────────────────────────────────────────────────

type SectionId = 'career' | 'wellbeing' | 'ai' | 'export' | 'data' | 'display'

interface SidebarItem {
  id: SectionId
  label: string
  icon: React.ReactNode
}

// ─────────────────────────────────────────────────────
// トースト通知
// ─────────────────────────────────────────────────────

interface ToastState {
  message: string
  type: 'success' | 'error'
  visible: boolean
}

function Toast({ toast }: { toast: ToastState }) {
  if (!toast.visible) return null
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
        ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
      role="alert"
    >
      {toast.type === 'success'
        ? <CheckCircle2 size={16} />
        : <XCircle size={16} />}
      {toast.message}
    </div>
  )
}

function useToast() {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', visible: false })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast({ message, type, visible: true })
    timerRef.current = setTimeout(() => setToast((p) => ({ ...p, visible: false })), 3500)
  }, [])

  return { toast, showToast }
}



// ─────────────────────────────────────────────────────
// 1. キャリアゴールセクション
// ─────────────────────────────────────────────────────

function CareerSection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const { careerGoal, saveCareerGoal } = useGoalStore()
  const [text, setText]             = useState(careerGoal?.text ?? '')
  const [targetDate, setTargetDate] = useState(careerGoal?.targetDate ?? '')
  const [userName, setUserName]     = useState(careerGoal?.userName ?? '')
  const [error, setError]           = useState('')
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    setText(careerGoal?.text ?? '')
    setTargetDate(careerGoal?.targetDate ?? '')
    setUserName(careerGoal?.userName ?? '')
  }, [careerGoal])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) { setError('キャリアゴールを入力してください'); return }
    setSaving(true)
    try {
      await saveCareerGoal({ text: text.trim(), targetDate: targetDate || null, userName: userName.trim() || null })
      showToast('キャリアゴールを保存しました')
    } catch {
      showToast('保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">キャリアゴール</h2>
      <form onSubmit={handleSave} noValidate className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            ゴール <span className="text-red-500">*</span>
          </label>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setError('') }}
            rows={3}
            placeholder="例：データサイエンティストに転職する"
            className={`w-full px-3 py-2 text-sm border rounded-lg outline-none resize-none transition-colors
              ${error ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400'}`}
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              目標時期 <span className="text-gray-400 font-normal">任意</span>
            </label>
            <input
              type="month"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              氏名 <span className="text-gray-400 font-normal">PDFポートフォリオ用・任意</span>
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="山田 太郎"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg transition-colors"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            保存する
          </button>
        </div>
      </form>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// 2. ウェルビーイングゴールセクション
// ─────────────────────────────────────────────────────

function WellbeingSection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const { wellbeingGoal, careerGoal, saveWellbeingGoal } = useGoalStore()

  const [personal, setPersonal]   = useState(wellbeingGoal?.axes.personal ?? '')
  const [social,   setSocial]     = useState(wellbeingGoal?.axes.social   ?? '')
  const [planet,   setPlanet]     = useState(wellbeingGoal?.axes.planet   ?? '')
  const [goalText, setGoalText]   = useState(wellbeingGoal?.text ?? '')
  const [aiGenerated, setAiGenerated] = useState(false)
  const [generating, setGenerating]   = useState(false)
  const [saving, setSaving]           = useState(false)
  const [genError, setGenError]       = useState('')

  useEffect(() => {
    setPersonal(wellbeingGoal?.axes.personal ?? '')
    setSocial(wellbeingGoal?.axes.social   ?? '')
    setPlanet(wellbeingGoal?.axes.planet   ?? '')
    setGoalText(wellbeingGoal?.text ?? '')
    setAiGenerated(false)
  }, [wellbeingGoal])

  const handleGenerate = async () => {
    if (!careerGoal) { setGenError('先にキャリアゴールを設定してください'); return }
    setGenerating(true)
    setGenError('')
    try {
      const prompt =
        `以下の3軸の価値観と、キャリアゴール「${careerGoal.text}」をもとに、` +
        `ウェルビーイングゴール（なぜそのキャリアを目指すのかという根本的な動機）を` +
        `日本語で一文（30〜50字程度）で生成してください。文章のみ出力し、説明や前置きは不要です。\n\n` +
        `個人軸: ${personal || '未記入'}\n社会軸: ${social || '未記入'}\n地球軸: ${planet || '未記入'}`
      const result = await window.electronAPI.chatAI(prompt, '')
      setGoalText(result.replace(/^["「『]|["」』]$/g, '').trim())
      setAiGenerated(true)
    } catch {
      setGenError('AI生成に失敗しました。AI接続設定を確認してください。')
    } finally {
      setGenerating(false)
    }
  }

  const handleAdopt = async () => {
    if (!goalText.trim()) { setGenError('WBゴールのテキストを入力または生成してください'); return }
    setSaving(true)
    try {
      await saveWellbeingGoal({
        text: goalText.trim(),
        axes: { personal: personal.trim() || null, social: social.trim() || null, planet: planet.trim() || null },
        aiGenerated,
      })
      showToast('ウェルビーイングゴールを保存しました')
    } catch {
      showToast('保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold text-gray-800">ウェルビーイングゴール</h2>
        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
          OECD 2030
        </span>
      </div>

      {/* OECD説明 */}
      <div className="flex gap-2 p-3 bg-wb-bg rounded-lg border border-wb-green/20 mb-4 text-xs text-wb-green leading-relaxed">
        <span className="flex-shrink-0">🌱</span>
        <p>「なぜそのキャリアを目指すのか」という根本的な動機・価値観を個人・社会・地球の3軸で表現します。OECD Learning Compass 2030 の個人・集合的ウェルビーイングの概念に基づいています。</p>
      </div>

      {/* 3軸入力 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: '🧘 個人軸', value: personal, onChange: setPersonal, ph: '自己成長・自己実現・ウェルネスに関する価値観' },
          { label: '🤝 社会軸', value: social,   onChange: setSocial,   ph: 'コミュニティ・他者への貢献に関する価値観' },
          { label: '🌍 地球軸', value: planet,   onChange: setPlanet,   ph: '持続可能性・環境・次世代への責任に関する価値観' },
        ].map((ax) => (
          <div key={ax.label}>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">{ax.label}</label>
            <textarea
              value={ax.value}
              onChange={(e) => ax.onChange(e.target.value)}
              rows={4}
              placeholder={ax.ph}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-wb-green/60 focus:ring-1 focus:ring-wb-green/40 transition-colors resize-none"
            />
          </div>
        ))}
      </div>

      {/* AI生成ボタン */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-wb-green bg-wb-bg border border-wb-green/30 hover:bg-wb-green/10 disabled:opacity-50 rounded-lg transition-colors mb-4"
      >
        {generating
          ? <><Loader2 size={14} className="animate-spin" />AI生成中...</>
          : <><Sparkles size={14} />AIにWBゴールを生成してもらう</>}
      </button>

      {genError && <p className="text-xs text-red-500 mb-3">{genError}</p>}

      {/* 生成結果エリア */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
        <label className="block text-xs font-medium text-gray-700">
          WBゴール（全体テキスト）
          {aiGenerated && (
            <span className="ml-2 text-[10px] text-wb-green bg-wb-bg px-1.5 py-0.5 rounded">✨ AI生成</span>
          )}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-base pointer-events-none select-none">🌱</span>
          <input
            type="text"
            value={goalText}
            onChange={(e) => { setGoalText(e.target.value); setAiGenerated(false) }}
            placeholder="例：地域のデジタル格差をなくして次世代の可能性を広げたい"
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-wb-green/60 focus:ring-1 focus:ring-wb-green/40 transition-colors bg-white"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 rounded-lg transition-colors"
          >
            <RefreshCw size={12} className={generating ? 'animate-spin' : ''} />
            再生成する
          </button>
          <button
            type="button"
            onClick={handleAdopt}
            disabled={saving || !goalText.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-wb-green hover:opacity-90 disabled:opacity-40 rounded-lg transition-colors"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            このゴールを採用する
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// 3. AI接続設定セクション
// ─────────────────────────────────────────────────────

const LLM_SERVICES = [
  { value: 'gemini', label: 'Gemini（Google）', defaultModel: 'gemini-2.5-flash-lite', hint: '無料枠あり' },
  { value: 'claude', label: 'Claude（Anthropic）', defaultModel: 'claude-haiku-4-5-20251001', hint: '' },
  { value: 'openai', label: 'ChatGPT（OpenAI）', defaultModel: 'gpt-5o-mini', hint: '' },
] as const

type LLMService = typeof LLM_SERVICES[number]['value']

interface AIFormState {
  provider: 'llm' | 'local' | 'dify'
  llmService: LLMService
  llmModel: string
  llmApiKey: string
  localEndpoint: string
  localModel: string
  difyEndpoint: string
  difyApiKey: string
}

function AISection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const { config, saveConfig } = useAIStore()

  const [form, setForm] = useState<AIFormState>({
    provider: (config?.provider === 'dify' ? 'dify' : config?.provider === 'local' ? 'local' : 'llm'),
    llmService: (config?.llm?.service ?? 'gemini') as LLMService,
    llmModel: config?.llm?.model ?? 'gemini-2.5-flash-lite',
    llmApiKey: '',
    localEndpoint: config?.local?.endpoint ?? 'http://localhost:11434',
    localModel: config?.local?.model ?? 'gemma3:4b',
    difyEndpoint: config?.dify?.endpoint ?? '',
    difyApiKey: '',
  })

  const [testing, setTesting]   = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [saving, setSaving]     = useState(false)

  // 初期表示時にkeytarからAPIキーを読み込んで表示
  useEffect(() => {
    const loadKeys = async () => {
      try {
        if (config?.provider === 'local') return  // ローカルLLMはAPIキー不要
        const service = config?.provider === 'dify' ? 'dify' : (config?.llm?.service ?? 'gemini')
        const key = await window.electronAPI.loadApiKey?.(service)
        if (key) {
          if (config?.provider === 'dify') {
            setForm((p) => ({ ...p, difyApiKey: key }))
          } else {
            setForm((p) => ({ ...p, llmApiKey: key }))
          }
        }
      } catch { /* ignore */ }
    }
    loadKeys()
  }, [])

  // LLMサービス変更時にデフォルトモデルを更新
  const handleServiceChange = (service: LLMService) => {
    const def = LLM_SERVICES.find((s) => s.value === service)?.defaultModel ?? ''
    setForm((p) => ({ ...p, llmService: service, llmModel: def }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const aiConfig: AIConfig =
        form.provider === 'dify'
          ? { provider: 'dify', dify: { endpoint: form.difyEndpoint } }
          : form.provider === 'local'
          ? { provider: 'local', local: { endpoint: form.localEndpoint, model: form.localModel } }
          : { provider: 'llm', llm: { service: form.llmService, model: form.llmModel } }

      await saveConfig(aiConfig)

      // APIキーを keytar に保存
      if (form.provider === 'llm' && form.llmApiKey) {
        await window.electronAPI.saveApiKey?.(form.llmService, form.llmApiKey)
      } else if (form.provider === 'dify' && form.difyApiKey) {
        await window.electronAPI.saveApiKey?.('dify', form.difyApiKey)
      }

      showToast('AI接続設定を保存しました')
      setForm((p) => ({ ...p, llmApiKey: '', difyApiKey: '' })) // APIキー入力をクリア
    } catch {
      showToast('保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await window.electronAPI.chatAI('接続テストです。「OK」とだけ返してください。', '')
      const ok = !result.startsWith('⚠️')
      setTestResult({ ok, msg: ok ? '接続成功：' + result.slice(0, 40) : result.slice(0, 80) })
    } catch (e) {
      setTestResult({ ok: false, msg: String(e) })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">AI接続設定</h2>

      <div className="space-y-3 mb-4">
        {/* ── LLM直接接続 ── */}
        <div
          className={`border rounded-xl p-4 transition-colors ${form.provider === 'llm' ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200'}`}
        >
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="radio"
              name="provider"
              checked={form.provider === 'llm'}
              onChange={() => setForm((p) => ({ ...p, provider: 'llm' }))}
              className="accent-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">LLM直接接続（クラウド）</span>
            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Gemini優先</span>
          </label>

          {form.provider === 'llm' && (
            <div className="space-y-3 pl-5">
              {/* サービス選択 */}
              <div className="flex gap-2 flex-wrap">
                {LLM_SERVICES.map((svc) => (
                  <label key={svc.value} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="llmService"
                      checked={form.llmService === svc.value}
                      onChange={() => handleServiceChange(svc.value)}
                      className="accent-blue-500"
                    />
                    <span className="text-xs text-gray-700">{svc.label}</span>
                    {svc.hint && <span className="text-[10px] text-gray-400">{svc.hint}</span>}
                  </label>
                ))}
              </div>

              {/* モデル名 */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">モデル名</label>
                <input
                  type="text"
                  value={form.llmModel}
                  onChange={(e) => setForm((p) => ({ ...p, llmModel: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>

              {/* APIキー */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  APIキー
                  <span className="ml-1 text-gray-400">（入力すると保存されます）</span>
                </label>
                <input
                  type="password"
                  value={form.llmApiKey}
                  onChange={(e) => setForm((p) => ({ ...p, llmApiKey: e.target.value }))}
                  placeholder="設定済みの場合は空欄でOK"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Dify ── */}
        <div
          className={`border rounded-xl p-4 transition-colors ${form.provider === 'dify' ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200'}`}
        >
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="radio"
              name="provider"
              checked={form.provider === 'dify'}
              onChange={() => setForm((p) => ({ ...p, provider: 'dify' }))}
              className="accent-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Dify</span>
            <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium">優先推奨</span>
          </label>

          {form.provider === 'dify' && (
            <div className="space-y-2 pl-5">
              <div>
                <label className="block text-xs text-gray-600 mb-1">エンドポイント</label>
                <input
                  type="url"
                  value={form.difyEndpoint}
                  onChange={(e) => setForm((p) => ({ ...p, difyEndpoint: e.target.value }))}
                  placeholder="https://api.dify.ai/v1"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  APIキー <span className="text-gray-400">（入力すると保存されます）</span>
                </label>
                <input
                  type="password"
                  value={form.difyApiKey}
                  onChange={(e) => setForm((p) => ({ ...p, difyApiKey: e.target.value }))}
                  placeholder="app-●●●●●●●●●●●"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── ローカルLLM接続 ── */}
        <div
          className={`border rounded-xl p-4 transition-colors ${form.provider === 'local' ? 'border-green-400 bg-green-50/30' : 'border-gray-200'}`}
        >
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="radio"
              name="provider"
              checked={form.provider === 'local'}
              onChange={() => setForm((p) => ({ ...p, provider: 'local' }))}
              className="accent-green-600"
            />
            <span className="text-sm font-medium text-gray-700">ローカルLLM接続</span>
            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">APIキー不要</span>
          </label>

          {form.provider === 'local' && (
            <div className="space-y-2 pl-5">
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 mb-3">
                💻 Ollama等のローカルLLMが起動している必要があります。<br />
                ローカルLLMを使った場合は、AIとの対話が外部に出ていくことはありません。
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">エンドポイントURL</label>
                <input
                  type="url"
                  value={form.localEndpoint}
                  onChange={(e) => setForm((p) => ({ ...p, localEndpoint: e.target.value }))}
                  placeholder="http://localhost:11434"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
                />
                <p className="mt-1 text-[10px] text-gray-400">
                  Ollama: http://localhost:11434　／　LM Studio: http://localhost:1234
                </p>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">モデル名</label>
                <input
                  type="text"
                  value={form.localModel}
                  onChange={(e) => setForm((p) => ({ ...p, localModel: e.target.value }))}
                  placeholder="gemma3:4b"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
                />
                <p className="mt-1 text-[10px] text-gray-400">
                  例: llama3.2:3b / gemma3:4b / qwen3.5:0.8b / phi4-mini:3.8b
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Langflow（近日対応） ── */}
        <div className="border border-gray-200 rounded-xl p-4 opacity-50 cursor-not-allowed">
          <div className="flex items-center gap-2">
            <input type="radio" disabled className="accent-gray-400" />
            <span className="text-sm font-medium text-gray-500">Langflow</span>
            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">近日対応</span>
          </div>
        </div>
      </div>

      {/* テスト結果 */}
      {testResult && (
        <div className={`flex items-start gap-2 p-3 rounded-lg text-xs mb-3
          ${testResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {testResult.ok ? <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" /> : <XCircle size={14} className="flex-shrink-0 mt-0.5" />}
          <span className="break-all">{testResult.msg}</span>
        </div>
      )}

      {/* ボタン */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleTest}
          disabled={testing}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors"
        >
          {testing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
          接続テスト
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg transition-colors"
        >
          {saving && <Loader2 size={13} className="animate-spin" />}
          保存する
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// 4. エクスポートセクション
// ─────────────────────────────────────────────────────

function ExportSection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [exporting, setExporting] = useState<string | null>(null)

  const handleCSV = async () => {
    setExporting('csv')
    try {
      const result = await window.electronAPI.exportCSV()
      if (result.success) showToast('CSVエクスポートが完了しました')
      else if (result.error !== 'キャンセルされました') showToast(result.error ?? '失敗しました', 'error')
    } finally {
      setExporting(null)
    }
  }

  const handlePDFPortfolio = async () => {
    setExporting('pdf-portfolio')
    try {
      const result = await window.electronAPI.exportPDFPortfolio()
      if (result.success) showToast('PDFポートフォリオを保存しました')
      else if (result.error !== 'キャンセルされました') showToast(result.error ?? '失敗しました', 'error')
    } finally {
      setExporting(null)
    }
  }

  const handlePDFTimeline = async () => {
    setExporting('pdf-timeline')
    try {
      const result = await window.electronAPI.exportPDFTimeline()
      if (result.success) showToast('タイムライン印刷が完了しました')
      else if (result.error !== 'キャンセルされました') showToast(result.error ?? '失敗しました', 'error')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">エクスポート</h2>
      <div className="space-y-3">
        {/* CSV */}
        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-700 mb-1">CSVエクスポート（全データ）</p>
          <p className="text-[11px] text-gray-400 mb-3">学習カード・アウトプット・ゴール・AI履歴の全データを5ファイルのZIPで出力します。</p>
          <button
            onClick={handleCSV}
            disabled={exporting === 'csv'}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg transition-colors"
          >
            {exporting === 'csv' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            CSVエクスポート（全データ）
          </button>
        </div>

        {/* PDFポートフォリオ */}
        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-700 mb-1">PDFポートフォリオ（A4縦）</p>
          <p className="text-[11px] text-gray-400 mb-3">WBゴール・キャリアゴール・学習履歴をA4縦レイアウトで出力します。</p>
          <button
            onClick={handlePDFPortfolio}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download size={13} />
            PDFポートフォリオ（A4）
          </button>
        </div>

        {/* PDFタイムライン */}
        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-medium text-gray-700 mb-1">PDFタイムライン印刷</p>
          <p className="text-[11px] text-gray-400 mb-3">タイムライン画面をそのままA3横でPDF出力します。</p>
          <button
            onClick={handlePDFTimeline}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download size={13} />
            PDFタイムライン印刷
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// 5. データ管理セクション
// ─────────────────────────────────────────────────────

function DataSection({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [anonymize, setAnonymize]     = useState(true)
  const [exporting, setExporting]     = useState(false)
  const [exportingCSV, setExportingCSV] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)

  const today = new Date()
  const todayStr = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`

  const handleCSV = async () => {
    setExportingCSV(true)
    try {
      const result = await window.electronAPI.exportCSV()
      if (result.success) showToast('CSVエクスポートが完了しました')
      else if (result.error !== 'キャンセルされました') showToast(result.error ?? '失敗しました', 'error')
    } finally {
      setExportingCSV(false)
    }
  }

  const handleResearch = async () => {
    setExporting(true)
    try {
      const result = await window.electronAPI.exportResearchLog(anonymize)
      if (result.success) {
        showToast(`research-${todayStr}.zip を保存しました`)
      } else if (result.error !== 'キャンセルされました') {
        showToast(result.error ?? '失敗しました', 'error')
      }
    } finally {
      setExporting(false)
    }
  }

  const handleBackupAndReset = async () => {
    setExportingCSV(true)
    try {
      const result = await window.electronAPI.exportCSV()
      if (result.success) {
        showToast('バックアップ完了。続けて初期化してください')
      }
    } finally {
      setExportingCSV(false)
    }
  }


  return (
    <div className="max-w-lg space-y-5">
      <h2 className="text-sm font-semibold text-gray-800">データ管理</h2>

      {/* バックアップ */}
      <section>
        <h3 className="text-xs font-medium text-gray-600 mb-2">バックアップ</h3>
        <div className="border border-gray-200 rounded-xl p-4">
          <button
            onClick={handleCSV}
            disabled={exportingCSV}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors"
          >
            {exportingCSV ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            CSVエクスポート（全データ）
          </button>
        </div>
      </section>

      {/* 研究データ */}
      <section>
        <h3 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1.5">
          <FlaskConical size={13} />
          研究データ
        </h3>
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            実証実験用の行動ログをエクスポートします。通常のCSVエクスポートとは別ファイルです。
          </p>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={anonymize}
              onChange={(e) => setAnonymize(e.target.checked)}
              className="rounded border-gray-300 accent-blue-500"
            />
            <span className="text-xs text-gray-700">
              氏名・ゴールテキストを匿名化する
              <span className="ml-1 text-[10px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded">推奨</span>
            </span>
          </label>
          <button
            onClick={handleResearch}
            disabled={exporting}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg transition-colors"
          >
            {exporting ? <Loader2 size={13} className="animate-spin" /> : <FlaskConical size={13} />}
            研究データをエクスポート
          </button>
        </div>
      </section>

      {/* 初期化 */}
      <section>
        <h3 className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1.5">
          <AlertTriangle size={13} />
          初期化
        </h3>
        <div className="border border-red-200 rounded-xl p-4 space-y-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            すべての学習データ・ゴール・AI履歴が削除されます。
            <span className="font-medium text-gray-700">AI接続設定（APIキー等）は保持されます。</span>
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleBackupAndReset}
              disabled={exportingCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors"
            >
              {exportingCSV ? <Loader2 size={12} className="animate-spin" /> : <Shield size={12} />}
              バックアップしてから初期化
            </button>
            <button
              onClick={() => setShowResetDialog(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              <AlertTriangle size={12} />
              データを初期化する
            </button>
          </div>
        </div>
      </section>

      {/* 初期化確認ダイアログ */}
      <ResetConfirmModal
        isOpen={showResetDialog}
        onCancel={() => setShowResetDialog(false)}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────
// 6. 表示・言語セクション
// ─────────────────────────────────────────────────────

function DisplaySection() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  return (
    <div className="max-w-lg">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">表示・言語</h2>
      <div className="space-y-5">
        {/* 言語 */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">言語</label>
          <select
            disabled
            className="w-48 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          >
            <option>日本語</option>
          </select>
          <p className="mt-1 text-[11px] text-gray-400">将来のバージョンで多言語対応予定です</p>
        </div>

        {/* テーマ */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">テーマ</label>
          <div className="flex gap-2">
            {[
              { value: 'light',  label: '☀️ ライト' },
              { value: 'dark',   label: '🌙 ダーク' },
              { value: 'system', label: '🖥 システム連動' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value as typeof theme)}
                className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                  theme === opt.value
                    ? 'border-blue-400 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-gray-400">ダーク・システム連動は将来のバージョンで対応予定です</p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// SettingsPage（メイン export）
// ─────────────────────────────────────────────────────

interface SettingsPageProps {
  onClose: () => void
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'career',   label: 'キャリアゴール',         icon: <Target size={14} /> },
  { id: 'wellbeing',label: 'WBゴール',               icon: <Leaf size={14} /> },
  { id: 'ai',       label: 'AI接続設定',             icon: <Cpu size={14} /> },
  { id: 'export',   label: 'エクスポート',           icon: <Download size={14} /> },
  { id: 'data',     label: 'データ管理',             icon: <Database size={14} /> },
  { id: 'display',  label: '表示・言語',             icon: <Globe size={14} /> },
]

export function SettingsPage({ onClose }: SettingsPageProps) {
  const [active, setActive]     = useState<SectionId>('career')
  const { toast, showToast }    = useToast()

  const renderSection = () => {
    switch (active) {
      case 'career':    return <CareerSection    showToast={showToast} />
      case 'wellbeing': return <WellbeingSection showToast={showToast} />
      case 'ai':        return <AISection        showToast={showToast} />
      case 'export':    return <ExportSection    showToast={showToast} />
      case 'data':      return <DataSection      showToast={showToast} />
      case 'display':   return <DisplaySection />
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-white flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0">
        <h1 className="text-sm font-bold text-gray-800">設定</h1>
        <button
          onClick={onClose}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="設定を閉じる"
        >
          <ChevronRight size={14} className="rotate-180" />
          戻る
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* サイドバー */}
        <nav
          className="flex-shrink-0 border-r border-gray-100 py-3 overflow-y-auto"
          style={{ width: 148 }}
          aria-label="設定メニュー"
        >
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`
                w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left transition-colors
                ${active === item.id
                  ? 'bg-blue-50 text-blue-700 font-semibold border-r-2 border-blue-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }
              `}
              aria-current={active === item.id ? 'page' : undefined}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* コンテンツエリア */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {renderSection()}
        </main>
      </div>

      {/* トースト通知 */}
      <Toast toast={toast} />
    </div>
  )
}
