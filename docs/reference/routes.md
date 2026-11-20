# Routes

| Path                       | Access                                     | Page                                                                               |
| -------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------- |
| `/entrar`                  | visitors only (logged-in users go to `/`)  | Login                                                                              |
| `/cadastro`                | visitors only                              | Sign-up                                                                            |
| `/`                        | logged-in users (visitors go to `/entrar`) | Início dashboard with status totals, recent proposals, links, and activity         |
| `/propostas`               | logged-in users                            | Proposal list with server-side search and pages; `?q=`, `?pagina=`, `?por_pagina=` |
| `/propostas/nova`          | logged-in users                            | New proposal: briefing form, then live AI generation                               |
| `/propostas/:id`           | members of the proposal                    | Proposal as a document; edit, history, share (owner), regenerate                   |
| `/propostas/:id/editar`    | owners and editors (viewers are sent back) | Markdown editor with live preview                                                  |
| `/propostas/:id/historico` | members of the proposal                    | Version history with document and changes views; restore (owner, editor)           |
| `/conta`                   | logged-in users                            | Redirects to `/conta/perfil`                                                       |
| `/conta/perfil`            | logged-in users                            | Account: name and e-mail (e-mail change asks for the password)                     |
| `/conta/seguranca`         | logged-in users                            | Two-factor authentication, password change, and active sessions                    |
| `/conta/dados`             | logged-in users                            | Privacy notice status, data export, and account deletion                           |
| `/privacidade`             | anyone                                     | Privacy notice (LGPD)                                                              |
| `/p/:token`                | anyone, no login                           | Public, read-only proposal from a share link                                       |
| anything else              |                                            | redirects to `/`                                                                   |

The proposal, account, and privacy pages are loaded on demand (route-level code splitting), so the Markdown renderer is not part of the
initial bundle.

## Generation

`POST /proposals/{id}/generate` answers with server-sent events. The app reads them with `fetch` and a stream reader
(`EventSource` cannot send a `POST` or the `Authorization` header). Deltas render as they arrive, and when `done` arrives
the app opens the saved proposal. The client gives up after 180 seconds. Errors show the API's Portuguese message only.
Markdown is rendered with `react-markdown`, which never renders raw HTML from the content.

## Editing

The editor saves manually (button, Ctrl+S, or Cmd+S) instead of autosaving, because every save creates a version.
Each save sends `PUT /proposals/{id}/content` with the `base_version` the editor loaded. A `409 version_conflict` opens
a dialog that lets the user copy their text and load the latest version, so nobody overwrites someone else's work
silently. Leaving the page with unsaved changes asks for confirmation, both inside the app and when closing the tab.

## History

Versions come from `GET /proposals/{id}/versions`. The changes view compares a version with the one before it
(line diff with `diff`, unchanged runs collapsed). Restoring asks for confirmation and creates a new version, so the
history is never rewritten.

## Sharing

Only owners see **Compartilhar**. A link is created with an expiration of 1, 7, 30, or 90 days. The API returns the
token only once, so the dialog shows the full link right after creation and asks the user to copy it. Links are listed
with their status (active, expired, revoked) and can be revoked one at a time. Public links have the form `/p/<token>`.

## Public proposal

`/p/:token` calls `POST /public/proposals/resolve` with the token in its JSON body, and shows the proposal as a
client-facing document (cover, table of contents, reading progress), with no app shell and no edit controls.
"Imprimir / PDF" uses the browser's print dialog; print styles drop the header, outline, and footer, and always use
the light palette. Unknown, expired, and revoked links all show the same "link unavailable" message, matching the
API, which answers the same `404` for each. Other errors (rate limit, network) show the API message and a retry.

Because the token is part of the URL, the page sets `<meta name="robots" content="noindex, nofollow">` and
`<meta name="referrer" content="no-referrer">`, so search engines skip it and links inside the proposal never receive
the token in the `Referer` header.

## Account and privacy

Sign-up requires ticking "Li e aceito o aviso de privacidade"; the link opens `/privacidade` in a new tab. The notice
text lives in `src/features/privacy/privacy.content.ts`; when it changes, the API's `PRIVACY_NOTICE_VERSION` must change
too, and every user whose accepted version is older sees a banner at the top of the app until they accept it.

`/conta` has one tab per area (Perfil, Segurança, Privacidade e dados), each with its own URL. Changing the e-mail and deleting the
account ask for the current password; deletion also asks the user to type `EXCLUIR`. After deletion the session ends with
an `account_deleted` notice, and the login page confirms it. The export downloads `silver-proposals-dados.json` from
`GET /account/export`.

## Account security

The **Segurança** tab enrolls an authenticator with a QR code or a manual key, then confirms enrollment with a
six-digit code. QR codes render in the browser. Recovery codes appear after enrollment or regeneration and can
be copied before closing the dialog. Regeneration invalidates the previous codes. Disabling 2FA requires the
current password and an authenticator or recovery code. The authenticator field uses six numeric slots in setup,
login, and deactivation. The recovery-code option shows an alphanumeric field.

Accounts with 2FA stay on the login page after entering their password. The challenge stays in memory until
the user enters a code or returns to the password form. A successful second step returns them to the requested
page. If the challenge expires, they must enter their password again.

Active sessions show the browser, last activity, and a marker for the current session. Users can end individual
sessions, including the current one, or end all others. Password changes also end all other sessions.

## Home dashboard

The signed-in landing page uses `GET /dashboard/summary`. The sidebar links to **Início** and **Propostas**.
**Minha conta** is available in the sidebar footer. **Ver todas** opens the searchable proposal list.

The status distribution groups each visible proposal under one status, including archived proposals. The AI count
covers the signed-in user's generations in the past 30 days. Link counts and link activity cover owned proposals,
and the expiry window is seven days. Dashboard links go to the proposal page for management.

The proposal list shows 5 proposals per page by default; **Por página** switches to 10, 20, or 50 (`?por_pagina=`), and any other value falls back to 5. Typing in the search box waits 300 ms before querying,
returns to the first page, and replaces the history entry, so the back button skips each keystroke; changing the page
adds a history entry. The search and page live in the address (`/propostas?q=padaria&pagina=2&por_pagina=10`), so they survive a
reload and the login redirect. A page past the end goes back to the last page. Each row and the proposal page show the
status the API derives (Rascunho, Gerada, Editada, Compartilhada, Arquivada); editors and viewers never see
Compartilhada, since only owners see links.
