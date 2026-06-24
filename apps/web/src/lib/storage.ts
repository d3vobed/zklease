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
  uniqueOwners: number;
}

let db: VerificationRecord[] = [];

export function addVerification(record: VerificationRecord): VerificationRecord {
  db.push(record);
  return record;
}

export function getVerificationsByOwner(owner: string): VerificationRecord[] {
  return db
    .filter((v) => v.owner.toLowerCase() === owner.toLowerCase())
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function getStats(): Stats {
  const uniqueOwners = new Set(db.map((v) => v.owner.toLowerCase()));
  return {
    totalVerifications: db.length,
    uniqueOwners: uniqueOwners.size,
  };
}
