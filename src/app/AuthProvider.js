"use client"

import { createContext, useContext, useState, useEffect, useRef } from "react"
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { ADMIN_EMAILS } from "@/lib/constants"

const AuthContext = createContext(null)

export const allowedAdmins = ADMIN_EMAILS

const isDev = typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const registeredRef = useRef(false)

  useEffect(() => {
    if (isDev) {
      const devUser = { email: "dev@studyhub.local", uid: "dev-user" }
      setUser(devUser)
      setLoading(false)
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: devUser.uid, email: devUser.email }),
      }).catch(() => {})
      return
    }
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!user || registeredRef.current) return
    registeredRef.current = true
    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid, email: user.email }),
    }).catch(() => {})
  }, [user])

  const signUp = (email, password) => createUserWithEmailAndPassword(auth, email, password)
  const logIn = (email, password) => signInWithEmailAndPassword(auth, email, password)
  const logOut = () => {
    if (isDev) { setUser(null); return }
    return signOut(auth)
  }

  const isAdmin = user && allowedAdmins.includes(user.email)

  return (
    <AuthContext.Provider value={{ user, loading, signUp, logIn, logOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}
