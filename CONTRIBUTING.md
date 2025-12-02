## Contributing to ResQ

Thanks for your interest in contributing to ResQ — the National Disaster Management Platform. This document explains how to get your development environment ready, code style and testing expectations, and the process for submitting issues and pull requests.

### Getting started (development setup)

1. Fork the repository and clone your fork:

   git clone https://github.com/<your-username>/resq.git
   cd resq

2. Install dependencies (root contains multiple subprojects — web-dashboard frontend is primary):

   # from repository root
   npm install

3. Frontend dev (web-dashboard)

   cd src/web-dashboard/frontend
   npm install
   npm run dev

4. Backend dev (optional)

   cd src/web-dashboard/backend
   npm install
   # create a local .env with DB and JWT settings (see .env.example)
   npm run dev

Notes:
- Use Node 18+ and npm 9+ (or yarn). We recommend using nvm to manage Node versions.
- The frontend expects `VITE_API_BASE_URL` in .env.local for local testing.

### Code style and linting

- We use TypeScript and ESLint + Prettier. Please run linting and format before committing:

  cd src/web-dashboard/frontend
  npm run lint
  npm run format

- Keep commits focused and atomic. Use conventional commit messages when possible.

### Tests

- Unit tests live next to their projects. To run frontend tests:

  cd src/web-dashboard/frontend
  npm test

### Branching and PRs

- Work on feature branches off `main` or the current target branch: `feature/...`.
- Open a pull request against `main` (or the branch specified in the issue). Describe the purpose, list changes, and link related issues.
- A PR should pass CI (lint, typecheck, build, and tests) before merging.

### Issue & PR templates

- Use the `.github/ISSUE_TEMPLATE/` templates (bug report, feature request, security) when filing new issues.

### Security

- For security-sensitive issues, please use the security disclosure template or contact the maintainers privately via the repository's security policy.

### Getting help

- If you're unsure where to start, check the `good first issue` label or ask in Issues and tag maintainers.

Thanks — your contributions help make ResQ better for everyone.
