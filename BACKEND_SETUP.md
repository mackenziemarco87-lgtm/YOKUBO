# HospitalityOS backend setup

This repository now includes a server-side chat endpoint at `/api/chat`. It is designed for Vercel Functions. GitHub Pages remains the static demo host; it cannot run this server endpoint. The website does not use this backend until its chat is connected to it in the next step.

## Required Vercel environment variables

After importing this repository into Vercel, add these under **Project Settings → Environment Variables**:

- `OPENAI_API_KEY`: your OpenAI API key. Keep this only in Vercel's environment variables; never put it in browser code or commit it to GitHub.
- `APP_ACCESS_PASSWORD`: a long, private password that the chat frontend will ask you for.
- `ALLOWED_ORIGIN` (optional): an additional exact origin to allow. The endpoint already accepts the current Vercel deployment host and Vercel's stable production domain.
- `OPENAI_MODEL` (optional): model name. If omitted, the endpoint uses `gpt-6-astra`.

Set the variables for the Production environment. After adding or changing them, create a new deployment so the function receives the updated values.

## What this first backend can do

- Accept recent chat messages at `POST /api/chat`
- Require an app password and allow only the configured site origin
- Call the OpenAI Responses API using a server-side key
- Return a response based on the sample hotel snapshot in the function instructions

The first version has no live property-system connection and cannot carry out hotel actions. Connecting the website UI to this endpoint and setting the Vercel environment variables are the next steps.
