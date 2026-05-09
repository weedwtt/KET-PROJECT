import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#FDF8EE]">
      {/*
       * Decorative circles
       * mobile  : 192px (w-48), offset -64px
       * iPad+   : 256px (w-64), offset -80px
       * desktop : 320px (w-80), offset -96px
       */}
      <div className="
        absolute -top-16 -left-16
        w-48 h-48
        md:-top-20 md:-left-20 md:w-64 md:h-64
        lg:-top-24 lg:-left-24 lg:w-80 lg:h-80
        rounded-full bg-[#FDF0D5]
      " />
      <div className="
        absolute -bottom-16 -right-16
        w-48 h-48
        md:-bottom-20 md:-right-20 md:w-64 md:h-64
        lg:-bottom-24 lg:-right-24 lg:w-80 lg:h-80
        rounded-full bg-[#FDF0D5]
      " />

      {/*
       * Content wrapper
       * mobile  : full width, max 320px, padding 16px
       * iPad    : max 400px
       * desktop : max 448px
       */}
      <div className="
        relative z-10
        w-full max-w-xs px-4 py-10
        md:max-w-sm
        lg:max-w-md
      ">
        {/* Logo + title */}
        <div className="flex flex-col items-center mb-6 md:mb-8">
          <div className="
            w-14 h-14 rounded-2xl bg-[#F5A623] shadow-md
            flex items-center justify-center mb-4
            md:w-16 md:h-16
            lg:w-[72px] lg:h-[72px]
          ">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-[#2D1B00] tracking-wide md:text-2xl lg:text-3xl">
            ระบบปกครอง
          </h1>
          <p className="text-sm text-[#F5A623] font-medium mt-1 text-center md:text-base">
            โรงเรียนบางพลีราษฎร์บำรุง
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm px-6 py-7 md:px-8 md:py-8 lg:px-10 lg:py-10">
          <p className="
            text-center text-xs leading-relaxed text-gray-500 mb-5
            md:text-sm md:mb-6
          ">
            ยินดีต้อนรับเข้าสู่ระบบบันทึกข้อมูลด้านความประพฤติของนักเรียน
            <br />
            โรงเรียนบางพลีราษฎร์บำรุง
          </p>

          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
