# YOKUBO

YOKUBO is being built as a hospitality AI operating system. The long-term product combines YOKUBO-owned agents with a platform where independent creators can build and offer hospitality agents.

## Current foundation

The repository is moving from a static prototype toward a Next.js and TypeScript application. The existing HospitalityOS dashboard and Agent Studio demos remain available as browser pages while the application foundation is built.

- Run locally with Node.js 22 or later: `npm install`, then `npm run dev`.
- The root page currently redirects to the existing dashboard at `/index.html`.
- The Vercel Function at `/api/chat` keeps the OpenAI key on the server and answers from a sample hotel snapshot.
- The dashboard uses sample hotel data. It is not connected to a PMS or other live hotel systems.
- The Agent Studio prototype stores drafts in that browser only. It is not cloud persistence or a creator marketplace.

## Not implemented yet

There is not yet user sign-in, organization or property membership, tenant-isolated hotel data, persistent conversations, live hotel integrations, publishing, subscriptions, or creator payouts. The app-password check on the current chat endpoint is a prototype gate, not a user account system.

## Build sequence

1. Establish the application foundation and preserve the working demo.
2. Add authentication, organizations, properties, roles, and database-enforced tenant isolation.
3. Build the agent runtime, knowledge, conversations, approved tools, and audit records.
4. Prove one YOKUBO-owned hospitality agent with a real hotel workflow.
5. Add creator ownership, versioning, deployment, marketplace sales, and revenue sharing.

Marketplace payments are intentionally later than the secure hotel workspace and first useful agent.
