# Architecture overview

Single-page app (React 19, Vite) talking to the [backend API](https://github.com/victorkauan/silver-proposals-backend).
All user-facing text is in Brazilian Portuguese.

## Building blocks

| Concern      | Choice                                                           | Where                                |
| ------------ | ---------------------------------------------------------------- | ------------------------------------ |
| Routing      | React Router (data router)                                       | `src/features/app/app.routes.tsx`    |
| Server state | TanStack Query (mutations and queries, loading and error states) | `src/features/app/index.tsx`         |
| Forms        | React Hook Form with Zod schemas that mirror the API validation  | `src/features/*/<feature>.schema.ts` |
| UI           | shadcn/ui on Tailwind CSS v4 (Base UI primitives)                | `src/@shared/components/ui`          |
| API calls    | `request` and `requestJson` in the HTTP client                   | `src/@shared/api/http.client.ts`     |

## Layout and visual style

The interface follows the minimal style of Vercel's [Geist](https://vercel.com/geist/introduction): a neutral gray scale,
subtle borders, small radii, and Geist Sans. Screens are adapted from [shadcn/ui blocks](https://ui.shadcn.com/blocks):

- **Login and sign-up** (`login-02` / `signup-02`): a two-column page with the form on the left and a dark brand
  panel on the right. The panel shows a grid pattern and a preview of a generated proposal, and it is hidden on small screens.
- **Signed-in area** (`sidebar-07`): `AppShell` puts a sidebar that collapses to icons (brand, navigation, user menu)
  next to an inset content area with a header (sidebar toggle and breadcrumb).
- **Accent:** a single blue accent (`--primary`, as in Geist) for primary buttons, the active navigation item, and focus
  rings, plus a blue-to-violet gradient on the brand mark. Everything else stays on the neutral gray scale.
- **Theme:** light, dark, or system, chosen in the user menu and stored in `localStorage`. An inline script in
  `index.html` applies it before the first paint, so there is no flash of the wrong theme.

The design follows the backend's
[ADR-0001](https://github.com/victorkauan/silver-proposals-backend/blob/main/docs/adr/0001-refresh-token-in-httponly-cookie.md):

1. The **access token lives only in memory** (a module variable in the HTTP client). It is never written to
   `localStorage`, `sessionStorage`, or a readable cookie, and passwords are never stored.
2. On page load, `SessionProvider` calls `POST /auth/refresh`. The browser sends the `httpOnly` refresh cookie, so a
   valid session comes back without the app ever seeing that cookie.
3. When an authenticated request gets `401`, the client refreshes once and retries. Concurrent `401`s share a single
   refresh, because the backend revokes the whole session when a rotated refresh token is presented twice.
4. Logout calls `POST /auth/logout`, clears the token, and drops all cached queries.

While the session is loading, protected pages show a spinner. Anonymous visitors are sent to `/entrar` and come back
to the page they asked for after logging in.

**Known limitation:** two tabs refreshing at the same instant can present the same refresh token, which the backend
treats as reuse and answers by ending the session. The user simply logs in again.

## Errors

API errors arrive as `{ code, message }` with the message already in Portuguese. `ApiError` carries both, and forms
show the message. Network failures and non-API errors get generic Portuguese messages from the HTTP client.
