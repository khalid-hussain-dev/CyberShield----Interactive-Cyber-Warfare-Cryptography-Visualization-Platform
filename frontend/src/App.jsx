import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { Activity, BookOpen, Download, GitCompare, LockKeyhole, LogOut, Menu, Play, Radar, RotateCcw, Shield, Sword, Terminal, Trophy, Zap } from 'lucide-react'
import AppFooter from './components/AppFooter'
import ActionNotice from './components/ActionNotice'
import AuthGate from './components/AuthGate'
import BackendStatus from './components/BackendStatus'
import BrandLoader from './components/BrandLoader'
import EventFeed from './components/EventFeed'
import ExplainModePanel from './components/ExplainModePanel'
import MetricCard from './components/MetricCard'
import NavbarLogo from './components/NavbarLogo'
import NetworkVisualizer from './components/NetworkVisualizer'
import ScenarioRail from './components/ScenarioRail'
import SecurityComparison from './components/SecurityComparison'
import SectionPanel from './components/SectionPanel'
import StatusPill from './components/StatusPill'
import TerminalStream from './components/TerminalStream'
import ScenarioTimeline from './components/ScenarioTimeline'
import CryptoPlayground from './components/CryptoPlayground'
import BlockchainExplorer from './components/BlockchainExplorer'
import IDSPanel from './components/IDSPanel'
import { OperatorScore, Leaderboard } from './components/OperatorHUD'
import ForensicDissector from './components/ForensicDissector'
import DuelLobby from './components/DuelLobby'
import DuelArena from './components/DuelArena'
import { getScenarioExplanation } from './data/scenarioExplanations'
import useAuthSession from './hooks/useAuthSession'
import useBackendHealth from './hooks/useBackendHealth'
import useRealtimeSimulation from './hooks/useRealtimeSimulation'
import useScenarioComparison from './hooks/useScenarioComparison'
import useSimulationData from './hooks/useSimulationData'
import { buildReportFilename, buildScenarioReport, downloadTextFile, riskScore } from './utils/reportBuilder'
import { saveAuditReport, getAuditReports } from './services/simulationApi'

function App() {
  const authSession = useAuthSession()
  const [view, setView] = useState('dashboard')
  const [duelContext, setDuelContext] = useState(null) // { roomCode, role }

  if (authSession.session.status === 'loading') {
    return <BrandLoader text="Authenticating" tone="blue" />
  }

  if (authSession.session.status === 'checking') {
    return <BrandLoader text="Restoring Session" tone="blue" />
  }

  if (authSession.session.status !== 'authenticated') {
    return <AuthGate session={authSession.session} onLogin={authSession.login} onRegister={authSession.register} />
  }

  if (view === 'playground') {
    return <CryptoPlayground onBack={() => setView('dashboard')} />
  }

  if (view === 'duel-lobby') {
    return (
      <div className="min-h-screen bg-cyber-background">
        <Dashboard authSession={authSession} onViewPlayground={() => setView('playground')} onViewDuel={() => setView('duel-lobby')} />
        <DuelLobby
          token={authSession.session.token}
          onBack={() => setView('dashboard')}
          onEnterArena={(ctx) => {
            setDuelContext(ctx)
            setView('duel-arena')
          }}
        />
      </div>
    )
  }

  if (view === 'duel-arena' && duelContext) {
    return (
      <DuelArena
        token={authSession.session.token}
        roomCode={duelContext.roomCode}
        role={duelContext.role}
        onBack={() => { setDuelContext(null); setView('dashboard') }}
      />
    )
  }

  return <Dashboard authSession={authSession} onViewPlayground={() => setView('playground')} onViewDuel={() => setView('duel-lobby')} />
}

function Dashboard({ authSession, onViewPlayground, onViewDuel }) {
  const scoreRef = useRef(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedScenarioId, setSelectedScenarioId] = useState('bank-mitm')
  const [defenseEnabled, setDefenseEnabled] = useState(false)
  const [launched, setLaunched] = useState(false)
  const [actionOverlay, setActionOverlay] = useState(null)
  const [notice, setNotice] = useState(null)
  const [auditHistory, setAuditHistory] = useState([])
  const backendHealth = useBackendHealth()
  const simulation = useSimulationData({ selectedScenarioId, defenseEnabled, launched })
  const realtime = useRealtimeSimulation({ selectedScenarioId, defenseEnabled, launched })
  const comparison = useScenarioComparison(selectedScenarioId)
  const simulationState = realtime.state ?? simulation.state

  const selectedScenario = simulationState.scenario ?? simulation.selectedScenario
  const explanation = getScenarioExplanation(selectedScenarioId)
  const reportReady = comparison.status === 'ready' && comparison.insecure && comparison.secure
  const logoTone = !launched ? 'blue' : defenseEnabled && simulationState.attack_success === false ? 'green' : 'red'
  const attackStream = useMemo(
    () => (realtime.hackerLogs.length > 0 ? realtime.hackerLogs : simulationState.attack_logs),
    [realtime.hackerLogs, simulationState.attack_logs],
  )
  const defenseStream = useMemo(
    () => (realtime.defenderLogs.length > 0 ? realtime.defenderLogs : simulationState.defense_logs),
    [realtime.defenderLogs, simulationState.defense_logs],
  )

  // Load existing audit history on mount
  const loadAuditHistory = useCallback(async () => {
    try {
      const response = await getAuditReports(authSession.session.token)
      setAuditHistory(response.data.reports ?? [])
    } catch {
      // Silently fail — audit history is non-critical
    }
  }, [authSession.session.token])

  useEffect(() => {
    loadAuditHistory()
  }, [loadAuditHistory])

  function showNotice(nextNotice) {
    setNotice(nextNotice)
    window.setTimeout(() => setNotice(null), 2600)
  }

  function handleScenarioSelect(scenarioId) {
    setSelectedScenarioId(scenarioId)
    setLaunched(false)
    setDefenseEnabled(false)
    setNotice(null)
  }

  function handleLaunch() {
    setActionOverlay({ text: 'Launching Attack', tone: 'red' })

    window.setTimeout(async () => {
      setDefenseEnabled(false)
      setLaunched(true)
      setActionOverlay(null)
      showNotice({
        tone: 'red',
        title: 'Intrusion Detected',
        message: `${selectedScenario?.name ?? 'Scenario'} has been launched.`,
      })
      // Award XP for launching attack
      try {
        await fetch('/api/scores/event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authSession.session.token}`,
          },
          body: JSON.stringify({ event_type: 'launch' }),
        })
        if (scoreRef.current) scoreRef.current()
      } catch (err) {
        // Non-blocking
      }
    }, 950)
  }

  function handleDefend() {
    if (!launched) {
      showNotice({
        tone: 'blue',
        title: 'No Active Attack',
        message: 'Launch a scenario before deploying defenses.',
      })
      return
    }

    setActionOverlay({ text: 'Defending System', tone: 'green' })

    window.setTimeout(async () => {
      setDefenseEnabled(true)
      setActionOverlay(null)
      showNotice({
        tone: 'green',
        title: 'Attack Neutralized',
        message: 'Defensive controls have blocked the active threat.',
      })
      // Award XP for deploying defenses
      try {
        await fetch('/api/scores/event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authSession.session.token}`,
          },
          body: JSON.stringify({ event_type: 'defend' }),
        })
        if (scoreRef.current) scoreRef.current()
      } catch (err) {
        // Non-blocking
      }
    }, 950)
  }

  function handleReset() {
    setLaunched(false)
    setDefenseEnabled(false)
    setActionOverlay(null)
    setNotice(null)
  }

  async function handleExportReport() {
    if (!reportReady) {
      showNotice({
        tone: 'yellow',
        title: 'Report Not Ready',
        message: 'Before and after comparison data is still loading.',
      })
      return
    }

    const generatedAt = comparison.generatedAt ?? new Date()
    const content = buildScenarioReport({
      user: authSession.session.user,
      scenario: selectedScenario,
      state: simulationState,
      comparison,
      explanation,
      generatedAt,
    })
    const filename = buildReportFilename(selectedScenarioId, generatedAt)
    downloadTextFile(filename, content)

    // Auto-save to audit log
    try {
      await saveAuditReport(
        {
          scenario_id: selectedScenarioId,
          scenario_name: selectedScenario?.name ?? selectedScenarioId,
          risk_score_before: riskScore(comparison.insecure),
          risk_score_after: riskScore(comparison.secure),
        },
        authSession.session.token,
      )
      await loadAuditHistory()

      // Award XP for exporting report
      try {
        await fetch('/api/scores/event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authSession.session.token}`,
          },
          body: JSON.stringify({ event_type: 'report_exported' }),
        })
        if (scoreRef.current) scoreRef.current()
      } catch (err) {
        // Non-blocking
      }
    } catch {
      // Non-blocking — report already downloaded
    }

    showNotice({
      tone: 'blue',
      title: 'Report Exported',
      message: `${filename} has been generated and archived.`,
    })
  }

  return (
    <div className="flex min-h-screen bg-cyber-background text-cyber-text flex-col">
      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* Collapsible Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-cyber-border bg-cyber-panel p-5 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} shrink-0`}>
        <div className="flex items-center gap-3 mb-8">
          <NavbarLogo tone={logoTone} />
          <div>
            <p className="text-[10px] font-bold uppercase text-cyber-muted">CNS LAB</p>
            <h2 className="text-sm font-bold text-cyber-text">CyberShield</h2>
          </div>
        </div>
        
        <nav className="space-y-1.5">
          {[
            {
              id: 'nav-dashboard',
              label: 'Dashboard HUD',
              icon: <Activity className="h-4 w-4 text-cyber-blue" />,
              onClick: () => { setSidebarOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); },
            },
            {
              id: 'nav-sandbox',
              label: 'Crypto Sandbox',
              icon: <Zap className="h-4 w-4 text-cyber-blue" />,
              onClick: () => { setSidebarOpen(false); onViewPlayground(); },
            },
            {
              id: 'nav-ids',
              label: 'AI-IDS Monitor',
              icon: <Shield className="h-4 w-4 text-cyber-green" />,
              onClick: () => { setSidebarOpen(false); document.getElementById('ids-analysis')?.scrollIntoView({ behavior: 'smooth' }); },
            },
            {
              id: 'nav-blockchain',
              label: 'Blockchain Ledger',
              icon: <GitCompare className="h-4 w-4 text-cyber-yellow" />,
              onClick: () => { setSidebarOpen(false); document.getElementById('blockchain-explorer')?.scrollIntoView({ behavior: 'smooth' }); },
            },
            {
              id: 'nav-leaderboard',
              label: 'Cyber Leaderboard',
              icon: <Trophy className="h-4 w-4 text-cyber-yellow" />,
              onClick: () => { setSidebarOpen(false); document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' }); },
            },
            {
              id: 'nav-duel',
              label: '⚔ Duel Mode',
              icon: <Sword className="h-4 w-4 text-cyber-red" />,
              onClick: () => { setSidebarOpen(false); onViewDuel(); },
            },
            {
              id: 'nav-explain',
              label: 'Explain Mode',
              icon: <BookOpen className="h-4 w-4 text-cyber-blue" />,
              onClick: () => { setSidebarOpen(false); document.getElementById('explain-mode')?.scrollIntoView({ behavior: 'smooth' }); },
            },
          ].map(({ id, label, icon, onClick }) => (
            <button
              key={id}
              id={id}
              onClick={(e) => {
                // Ripple effect
                const btn = e.currentTarget
                const ripple = document.createElement('span')
                const rect = btn.getBoundingClientRect()
                const size = Math.max(rect.width, rect.height)
                ripple.className = 'ripple'
                ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`
                btn.appendChild(ripple)
                setTimeout(() => ripple.remove(), 550)
                onClick()
              }}
              className="sidebar-nav-btn flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-semibold text-cyber-text hover:bg-cyber-panelSoft"
            >
              {icon}
              {label}
            </button>
          ))}

          <button
            id="nav-signout"
            onClick={() => { setSidebarOpen(false); authSession.logout(); }}
            className="sidebar-nav-btn flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-semibold text-cyber-muted hover:text-cyber-red hover:bg-cyber-red/10 mt-8"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {actionOverlay ? <BrandLoader text={actionOverlay.text} tone={actionOverlay.tone} /> : null}
        <ActionNotice notice={notice} />

        {/* ── Sticky Navbar ── */}
        <div className="sticky-navbar px-4 py-3 sm:px-6 lg:px-8 mb-4">
          <header className="mx-auto max-w-[1480px] rounded-lg border border-cyber-border bg-cyber-panel/80 px-4 py-4 shadow-panel">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  {/* Hamburger menu button */}
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-cyber-border bg-cyber-panelSoft text-cyber-text hover:border-cyber-blue"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <NavbarLogo tone={logoTone} />
                  <div>
                    <p className="text-xs font-semibold uppercase text-cyber-muted">Cryptography &amp; Network Security</p>
                    <h1 className="text-2xl font-semibold text-cyber-text">CyberShield Command Center</h1>
                  </div>
                </div>
              </div>

            <div className="flex flex-wrap items-center gap-2">
              <BackendStatus health={backendHealth} />
              <StatusPill tone={realtime.connection.status === 'online' ? 'green' : realtime.connection.status === 'connecting' ? 'yellow' : 'red'}>
                {realtime.connection.status === 'online' ? 'Realtime Live' : realtime.connection.status === 'connecting' ? 'Realtime Sync' : 'Realtime Offline'}
              </StatusPill>
              <StatusPill tone={logoTone}>{!launched ? 'Neutral' : defenseEnabled ? 'Threat Neutralized' : 'Attack Running'}</StatusPill>
              <StatusPill tone={defenseEnabled ? 'green' : 'yellow'}>{defenseEnabled ? 'Defense Active' : 'Defense Ready'}</StatusPill>
              <StatusPill tone="blue">{authSession.session.user.username}</StatusPill>
              <OperatorScore token={authSession.session.token} scoreRef={scoreRef} />
              <button
                type="button"
                title="Open Crypto Playground"
                onClick={onViewPlayground}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-cyber-border bg-cyber-panelSoft px-3 text-sm font-semibold text-cyber-text transition hover:border-cyber-blue"
              >
                <Zap className="h-4 w-4 text-cyber-blue" aria-hidden="true" />
                Sandbox
              </button>
              <button
                type="button"
                title={reportReady ? 'Export scenario report' : 'Report comparison data is loading'}
                onClick={handleExportReport}
                disabled={!reportReady}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-cyber-border bg-cyber-panelSoft px-3 text-sm font-semibold text-cyber-text transition hover:border-cyber-blue disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-cyber-border"
              >
                <Download className="h-4 w-4 text-cyber-blue" aria-hidden="true" />
                Report
              </button>
              <button
                type="button"
                title="Launch scenario"
                onClick={handleLaunch}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-cyber-border bg-cyber-panelSoft px-3 text-sm font-semibold text-cyber-text transition hover:border-cyber-blue"
              >
                <Play className="h-4 w-4 text-cyber-blue" aria-hidden="true" />
                Launch
              </button>
              <button
                type="button"
                title="Activate defense"
                onClick={handleDefend}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-cyber-border bg-cyber-panelSoft px-3 text-sm font-semibold text-cyber-text transition hover:border-cyber-green"
              >
                <LockKeyhole className="h-4 w-4 text-cyber-green" aria-hidden="true" />
                Defend
              </button>
              <button
                type="button"
                title="Reset simulation"
                onClick={handleReset}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-cyber-border bg-cyber-panelSoft text-cyber-muted transition hover:border-cyber-yellow hover:text-cyber-yellow"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                title="Sign out"
                onClick={authSession.logout}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-cyber-border bg-cyber-panelSoft text-cyber-muted transition hover:border-cyber-red hover:text-cyber-red"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>
        </div>

        <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-4">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {simulationState.metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <SectionPanel title="Scenario Engine" icon={Zap}>
            <ScenarioRail scenarios={simulation.scenarios} selectedScenarioId={selectedScenarioId} onSelect={handleScenarioSelect} />
          </SectionPanel>

          <div className="flex flex-col gap-4">
            <SectionPanel
              title={selectedScenario?.name ?? 'Attack Visualization'}
              icon={Radar}
              action={
                <div className="flex items-center gap-2">
                  {realtime.error || simulation.error ? <StatusPill tone="yellow">Fallback</StatusPill> : null}
                  <StatusPill tone={simulation.status === 'loading' ? 'yellow' : defenseEnabled ? 'green' : 'red'}>
                    {simulation.status === 'loading' ? 'Syncing' : defenseEnabled ? 'Encrypted' : 'Plaintext'}
                  </StatusPill>
                </div>
              }
            >
              <NetworkVisualizer
                defenseEnabled={defenseEnabled}
                launched={launched}
                packets={simulationState.packets}
                scenario={selectedScenario}
                channel={simulationState.channel}
              />
            </SectionPanel>

            {selectedScenarioId === 'packet-sniffing' && (
              <SectionPanel title="PCAP Forensic Dissector" icon={Terminal}>
                <ForensicDissector packets={simulationState.packets} launched={launched} />
              </SectionPanel>
            )}
          </div>

          <div className="grid gap-4">
            <SectionPanel title="Live Alerts" icon={Activity}>
              <EventFeed alerts={simulationState.alerts} />
            </SectionPanel>

            <SectionPanel title="Active Defenses" icon={Shield}>
              <div className="space-y-3">
                {simulationState.defenses.map((defense) => (
                  <div key={defense.name} className="flex items-center justify-between gap-3 border-b border-cyber-border pb-3 last:border-b-0 last:pb-0">
                    <span className="min-w-0 truncate text-sm text-cyber-text">{defense.name}</span>
                    <StatusPill tone={defense.tone}>{defense.status}</StatusPill>
                  </div>
                ))}
              </div>
            </SectionPanel>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SectionPanel title="Hacker Terminal" icon={Terminal}>
            <TerminalStream entries={attackStream} tone="red" />
          </SectionPanel>
          <SectionPanel title="Defender Console" icon={Shield}>
            <TerminalStream entries={defenseStream} tone="green" />
          </SectionPanel>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div id="ids-analysis" className="flex flex-col gap-4">
            <SectionPanel title="AI-IDS Analysis" icon={Shield}>
              <IDSPanel packets={simulationState.packets} token={authSession.session.token} />
            </SectionPanel>
          </div>

          <SectionPanel title="Scenario Timeline" icon={Activity}>
            <ScenarioTimeline events={realtime.events} />
          </SectionPanel>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SectionPanel title="Operator Audit Log" icon={Download}>
            {auditHistory.length === 0 ? (
              <p className="py-3 text-center text-xs text-cyber-muted">No audit records yet. Export a report to start archiving.</p>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {auditHistory.map((record) => (
                  <div key={record.id} className="flex items-center justify-between gap-3 rounded-lg border border-cyber-border bg-cyber-panelSoft px-3 py-2 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-cyber-text">{record.scenario_name}</p>
                      <p className="text-cyber-muted">{record.created_at.slice(0, 16).replace('T', ' ')}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded bg-cyber-red/20 px-1.5 py-0.5 font-mono text-[10px] text-red-200">{record.risk_score_before}</span>
                      <span className="text-cyber-muted">→</span>
                      <span className="rounded bg-cyber-green/20 px-1.5 py-0.5 font-mono text-[10px] text-green-200">{record.risk_score_after}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>

          <div id="blockchain-explorer" className="flex flex-col gap-4">
            <SectionPanel title="Blockchain Explorer" icon={Shield}>
              <BlockchainExplorer token={authSession.session.token} />
            </SectionPanel>
          </div>

          <div id="leaderboard" className="flex flex-col gap-4">
            <SectionPanel title="Cyber Range Leaderboard" icon={Activity}>
              <Leaderboard token={authSession.session.token} />
            </SectionPanel>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)]">
          <div id="explain-mode" className="flex flex-col gap-4">
            <SectionPanel title="Explain Mode" icon={BookOpen}>
              <ExplainModePanel explanation={explanation} />
            </SectionPanel>
          </div>
          <SectionPanel title="Before vs After" icon={GitCompare}>
            <SecurityComparison comparison={comparison} />
          </SectionPanel>
        </section>
        </div>
        </div>

        {/* ── Footer ── */}
        <AppFooter />
      </main>
  </div>
  )
}

export default App
