export interface VerificationRequest {
  owner: string;
  threshold: string;
  txHash: string;
  network: string;
}

export interface VerificationResponse {
  id: string;
  owner: string;
  threshold: string;
  txHash: string;
  network: string;
  timestamp: number;
}

export interface VerificationRecord {
  id: string;
  owner: string;
  threshold: string;
  txHash: string;
  network: string;
  timestamp: number;
}

export interface Credential {
  address: string;
  verified: boolean;
  threshold: string;
  txHashes: string[];
  lastVerified: number;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(endpoint, {
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
  async submitVerification(data: VerificationRequest): Promise<VerificationResponse> {
    return fetchApi<VerificationResponse>("/api/verification", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getHistory(address: string): Promise<VerificationRecord[]> {
    return fetchApi<VerificationRecord[]>(`/api/verification/${address}`);
  },

  async getCredential(address: string): Promise<Credential | null> {
    return fetchApi<Credential | null>(`/api/credential/${address}`);
  },

  async getStats(): Promise<{ totalVerifications: number; uniqueOwners: number }> {
    return fetchApi("/api/stats");
  },
};
