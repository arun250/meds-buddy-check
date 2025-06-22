import React, { useState, useEffect} from "react"

import { supabase } from "../supabase"

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Form } from "@/components/ui/form";

import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'

import { Heart } from "lucide-react";

type AuthType = "login" | "signup"

const AuthForm: React.FC = () => {
    
    const [authType, setAuthType] = useState<AuthType>("login")
    const [email,setEmail] =useState("")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")
    const [message, setMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate()

// prevent login
useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        navigate("/")
      }
    }
    checkSession()
  }, [])
  

  // for form submission

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage("")
        setIsLoading(true)
        if (authType === 'signup' && name.trim() === '') {
            setMessage('Please enter your full name.')
            return
          }
        
          if (!email.trim() || !password.trim()) {
            setMessage('Email and Password cannot be empty.')
            return
          }

        try {
            if (authType === "signup") {

                const { data: existingProfiles, error: profileError } = await supabase
                .from("Profile")
                .select("*")
                    .or(`email.eq.${email},full_name.eq.${name}`)
                    .limit(1)
                    .maybeSingle();
        
              if (profileError) throw profileError;
        
              if (existingProfiles) {
                setMessage("Email or Name is already registered.");
                return;
              }
                
              const isValidEmail = /\S+@\S+\.\S+/.test(email);
              if (!isValidEmail) {
                setMessage("Invalid email format");
                return;
              }
              
                const {data, error } = await supabase.auth.signUp({
                    email, password, options: {
                        data:{full_name:name},
                    },
                })
                if (error) throw error

                const userId = data.user?.id;
                if (userId) {
                  const {error: insertError} = await supabase.from("Profile").insert({
                    user_id: userId,
                    email,
                    full_name: name,
                  });
                if (insertError) throw insertError
                }
                setMessage("Sign up successful! Please check your email")
                setName("")
                setEmail("")
                setPassword("")             
            }
            else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,password,
                })
                if (error) throw error
                // setMessage("Login successful")
                navigate('/')
               
            }
        } catch (err: any) {
            setMessage(err.message ||"Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
      <div className="flex flex-col justify-center items-center h-screen">
           <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center ml-2 mt-2 mb-6 ">
        <Heart className="w-10 h-10 text-white" />
      </div>
        <div className="w-full max-w-md bg-white p-8 border">
            <h2 className="text-2xl font-bold mb-6 text-center">
            {authType === "login" ? "Login" : "Sign Up"}
          </h2>
       
            <form onSubmit = {handleSubmit} className="space-y-4">
                <Input
                    type="text"
                    placeholder="Full Name"
                    className="w-full px-4 py-2 border rounded-lg"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    />
                <Input
                    type="email"
                    placeholder="Email"
                    className="w-full px-4 py-2 border rounded-lg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    />
                 <Input
                    type="password"
                    placeholder="Pasword"
                    className="w-full px-4 py-2 border rounded-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    />
                <Button type="submit" className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg">
                {authType === "login"? "Login": "Sign Up"}
                </Button>
            </form>
            {message && <p className="text-center mt-4 text-red-600">{message}</p>}
            <p className="text-center mt-4 text-sm">
                {authType === "login" ? "Don't have an account?" : "Already have an account?"}
                    <button className="text-blue-500 underline" onClick={() => setAuthType(authType === "login" ? "signup" : "login")             
                    }>
                {authType === "login" ? "Sign Up" : "Login"}
                </button>
            </p>
        </div>
                    </div>
    )
}

export default AuthForm




