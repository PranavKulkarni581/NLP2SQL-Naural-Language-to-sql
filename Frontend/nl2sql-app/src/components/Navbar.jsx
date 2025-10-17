import { Moon, Sun } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function Navbar({ theme, setTheme }) {
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50"
    >
      <div className="glass shadow-glass border-b border-white/20 dark:border-white/10">
        <nav className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <a href="#" className="text-xl font-extrabold tracking-tight grad-text">NL2SQL</a>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link to="/" className="hover:opacity-80 transition">Home</Link>
            <Link to="/business" className="hover:opacity-80 transition">Business</Link>
            
            <Link to="/local" className="hover:opacity-80 transition">Local</Link>
            <Link to="/about" className="hover:opacity-80 transition">About</Link>
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
