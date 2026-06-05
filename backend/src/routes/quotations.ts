import { Router } from "express";
import { z } from "zod";
import { rateLimit } from "../middleware/rateLimit";
import {
  acceptQuotation,
  getQuotationBySlug,
  requestQuotationRevision,
  trackQuotationView,
} from "../services/quotationService";
import { HttpError } from "../utils/httpError";

export const quotationsRouter = Router();

quotationsRouter.get("/:slug", async (req, res, next) => {
  try {
    const quotation = await getQuotationBySlug(req.params.slug);
    res.json({ quotation });
  } catch (e) {
    next(e);
  }
});

quotationsRouter.post("/:slug/view", async (req, res, next) => {
  try {
    const ip = String(req.ip ?? "unknown");
    if (!rateLimit(`qview:${ip}`, 30, 60 * 1000)) {
      throw new HttpError(429, "Too many requests");
    }
    const body = z
      .object({ viewerKey: z.string().max(100).optional().default("") })
      .parse(req.body ?? {});
    const viewerKey = body.viewerKey || ip;
    const ua = String(req.headers["user-agent"] ?? "");
    const quotation = await trackQuotationView(req.params.slug, viewerKey, ua);
    res.json({ quotation });
  } catch (e) {
    next(e);
  }
});

quotationsRouter.post("/:slug/accept", async (req, res, next) => {
  try {
    const ip = String(req.ip ?? "unknown");
    if (!rateLimit(`qaccept:${ip}`, 5, 60 * 60 * 1000)) {
      throw new HttpError(429, "Too many requests");
    }
    const quotation = await acceptQuotation(req.params.slug);
    res.json({ ok: true, quotation });
  } catch (e) {
    next(e);
  }
});

quotationsRouter.post("/:slug/revision", async (req, res, next) => {
  try {
    const ip = String(req.ip ?? "unknown");
    if (!rateLimit(`qrev:${ip}`, 10, 60 * 60 * 1000)) {
      throw new HttpError(429, "Too many requests");
    }
    const body = z.object({ message: z.string().max(2000).optional().default("") }).parse(req.body ?? {});
    const quotation = await requestQuotationRevision(req.params.slug, body.message);
    res.json({ ok: true, quotation });
  } catch (e) {
    next(e);
  }
});
