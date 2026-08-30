"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-6 text-center">
      <div className="animate-pulse text-xs text-neutral-500 font-bold">
        Đang chuyển tiếp tới trang đăng nhập / đăng ký...
      </div>
    </div>
  );
}
