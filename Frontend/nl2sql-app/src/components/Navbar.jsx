import { Moon, Sun } from 'lucide-react'
import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'

export default function Navbar({ theme, setTheme }) {
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  // ✅ Active page classes
  const activeClass =
    "grad-text font-semibold";

  const baseClass =
    "hover:opacity-80 transition";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50"
    >
      <div className="glass shadow-glass border-b border-white/20 dark:border-white/10">
        <nav className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          
          <a href="#" className="text-xl font-extrabold tracking-tight grad-text">
            AskDB
          </a>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium">

            {/* ✅ ACTIVE PAGE HIGHLIGHT */}
            <NavLink
              to="/"
              className={({ isActive }) => isActive ? activeClass : baseClass}
            >
              Home
            </NavLink>

            <NavLink
              to="/business"
              className={({ isActive }) => isActive ? activeClass : baseClass}
            >
              Business
            </NavLink>

            <NavLink
              to="/local"
              className={({ isActive }) => isActive ? activeClass : baseClass}
            >
              Local
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) => isActive ? activeClass : baseClass}
            >
              About
            </NavLink>
          </div>

          <button
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className="rounded-2xl p-2 border border-white/20 dark:border-white/10 hover:scale-105 transition glass"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </nav>
      </div>
    </motion.header>
  )
}
