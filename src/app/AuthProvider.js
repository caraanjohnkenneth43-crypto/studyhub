"use client"

import { createContext, useContext, useState, useEffect, useRef } from "react"
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { ADMIN_EMAILS } from "@/lib/constants"

const AuthContext = createContext(null)

export const allowedAdmins = ADMIN_EMAILS

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const registeredRef = useRef(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!user || registeredRef.current) return
    registeredRef.current = true
    const initDisplayName = async () => {
      if (!user.displayName) {
        try {
          await updateProfile(user, { displayName: user.email.split("@")[0] })
        } catch {}
      }
    }
    initDisplayName()
    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid, email: user.email, displayName: user.displayName || user.email.split("@")[0] }),
    }).catch(() => {})
  }, [user])

  const signUp = (email, password) => createUserWithEmailAndPassword(auth, email, password)
  const logIn = (email, password) => signInWithEmailAndPassword(auth, email, password)

  const logOut = () => signOut(auth)

  const isAdmin = user && allowedAdmins.includes(user.email)

  return (
    <AuthContext.Provider value={{ user, loading, signUp, logIn, logOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}
