"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function DmRoomRedirect() {
  const { id } = useParams()
  const router = useRouter()

  useEffect(() => {
    router.replace("/dm")
  }, [router])

  return null
}
