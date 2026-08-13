import {
  AudioLines,
  Bot,
  ChevronDown,
  CircleUserRound,
  FolderKanban,
  Home,
  Library,
  ListTodo,
  LogOut,
  Menu,
  PanelLeftClose,
  Search,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { PlayerBar } from './PlayerBar'
import { useAuth } from '../context/AuthContext'

const navigation = [
  { label: '首页', href: '/', icon: Home, end: true },
  { label: 'AI 音乐创作', href: '/create', icon: WandSparkles },
  { label: '音频工作台', href: '/studio', icon: AudioLines },
  { label: 'Agent 助手', href: '/assistant', icon: Bot, badge: 'Beta' },
]

const workspace = [
  { label: '我的项目', href: '/projects', icon: FolderKanban },
  { label: '资产库', href: '/library', icon: Library },
  { label: '任务中心', href: '/tasks', icon: ListTodo },
]

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { user, logout } = useAuth()
  const displayName = user?.display_name || user?.username || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="brand-row">
          <NavLink to="/" className="brand" onClick={() => setMobileOpen(false)}>
            <span className="brand-mark"><AudioLines size={20} /></span>
            <span>CHEER</span>
          </NavLink>
          <button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)} aria-label="关闭菜单">
            <PanelLeftClose size={19} />
          </button>
        </div>

        <NavLink className="new-creation" to="/create" onClick={() => setMobileOpen(false)}>
          <Sparkles size={17} />
          开始创作
        </NavLink>

        <nav className="side-nav">
          <div className="nav-group">
            {navigation.map(({ label, href, icon: Icon, badge, end }) => (
              <NavLink key={href} to={href} end={end} onClick={() => setMobileOpen(false)}>
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
                {badge && <small>{badge}</small>}
              </NavLink>
            ))}
          </div>
          <div className="nav-label">工作空间</div>
          <div className="nav-group">
            {workspace.map(({ label, href, icon: Icon }) => (
              <NavLink key={href} to={href} onClick={() => setMobileOpen(false)}>
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="sidebar-project">
          <div className="sidebar-project-art cover-b"><AudioLines size={20} /></div>
          <div>
            <span>当前项目</span>
            <strong>Default Project</strong>
          </div>
          <ChevronDown size={16} />
        </div>
        <div className="sidebar-profile">
          <div className="avatar">{initials}</div>
          <div>
            <strong>{displayName}</strong>
            <span>个人工作空间</span>
          </div>
          <CircleUserRound size={18} />
        </div>
      </aside>

      {mobileOpen && <button className="sidebar-overlay" onClick={() => setMobileOpen(false)} aria-label="关闭菜单" />}

      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="打开菜单">
            <Menu size={20} />
          </button>
          <button className={`search-box ${searchOpen ? 'is-open' : ''}`} onClick={() => setSearchOpen(true)}>
            <Search size={17} />
            <input placeholder="搜索项目、音频或任务" aria-label="搜索" onBlur={() => setSearchOpen(false)} />
            <kbd>⌘ K</kbd>
          </button>
          <div className="topbar-actions">
            <span className="service-status"><i /> 服务运行正常</span>
            <div className="topbar-profile">
              <button className="icon-button profile-button" onClick={() => setProfileOpen(!profileOpen)} aria-label="个人中心">{initials}</button>
              {profileOpen && <div className="profile-popover"><div><strong>{displayName}</strong><span>{user?.email || user?.username}</span></div><button onClick={logout}><LogOut size={15} />退出登录</button></div>}
            </div>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
        <PlayerBar />
      </div>
    </div>
  )
}
