"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Record {
  id: number;
  patient_id: number;
  doctor_id: number;
  complaints: string;
  anamnesis: string;
  diagnosis: string;
  plan: string;
  created_at: string;
}

interface Patient {
  id: number;
  full_name: string;
  age: number;
  phone: string;
}

interface PatientProfileResponse {
  patient: Patient;
  history: Record[];
}

export default function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  // Распаковка Promise для получения id
  const { id } = use(params);

  const [data, setData] = useState<PatientProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:8080/api/patients/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Ошибка загрузки профиля пациента");

        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (isLoading) return <div className="p-8">Загрузка данных...</div>;
  if (error || !data) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Электронная карта пациента</h1>
        <Button
          onClick={() =>
            router.push(`/dashboard/patients/${data.patient.id}/records/new`)
          }
        >
          Новый прием
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{data.patient.full_name}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>ID:</strong> {data.patient.id}
          </div>
          <div>
            <strong>Возраст:</strong> {data.patient.age}
          </div>
          <div>
            <strong>Телефон:</strong> {data.patient.phone || "—"}
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold mt-8 mb-4">История приемов</h2>
      <div className="space-y-4">
        {data.history.length === 0 ? (
          <div className="text-slate-500">Записей о приемах нет.</div>
        ) : (
          data.history.map((record) => (
            <Card key={record.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-blue-700">
                  Прием от{" "}
                  {new Date(record.created_at).toLocaleDateString("ru-RU")}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm">
                <div>
                  <strong>Жалобы:</strong> {record.complaints}
                </div>
                <div>
                  <strong>Анамнез:</strong> {record.anamnesis}
                </div>
                <div>
                  <strong>Диагноз:</strong> {record.diagnosis}
                </div>
                <div>
                  <strong>План лечения:</strong> {record.plan}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
