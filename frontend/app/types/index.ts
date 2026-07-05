export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Patient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  diagnosis: string;
  status: "active" | "discharged" | "critical";
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
