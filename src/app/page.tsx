'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Car, Building2, Eye, EyeOff, AlertCircle, Sparkles, Shield, Clock } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          method: 'GET',
        })
        if (response.ok) {
          router.push('/dashboard')
        }
      } catch (error) {
        // Ignore error, user needs to login
      }
    }
    checkAuth()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        const data = await response.json()
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-md w-full space-y-8 p-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-24 w-24 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300 animate-pulse">
            <Building2 className="h-12 w-12 text-white" />
          </div>
          <h2 className="mt-8 text-5xl font-bold text-white bg-gradient-to-r from-white to-purple-200 bg-clip-text">
            Mall Parking
          </h2>
          <p className="mt-3 text-xl text-purple-200 font-medium">
            Management System
          </p>
          <p className="mt-2 text-sm text-purple-300">
            Secure • Efficient • Smart
          </p>
        </div>
        
        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 rounded-full">
              <Shield className="h-5 w-5 text-white" />
              <span className="text-white font-semibold text-sm">Operator Portal</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-white mb-3">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-6 py-4 border-2 border-white/20 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 text-gray-900 bg-white/90 backdrop-blur-sm transition-all duration-300 placeholder-gray-500"
                  placeholder="Enter your username"
                  disabled={loading}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white mb-3">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 pr-12 border-2 border-white/20 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 text-gray-900 bg-white/90 backdrop-blur-sm transition-all duration-300 placeholder-gray-500"
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-purple-500 hover:text-purple-600 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-2xl animate-pulse">
                <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                <span className="text-red-200 text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-6 border-2 border-transparent rounded-2xl shadow-2xl text-lg font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-purple-500/25"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Sign in
                </div>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl border border-white/20 backdrop-blur-sm">
            <div className="flex items-center mb-3">
              <Clock className="h-4 w-4 text-blue-300 mr-2" />
              <h4 className="text-sm font-semibold text-blue-200">Demo Credentials</h4>
            </div>
            <div className="space-y-2 text-xs text-blue-100">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Username:</span>
                <span className="bg-white/20 px-2 py-1 rounded-lg">admin</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Password:</span>
                <span className="bg-white/20 px-2 py-1 rounded-lg">admin123</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-purple-300">
            © 2025 Mall Parking Management System
          </p>
          <div className="flex items-center justify-center mt-2 space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-300">Secure Connection</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
