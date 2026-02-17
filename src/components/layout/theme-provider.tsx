import { createContext, useContext, useEffect, useState } from "react"

const ThemeProviderContext = createContext<{
    theme: "dark" | "light" | "system"
    setTheme: (theme: "dark" | "light" | "system") => void
}>({
    theme: "system",
    setTheme: () => { },
})

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "vite-ui-theme",
}: {
    children: React.ReactNode
    defaultTheme?: "dark" | "light" | "system"
    storageKey?: string
}) {
    const [theme, setTheme] = useState<"dark" | "light" | "system">(() => {
        return (localStorage.getItem(storageKey) as "dark" | "light" | "system") || defaultTheme
    })

    useEffect(() => {
        const root = window.document.documentElement

        root.classList.remove("light", "dark")

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light"

            root.classList.add(systemTheme)
            return
        }

        root.classList.add(theme)
    }, [theme])

    const value = {
        theme,
        setTheme: (theme: "dark" | "light" | "system") => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
    }

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider")
    }

    return context
}
