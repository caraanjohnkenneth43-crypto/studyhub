"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return unsub
  }, [])

  const signUp = (email, password) => createUserWithEmailAndPassword(auth, email, password)
  const logIn = (email, password) => signInWithEmailAndPassword(auth, email, password)
  const logOut = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, loading, signUp, logIn, logOut }}>
      {children}
    </AuthContext.Provider>
  )
}
