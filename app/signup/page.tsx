import { SignupForm } from "@/components/signup-form"
import Navbar from "@/app/navbar/page"

export default function Page() {
  return (
    <div
      className="min-h-svh w-full relative"
      style={{ background: "linear-gradient(135deg, #ffffff 0%, #dbeafe 40%, #3b82f6 100%)" }}
    >
      <Navbar />
      {/* Subtle depth overlays */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue-300/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-white/60 blur-[100px]" />
      </div>
      <div className="flex items-center justify-center px-6 pt-28 pb-10 relative z-10">
        <div className="w-full max-w-sm">
          <SignupForm />
        </div>
      </div>
    </div>
  )
}
