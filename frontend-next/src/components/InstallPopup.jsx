import { useEffect, useState } from 'react'

export default function InstallPopup() {
  const [show, setShow] = useState(false)
 const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) return
    const timer = setTimeout(() => setShow(true), 1000)
    return () => clearTimeout(timer)
  }, [])


 // PWA: Listen for beforeinstallprompt event
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])
  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowInstallButton(false)
    }
    setDeferredPrompt(null)
  }
  const handleInstall = () => {
    setShow(false)
    
    // Try native PWA prompt first
    const prompt = window.deferredPrompt
    if (prompt) {
      prompt.prompt()
      prompt.userChoice.then((choice) => {
        if (choice.outcome === 'accepted') console.log('Installed!')
      })
      window.deferredPrompt = null
      return
    }
    
    // Exact same alerts as Navbar - Direct install attempt
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const isAndroid = /android/i.test(navigator.userAgent)
    
    if (isIOS) {
      alert('Share button (↑) → Add to Home Screen → Add')
    } else if (isAndroid) {
      alert('Chrome menu (⋮) → Install app → Follow prompts')
    } else {
      alert('Look for 📥 Install icon in address bar → Click Install')
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden relative">
        <button onClick={() => setShow(false)} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-700">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        <div className="bg-gradient-to-br from-orange-400 to-red-400 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-4xl">🍱</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Install MealBox App</h2>
          <p className="text-white/80 text-sm">Fast ordering &amp; live tracking</p>
        </div>

        <div className="p-5 space-y-2">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-orange-50 dark:bg-gray-800">
            <span className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">⚡</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">Quick reorder in 2 taps</span>
          </div>
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-blue-50 dark:bg-gray-800">
            <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">📍</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">Live delivery tracking</span>
          </div>
        </div>

        <div className="p-5 pt-0">
          {/* EXACT SAME BUTTON AS NAVBAR */}
          <button onClick={handleInstallClick}
            className="w-full bg-gradient-to-r from-orange-400 to-red-400 text-white py-3.5 px-4 rounded-xl font-bold text-lg hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-orange-500/30"
          >
            📲 Install App
          </button>
        </div>
      </div>
    </div>
  )
}
