# Routes

| Path                       | Access                                     | Page                                                                     |
| -------------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| `/entrar`                  | visitors only (logged-in users go to `/`)  | Login                                                                    |
| `/cadastro`                | visitors only                              | Sign-up                                                                  |
| `/`                        | logged-in users (visitors go to `/entrar`) | Proposal list (empty state with getting-started steps)                   |
| `/propostas/nova`          | logged-in users                            | New proposal: briefing form, then live AI generation                     |
| `/propostas/:id`           | members of the proposal                    | Proposal as a document; edit, history, share (owner), regenerate         |
| `/propostas/:id/editar`    | owners and editors (viewers are sent back) | Markdown editor with live preview                                        |
| `/propostas/:id/historico` | members of the proposal                    | Version history with document and changes views; restore (owner, editor) |
| anything else              |                                            | redirects to `/`                                                         |

The proposal pages are loaded on demand (route-level code splitting), so the Markdown renderer is not part of the
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
