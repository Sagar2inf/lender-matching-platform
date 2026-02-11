import type { BorrowerFormData } from "../app/pages/Borrower/types";
import api from "./api"; 

export interface BorrowerSubmissionResponse {
  success: boolean;
  message: string;
  matches_count: number;
  note: string;
}

const registerBorrowerApplication = async (
  formData: BorrowerFormData
): Promise<BorrowerSubmissionResponse> => {
  try {
    console.log("Submitting borrower application:", formData);
    const response = await api.post<BorrowerSubmissionResponse>("/borrowers/apply", formData);

    return response.data;

  } catch (error: any) {
    console.error("Borrower Service Error:", error);
    
    const errorMessage = 
      error.response?.data?.detail || 
      error.message || 
      "Submission failed";
      
    throw new Error(errorMessage);
  }
};

export const borrowerService = {
  register: registerBorrowerApplication,
};