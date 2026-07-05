"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Patient {
  id: number;
  doctor_id: number;
  full_name: string;
  age: number;
  phone: string;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        setError(null);
        const response = await fetch("http://localhost:8080/api/patients", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            router.replace("/login");
            return;
          }
          throw new Error(
            `Ошибка ${response.status}: Не удалось загрузить данные пациентов`,
          );
        }

        const data = await response.json();
        console.log(data);
        setPatients(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, [router]);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center text-slate-500 font-medium">
        Загрузка списка пациентов...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Пациенты</h1>
        <Button onClick={() => router.push("/dashboard/patients/new")}>
          Добавить пациента
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Список прикрепленных пациентов</CardTitle>
        </CardHeader>
        <CardContent>
          {patients.length === 0 && !error ? (
            <div className="text-center py-8 text-slate-500">
              Список пациентов пуст.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>ФИО</TableHead>
                  <TableHead>Возраст</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Дата добавления</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.id}</TableCell>
                    <TableCell>{patient.full_name}</TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell>{patient.phone || "—"}</TableCell>
                    <TableCell>
                      {new Date(patient.created_at).toLocaleDateString("ru-RU")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/patients/${patient.id}`)
                        }
                      >
                        Карта пациента
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
