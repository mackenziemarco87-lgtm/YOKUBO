# HospitalityOS AI · Operations Copilot

A browser-based starter concept for an AI operations assistant for hotels. It includes a responsive operations dashboard and an interactive demo chat that answers questions about the sample property data shown on screen.

## Run it

Open `index.html` in a browser. No install or build step is needed.

## What works in this demo

- Responsive dashboard for a sample hotel, The Meridian Hotel in Barcelona
- Clickable chat prompts and free-form questions about sample arrivals, occupancy, requests, and VIP preparation
- Sample attention queue for housekeeping, maintenance, and front desk
- Responsive layouts for desktop and mobile

## Important

The dashboard and assistant use hard-coded demo data. The chat is a small local rules-based prototype; it does not call an AI model, property management system, or live hotel data source. Before using it operationally, connect an authenticated backend and approved property systems, define staff permissions, and replace the sample data.

## Next build step

Agree the first live workflow (for example, summarizing arrivals from a property management system), then add a backend integration for that system and an AI model. Keep API credentials on the server, never in browser JavaScript.
