const DEFAULT_TONE = "professional";
const COMPOSE_BODY_SELECTORS = [
  'div[aria-label="Message Body"][contenteditable="true"]',
  'div[contenteditable="true"][g_editable="true"]',
  'div[role="textbox"][contenteditable="true"]'
];
const TOOLBAR_SELECTORS = [
  ".btC",
  ".gU.Up",
  ".aDh",
  ".aDj",
  ".amn",
  '[role="dialog"] .aDh',
  '[role="dialog"] .btC',
  '[role="group"]'
];
const SEND_BUTTON_SELECTORS = [
  'div[role="button"][data-tooltip^="Send"]',
  'div[role="button"][data-tooltip*="Send"]',
  'div[role="button"][aria-label^="Send"]',
  'div[role="button"][aria-label*="Send"]',
  "div.T-I.T-I-atl",
  "div.T-I-atl",
  'button[aria-label^="Send"]'
];
const EXTENSION_RUNTIME = globalThis.chrome?.runtime || globalThis.browser?.runtime || null;

let lastKnownUrl = location.href;
let scanScheduled = false;

startObservers();
scheduleScan();

function startObservers() {
  const observer = new MutationObserver(() => {
    scheduleScan();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  window.addEventListener("popstate", scheduleScan);
  window.addEventListener("hashchange", scheduleScan);
  window.setInterval(checkUrlChange, 800);
}

function checkUrlChange() {
  if (location.href === lastKnownUrl) {
    return;
  }

  lastKnownUrl = location.href;
  scheduleScan();
}

function scheduleScan() {
  if (scanScheduled) {
    return;
  }

  scanScheduled = true;
  window.requestAnimationFrame(() => {
    scanScheduled = false;
    scanComposeWindows();
  });
}

function scanComposeWindows() {
  const composeBodies = findComposeBodies();

  composeBodies.forEach((composeBody) => {
    const composeContext = findComposeContext(composeBody);
    if (!composeContext) {
      return;
    }

    const { composeRoot, toolbar, sendButton } = composeContext;

    if (toolbar.querySelector(`.ai-reply-button[data-compose-id="${composeBody.dataset.aiComposeId || ""}"]`)) {
      return;
    }

    injectAiReplyButton(composeRoot, composeBody, toolbar, sendButton);
  });
}

function findComposeBodies() {
  const allMatches = COMPOSE_BODY_SELECTORS.flatMap((selector) =>
    Array.from(document.querySelectorAll(selector))
  );

  return allMatches.filter((node, index) =>
    allMatches.indexOf(node) === index && isVisible(node)
  );
}

function findComposeContext(composeBody) {
  if (!composeBody.dataset.aiComposeId) {
    composeBody.dataset.aiComposeId = `compose-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  const composeRoot =
    composeBody.closest('div[role="dialog"]') ||
    composeBody.closest(".M9") ||
    composeBody.closest(".aoI") ||
    composeBody.closest(".AD") ||
    composeBody.closest(".nH") ||
    composeBody.parentElement;

  const sendButton = findNearestSendButton(composeBody);
  if (!sendButton) {
    return null;
  }

  const toolbar = findToolbarFromSendButton(sendButton, composeRoot) || sendButton.parentElement;
  if (composeRoot && toolbar) {
    return {
      composeRoot,
      toolbar,
      sendButton
    };
  }

  return null;
}

function findNearestSendButton(composeBody) {
  const localRoot =
    composeBody.closest('div[role="dialog"]') ||
    composeBody.closest(".M9") ||
    composeBody.closest(".aoI") ||
    composeBody.closest(".AD") ||
    composeBody.closest(".nH") ||
    composeBody.parentElement;

  let current = localRoot || composeBody;
  let depth = 0;

  while (current && depth < 12) {
    for (const selector of SEND_BUTTON_SELECTORS) {
      const sendButtons = Array.from(current.querySelectorAll(selector)).filter(isVisible);
      if (sendButtons.length > 0) {
        const exact = sendButtons.find((button) => {
          const container = button.closest('div[role="dialog"], .M9, .aoI, .AD, .nH');
          return !localRoot || !container || container === localRoot;
        });

        return exact || sendButtons[0];
      }
    }

    current = current.parentElement;
    depth += 1;
  }

  return null;
}

function findToolbarFromSendButton(sendButton, composeRoot) {
  const localToolbar = TOOLBAR_SELECTORS.map((selector) => {
    if (!composeRoot) {
      return [];
    }

    return Array.from(composeRoot.querySelectorAll(selector)).filter(isVisible);
  }).flat();

  if (localToolbar.length > 0) {
    const matchingToolbar = localToolbar.find((node) => node.contains(sendButton));
    if (matchingToolbar) {
      return matchingToolbar;
    }
  }

  return (
    sendButton.closest(".btC") ||
    sendButton.closest(".gU.Up") ||
    sendButton.closest(".aDh") ||
    sendButton.closest(".aDj") ||
    sendButton.closest(".amn") ||
    sendButton.closest('[role="group"]') ||
    sendButton.parentElement
  );
}

function injectAiReplyButton(composeRoot, composeBody, toolbar, sendButton) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ai-reply-button";
  button.dataset.composeId = composeBody.dataset.aiComposeId || "";
  button.title = "Generate AI reply";
  button.setAttribute("aria-label", "Generate AI reply");
  button.dataset.state = "idle";
  button.innerHTML = `
    <span class="ai-reply-button__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M4.5 7.75A1.75 1.75 0 0 1 6.25 6h8.1A1.75 1.75 0 0 1 16.1 7.75v6.5A1.75 1.75 0 0 1 14.35 16h-8.1A1.75 1.75 0 0 1 4.5 14.25z"></path>
        <path d="M5.6 7.1l4.7 3.7 4.7-3.7" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"></path>
        <path d="M18.2 4.2l.45 1.3 1.3.45-1.3.45-.45 1.3-.45-1.3-1.3-.45 1.3-.45z"></path>
      </svg>
    </span>
    <span class="ai-reply-button__label">AI Reply</span>
  `;

  button.addEventListener("click", async () => {
    try {
      setButtonState(button, "loading", "Generating...");

      const emailContext = collectEmailContext(composeRoot, composeBody);
      const mode = detectMode(emailContext);
      const currentDraft = cleanText(composeBody.innerText || composeBody.textContent || "");
      const previousReply = composeRoot.dataset.aiReplyLastReply || "";
      const userInstruction = resolveUserInstruction(composeRoot, currentDraft, previousReply, mode);

      if (mode === "compose" && !userInstruction) {
        throw new Error("Compose mode ke liye instruction likho, jaise leave email ya boss ko mail.");
      }

      if (mode === "reply" && !emailContext.trim()) {
        throw new Error("Email context nahi mila.");
      }

      const variationIndex = Number(composeRoot.dataset.aiReplyVariationIndex || "0") + 1;

      const generatedReply = await requestAiReply({
        emailContent: emailContext,
        tone: DEFAULT_TONE,
        previousReply,
        userInstruction,
        mode,
        variationIndex
      });

      insertReply(composeBody, generatedReply);
      composeRoot.dataset.aiReplyVariationIndex = String(variationIndex);
      composeRoot.dataset.aiReplyLastReply = generatedReply;
      composeRoot.dataset.aiReplyLastInstruction = userInstruction;
      setButtonState(button, "success", "Inserted");
      showInlineNotice(composeRoot, variationIndex > 1 ? "New variation inserted" : "AI reply inserted");
    } catch (error) {
      console.error("AI Reply error:", error);
      setButtonState(button, "error", "Retry");
      showInlineNotice(composeRoot, error.message || "AI reply generate nahi hua.", true);
    } finally {
      window.setTimeout(() => {
        setButtonState(button, "idle", "AI Reply");
      }, 1800);
    }
  });

  const buttonHost = document.createElement("div");
  buttonHost.className = "ai-reply-button-host";
  buttonHost.dataset.composeId = composeBody.dataset.aiComposeId || "";
  buttonHost.appendChild(button);

  const sendAnchor = sendButton.closest('[role="button"]') || sendButton;
  if (sendAnchor?.parentElement) {
    sendAnchor.insertAdjacentElement("beforebegin", buttonHost);
    return;
  }

  if (toolbar) {
    toolbar.prepend(buttonHost);
  }
}

function setButtonState(button, state, labelText) {
  const label = button.querySelector(".ai-reply-button__label");
  if (label) {
    label.textContent = labelText;
  }

  button.disabled = state === "loading";
  button.dataset.state = state;
}

function collectEmailContext(composeRoot, composeBody) {
  const threadRegion = findThreadRegion(composeRoot, composeBody);
  const messageScope = findMessageScope(threadRegion, composeRoot, composeBody);
  const composeDraft = cleanText(composeBody.innerText || composeBody.textContent || "");
  const subject = cleanText(
    threadRegion?.querySelector("h2.hP, h2[data-thread-perm-id]")?.textContent || ""
  );

  const sender = cleanText(
    messageScope?.querySelector(".gD, .go, .yP, .iv, .g2")?.textContent ||
      threadRegion?.querySelector(".gD, .go, .yP, .iv, .g2")?.textContent ||
      composeRoot.querySelector(".gD, .go, .yP, .iv")?.textContent ||
      ""
  );

  const latestMessage = extractLatestMessage(messageScope, composeBody);
  const threadText = extractThreadText(threadRegion, messageScope, composeBody);

  const context = [
    subject ? `Subject: ${subject}` : "",
    sender ? `Sender: ${sender}` : "",
    latestMessage ? `Latest message:\n${latestMessage}` : "",
    threadText ? `Thread context:\n${threadText}` : ""
  ]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  if (!context) {
    return "";
  }

  if (composeDraft && context === composeDraft) {
    return "";
  }

  return context;
}

function findThreadRegion(composeRoot, composeBody) {
  return (
    composeBody.closest('[role="list"]') ||
    composeBody.closest('.nH.if') ||
    composeRoot.closest('div[role="main"]') ||
    document.querySelector('div[role="main"]')
  );
}

function detectMode(emailContext) {
  return emailContext ? "reply" : "compose";
}

function resolveUserInstruction(composeRoot, currentDraft, previousReply, mode) {
  const lastInstruction = composeRoot.dataset.aiReplyLastInstruction || "";

  if (!currentDraft) {
    return lastInstruction;
  }

  if (previousReply && currentDraft === previousReply) {
    return lastInstruction;
  }

  if (mode === "reply" && lastInstruction && currentDraft.startsWith(previousReply)) {
    return lastInstruction;
  }

  return currentDraft;
}

function findMessageScope(threadRegion, composeRoot, composeBody) {
  const replyContainer =
    composeBody.closest(".adn.ads") ||
    composeBody.closest(".bkK") ||
    composeBody.closest(".M9") ||
    composeBody.closest(".aoI");

  if (replyContainer) {
    const previousMessage = findPreviousVisibleMessage(replyContainer, threadRegion);
    if (previousMessage) {
      return previousMessage;
    }
  }

  const visibleMessages = getVisibleMessageBlocks(threadRegion || composeRoot);
  if (visibleMessages.length > 0) {
    return visibleMessages[visibleMessages.length - 1];
  }

  return threadRegion || composeRoot;
}

function findPreviousVisibleMessage(replyContainer, threadRegion) {
  let current = replyContainer.previousElementSibling;

  while (current) {
    if (isVisible(current) && current.querySelector(".a3s.aiL, .a3s")) {
      return current;
    }
    current = current.previousElementSibling;
  }

  const visibleMessages = getVisibleMessageBlocks(threadRegion);
  return visibleMessages.length > 0 ? visibleMessages[visibleMessages.length - 1] : null;
}

function getVisibleMessageBlocks(root) {
  if (!root) {
    return [];
  }

  return Array.from(root.querySelectorAll(".adn.ads, .h7, [data-message-id], .gs"))
    .filter((node) => isVisible(node) && cleanText(node.innerText || node.textContent || ""));
}

function extractLatestMessage(messageScope, composeBody) {
  if (!messageScope) {
    return "";
  }

  const preferredContent = messageScope.querySelector(".a3s.aiL, .a3s");
  const fallbackContent = messageScope;
  const composeText = cleanText(composeBody.innerText || composeBody.textContent || "");
  const messageText = cleanText(
    preferredContent?.innerText ||
      preferredContent?.textContent ||
      fallbackContent.innerText ||
      fallbackContent.textContent ||
      ""
  );

  if (!messageText) {
    return "";
  }

  if (composeText && messageText === composeText) {
    return "";
  }

  return messageText.replace(composeText, "").trim().slice(-2500);
}

function extractThreadText(threadRegion, messageScope, composeBody) {
  const quotedBlocks = Array.from(
    (messageScope || threadRegion || composeBody.parentElement).querySelectorAll(".gmail_quote, blockquote, .h7")
  );

  const quotedText = quotedBlocks
    .map((node) => cleanText(node.innerText || node.textContent || ""))
    .filter(Boolean)
    .join("\n\n");

  if (quotedText) {
    return quotedText.slice(-5000);
  }

  const mainRegion = messageScope || threadRegion;

  if (!mainRegion) {
    return "";
  }

  const fullText = cleanText(mainRegion.innerText || mainRegion.textContent || "");
  const composeText = cleanText(composeBody.innerText || composeBody.textContent || "");

  if (!fullText) {
    return "";
  }

  return fullText.replace(composeText, "").trim().slice(-5000);
}

function cleanText(value) {
  return value.replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function isVisible(node) {
  if (!node || !(node instanceof HTMLElement)) {
    return false;
  }

  const style = window.getComputedStyle(node);
  return style.display !== "none" && style.visibility !== "hidden" && node.offsetParent !== null;
}

async function requestAiReply(payload) {
  if (!EXTENSION_RUNTIME?.sendMessage) {
    throw new Error("Extension runtime unavailable. Extension reload karo.");
  }

  const result = await EXTENSION_RUNTIME.sendMessage({
    type: "GENERATE_AI_REPLY",
    payload
  });

  if (!result?.ok) {
    throw new Error(result?.error || "Backend response failed.");
  }

  return result.text || "";
}

function insertReply(composeBody, generatedReply) {
  composeBody.focus();

  const hasDraft = cleanText(composeBody.innerText || composeBody.textContent || "");
  if (hasDraft) {
    document.execCommand("selectAll", false, null);
  }

  const inserted = document.execCommand("insertText", false, generatedReply);
  if (!inserted) {
    composeBody.innerHTML = buildReplyHtml(generatedReply);
  }

  composeBody.dispatchEvent(new Event("input", { bubbles: true }));
  composeBody.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, inputType: "insertText", data: generatedReply }));
  composeBody.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: generatedReply }));
  composeBody.dispatchEvent(new Event("change", { bubbles: true }));
}

function showInlineNotice(composeRoot, message, isError = false) {
  const existingNotice = composeRoot.querySelector(".ai-reply-notice");
  if (existingNotice) {
    existingNotice.remove();
  }

  const notice = document.createElement("div");
  notice.className = "ai-reply-notice";
  notice.dataset.variant = isError ? "error" : "success";
  notice.textContent = message;

  const composeBody = composeRoot.querySelector(COMPOSE_BODY_SELECTORS.join(","));
  const anchor = composeBody?.parentElement || composeRoot;
  anchor.appendChild(notice);

  window.setTimeout(() => {
    notice.remove();
  }, 2600);
}

function buildReplyHtml(generatedReply) {
  const safeLines = generatedReply
    .split(/\r?\n/)
    .map((line) => escapeHtml(line));

  return safeLines
    .map((line) => (line ? `<div>${line}</div>` : "<div><br></div>"))
    .join("");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
