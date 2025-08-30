"use client"

import Image from "next/image"
import ThemeToggle from "./ThemeToggle"

export default function Navbar() {
    return (
        <div className="items-center justify-between flex w-full border-b-3 h-16 px-4 
            dark:border-white border-black dark:text-white text-black">
            
            <div className="text-md flex items-center">
                <Image
                    src="/logoo.png"
                    alt="Logo"
                    width={0}
                    height={0}
                    sizes="7vw"
                    className="h-full w-auto object-contain"
                />
            </div>

            <ThemeToggle />
        </div>
    )
}