# Parser Coverage Validator

Internal web application for checking whether news from source websites are actually present in CSI monitoring data.

The project is made for parser QA, coverage validation, issue documentation and analyst workflow support. It is not a media monitoring dashboard. Its purpose is to help analysts verify extraction quality, compare source-site news with CSI data and record problems in a structured way.

## Main purpose

- test news extraction from source websites
- import CSI data from export, API or manual JSON
- compare extracted news with CSI records
- detect missing news, duplicates and mismatches
- create issues and follow-up tasks
- keep internal instructions in one place

## Run backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Backend: `http://localhost:5000`

If Prisma on Windows says the database already exists, delete `backend/prisma/dev.db` once and run the commands again.

## Run frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Demo accounts

- `admin@csi.local / Admin12345`
- `analyst@csi.local / Analyst12345`
- `viewer@csi.local / Viewer12345`

## Postman

Collection file:

- `postman/Parser_Coverage_Validator.postman_collection.json`

Variables:

- `{{baseUrl}} = http://localhost:5000`
- `{{token}} = JWT token after login`

