# Fundsroom Infotech Pvt. Ltd. — Full Stack Developer Case Study
## Official Technical Documentation & Submission Report
**Project Title**: Mini ERP + CRM Operations Portal  
**Submission Google Form**: [https://forms.gle/42khMh6vsBLvmefAA](https://forms.gle/42khMh6vsBLvmefAA)  

---

## 📌 1. Deliverables Checklist

| Deliverable Requirement | Location / Link | Status |
|---|---|---|
| **1. GitHub Repository Link** | [https://github.com/Satyam-R4j/fundsroom-mini-erp](https://github.com/Satyam-R4j/fundsroom-mini-erp) | ✅ Public & Up to date |
| **2. Live Frontend URL** | [https://fundsroom-erp-app.onrender.com/](https://fundsroom-erp-app.onrender.com/) | ✅ Deployed & Live |
| **3. Live Backend API URL** | [https://fundsroom-mini-erp-qcuy.onrender.com/api](https://fundsroom-mini-erp-qcuy.onrender.com/api) | ✅ Deployed & Live |
| **4. Test Login Credentials** | See Section 2 below (4 Roles: Admin, Sales, Warehouse, Accounts) | ✅ Seeded & Active |
| **5. Postman Collection** | [docs/postman_collection.json](file:///c:/OneDrive/Desktop/Project/Pro-Projects/fundsroom_assignment/docs/postman_collection.json) | ✅ Included in repository |
| **6. README Documentation** | [README.md](file:///c:/OneDrive/Desktop/Project/Pro-Projects/fundsroom_assignment/README.md) | ✅ Documented |
| **7. Architecture Explanation** | See Section 7 below | ✅ Detailed |
| **8. Known Limitations** | See Section 9 below | ✅ Documented |

---

## 🔑 2. Test System Credentials (All 4 System Roles)

The system enforces Role-Based Access Control (RBAC). You can log in using any of the seeded credentials below or use the quick role login buttons on the frontend:

| System Role | Email Address | Password | Operational Access Level |
|---|---|---|---|
| 👑 **ADMIN** | `admin@fundsroom.com` | `admin123` | Unrestricted Access across CRM, Inventory, Stock Audit Logs, and Sales Challans. |
| 💼 **SALES** | `sales@fundsroom.com` | `admin123` | Customer onboardings, lead tracking, issuing Draft & Confirmed Sales Challans. |
| 📦 **WAREHOUSE** | `warehouse@fundsroom.com` | `admin123` | Inventory product catalog, stock IN/OUT adjustments, low-stock alerts, and audit logs. |
| 📊 **ACCOUNTS** | `accounts@fundsroom.com` | `admin123` | Invoicing audit, revenue reports, confirming draft sales challans, and financial dashboards. |

---

## ⚙️ 3. How the Server Was Set Up & Environment Management

### Server Setup
1. **Backend Framework**: Built using **Node.js** and **Express.js** in strict **TypeScript** mode.
2. **OR & Database Layer**: Integrated **Prisma ORM (v5.22)** for type-safe database queries, schema migrations, and relational transactions.
3. **Authentication**: **JWT (JSON Web Tokens)** via `jsonwebtoken` with 7-day session validity. Password hashing via `bcryptjs` (salt factor 10).
4. **CORS & Middleware**: Configured `cors` middleware allowing cross-origin requests from the React frontend, custom error-handling middleware, and JWT authentication middleware (`authenticateToken` & `requireRole`).

### Environment Variables Management
Environment variables are managed cleanly across local development and production cloud deployment:

- **Local Development**: Stored in `backend/.env` (excluded from Git via `.gitignore`).
- **Production (Render Cloud)**: Defined directly in the Render Web Service Environment Configuration panel.

```env
# Production Environment Variables Configuration
PORT=5000
DATABASE_URL="postgresql://neondb_owner:npg_tNBX7vw5xZId@ep-aged-flower-azk5brgu.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="fundsroom_erp_secret_key_2026_secure"
NODE_ENV="production"
```

---

## 🗄️ 4. Database Architecture (Neon Cloud PostgreSQL)

The database schema is hosted on **Neon Cloud PostgreSQL** (`ap-southeast-1` AWS region):

```
+----------------+       +-------------------+       +-----------------+
|      User      | 1---* |   CustomerNote    | *---1 |    Customer     |
+----------------+       +-------------------+       +-----------------+
| id (UUID)      |                                   | id (UUID)       |
| email (Unique) |       +-------------------+       | name, mobile    |
| role           | 1---* |     StockLog      |       | customerType    |
+----------------+       +-------------------+       | status (LEAD..) |
        |                 | productId (FK)    |       +-----------------+
        |                 | movementType (IN) |                |
        | 1               | quantityChanged   |                | 1
        |                 | reason, timestamp |                |
        |                 +-------------------+                |
        |                           | *                        |
        |                           | 1                        |
        |                 +-------------------+                |
        |                 |      Product      |                |
        |                 +-------------------+                |
        |                 | id (UUID)         |                |
        |                 | sku (Unique)      |                |
        |                 | currentStock      |                |
        |                 | minStockAlert     |                |
        |                 +-------------------+                |
        |                           | 1                        |
        |                           | *                        |
        |                 +-------------------+                | *
        |                 |    ChallanItem    | *------------1 | Challan
        |                 +-------------------+                +-----------------+
        |                 | productNameSnap.. |                | challanNumber   |
        |                 | unitPriceSnapshot |                | totalAmount     |
        |                 | quantity          |                | status (DRAFT..) |
        +-----------------+-------------------+----------------+-----------------+
```

---

## 💻 5. How to Run the Project Locally

### Step 1: Clone Repository
```bash
git clone https://github.com/Satyam-R4j/fundsroom-mini-erp.git
cd fundsroom-mini-erp
```

### Step 2: Backend Setup
```bash
cd backend
npm install

# Push Prisma schema to Neon PostgreSQL
npx prisma generate
npx prisma db push

# Seed initial test data (Users, Customers, Products)
npm run prisma:seed

# Start backend REST API server (runs on http://localhost:5000)
npm run dev
```

### Step 3: Frontend Setup
```bash
# Open a new terminal
cd frontend
npm install

# Start Vite frontend dev server (runs on http://localhost:3000)
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## 🌐 6. How to Deploy the Project

### A. Database Deployment (Neon Cloud Postgres)
1. Provisioned a free PostgreSQL database cluster on **Neon Tech** (`neon.tech`).
2. Executed `npx prisma db push` to create relational tables and indexes.

### B. Backend Deployment (Render Web Service)
1. Connected GitHub repository `Satyam-R4j/fundsroom-mini-erp` to **Render** as a **Web Service**.
2. **Root Directory**: `backend`
3. **Build Command**: `npm install && npx prisma generate && npm run build`
4. **Start Command**: `npx prisma db push && node dist/index.js`
5. Configured Environment Variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`.
6. Live Backend API: [https://fundsroom-mini-erp-qcuy.onrender.com/api](https://fundsroom-mini-erp-qcuy.onrender.com/api)

### C. Frontend Deployment (Render Static Site / Vercel)
1. Connected repository to Render as a **Static Site**.
2. **Root Directory**: `frontend`
3. **Build Command**: `npm install && npm run build`
4. **Publish Directory**: `dist`
5. Environment Variable: `VITE_API_URL` = `https://fundsroom-mini-erp-qcuy.onrender.com/api`.
6. Live Frontend Web App: [https://fundsroom-erp-app.onrender.com/](https://fundsroom-erp-app.onrender.com/)

---

## 🏗 7. System Architecture & Core Business Logic Explanation

1. **Multi-Tier Architecture**:
   - **Presentation Layer**: Single Page Application (SPA) built with React 18, Vite, and Tailwind CSS.
   - **Application API Layer**: Express REST API in TypeScript implementing JWT authentication middleware, input validations, and role-based route guards.
   - **Data Layer**: Neon Cloud PostgreSQL managed via Prisma ORM.

2. **Atomic Stock Deduction & Negative Stock Protection (`prisma.$transaction`)**:
   - When creating or confirming a Sales Challan (`DRAFT` → `CONFIRMED`), the system queries warehouse inventory levels for all requested products.
   - If stock for ANY product is less than requested quantity, the API aborts transaction and returns HTTP 400 error detailing product SKU and missing quantity.
   - If sufficient, Prisma `$transaction` updates product stock levels (`currentStock - quantity`) and creates corresponding `StockLog` entries (`movementType: 'OUT'`) atomically.

3. **Snapshot Pricing Pattern**:
   - When line items are added to a Sales Challan, `productNameSnapshot` and `unitPriceSnapshot` are saved into `ChallanItem`.
   - This ensures historical invoices and financial audits remain unaltered even if product prices or names are modified in the catalog later.

4. **Automated Low Stock Warning Alerts**:
   - Every product has a `minStockAlert` threshold.
   - When `currentStock <= minStockAlert`, visual warning badges (🔴 Low Stock) are dynamically highlighted in both the Inventory View and Executive Summary Dashboard.

---

## 💡 8. Assumptions Made

1. **Currency**: All monetary amounts are assumed to be in Indian Rupees (INR / ₹).
2. **Single-Tenant Architecture**: Built as a dedicated operations portal for Fundsroom Infotech.
3. **Challan Auto-Number Format**: Generated sequentially per calendar year in the format `CHAL-YYYY-XXXX` (e.g. `CHAL-2026-0001`).
4. **Stock Deduction Trigger**: Stock is deducted ONLY when a sales challan is in or transitions to `CONFIRMED` status. `DRAFT` status challans do not alter warehouse stock levels.

---

## ⚠️ 9. Known Limitations & Bonus Features Implemented

### Implemented Bonus Features ✨
- ✅ Live Executive Overview Dashboard with system health metrics and quick shortcuts.
- ✅ Printable Delivery Note / Invoice viewer with `window.print()` browser support.
- ✅ Full Postman v2.1 Collection export (`docs/postman_collection.json`).
- ✅ Cloud PostgreSQL Deployment on Neon Tech.

### Known Limitations / Future Enhancements 🔮
- **PDF File Export**: Currently implemented via browser print-to-PDF (`window.print()`). Could be upgraded to server-side PDF stream generation (`pdfkit` / `puppeteer`).
- **Image Upload to AWS S3**: Product images currently use category badges; AWS S3 bucket upload integration can be added to the product modal.
