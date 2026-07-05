export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  // Получение токена только в среде браузера
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // URL бэкенда может быть вынесен в .env (NEXT_PUBLIC_API_URL)
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  // Глобальная обработка 401 Unauthorized (истек JWT или неверная подпись)
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Произошла ошибка при запросе");
  }

  return response.json();
};
