# Runbook: Incident Response Checklist

When something breaks, follow this quick triage guide.

1. **Understand the blast radius**
   - Which component is failing? (Frontend, API, MCP, viz, database)
   - Is it affecting production or just preview/dev?
2. **Gather context**
   - Check Cloud Logging for recent errors.
   - Review uptime checks / monitoring dashboards.
   - Capture timestamps and request IDs if available.
3. **Stabilize**
   - Roll back to the previous Cloud Run revision if a bad deploy is suspected.
   - Temporarily disable automated jobs (ETL) if they are causing load issues.
4. **Communicate**
   - Document the incident in an issue or log with: symptoms, impact, actions.
   - Notify stakeholders (even if it’s only you, note the timeline).
5. **Root cause analysis**
   - After stabilization, identify the failure mode (e.g., expired secret, bad
     migration, quota limit).
   - Record findings and remediation steps in this repository.
6. **Follow-up**
   - Create tasks to prevent recurrence (monitoring gaps, automated tests,
     better alerts).
   - Update runbooks or documentation if a new scenario was handled.
