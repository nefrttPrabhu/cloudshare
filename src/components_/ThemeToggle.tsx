"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    if (!mounted) return null

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="px-3 py-1 border rounded-md 
                       dark:border-white border-black 
                       hover:bg-gray-200 dark:hover:bg-gray-700"
        >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
    )
}
