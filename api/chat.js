import { createHash, timingSafeEqual } from "node:crypto";
import OpenAI from "openai";

const MAX_BODY_BYTES = 12_000;
const MAX_MESSAGES = 10;
const MAX_MESSAGE_CHARS = 1_500;

function secretMatches(supplied, expected) {
  if (typeof supplied !== "string" || typeof expected !== "string" || !expected) return false;
  const suppliedHash = createHash("sha256").update(supplied).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(suppliedHash, expectedHash);
}

function send(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(body);
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const sameSiteOrigin = host ? `${protocol}://${host}` : "";
  const productionDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "";
  const configuredOrigin = process.env.ALLOWED_ORIGIN || "";
  const allowedOrigins = new Set([sameSiteOrigin, productionDomain, configuredOrigin].filter(Boolean));

  if (!origin || !allowedOrigins.has(origin)) {
    return send(res, 403, { error: "This site is not allowed to use the assistant." });
  }

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "600");

  if (req.method === "OPTIONS") {
    res.setHeader("Cache-Control", "no-store");
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return send(res, 405, { error: "Use POST to send a message." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const appPassword = process.env.APP_ACCESS_PASSWORD;
  if (!apiKey || !appPassword) {
    return send(res, 503, { error: "Backend secrets are not configured yet." });
  }

  const authHeader = req.headers.authorization || "";
  const suppliedPassword = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!secretMatches(suppliedPassword, appPassword)) {
    return send(res, 401, { error: "Access denied. Check the app password." });
  }

  const body = req.body;
  if (!body || typeof body !== "object" || Buffer.byteLength(JSON.stringify(body), "utf8") > MAX_BODY_BYTES) {
    return send(res, 400, { error: "Message is too large or invalid." });
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > MAX_MESSAGES) {
    return send(res, 400, { error: "Send between 1 and 10 recent messages." });
  }

  const safeMessages = [];
  for (const item of messages) {
    if (!item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string") {
      return send(res, 400, { error: "Each message must have a role and text." });
    }
    const content = item.content.trim();
    if (!content || content.length > MAX_MESSAGE_CHARS) {
      return send(res, 400, { error: "Each message must contain 1 to 1,500 characters." });
    }
    safeMessages.push({ role: item.role, content });
  }
  if (safeMessages.at(-1).role !== "user") {
    return send(res, 400, { error: "The last message must be from the user." });
  }

  try {
    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6-astra",
      instructions: [
        "You are HospitalityOS, a helpful assistant for hotel operations.",
        "This first version has no connection to any live hotel system and cannot take actions.",
        "Use only the sample snapshot below for property-specific facts. Clearly call it sample/demo data.",
        "Never invent current guest, room, booking, or staff information. If asked for live data, explain that no hotel system is connected yet.",
        "Offer practical suggestions, but do not claim to have sent messages, changed bookings, or completed operational tasks.",
        "Sample snapshot: 87% occupancy; 24 arrivals; 19 departures; 8 rooms ready; 12 open requests.",
        "Attention items: room 408 AC issue (high priority); room 215 extra towels waiting 18 minutes; VIP arrival Elena Rossi in room 602 at 11:30 AM."
      ].join("\n"),
      input: safeMessages,
      max_output_tokens: 400,
      store: false
    });

    return send(res, 200, { reply: response.output_text || "I couldn't create a reply. Please try again." });
  } catch (error) {
    const status = error?.status === 429 ? 429 : 502;
    return send(res, status, {
      error: status === 429
        ? "The AI service is busy or its usage limit was reached. Try again shortly."
        : "The AI service could not answer right now. Please try again later."
    });
  }
}
