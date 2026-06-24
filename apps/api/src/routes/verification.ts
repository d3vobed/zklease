import { Router } from "express";
import crypto from "node:crypto";
import type { CreateVerificationBody, VerificationRecord } from "../types/index.js";
import {
  addVerification,
  getVerificationsByOwner,
} from "../services/storage.js";

const router = Router();

router.post("/", (req, res) => {
  const body = req.body as CreateVerificationBody;

  if (!body.owner || !body.threshold || !body.txHash || !body.network) {
    res.status(400).json({
      error: "VALIDATION_ERROR",
      message:
        "Missing required fields: owner, threshold, txHash, network",
    });
    return;
  }

  const record: VerificationRecord = {
    id: crypto.randomUUID(),
    owner: body.owner,
    threshold: body.threshold,
    txHash: body.txHash,
    network: body.network,
    timestamp: Date.now(),
  };

  const saved = addVerification(record);
  res.status(201).json(saved);
});

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
    res.status(200).json([]);
    return;
  }

  res.status(200).json(verifications);
});

export default router;
