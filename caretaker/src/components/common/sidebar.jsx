import { NavLink, useNavigate } from 'react-router-dom'
import { Home, User, Bell, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { mockAlerts } from '../../mockData'

const navItems = [
  { to: '/caregiver', label: 'Home', icon: Home, end: true },
  { to: '/caregiver/patient', label: 'Patient Profile', icon: User },
  { to: '/caregiver/alerts', label: 'Alerts', icon: Bell },
  { to: '/caregiver/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const unreadAlerts = mockAlerts.filter((a) => !a.read).length

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 bg-surface border-r border-clay/40 h-screen flex flex-col flex-shrink-0 shadow-sm">
      <div className="p-6 border-b border-clay/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-fire text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-sm">
            🧠
          </div>
          <div>
            <h1 className="text-base font-bold text-ink">SmritiSetu</h1>
            <p className="text-xs text-ink/60">স্মৃতি সেতু · Caregiver Portal</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                  isActive
                    ? 'bg-fire text-white font-semibold shadow-sm'
                    : 'text-ink/70 hover:bg-cream/70 hover:text-ink'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.label === 'Alerts' && unreadAlerts > 0 && (
                <span className="w-5 h-5 rounded-full bg-sun text-ink text-xs font-bold flex items-center justify-center shadow-xs">
                  {unreadAlerts}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>
      <div className="p-4 border-t border-clay/40">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ink/70 hover:bg-fire/10 hover:text-fire w-full transition-colors cursor-pointer min-h-[44px]"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
