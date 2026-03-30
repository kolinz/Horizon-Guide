import React, { useState, useCallback } from 'react'
import { AppRoot } from './components/Onboarding/OnboardingFlow'
import { TopBar } from './components/TopBar'
import { TimelineView } from './components/Timeline/TimelineView'
import { AISidebar } from './components/Sidebar/AISidebar'
import { SettingsPage } from './components/Settings/SettingsPage'
import { LearningCardModal } from './components/Modals/LearningCardModal'
import { OutputCardModal } from './components/Modals/OutputCardModal'
import { useTimelineStore } from './stores/timelineStore'
import { useAIStore } from './stores/aiStore'
import type { LearningCard, OutputCard } from './types'

// ──────────────────────────────────────────────
// ホーム画面本体
// ──────────────────────────────────────────────

function HomeScreen() {
  const loadCards = useTimelineStore((s) => s.loadCards)
  const loadConfig = useAIStore((s) => s.loadConfig)

  // 初回ロード
  React.useEffect(() => {
    loadCards()
    loadConfig()
  }, [loadCards, loadConfig])

  // 画面状態
  const [showSettings, setShowSettings] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // 学習カードモーダル
  const [learningCardModal, setLearningCardModal] = useState<{
    open: boolean
    card?: LearningCard
  }>({ open: false })

  // アウトプットカードモーダル
  const [outputCardModal, setOutputCardModal] = useState<{
    open: boolean
    learningCardId: string
    output?: OutputCard
  }>({ open: false, learningCardId: '' })

  const handleAddCard    = useCallback(() => setLearningCardModal({ open: true }), [])
  const handleEditCard   = useCallback((card: LearningCard) => setLearningCardModal({ open: true, card }), [])
  const handleAddOutput  = useCallback((id: string) => setOutputCardModal({ open: true, learningCardId: id }), [])
  const handleEditOutput = useCallback((output: OutputCard) =>
    setOutputCardModal({ open: true, learningCardId: output.learningCardId, output }), [])

  if (showSettings) {
    return <SettingsPage onClose={() => setShowSettings(false)} />
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-50">
      {/* トップバー */}
      <TopBar
        onOpenSettings={() => setShowSettings(true)}
        onAddCard={handleAddCard}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />

      {/* メインエリア */}
      <div className="flex flex-1 overflow-hidden">
        {/* タイムライン */}
        <TimelineView
          onAddCard={handleAddCard}
          onEditCard={handleEditCard}
          onAddOutput={handleAddOutput}
          onEditOutput={handleEditOutput}
        />

        {/* AIサイドバー */}
        {isSidebarOpen && <AISidebar onClose={() => setIsSidebarOpen(false)} />}
      </div>

      {/* モーダル群 */}
      <LearningCardModal
        isOpen={learningCardModal.open}
        onClose={() => setLearningCardModal({ open: false })}
        card={learningCardModal.card}
      />
      <OutputCardModal
        isOpen={outputCardModal.open}
        onClose={() => setOutputCardModal({ open: false, learningCardId: '' })}
        learningCardId={outputCardModal.learningCardId}
        output={outputCardModal.output}
      />
    </div>
  )
}

// ──────────────────────────────────────────────
// App（エントリポイント）
// ──────────────────────────────────────────────

function App(): React.ReactElement {
  return (
    <AppRoot>
      <HomeScreen />
    </AppRoot>
  )
}

export default App
