import api from './api';

export const lenderService = {
  register: async (name: string, email: string) => {
    const response = await api.post('/lenders/register', { 
      lender_name: name, 
      email: email 
    });
    return response.data; 
  },

  verifyOtp: async (email: string, code: string) => {
    // console.log(email, code);
    const response = await api.post('/lenders/verify-otp', { code, email });
    return response.data;
  },

  login: async (email: string) => {
    const response = await api.post('/lenders/login', {email} );
    return response.data;
  },
  loginWithOtp: async (email: string, code: string) => {
    const response = await api.post('/lenders/login-verify', { code, email });
    return response.data;
  },

  getLenderPolicy: async(lender_id: string) => {
    const response = await api.get(`/lenders/${lender_id}/current-policy`);
    return response.data;
  },

  uploadPolicyDoc: async (lender_id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/lenders/${lender_id}/extract-clean-pdf/`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        });

        return response.data;
    },

  updateLenderPolicy: async (lender_id: string, policyData: any) => {
    console.log("debug: ", policyData);
    const response = await api.post(`/lenders/${lender_id}/update-policy`, policyData);
    return response.data;
  },
  getPolicyHistory: async (lender_id: string) => {
      try {
          const response = await api.get(`/lenders/${lender_id}/policy-history`);
          return response.data;
      } catch (error) {
          console.error("History fetch failed", error);
          return [];
      }
  },

  getMatchedBorrowers: async (lender_id: string) => {
    try {
        const response = await api.get(`/lenders/${lender_id}/matches`);
        return response.data;
    } catch (error) {
        console.error("Matched borrowers fetch failed", error);
        return [];
    }
  },

  getBorrowerDetails: async (lender_id: string, borrower_id: number) => {
    try {
        const response = await api.get(`/lenders/${lender_id}/borrower/${borrower_id}`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch borrower details", error);
        throw error;
    }
}

};