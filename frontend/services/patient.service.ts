import { apiClient } from "@/lib/api-client";
import { Patient } from "@/types";

export const PatientService = {
  async getPatients(): Promise<Patient[]> {
    return apiClient<Patient[]>("/patients");
  },
};
