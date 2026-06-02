import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { Workflows } from "@/components/landing/workflows"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Testimonials } from "@/components/landing/testimonials"
import { Pricing } from "@/components/landing/pricing"
import { Footer } from "@/components/landing/footer"


export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Workflows />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <Footer />
    </main>
  )
}
