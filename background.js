const API_URL = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const REQUEST_TIMEOUT_MS = 20000;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "GENERATE_AI_REPLY") {
    return false;
  }

  generateAiReply(message.payload)
    .then((text) => sendResponse({ ok: true, text }))
    .catch((error) => sendResponse({ ok: false, error: error.message || "Unknown error" }));

  return true;
});

async function generateAiReply(payload) {
  const emailContent = payload?.emailContent?.trim();
  const userInstruction = payload?.userInstruction?.trim() || "";
  const mode = payload?.mode === "compose" ? "compose" : "reply";
  if (!emailContent && !userInstruction) {
    throw new Error("Email context ya instruction missing.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  let data;

  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        emailContent: emailContent ? emailContent.slice(0, 12000) : "",
        tone: payload.tone || "professional",
        previousReply: (payload.previousReply || "").trim().slice(0, 12000),
        userInstruction: userInstruction.slice(0, 4000),
        mode,
        variationIndex: payload.variationIndex || 1
      }),
      signal: controller.signal
    });

    data = await response.json().catch(() => null);
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Check backend status.");
    }
    if (error instanceof TypeError) {
      throw new Error("Backend response browser ne block kar di. CORS ya backend availability check karo.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const details = Array.isArray(data?.details) ? data.details.join(" | ") : "";
    throw new Error(data?.message || details || data?.error || `Backend request failed (${response.status}).`);
  }

  if (typeof data?.text !== "string" || !data.text.trim()) {
    throw new Error("Backend se valid reply text nahi mila.");
  }

  return data.text.trim();
}
