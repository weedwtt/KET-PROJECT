import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#f2f5fa]">
      {/* Decorative blobs */}
      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[#465fff]/8 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-[#465fff]/8 blur-3xl" />

      <div className="relative z-10 w-full max-w-xs px-4 py-10 md:max-w-sm lg:max-w-md">
        {/* Logo + title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#465fff] shadow-lg shadow-[#465fff]/30 flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-7 h-7"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1c2434] tracking-wide">ระบบปกครอง</h1>
          <p className="text-sm text-[#465fff] font-medium mt-1 text-center">
            โรงเรียนบางพลีราษฎร์บำรุง
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e8edf2] px-7 py-8">
          <p className="text-center text-sm text-gray-500 mb-6 leading-relaxed">
            ยินดีต้อนรับเข้าสู่ระบบบันทึกข้อมูล<br />
            ด้านความประพฤติของนักเรียน
          </p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
