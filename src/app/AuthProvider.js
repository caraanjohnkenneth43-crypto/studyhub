"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"

const AuthContext = createContext(null)

const isDev = typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDev) {
      setUser({ email: "dev@studyhub.local", uid: "dev-user" })
      setLoading(false)
      return
    }
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return unsub
  }, [])

  const signUp = (email, password) => createUserWithEmailAndPassword(auth, email, password)
  const logIn = (email, password) => signInWithEmailAndPassword(auth, email, password)
  const logOut = () => {
    if (isDev) { setUser(null); return }
    return signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, logIn, logOut }}>
      {children}
    </AuthContext.Provider>
  )
}
