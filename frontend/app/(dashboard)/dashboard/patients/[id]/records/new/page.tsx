"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface Template {
  id: number;
  category: string;
  title: string;
  content: string;
}

export default function NewRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  // Распаковка Promise для получения id
  const { id } = use(params);

  const [formData, setFormData] = useState({
    complaints: "",
    anamnesis: "",
    diagnosis: "",
    plan: "",
  });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [patientName, setPatientName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      fetch("http://localhost:8080/api/templates", { headers })
        .then((res) => res.json())
        .then((data) => setTemplates(data || []))
        .catch(console.error);

      fetch(`http://localhost:8080/api/patients/${id}`, { headers })
        .then((res) => res.json())
        .then((data) => {
          if (data.patient) setPatientName(data.patient.full_name);
          if (data.history && data.history.length > 0) {
            setFormData((prev) => ({
              ...prev,
              anamnesis: data.history[0].anamnesis,
            }));
          }
        })
        .catch(console.error);
    };
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const insertTemplate = (
    field: "complaints" | "anamnesis" | "diagnosis" | "plan",
    content: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field] ? `${prev[field]}\n${content}` : content,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const token = localStorage.getItem("token");
    const payload = {
      patient_id: parseInt(id, 10),
      ...formData,
    };

    try {
      const res = await fetch(
        `http://localhost:8080/api/patients/${id}/records`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) throw new Error("Ошибка сохранения приема");

      router.push(`/dashboard/patients/${id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTemplateButtons = (
    category: string,
    field: "complaints" | "anamnesis" | "diagnosis" | "plan",
  ) => {
    const categoryTemplates = templates.filter((t) => t.category === category);
    if (categoryTemplates.length === 0) return null;

    return (
      <div className="flex gap-2 flex-wrap mb-2">
        {categoryTemplates.map((t) => (
          <Button
            key={t.id}
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => insertTemplate(field, t.content)}
          >
            +{t.title}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Новый прием: {patientName}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label>Жалобы</Label>
              {renderTemplateButtons("complaints", "complaints")}
              <Textarea
                name="complaints"
                value={formData.complaints}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Анамнез (перенесено из прошлой записи)</Label>
              {renderTemplateButtons("anamnesis", "anamnesis")}
              <Textarea
                name="anamnesis"
                value={formData.anamnesis}
                onChange={handleChange}
                required
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Диагноз</Label>
              {renderTemplateButtons("diagnosis", "diagnosis")}
              <Textarea
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>План лечения</Label>
              {renderTemplateButtons("plan", "plan")}
              <Textarea
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                required
                className="min-h-[150px]"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="w-full"
          >
            Отмена
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            Завершить прием и сохранить
          </Button>
        </div>
      </form>
    </div>
  );
}
