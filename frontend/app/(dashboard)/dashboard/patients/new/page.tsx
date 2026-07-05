"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Утилита для форматирования номера по российской маске
const formatPhoneNumber = (input: string) => {
  // Очистка от всех нецифровых символов
  const digits = input.replace(/\D/g, "");

  if (!digits) return "";

  // Проверка первой цифры для корректной подстановки кода +7
  const isStartWith8 = digits[0] === "8";
  const isStartWith7 = digits[0] === "7";
  const isStartWith9 = digits[0] === "9";

  let formatted = "+7 ";
  let phoneBody = digits;

  if (isStartWith7 || isStartWith8) {
    phoneBody = digits.substring(1);
  } else if (!isStartWith9) {
    // Ввод международных номеров с другими кодами (защита от слома маски)
    return `+${digits.substring(0, 15)}`;
  }

  // Применение сегментов маски
  if (phoneBody.length > 0) {
    formatted += `(${phoneBody.substring(0, 3)}`;
  }
  if (phoneBody.length >= 4) {
    formatted += `) ${phoneBody.substring(3, 6)}`;
  }
  if (phoneBody.length >= 7) {
    formatted += `-${phoneBody.substring(6, 8)}`;
  }
  if (phoneBody.length >= 9) {
    formatted += `-${phoneBody.substring(8, 10)}`;
  }

  return formatted;
};

export default function NewPatientPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Перехват и форматирование поля телефона
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, phone: formatPhoneNumber(value) }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const ageInt = parseInt(formData.age, 10);
    if (isNaN(ageInt) || ageInt <= 0) {
      setError("Возраст должен быть положительным числом.");
      setIsSubmitting(false);
      return;
    }

    // Проверка заполненности номера телефона (18 символов для "+7 (XXX) XXX-XX-XX")
    if (formData.phone.length > 0 && formData.phone.length < 18) {
      setError("Введите полный номер телефона.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      full_name: formData.full_name,
      age: ageInt,
      phone: formData.phone,
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch("http://localhost:8080/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          router.replace("/login");
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Ошибка сервера: ${response.status}`,
        );
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Добавление нового пациента</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">ФИО</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                required
                placeholder="Иванов Иван Иванович"
                value={formData.full_name}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Возраст</Label>
              <Input
                id="age"
                name="age"
                type="number"
                required
                min="1"
                placeholder="Например: 35"
                value={formData.age}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                maxLength={18}
                placeholder="+7 (999) 000-00-00"
                value={formData.phone}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="w-full"
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Сохранение..." : "Сохранить пациента"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
