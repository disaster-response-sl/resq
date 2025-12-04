# Privacy & Security Overview

This document summarizes how ResQ Hub handles user data, the privacy principles we follow, and technical and organizational controls we use to keep data safe.

## Purpose & Scope
- Applies to all user data collected and processed by the ResQ Hub web and mobile applications and supporting services.
- Covers personal data from citizens, reports, SOS signals, volunteers, and operational telemetry.

## Data Minimization & Purpose Limitation
- Collect only data that is necessary for emergency response (e.g., contact details, location, report details).
- Use data only for the stated purpose: delivering assistance, coordinating response, analytics for disaster management, and improving the service.

## Types of Data Collected
- Personal identifiers: name, phone number, email (when provided).
- Location data: GPS coordinates, addresses, inferred location from reports.
- Incident data: report content, photos, timestamps, severity, requested assistance.
- Operational logs & telemetry: system logs, timestamps, API access logs (used for debugging and security).

## Lawful Basis & User Consent
- Users explicitly consent by submitting reports or registering (where required).
- For anonymous public reports, we treat data as public incident data but avoid publishing direct identifiers unless consented.

## Data Storage & Retention
- Sensitive production data is stored in managed databases (MongoDB Atlas, Supabase where applicable) with access controls.
- Environment variables and secrets are stored in the deployment platform’s secure settings (e.g., Vercel/Netlify env vars) — never committed to source control.
- Retention policy:
  - Operational incident reports: retained for a project-defined period (e.g., 1–3 years) depending on legal/operational needs.
  - Personal data: retained no longer than necessary; requests for deletion are honored following our deletion procedure.

## Access Control & Least Privilege
- Role-based access control (RBAC): admin and responder routes require authenticated tokens and role checks.
- Principle of least privilege for services and staff: grant minimum necessary permissions.
- API keys and service tokens are rotated periodically.

## Authentication & Authorization
- Authentication uses JWT tokens for API access to third-party services and our own backend when required.
- Backend endpoints enforce token validation and role checks before returning sensitive data.

## Data Encryption
- In transit: HTTPS/TLS for all web and API traffic.
- At rest: Rely on managed DB provider encryption and disk-level encryption. Sensitive secrets are not stored in plaintext.

## Pseudonymization & Anonymization
- Report datasets used for public dashboards or analytics are pseudonymized or aggregated to avoid exposing personal identifiers.
- When sharing datasets with partners, remove or obfuscate direct identifiers unless explicit consent is given.

## Third-party Services & Data Sharing
- Only share data with trusted partners and services necessary for response (e.g., SMS gateways, mapping providers).
- Third-party services must have data processing agreements or be approved by project maintainers.

## Logging, Monitoring & Incident Response
- Maintain audit logs of access to sensitive endpoints and admin actions.
- Monitor error and security logs and respond using an incident response plan.
- Incident response steps: contain, assess, notify stakeholders, remediate, post-incident review.

## User Rights
- Users may request access to the personal data we hold about them, correct inaccuracies, or request deletion where applicable.
- Provide a contact point for privacy requests (see Contact below).

## Secure Development Practices
- Do not commit secrets to the repository. Use `.env` locally and environment settings in CI/CD.
- Use automated linting and dependency checks; patch dependencies promptly.
- Validate and sanitize all user input to avoid injection and file upload vulnerabilities.

## Deployment & Secrets Management
- For production deployments, set `VITE_PUBLIC_DATA_API_KEY`, database URLs, and any service tokens in the hosting provider’s environment variables.
- Limit access to deployment consoles and rotate secrets on personnel changes.

## Compliance & Data Protection
- Where applicable, follow local data protection guidelines and best practices.
- Maintain documentation for audits and compliance requests.

## Contact
For privacy or security inquiries, or to request data access/removal, contact: privacy@resq.example.org (replace with the project contact email).

---

This document is a short, practical summary. For production use, expand this into a full privacy policy and data processing agreement covering jurisdiction-specific requirements and legal obligations.