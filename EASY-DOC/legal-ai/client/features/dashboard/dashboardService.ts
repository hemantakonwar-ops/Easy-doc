import { api } from "../../lib/axiosInstance";

export interface DashboardStats {
  totalDocuments: number;
  analyzedThisMonth: number;
  averageRiskScore: number;
  pendingReview: number;
}

export interface RecentDocument {
  id: string;
  name: string;
  date: string;
  status: "Analyzed" | "Pending" | "Processing";
  risk: number | null;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const data = await api.get("/documents/stats");
    return (data as unknown) as DashboardStats;
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    throw error;
  }
};

export const getRecentDocuments = async (limit: number = 5): Promise<RecentDocument[]> => {
  try {
    const data = await api.get(`/documents?limit=${limit}&sort=createdAt:desc`);
    if (!Array.isArray(data)) {
      console.warn("API returned non-array data:", data);
      return [];
    }
    return data as RecentDocument[];
  } catch (error) {
    console.error("Failed to fetch recent documents:", error);
    return [];
  }
};
