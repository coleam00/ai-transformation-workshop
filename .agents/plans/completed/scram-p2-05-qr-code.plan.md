# Plan: QR Code Generation for Poll Sharing (SCRAM-P2-05)

## Summary

Build a reusable `<PollQRCode>` client component that encodes a poll's voting URL into a high-contrast QR code. The component wraps `qrcode.react`'s `<QRCodeCanvas>`, derives the base URL from `NEXT_PUBLIC_BASE_URL` (falling back to `window.location.origin`), and resizes proportionally on small screens. This unblocks SCRAM-P2-03 (Live Presentation Mode).

## User Story

As a voter,
I want to scan a QR code from the presenter's screen,
So that I can immediately reach the voting page on my phone without typing a URL.

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | LOW |
| Systems Affected | `src/shared/components`, `src/shared/index.ts`, `.env.example` |
| Jira Issue | SCRUM-2 (parent epic) |

---

## Patterns to Follow

### Client component declaration
```tsx
// SOURCE: src/features/polls/components/vote-form.tsx:1
"use client";
```

### Named export (not default) for non-page components
```tsx
// SOURCE: src/features/polls/components/vote-form.tsx:17
export function VoteForm({ pollId, options }: VoteFormProps) {
```

### Interface for props
```tsx
// SOURCE: src/features/polls/components/vote-form.tsx:12-15
interface VoteFormProps {
  pollId: string;
  options: PollOption[];
}
```

### Barrel re-export from shared
```ts
// SOURCE: src/shared/index.ts:1-10
export { formatDate, formatIso, parseIso, utcNow } from "./utils";
```

### Tailwind responsive class pattern
```tsx
// SOURCE: src/app/page.tsx:17
className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-6 py-16"
```

---

## Files to Change

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | UPDATE | Add `qrcode.react` dependency |
| `.env.example` | UPDATE | Document `NEXT_PUBLIC_BASE_URL` variable |
| `src/shared/components/PollQRCode.tsx` | CREATE | The QR code component |
| `src/shared/index.ts` | UPDATE | Re-export `PollQRCode` from shared barrel |

---

## Tasks

### Task 1: Install `qrcode.react`

- **File**: `package.json` (managed by bun)
- **Action**: UPDATE
- **Implement**: Run `bun add qrcode.react` in the worktree root. This adds the package and its bundled TypeScript types (the package ships its own declarations as of v4).
- **Mirror**: existing deps pattern in `package.json`
- **Validate**: `bun run lint && npx tsc --noEmit` — no new errors

### Task 2: Document `NEXT_PUBLIC_BASE_URL` in `.env.example`

- **File**: `.env.example`
- **Action**: UPDATE
- **Implement**: Append the following block:

```
# Base URL used for QR code generation. Defaults to window.location.origin at runtime.
# Set this for consistent URLs in all environments.
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

- **Validate**: Visual check — no code changes needed here

### Task 3: Create `PollQRCode` component

- **File**: `src/shared/components/PollQRCode.tsx`
- **Action**: CREATE
- **Implement**:
  - `"use client"` directive (uses `window.location.origin` at runtime)
  - Props interface: `{ pollId: string; size?: number }`
  - Derive `baseUrl` from `process.env.NEXT_PUBLIC_BASE_URL` at module level, with `typeof window !== "undefined" ? window.location.origin : ""` as the runtime fallback
  - Derive `votingUrl` as `${baseUrl}/poll/${pollId}`
  - Render `<QRCodeCanvas>` with:
    - `value={votingUrl}`
    - `bgColor="#ffffff"`, `fgColor="#000000"` (max contrast for projectors)
    - `level="M"` (medium error correction — good balance of density vs. scan reliability)
    - `size={size}` prop-driven, defaulting to `200`
    - Wrapper `<div>` with `className="rounded-sm bg-white p-3"` — the white padding acts as the quiet zone required for reliable scanning
  - Responsive size: accept `size` prop so the caller (`PresentationView`) can pass `Math.max(100, Math.min(200, viewportWidth * 0.12))` or similar. The component itself doesn't track viewport — keep it a pure display component.
- **Mirror**: `src/features/polls/components/vote-form.tsx:1-16` for "use client" + interface + named export pattern
- **Validate**: `bun run lint && npx tsc --noEmit`

### Task 4: Export from shared barrel

- **File**: `src/shared/index.ts`
- **Action**: UPDATE
- **Implement**: Add the following export line (keep existing exports, add at end):

```ts
export { PollQRCode } from "./components/PollQRCode";
```

- **Mirror**: `src/shared/index.ts:1-10` — existing export style
- **Validate**: `bun run lint && npx tsc --noEmit`

---

## Validation

```bash
# Install dependency first
bun add qrcode.react

# Then verify all checks pass
bun run lint && npx tsc --noEmit
```

---

## Acceptance Criteria

- [ ] `<PollQRCode pollId="abc123" />` renders without errors and shows a QR canvas
- [ ] Scanning the QR code on a mobile device navigates to `/poll/[id]`
- [ ] QR code renders black-on-white (`fgColor="#000000"` / `bgColor="#ffffff"`)
- [ ] `size` prop controls canvas dimensions; default is 200×200
- [ ] Type check passes (`npx tsc --noEmit`)
- [ ] Lint passes (`bun run lint`)
- [ ] `NEXT_PUBLIC_BASE_URL` is documented in `.env.example`
