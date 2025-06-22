// src/components/Header.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { Users, User, Heart } from "lucide-react";

interface HeaderProps {
  isLoggedIn: boolean
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn }) => {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header className=" bg-white shadow-md p-2 flex justify-between items-center">
      <div className='flex items-center'>

     <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center mr-2">
              <span className="text-white font-bold text-lg">M</span>
            </div>
    <h1 className="text-xl font-bold text-foreground">MediCare Companion</h1>
      </div>
      {isLoggedIn && (
        <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg "
        >
          Logout
        </button>
      )}
      
    </header>
  )
}

export default Header
