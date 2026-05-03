# Parser Coverage Validator

Internal web application for CSI Strategic consulting & IT, Data Analytics Department.

The system checks whether news published on source websites are present in CSI monitoring data. It is built for parser QA, coverage validation, issue tracking and analyst workflow support.

## What the project does

- stores a registry of media sources
- tests selectors and source extraction
- imports CSI data from export, API or manual JSON
- compares source-site news with CSI records
- shows missing news, duplicates and mismatches
- creates issues and follow-up tasks
- stores internal knowledge articles
- exports operational reports

## Difference from a media dashboard

This project does not replace media monitoring analytics.  
It is an internal validation tool for checking parser coverage and documenting technical problems.

## Stack

- Frontend: React, Vite, React Router, Axios, Recharts, CSS
- Backend: Node.js, Express, SQLite, Prisma, JWT, bcrypt, axios, cheerio, multer, csv-parse, xlsx

## Structure

```text
analyst-kb/
├── backend/
├── frontend/
├── postman/
├── samples/
└── README.md
```

## Run backend

```bash
cd backend
npm install
```

First try:

```bash
npx prisma migrate dev --name init
```

If Windows Prisma gives `Schema engine error`, use:

```bash
npx prisma db execute --file prisma/migrations/20260503020000_init/migration.sql --schema prisma/schema.prisma
npx prisma migrate resolve --applied 20260503020000_init
npx prisma generate
```

Then:

```bash
npm run seed
npm run dev
```

For normal next runs:

```bash
cd backend
npx prisma generate
npm run dev
```

Backend URL: `http://localhost:5000`

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## Demo accounts

- `admin@csi.local / Admin12345`
- `analyst@csi.local / Analyst12345`
- `viewer@csi.local / Viewer12345`

## Postman

Collection:

- `postman/Parser_Coverage_Validator.postman_collection.json`

Variables:

- `{{baseUrl}} = http://localhost:5000`
- `{{token}} = JWT token after login`

## Sample files

- `samples/sources_sample.csv`
- `samples/csi_socmedia_export_sample.csv`
- `samples/sources_sample.json`

## Pages

- Dashboard
- Source Registry
- Extraction Lab
- CSI Data Import
- Coverage Checks
- Issues
- Tasks
- Knowledge Base
- Reports
- Admin Panel

## What to show in internship defense

- real source extraction from website pages
- CSI import from export/API/manual JSON
- coverage check with evidence
- missing news and duplicates
- issues and tasks workflow
- report export and audit logs

## Common Windows notes

- `table "User" already exists` → database is already initialized
- `migration ... already recorded as applied` → skip `migrate resolve`
- `EPERM ... query_engine-windows.dll.node` → stop old Node/Prisma processes, then run `npx prisma generate`
- `EADDRINUSE ... 5000` → backend is already running on port `5000`
