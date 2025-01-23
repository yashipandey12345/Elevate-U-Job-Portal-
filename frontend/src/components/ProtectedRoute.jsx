import React, { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'
import { getCookie } from '../utils/cookies'

const ProtectedRoute = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    const checkAuth = () => {
      const token = getCookie("token")
      if (token && user) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        toast.error('You need to log in to access this page')
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [user])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute

