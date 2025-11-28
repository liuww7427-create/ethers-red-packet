import { ConnectButton } from '@rainbow-me/rainbowkit'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'

import CreatePacket from './pages/CreatePacket'
import ClaimPacket from './pages/ClaimPacket'
import PacketDetail from './pages/PacketDetail'
import PacketList from './pages/PacketList'

function Menu() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const navItems = [
    { path: '/create', key: '/create', label: '发红包', description: '创建拼手气或等额红包' },
    { path: '/claim', key: '/claim', label: '抢红包', description: '输入红包 ID 立即领取' },
    { path: '/packet/1', key: '/packet', label: '红包详情', description: '查看单个红包的实时状态' },
    { path: '/packets', key: '/packets', label: '红包列表', description: '快速查看并跳转到详情' },
  ]

  return (
    <div className="glass nav-row">
      {navItems.map((item) => {
        const active = pathname === item.key || pathname.startsWith(`${item.key}/`)
        return (
          <button
            key={item.path}
            className={`nav-chip ${active ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <div style={{ fontSize: 15, fontWeight: 700 }}>{item.label}</div>
            <div style={{ color: 'var(--muted)', fontWeight: 500, fontSize: 12 }}>{item.description}</div>
          </button>
        )
      })}
    </div>
  )
}

function AppShell() {
  return (
    <div className="app-shell">
      <div className="glass top-bar">
        <div className="brand">
          <div className="brand-mark">🧧</div>
          <div>
            <p className="brand-title">Onchain Lucky Packets</p>
            <p className="brand-subtitle">创建、分享、抢红包，并随时查看领取进度。</p>
          </div>
        </div>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </div>

      <Menu />

      <div className="page">
        <Routes>
          <Route path="/create" element={<CreatePacket />} />
          <Route path="/claim" element={<ClaimPacket />} />
          <Route path="/packets" element={<PacketList />} />
          <Route path="/packet/:packetId" element={<PacketDetail />} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

export default App
