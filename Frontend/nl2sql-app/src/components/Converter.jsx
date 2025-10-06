import { useState } from 'react'
import { motion } from 'framer-motion'
import { ClipboardCopy, Check, PlayCircle } from 'lucide-react'

export default function Converter() {
  const [input, setInput] = useState('')
  const [sql, setSql] = useState('')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dialect, setDialect] = useState('POSTGRES')

  const convert = async () => {
  if (!input.trim()) return
  setLoading(true)
  setCopied(false)
  setSql('')
  setExplanation('')

  try {
    const res = await fetch("http://localhost:8080/api/translate", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: input,
        dialect: dialect
      })
    })

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`)
    }

    const data = await res.json()

    // ✅ Directly use backend fields (no regex parsing)
    setSql(data.sql || '-- No SQL found')
    setExplanation(data.model || '-- No explanation found')

  } catch (err) {
    setSql(`-- Error: ${err.message}`)
    setExplanation('')
  } finally {
    setLoading(false)
  }
}


  const copySQL = async () => {
    if (!sql) return
    await navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section id="convert" className="relative py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        
        {/* Left: Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="glass rounded-3xl border border-white/30 dark:border-white/10 shadow-glass p-4 md:p-6"
        >
          <label className="block text-xl font-semibold mb-2 text-slate-700 dark:text-slate-200">
            Natural Language Query
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={8}
            placeholder="e.g., List total orders per customer for 2025, sorted by highest first."
            className="w-full resize-none rounded-2xl border border-slate-200/60 dark:border-slate-700/60
                       bg-white/70 dark:bg-slate-900/50 p-4 outline-none focus:ring-2
                       ring-offset-0 focus:ring-indigo-400 dark:focus:ring-indigo-500"
          />

          {/* Dialect Dropdown */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1 text-slate-600 dark:text-slate-300">
              SQL Dialect
            </label>
            <select
              value={dialect}
              onChange={(e) => setDialect(e.target.value)}
              className="w-full rounded-2xl border border-slate-200/60 dark:border-slate-700/60
                         bg-white/70 dark:bg-slate-900/50 p-3 outline-none focus:ring-2
                         ring-offset-0 focus:ring-indigo-400 dark:focus:ring-indigo-500"
            >
              <option value="POSTGRES">Postgres</option>
              <option value="MYSQL">MySQL</option>
              <option value="SQLITE">SQLite</option>
              <option value="MSSQL">MS SQL</option>
              <option value="ORACLE">Oracle</option>
            </select>
          </div>

          {/* Convert Button */}
          <div className="flex justify-center">
            <button
              onClick={convert}
              disabled={loading}
              className="mt-4 inline-flex items-center gap-2 rounded-3xl px-5 py-3 font-semibold text-white bg-grad-accent
                         hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition hover:scale-[1.02] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full" />
                  Converting…
                </>
              ) : (
                <>
                  <PlayCircle className="h-5 w-5" /> Convert
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Right: Output */}
        <div className="flex flex-col gap-6">
          {/* SQL Output */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.05, duration: 0.5 }}
            className="glass rounded-3xl border border-white/30 dark:border-white/10 shadow-glass p-4 md:p-6 flex flex-col"
          >
            <div className="flex items-center justify-between">
              <label className="block text-xl font-semibold text-slate-700 dark:text-slate-200">
                SQL Output
              </label>
              <button
                onClick={copySQL}
                className="inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 border border-white/20 dark:border-white/10 glass hover:scale-105 transition"
              >
                {copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                <span className="text-xs">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <pre className="mt-3 flex-1 overflow-auto rounded-2xl p-4 font-mono text-sm
                            bg-white/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60">
{sql || '-- Your SQL will appear here'}
            </pre>
          </motion.div>

          {/* Explanation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.5 }}
            className="glass rounded-3xl border border-white/30 dark:border-white/10 shadow-glass p-4 md:p-6 flex flex-col"
          >
            <label className="block text-xl font-semibold text-slate-700 dark:text-slate-200">
              Explanation
            </label>
            <div
              className="mt-3 flex-1 overflow-auto rounded-2xl p-4 text-sm leading-relaxed
                          bg-white/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60"
              dangerouslySetInnerHTML={{ __html: explanation || '-- Explanation will appear here' }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
