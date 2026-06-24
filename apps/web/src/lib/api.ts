const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface VerificationRequest {
  publicKey: string;
  threshold: string;
  proof: string;
}

export interface VerificationResponse {
  success: boolean;
  transactionId?: string;
  credentialId?: string;
  error?: string;
}

export interface VerificationRecord {
  id: string;
  publicKey: string;
  threshold: string;
  status: "pending" | "verified" | "failed";
  transactionId?: string;
  timestamp: string;
}

export interface Credential {
  id: string;
  tokenId: string;
  publicKey: string;
  threshold: string;
  issuedAt: string;
  metadata: Record<string, string>;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  async verifyBalance(data: VerificationRequest): Promise<VerificationResponse> {
    return fetchApi<VerificationResponse>("/verify", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getHistory(publicKey: string): Promise<VerificationRecord[]> {
    return fetchApi<VerificationRecord[]>(`/history?publicKey=${publicKey}`);
  },

  async getCredentials(publicKey: string): Promise<Credential[]> {
    return fetchApi<Credential[]>(`/credentials?publicKey=${publicKey}`);
  },

  async getCredentialById(id: string): Promise<Credential | null> {
    return fetchApi<Credential>(`/credentials/${id}`);
  },

  async getProofStatus(id: string): Promise<{ status: string; transactionId?: string }> {
    return fetchApi<{ status: string; transactionId?: string }>(`/proofs/${id}/status`);
  },
};
