import Hero from "@/components_/Hero"
import Navbar from "@/components_/Navbar"

export default function Home() {
  return (
    <div className="items-center justify-center h-[100vh] bg-white dark:bg-black">
      <Navbar />
      <Hero />
    </div>
  )
}
