# QuickBook Cloud Accounting

## Features
- **Dashboard**: Real-time financial metrics and trends.
- **Transactions**: Full CRUD management with search and filters.
- **Reports**: Generate professional Excel reports instantly.
- **Automation**: Daily WhatsApp summary reports via Twilio & Cron Jobs.
- **Secure**: JWT-based authentication for admins and staff.

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Recharts.
- **Backend**: Node.js, Express, MongoDB Atlas.
- **Reporting**: ExcelJS, Twilio WhatsApp API.

## Local Setup
1. **Frontend**: `bun install && bun dev`
2. **Backend**: 
   - `cd server`
   - `npm install`
   - Create `.env` from `.env.example`
   - `npm start`

## Deployment
- **Backend**: Host on Render/Railway.
- **Frontend**: Host on Vercel/Netlify.
- **Database**: Use MongoDB Atlas (Shared Cluster).