import axiosInstance from "./ApiClient";

export const PerformanceApi = {
  // Templates
  listTemplates: () => axiosInstance.get("/performance/templates"),
  getTemplate: (id: string) => axiosInstance.get(`/performance/templates/${id}`),
  createTemplate: (data: any) => axiosInstance.post("/performance/templates", data),
  updateTemplate: (id: string, data: any) => {
    // Filter out MongoDB internal fields
    const { _id, __v, createdAt, updatedAt, ...cleanData } = data || {};
    return axiosInstance.patch(`/performance/templates/${id}`, cleanData);
  },
  deleteTemplate: (id: string) => axiosInstance.patch(`/performance/templates/${id}/delete`),

  // Cycles
  listCycles: () => axiosInstance.get("/performance/cycles"),
  getCycle: (id: string) => axiosInstance.get(`/performance/cycles/${id}`),
  createCycle: (data: any) => axiosInstance.post("/performance/cycles", data),
  updateCycle: (id: string, data: any) => {
    // Filter out MongoDB internal fields
    const { _id, __v, createdAt, updatedAt, ...cleanData } = data || {};
    return axiosInstance.patch(`/performance/cycles/${id}`, cleanData);
  },
  setCycleStatus: (id: string, status: string) =>
    axiosInstance.patch(`/performance/cycles/${id}/status/${status}`),
  archiveCycle: (id: string) => axiosInstance.patch(`/performance/cycles/${id}/archive`),
  deleteCycle: (id: string) => axiosInstance.patch(`/performance/cycles/${id}/delete`),

  // Assignments
  createAssignment: (data: any) => axiosInstance.post("/performance/assignments", data),
  listAssignmentsForCycle: (cycleId: string) =>
    axiosInstance.get(`/performance/cycles/${cycleId}/assignments`),
  getAssignment: (id: string) => axiosInstance.get(`/performance/assignments/${id}`),
  updateAssignmentStatus: (id: string, status: string) =>
    axiosInstance.patch(`/performance/assignments/${id}/status/${status}`),
  deleteAssignment: (id: string) => axiosInstance.patch(`/performance/assignments/${id}/delete`),

  // Records
  createRecord: (assignmentId: string, data: any) =>
    axiosInstance.post(`/performance/assignments/${assignmentId}/records`, data),
  listRecordsForCycle: (cycleId: string) =>
    axiosInstance.get(`/performance/cycles/${cycleId}/records`),
  getRecord: (id: string) => axiosInstance.get(`/performance/records/${id}`),
  publishRecord: (id: string) => axiosInstance.patch(`/performance/records/${id}/publish`),
  acknowledgeRecord: (id: string) => axiosInstance.patch(`/performance/records/${id}/acknowledge`),
  deleteRecord: (id: string) => axiosInstance.patch(`/performance/records/${id}/delete`),

  // Disputes
  createDispute: (data: any) => axiosInstance.post("/performance/disputes", data),
  listDisputesForCycle: (cycleId: string) =>
    axiosInstance.get(`/performance/cycles/${cycleId}/disputes`),
  getDispute: (id: string) => axiosInstance.get(`/performance/disputes/${id}`),
  resolveDispute: (id: string, data: any) =>
    axiosInstance.patch(`/performance/disputes/${id}/resolve`, data),
};

