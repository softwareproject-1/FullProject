import axiosInstance from "./ApiClient";

export interface AdminResetPasswordRequest {
  newPassword: string;
  forcePasswordChange?: boolean;
}

export const authApi = {
  // Admin reset password (System Admin only)
  adminResetPassword: async (employeeId: string, data: AdminResetPasswordRequest) => {
    const response = await axiosInstance.patch(
      `/auth/admin/reset-password/${employeeId}`,
      data
    );
    return response.data;
  },
};

