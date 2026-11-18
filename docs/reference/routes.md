# Routes

| Path          | Access                                     | Page             |
| ------------- | ------------------------------------------ | ---------------- |
| `/entrar`     | visitors only (logged-in users go to `/`)  | Login            |
| `/cadastro`   | visitors only                              | Sign-up          |
| `/`           | logged-in users (visitors go to `/entrar`) | Home             |
| anything else |                                            | redirects to `/` |
