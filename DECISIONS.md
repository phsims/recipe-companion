# Decision log

Key technical and product decisions for Recipe Companion. Use this to understand *why* things are built the way they are.

---

## 1. CopilotKit: sidebar + Next.js proxy

**Decision:** Use CopilotKit’s **CopilotSidebar** for the chat UI and run the CopilotKit runtime inside **Next.js API routes** that proxy to the Python backend.

**Why:**

- The challenge backend exposes a single `POST /copilotkit` endpoint; CopilotKit’s client expects a GraphQL-style runtime. The Next.js routes (`/api/copilotkit`, `/api/copilotkit/[...path]`) unwrap the CopilotKit envelope and forward the body to the backend so existing Pydantic validation works.
- A sidebar keeps the recipe visible while chatting, which fits “cooking companion” better than a full-page or modal chat.
- The runtime lives in the Next app so we can keep a single backend contract and avoid CORS/credentials issues from the browser talking directly to the Python server.

**Where:** `lib/copilotkitRuntime.ts`, `app/api/copilotkit/route.ts`, `app/api/copilotkit/[...path]/route.ts`, `lib/copilotkitProxy.ts`, `components/CopilotKitWrapper.tsx`.

---

## 2. App content inside the sidebar

**Decision:** Render the whole app (Header + pages) as **children of CopilotSidebar**, not as a sibling.

**Why:**

- CopilotKit’s chat open/close state lives in a context provided *inside* the sidebar. To open the sidebar from our “Open AI Cooking Assistant” buttons (AppBar and RecipeDisplay), those components must be inside that context so they can call `useChatContext().setOpen(true)`.
- Putting children inside the sidebar is the pattern shown in CopilotKit docs and gives one source of truth for open/close.

**Where:** `components/CopilotKitWrapper.tsx` – `<CopilotSidebar>{children}</CopilotSidebar>`.

---

## 3. Sidebar close behavior

**Decision:** Disable **click-outside-to-close** and make our AppBar and RecipeDisplay buttons **toggle** the sidebar (open and close).

**Why:**

- Click-outside was fighting with the floating toggle button and sometimes made “close” feel unreliable. Turning it off (`clickOutsideToClose={false}`) removes that race.
- Letting our buttons call `setOpen(!chatOpen)` gives users a clear, consistent way to close from the recipe UI as well as from the sidebar’s own button or header close.

**Where:** `CopilotKitWrapper.tsx` – `clickOutsideToClose={false}`; `app/recipe/page.tsx` – `onToggleChat = () => setChatOpen(!chatOpen)`.

---

## 4. Recipe state: merge agent state into local context

**Decision:** Keep recipe state in **React context** (`RecipeContext`) and **merge** CopilotKit agent state (from `useCoAgent`) into it on each update. Do not POST recipe state from the frontend into the API.

**Why:**

- The backend owns the canonical state per thread; the agent returns updated state in the stream. We treat that as the source of truth and reflect it in the UI by merging into context.
- Pushing state from the client into the backend would duplicate responsibility and could conflict with what the agent is doing. Letting the agent drive state via tools keeps one source of truth.

**Where:** `app/recipe/page.tsx` – `useEffect` that merges `state` into `recipeState`; `contexts/RecipeContext.tsx`.

---

## 5. Substitutions applied across the whole recipe

**Decision:** When the agent updates only the **ingredients** list (e.g. substitute name), apply that name change everywhere: **ingredients**, **step instructions**, **step tips**, and **recipe description**.

**Why:**

- Otherwise the UI would show “use almond milk” in the steps but still list “dairy milk” in ingredients, which is confusing. A substitution should feel global.

**Where:** `utils/recipe.ts` – `substituteIngredient`, `replaceIngredientInText`, `applyAgentSubstitutionsToRecipe`; `app/recipe/page.tsx` – merge uses `applyAgentSubstitutionsToRecipe(agentRecipe, prev.recipe)`.

---

## 6. Scaling from current servings

**Decision:** **Scale recipe** using `targetServings / recipe.servings` (current servings). Keep `original_servings` for reference but do not re-anchor to it when the user changes servings again.

**Why:**

- Matches the mental model “change to N servings from what I see now” and avoids surprise when the user has already scaled once.

**Where:** `utils/recipe.ts` – `scaleRecipe`.

---

## 7. Voice input: Web Speech API + context + custom Input

**Decision:** Use the browser **Web Speech API** (SpeechRecognition) for voice. Put the transcript in a **React context** and pass a **custom Input** to CopilotSidebar that, when it sees a pending transcript, calls `onSend(transcript)` and clears it.

**Why:**

- CopilotKit doesn’t expose a “send message” hook from outside the chat; the Input component is the one that has `onSend`. So we need a way to inject text from our mic button into that Input. A shared context + custom Input component achieves that without forking CopilotKit.
- Web Speech API is built-in (Chrome, Edge, Safari), needs no backend for STT, and we show a “not supported” state in other browsers (e.g. Firefox).

**Where:** `contexts/VoiceInputContext.tsx`, `components/VoiceInput.tsx`, `components/CopilotVoiceInput.tsx`, `CopilotKitWrapper.tsx` – `Input={CopilotVoiceInput}`.

---

## 8. Error handling: chat, backend, upload

**Decision:** Explicit **error UI** in three places: (1) **Chat/sidebar** – use CopilotKit’s `renderError` with a custom component that shows message + Dismiss + Retry; (2) **Backend down** – banner below the header with Retry; (3) **Upload** – show error message and a “Try again” button that retries the last file or clears the error.

**Why:**

- Users need to see when something failed and have a clear next step (retry or dismiss) instead of a silent failure or generic message.

**Where:** `components/ChatErrorAlert.tsx`, `CopilotKitWrapper.tsx` – `renderError`; `components/Header.tsx` – backend-down Alert; `components/UploadZone.tsx` – error + Try again.

---

## 9. Accessibility: skip link, landmarks, labels, keyboard

**Decision:** Do an **accessibility pass**: skip link to main content, `<main id="main-content">`, proper heading hierarchy (h1 on home and recipe title, h2 for Ingredients/Instructions), **aria-labels** on icon buttons and inputs, **aria-live/role="alert"** for loading and errors, **progressbar** semantics for step progress, and **keyboard** activation (Enter/Space) for step list items.

**Why:**

- Supports keyboard-only and screen-reader users and aligns with WCAG-style expectations without changing the visual design.

**Where:** `components/SkipLink.tsx`, `app/layout.tsx`, `app/globals.css`; `components/UploadZone.tsx`, `components/RecipeDisplay.tsx`, `app/recipe/page.tsx`, `components/Header.tsx` – aria and keyboard behavior.

---

## 10. No backend hosting documentation

**Decision:** Do **not** document how to host the Python backend (Railway, Render, etc.) or how to point a deployed frontend at it.

**Why:**

- Per product decision: the app is not being deployed with a live backend; hosting instructions were removed to avoid maintaining steps we don’t use.

**Where:** README and CHALLENGE_CHECKLIST no longer include deployment/hosting sections for the backend.

---

## 11. Gemini 3.1 Flash Lite in the backend

**Decision:** Use **Gemini 3.1 Flash Lite** in the Python backend for the CopilotKit/agent LLM to get a **higher rate limit**.

**Why:**

- Heavier models hit rate limits sooner during development and demos. Flash Lite offers a higher quota so upload + multi-turn chat stays within limits without throttling or errors.
- Trade-off is accepted for this app: the lighter model is sufficient for recipe extraction, scaling, substitutions, and step guidance.

**Where:** Backend (Code-Challenge repo) – model/config used by the agent (e.g. LangGraph or CopilotKit integration with the Gemini API).

---

## 12. Next.js for speed

**Decision:** Use **Next.js** (App Router) for the frontend framework.

**Why:**

- Fast to build and iterate: file-based routing, server components where useful, and a single stack for API routes that proxy to the Python backend. Good fit for getting the challenge app to a working state quickly.

**Where:** Entire frontend – `app/` directory, `next.config`, `package.json`.

---

## 13. MUI for speed

**Decision:** Use **MUI (Material UI)** for UI components and layout.

**Why:**

- Speeds up development: ready-made, accessible components (AppBar, Button, Card, TextField, etc.) and theming so we can focus on flows and integration instead of building a design system from scratch.

**Where:** `components/` (Header, RecipeDisplay, UploadZone, etc.), `app/ThemeRegistry.tsx`, MUI imports across the app.

---

## 14. Images created in Nano Banana

**Decision:** Create app **images** (e.g. logo, icons, or graphics) in **Nano Banana**.

**Why:**

- Nano Banana was used to generate or edit the image assets for the app so we could ship a polished look without custom illustration work.

**Where:** Static assets (e.g. `public/logo.png` or other image files used in the UI).

---

*Last updated to reflect the current codebase and challenge checklist.*
