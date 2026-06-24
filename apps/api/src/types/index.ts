export interface VerificationRecord {
  id: string;
  owner: string;
  threshold: string;
  txHash: string;
  network: string;
  timestamp: number;
}

export interface CredentialRecord {
  address: string;
  verified: boolean;
  threshold: string;
  txHashes: string[];
  lastVerified: number;
}

export interface Stats {
  totalVerifications: number;
  uniqueAddresses: number;
  lastVerification: number | null;
}

export interface HealthResponse {
  status: "ok";
  uptime: number;
  timestamp: number;
}

export interface ApiError {
  error: string;
  message: string;
}

export interface CreateVerificationBody {
  owner: string;
  threshold: string;
  txHash: string;
  network: string;
}
