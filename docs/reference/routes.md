# Routes

| Path              | Access                                     | Page                                                   |
| ----------------- | ------------------------------------------ | ------------------------------------------------------ |
| `/entrar`         | visitors only (logged-in users go to `/`)  | Login                                                  |
| `/cadastro`       | visitors only                              | Sign-up                                                |
| `/`               | logged-in users (visitors go to `/entrar`) | Proposal list (empty state with getting-started steps) |
| `/propostas/nova` | logged-in users                            | New proposal: briefing form, then live AI generation   |
| `/propostas/:id`  | logged-in members of the proposal          | Proposal: rendered Markdown, generate or regenerate    |
| anything else     |                                            | redirects to `/`                                       |

## Generation

`POST /proposals/{id}/generate` answers with server-sent events. The app reads them with `fetch` and a stream reader
(`EventSource` cannot send a `POST` or the `Authorization` header). Deltas render as they arrive, and when `done` arrives
the app opens the saved proposal. The client gives up after 180 seconds. Errors show the API's Portuguese message only.
Markdown is rendered with `react-markdown`, which never renders raw HTML from the content.
