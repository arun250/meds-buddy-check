import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
    
    
  const navigate = useNavigate()

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        navigate("/login")
      }
    }
    checkSession()
  }, [navigate])

  if (isAuthenticated === null) return null // or loading spinner

  return isAuthenticated ? children : null
}

export default ProtectedRoute
