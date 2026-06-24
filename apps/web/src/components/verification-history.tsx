"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { api, VerificationRecord } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import {
  History,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export function VerificationHistory() {
  const { publicKey } = useWallet();
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!publicKey) {
      setRecords([]);
      setIsLoading(false);
      return;
    }

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const data = await api.getHistory(publicKey);
        setRecords(data);
      } catch {
        setRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [publicKey]);

  if (!publicKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-muted-foreground" />
            Verification History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <History className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Connect your wallet to view history
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-muted-foreground" />
            Verification History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-purple-400" />
          Verification History
          {records.length > 0 && (
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {records.length} total
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <History className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium">No verifications yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Generate your first zero-knowledge proof to see it here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Threshold
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Transaction
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-white/5 transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="whitespace-nowrap px-3 py-3 text-sm">
                      {formatDate(new Date(record.timestamp).toISOString())}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm font-medium">
                      ${record.threshold} USDC
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="success" className="flex w-fit items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      {record.txHash ? (
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${record.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          <code className="text-xs">
                            {record.txHash.slice(0, 8)}...
                          </code>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
