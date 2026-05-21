import api from '../../lib/axiosInstance';

export interface RiskResponse {
  riskScore: number;
  flags: any[];
  summary: string;
}

export const getRiskAnalysis = async (documentId: string): Promise<RiskResponse> => {
  const data = await api.get(`/risk/${documentId}`);
  return (data as unknown) as RiskResponse;
};
