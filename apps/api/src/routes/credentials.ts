import { Router } from "express";
import type { CredentialRecord } from "../types/index.js";
import { getVerificationsByOwner } from "../services/storage.js";

const router = Router();

router.get("/:address", (req, res) => {
  const { address } = req.params;

  if (!address) {
    res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Address parameter is required",
    });
    return;
  }

  const verifications = getVerificationsByOwner(address);

  if (verifications.length === 0) {
    res.status(200).json(null);
    return;
  }

  const txHashes = verifications.map((v) => v.txHash);
  const lastVerified = Math.max(...verifications.map((v) => v.timestamp));
  const threshold = verifications[0].threshold;

  const credential: CredentialRecord = {
    address: address.toLowerCase(),
    verified: verifications.length > 0,
    threshold,
    txHashes,
    lastVerified,
  };

  res.status(200).json(credential);
});

export default router;
