import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  ChevronRight, Loader2, Sparkles, RefreshCw,
  ArrowRight, CheckCircle2, SkipForward, Key, ExternalLink,
} from 'lucide-react'
import { useGoalStore } from '../../stores/goalStore'

// ──────────────────────────────────────────────
// 型
// ──────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4

// ──────────────────────────────────────────────
// ステップインジケーター
// ──────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 1, label: 'ようこそ' },
    { id: 2, label: 'AI設定' },
    { id: 3, label: 'キャリアゴール' },
    { id: 4, label: 'WBゴール' },
  ]

  return (
    <div className="flex items-center justify-center gap-2 mb-8" aria-label="ステップ">
      {steps.map((s, idx) => (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={`
                w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                transition-all duration-300
                ${current === s.id
                  ? 'bg-blue-500 text-white scale-110 shadow-md shadow-blue-200'
                  : current > s.id
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-400'
                }
              `}
              aria-current={current === s.id ? 'step' : undefined}
            >
              {current > s.id ? <CheckCircle2 size={14} /> : s.id}
            </div>
            <span
              className={`text-[10px] whitespace-nowrap font-medium transition-colors ${
                current === s.id ? 'text-blue-600' : current > s.id ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              {s.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`w-10 h-px mb-4 transition-colors duration-300 ${
                current > s.id ? 'bg-green-400' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ──────────────────────────────────────────────
// Step 1 — ウェルカム画面
// ──────────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center max-w-md mx-auto">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-xl shadow-blue-200">
        <span className="text-4xl">🧭</span>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Horizon Guide</h1>
      <p className="text-base text-gray-500 mb-2 leading-relaxed">キャリアゴールを起点に、学習を設計・記録し、</p>
      <p className="text-base text-gray-500 mb-8 leading-relaxed">AIの助言とともに着実に前進するためのツールです。</p>
      <div className="w-full space-y-2.5 mb-10 text-left">
        {[
          { icon: '🎯', title: 'ゴール起点の設計', desc: 'キャリアゴールから逆算した学習計画を立てる' },
          { icon: '📅', title: '横軸タイムライン', desc: '過去・現在・未来の学習を一覧で可視化する' },
          { icon: '📦', title: 'アウトプット紐づけ', desc: '各学習に成果物（記事・資格など）を必ず記録する' },
          { icon: '🤖', title: 'AI助言', desc: 'Dify / Gemini などのAIが学習計画を支援する' },
        ].map((f) => (
          <div key={f.title} className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-xl flex-shrink-0 mt-0.5">{f.icon}</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">{f.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-500 hover:bg-blue-600 text-white text-base font-semibold rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
      >
        はじめる <ArrowRight size={18} />
      </button>
      <p className="mt-3 text-xs text-gray-400">セットアップは1〜2分で完了します</p>
    </div>
  )
}

// ──────────────────────────────────────────────
// Step 2 — AI接続設定（Gemini / ローカルLLM）
// ──────────────────────────────────────────────

type AISetupMode = 'gemini' | 'local'

function AISetupStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [mode, setMode] = useState<AISetupMode>('gemini')
  const [apiKey, setApiKey] = useState('')
  const [localEndpoint, setLocalEndpoint] = useState('http://localhost:11434')
  const [localModel, setLocalModel] = useState('gemma3:4b')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      if (mode === 'gemini') {
        if (!apiKey.trim()) { setError('APIキーを入力してください'); setSaving(false); return }
        await window.electronAPI.saveApiKey('gemini', apiKey.trim())
        await window.electronAPI.saveAIConfig({
          provider: 'llm',
          llm: { service: 'gemini', model: 'gemini-2.5-flash-lite' },
        })
      } else {
        if (!localEndpoint.trim()) { setError('エンドポイントURLを入力してください'); setSaving(false); return }
        if (!localModel.trim()) { setError('モデル名を入力してください'); setSaving(false); return }
        await window.electronAPI.saveAIConfig({
          provider: 'local',
          local: { endpoint: localEndpoint.trim(), model: localModel.trim() },
        })
      }
      setSaved(true)
      setTimeout(() => onNext(), 800)
    } catch {
      setError('保存に失敗しました。もう一度お試しください。')
    } finally {
      setSaving(false)
    }
  }

  const canSave = mode === 'gemini' ? !!apiKey.trim() : (!!localEndpoint.trim() && !!localModel.trim())

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="mb-5">
        <div className="text-3xl mb-3">🤖</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI接続を設定しましょう</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          学習計画の助言に使うAIを選択してください。後から設定画面で変更できます。
        </p>
      </div>

      {/* 接続方式の選択 */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          type="button"
          onClick={() => { setMode('gemini'); setError(''); setSaved(false) }}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
            mode === 'gemini'
              ? 'border-blue-400 bg-blue-50/50 shadow-sm'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <span className="text-2xl">☁️</span>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">Gemini（クラウド）</p>
            <p className="text-[10px] text-gray-500 mt-0.5">無料枠あり・APIキー必要</p>
          </div>
          {mode === 'gemini' && (
            <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">選択中</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => { setMode('local'); setError(''); setSaved(false) }}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
            mode === 'local'
              ? 'border-green-400 bg-green-50/50 shadow-sm'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <span className="text-2xl">💻</span>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">ローカルLLM</p>
            <p className="text-[10px] text-gray-500 mt-0.5">APIキー不要・完全ローカル</p>
          </div>
          {mode === 'local' && (
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">選択中</span>
          )}
        </button>
      </div>

      {/* Gemini設定 */}
      {mode === 'gemini' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-700 mb-2 font-medium">Gemini API キーの取得方法：</p>
            <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
              <li>Google AI Studio（aistudio.google.com）にアクセス</li>
              <li>「Get API key」をクリック</li>
              <li>APIキーをコピーして下に貼り付け</li>
            </ol>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-blue-500 hover:text-blue-700 underline"
              onClick={(e) => { e.preventDefault(); window.open('https://aistudio.google.com/app/apikey') }}
            >
              <ExternalLink size={11} /> Google AI Studio を開く
            </a>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Gemini API キー <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Key size={14} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setError('') }}
                placeholder="AIzaSy..."
                className={`w-full pl-8 pr-4 py-3 text-sm border rounded-xl outline-none transition-colors ${
                  error ? 'border-red-400 bg-red-50' : saved ? 'border-green-400 bg-green-50' : 'border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                }`}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
          </div>
        </div>
      )}

      {/* ローカルLLM設定 */}
      {mode === 'local' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-xs text-green-700 leading-relaxed">
              💻 Ollama等のローカルLLMが起動している必要があります。<br />
              ローカルLLMを使った場合は、AIとの対話が外部に出ていくことはありません。
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              エンドポイントURL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={localEndpoint}
              onChange={(e) => { setLocalEndpoint(e.target.value); setError('') }}
              placeholder="http://localhost:11434"
              className={`w-full px-4 py-3 text-sm border rounded-xl outline-none transition-colors ${
                error ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-green-400 focus:ring-2 focus:ring-green-100'
              }`}
            />
            <p className="mt-1 text-[10px] text-gray-400">Ollama: 11434　／　LM Studio: 1234</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              モデル名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={localModel}
              onChange={(e) => { setLocalModel(e.target.value); setError('') }}
              placeholder="gemma3:4b"
              className={`w-full px-4 py-3 text-sm border rounded-xl outline-none transition-colors ${
                error ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-green-400 focus:ring-2 focus:ring-green-100'
              }`}
            />
            <p className="mt-1 text-[10px] text-gray-400">例: gemma3:4b / llama3.2 / qwen2.5 / mistral</p>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-red-500">⚠ {error}</p>}
      {saved && <p className="mt-3 text-xs text-green-600">✓ 保存しました。次のステップに進みます...</p>}

      <div className="flex gap-3 mt-5">
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors font-medium"
        >
          <SkipForward size={14} /> スキップ（後で設定）
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || saved || !canSave}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-2xl transition-all ${
            !canSave || saving || saved
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : mode === 'gemini'
              ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-200'
              : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200'
          }`}
        >
          {saving ? <><Loader2 size={14} className="animate-spin" />保存中...</> : saved ? '✓ 保存済み' : <>設定して次へ <ChevronRight size={14} /></>}
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Step 3 — キャリアゴール入力
// ──────────────────────────────────────────────

interface CareerFormState {
  text: string
  targetDate: string
  userName: string
}

function CareerGoalStep({ initialState, onChange, onNext }: {
  initialState: CareerFormState
  onChange: (s: CareerFormState) => void
  onNext: () => void
}) {
  const [text, setText] = useState(initialState.text)
  const [targetDate, setTargetDate] = useState(initialState.targetDate)
  const [userName, setUserName] = useState(initialState.userName)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { textareaRef.current?.focus() }, [])
  useEffect(() => { onChange({ text, targetDate, userName }) }, [text, targetDate, userName, onChange])

  const handleNext = () => {
    if (!text.trim()) { setError('キャリアゴールを入力してください'); textareaRef.current?.focus(); return }
    setError(''); onNext()
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="mb-6">
        <div className="text-3xl mb-3">🎯</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">あなたのキャリアゴールを教えてください</h2>
        <p className="text-sm text-gray-500 leading-relaxed">「何者になりたいか・何を達成したいか」を自由に書いてください。後から変更することもできます。</p>
      </div>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">キャリアゴール <span className="text-red-500">*</span></label>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); setError('') }}
            rows={3}
            placeholder="例：データサイエンティストに転職して、機械学習でビジネス課題を解決したい"
            className={`w-full px-4 py-3 text-sm border rounded-xl outline-none resize-none leading-relaxed transition-colors ${
              error ? 'border-red-400 focus:ring-2 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
            }`}
          />
          {error && <p className="mt-1.5 text-xs text-red-500">⚠ {error}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">目標時期 <span className="ml-1 text-xs text-gray-400 font-normal">任意</span></label>
            <input type="month" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">氏名 <span className="ml-1 text-xs text-gray-400 font-normal">PDF用・任意</span></label>
            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="山田 太郎"
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors" />
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 leading-relaxed">
          💡 ゴールは具体的なほど、AIがより的確な助言を提供できます。職種・スキル・時期を含めると効果的です。
        </div>
        <button onClick={handleNext}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-500 hover:bg-blue-600 text-white text-base font-semibold rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all duration-200 active:scale-[0.98]">
          次へ：ウェルビーイングゴールを設定 <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Step 4 — WBゴール設定（任意）
// ──────────────────────────────────────────────

function WellbeingGoalStep({ careerGoalText, onComplete, onSkip, isSubmitting }: {
  careerGoalText: string
  onComplete: (wbGoalText: string | null, axes: { personal: string | null; social: string | null; planet: string | null }, aiGenerated: boolean) => Promise<void>
  onSkip: () => Promise<void>
  isSubmitting: boolean
}) {
  const [personal, setPersonal] = useState('')
  const [social, setSocial] = useState('')
  const [planet, setPlanet] = useState('')
  const [goalText, setGoalText] = useState('')
  const [aiGenerated, setAiGenerated] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [adoptError, setAdoptError] = useState('')

  const handleGenerate = async () => {
    setGenerating(true); setGenError('')
    try {
      const prompt =
        `以下の3軸の価値観と、キャリアゴール「${careerGoalText}」をもとに、` +
        `ウェルビーイングゴール（なぜそのキャリアを目指すのかという根本的な動機）を` +
        `日本語で一文（30〜50字程度）で生成してください。文章のみ出力し、説明や前置きは不要です。\n\n` +
        `個人軸: ${personal || '未記入'}\n社会軸: ${social || '未記入'}\n地球軸: ${planet || '未記入'}`
      const result = await window.electronAPI.chatAI(prompt, '')
      const clean = result.replace(/^["「『]|["」』]$/g, '').replace(/^⚠️.+/, '').trim()
      if (!clean) throw new Error('空のレスポンス')
      setGoalText(clean); setAiGenerated(true)
    } catch {
      setGenError('AI生成に失敗しました。手動でWBゴールを入力するか、スキップしてください。')
    } finally {
      setGenerating(false)
    }
  }

  const handleAdopt = async () => {
    if (!goalText.trim()) { setAdoptError('WBゴールのテキストを入力または生成してください'); return }
    setAdoptError('')
    await onComplete(goalText.trim(), {
      personal: personal.trim() || null,
      social: social.trim() || null,
      planet: planet.trim() || null,
    }, aiGenerated)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-5">
        <div className="text-3xl mb-3">🌱</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">学習の「Why」を設定しましょう</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          OECD Education 2030「Learning Compass」の概念に基づき、キャリアゴールの根底にある価値観・動機を言語化します。
          <span className="font-medium text-gray-600">任意設定です。後から変更・追加できます。</span>
        </p>
      </div>
      <div className="flex items-start gap-2.5 bg-wb-bg border border-wb-green/20 rounded-xl px-4 py-3 mb-5 text-xs text-wb-green leading-relaxed">
        <span className="flex-shrink-0 text-base">🌱</span>
        <p>ウェルビーイングゴールは「なぜそのキャリアを目指すのか」という根本的な動機です。個人・社会・地球の3軸で表現することで、学習の目的が明確になり、内発的動機を高めます。</p>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { emoji: '🧘', label: '個人軸', desc: '自己成長・自己実現・ウェルネス', value: personal, onChange: setPersonal, ph: '例：データで自分の意思決定の質を上げる' },
          { emoji: '🤝', label: '社会軸', desc: 'コミュニティ・他者への貢献', value: social, onChange: setSocial, ph: '例：地域の中小企業のDX推進を支援する' },
          { emoji: '🌍', label: '地球軸', desc: '持続可能性・次世代への責任', value: planet, onChange: setPlanet, ph: '例：AIの民主化で次世代の選択肢を広げる' },
        ].map((ax) => (
          <div key={ax.label}>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1">
              <span>{ax.emoji}</span><span>{ax.label}</span><span className="text-gray-400 font-normal">({ax.desc})</span>
            </label>
            <textarea value={ax.value} onChange={(e) => { ax.onChange(e.target.value); setAiGenerated(false) }}
              rows={3} placeholder={ax.ph}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:border-wb-green/60 focus:ring-2 focus:ring-wb-green/20 transition-colors resize-none leading-relaxed" />
          </div>
        ))}
      </div>
      <button type="button" onClick={handleGenerate} disabled={generating || isSubmitting}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-wb-green bg-wb-bg border border-wb-green/30 hover:bg-wb-green/10 disabled:opacity-50 rounded-xl transition-colors mb-4">
        {generating ? <><Loader2 size={14} className="animate-spin" />AI生成中...</> : <><Sparkles size={14} />AIにWBゴールを提案してもらう</>}
      </button>
      {genError && <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">⚠ {genError}</p>}
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 mb-5">
        <label className="block text-xs font-medium text-gray-700 mb-2">
          WBゴール（全体テキスト）
          {aiGenerated && <span className="ml-2 text-[10px] text-wb-green bg-wb-bg px-1.5 py-0.5 rounded">✨ AI生成</span>}
        </label>
        <div className="relative mb-2">
          <span className="absolute left-3 top-2.5 text-base pointer-events-none select-none">🌱</span>
          <input type="text" value={goalText}
            onChange={(e) => { setGoalText(e.target.value); setAiGenerated(false); setAdoptError('') }}
            placeholder="例：地域のデジタル格差をなくして次世代の可能性を広げたい"
            className={`w-full pl-8 pr-3 py-2.5 text-sm border rounded-xl outline-none transition-colors ${
              adoptError ? 'border-red-400 focus:ring-2 focus:ring-red-100 bg-red-50' : 'border-gray-300 focus:border-wb-green/60 focus:ring-2 focus:ring-wb-green/20 bg-white'
            }`} />
        </div>
        {adoptError && <p className="text-xs text-red-500 mb-2">{adoptError}</p>}
        <div className="flex justify-end">
          <button type="button" onClick={handleGenerate} disabled={generating || isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-40 rounded-lg transition-colors">
            <RefreshCw size={11} className={generating ? 'animate-spin' : ''} />再生成
          </button>
        </div>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onSkip} disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-2xl transition-colors font-medium">
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <SkipForward size={14} />}スキップして始める
        </button>
        <button type="button" onClick={handleAdopt} disabled={isSubmitting || !goalText.trim()}
          className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-semibold rounded-2xl transition-all ${
            !goalText.trim() || isSubmitting ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-wb-green text-white hover:opacity-90 shadow-lg shadow-green-200 hover:shadow-xl'
          }`}>
          {isSubmitting ? <><Loader2 size={14} className="animate-spin" />保存中...</> : <>設定して始める <ChevronRight size={14} /></>}
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// OnboardingFlow（メイン export）
// ──────────────────────────────────────────────

interface OnboardingFlowProps {
  onComplete: () => void
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { saveCareerGoal, saveWellbeingGoal } = useGoalStore()
  const [step, setStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [careerForm, setCareerForm] = useState({ text: '', targetDate: '', userName: '' })

  const handleCareerNext = useCallback(() => { setStep(4) }, [])

  const persistCareerGoal = useCallback(async () => {
    await saveCareerGoal({
      text: careerForm.text.trim(),
      targetDate: careerForm.targetDate || null,
      userName: careerForm.userName.trim() || null,
    })
  }, [careerForm, saveCareerGoal])

  const handleCompleteWithWB = useCallback(async (
    wbText: string | null,
    axes: { personal: string | null; social: string | null; planet: string | null },
    aiGenerated: boolean
  ) => {
    setIsSubmitting(true)
    try {
      await persistCareerGoal()
      if (wbText) await saveWellbeingGoal({ text: wbText, axes, aiGenerated })
      onComplete()
    } finally {
      setIsSubmitting(false)
    }
  }, [persistCareerGoal, saveWellbeingGoal, onComplete])

  const handleSkip = useCallback(async () => {
    setIsSubmitting(true)
    try {
      await persistCareerGoal()
      onComplete()
    } finally {
      setIsSubmitting(false)
    }
  }, [persistCareerGoal, onComplete])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex flex-col">
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {step > 1 && <StepIndicator current={step} />}
          {step === 1 && <WelcomeStep onNext={() => setStep(2)} />}
          {step === 2 && <AISetupStep onNext={() => setStep(3)} onSkip={() => setStep(3)} />}
          {step === 3 && <CareerGoalStep initialState={careerForm} onChange={setCareerForm} onNext={handleCareerNext} />}
          {step === 4 && (
            <WellbeingGoalStep
              careerGoalText={careerForm.text}
              onComplete={handleCompleteWithWB}
              onSkip={handleSkip}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </main>
      <footer className="py-3 text-center">
        <p className="text-[11px] text-gray-300 select-none">Horizon Guide v0.1.0</p>
      </footer>
    </div>
  )
}

// ──────────────────────────────────────────────
// AppRoot
// ──────────────────────────────────────────────

interface AppRootProps {
  children: React.ReactNode
}

export function AppRoot({ children }: AppRootProps) {
  const { careerGoal, loadGoals } = useGoalStore()
  const [checked, setChecked] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const init = async () => { await loadGoals(); setChecked(true) }
    init()
  }, [loadGoals])

  useEffect(() => {
    if (checked) setShowOnboarding(careerGoal === null)
  }, [checked, careerGoal])

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <span className="text-xl">🧭</span>
          </div>
          <Loader2 size={20} className="animate-spin text-blue-400" />
          <p className="text-xs text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
  }

  return <>{children}</>
}
