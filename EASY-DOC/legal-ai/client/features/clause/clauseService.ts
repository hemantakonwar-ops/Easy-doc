import api from '../../lib/axiosInstance';

export interface Clause {
  id: string;
  title: string;
  description: string;
  type: string;
  text?: string;
}

export const extractClauses = async (documentId: string, clauseTypes?: string[]): Promise<Clause[]> => {
  try {
    const data = await api.post('/clause', {
      documentId,
      clauseTypes,
    });
    console.log("extractClauses data:", data);
    return ((data as any).clauses || []) as Clause[];
  } catch (error) {
    console.error("extractClauses error:", error);
    throw error;
  }
};
