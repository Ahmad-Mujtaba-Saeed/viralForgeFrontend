import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { Workflows } from "@/components/landing/workflows"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Testimonials } from "@/components/landing/testimonials"
import { Pricing } from "@/components/landing/pricing"
import { Footer } from "@/components/landing/footer"
import EditorEmbed from "@/components/editor/EditorEmbed"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Workflows />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <div className="container mx-auto my-8">
        <EditorEmbed editorUrl={"http://localhost:5173"} />
      </div>
      <Footer />
    </main>
  )
}
