"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Состояние проверки авторизации. По умолчанию true, чтобы не показывать
  // защищенный контент до завершения проверки.
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // 1. Защита от выполнения на сервере (Next.js SSR/Hydration)
    if (typeof window === "undefined") return;

    // 2. Получение токена
    const token = localStorage.getItem("token");
    console.log(token);
    console.log(token);
    console.log(token);
    console.log(token);

    // 3. Строгая проверка на отсутствие токена или некорректные строки
    if (!token || token === "null" || token === "undefined") {
      // Используем replace вместо push, чтобы не засорять историю браузера
      // router.replace("/login");
      console.log("unathenticated");
    } else {
      // Токен есть — разрешаем отображение контента
      setIsCheckingAuth(false);
    }
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.replace("/login");
  };

  // Пока идет проверка, показываем нейтральный экран загрузки
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 text-slate-500">
        Загрузка системы...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div className="font-bold text-xl text-slate-800 tracking-tight">
          Медицинская система
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 hidden sm:inline-block">
            Режим врача
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Выйти
          </Button>
        </div>
      </header>

      {/* Контейнер для дочерних страниц (например, списка пациентов) */}
      <main className="mx-auto w-full">{children}</main>
    </div>
  );
}
