# Fundsroom Mini ERP + CRM Operations Portal

> **Full Stack Developer Case Study** for **Fundsroom Infotech Pvt. Ltd.**  
> An enterprise-grade, full-stack Operations Portal managing Auth/RBAC, Customer CRM, Inventory Stock Audit Trail, and Sales Challans.

---

## 🌐 Live Application & API Deployment URLs

- 🚀 **Live Frontend Web App**: [https://fundsroom-erp-app.onrender.com/](https://fundsroom-erp-app.onrender.com/)
- ⚡️ **Live Backend REST API**: [https://fundsroom-mini-erp-qcuy.onrender.com/api](https://fundsroom-mini-erp-qcuy.onrender.com/api)
- 🐘 **Live Database**: Cloud PostgreSQL hosted on **Neon** (`ep-aged-flower-azk5brgu.c-3.ap-southeast-1.aws.neon.tech`)

---

## 🏢 Business Context & Core Modules

### 1. Authentication & Role-Based Access Control (RBAC)
- **JWT Authentication**: Secure Bearer token session authentication with custom payload signed via `jsonwebtoken`.
- **4 System Roles**:
  - 👑 **ADMIN**: Full system access, product catalog creation, user role management, and operational oversight.
  - 💼 **SALES**: Lead management, client follow-up tracking, and issuing Sales Challans.
  - 📦 **WAREHOUSE**: Stock intake, inventory management, low-stock alerts, and stock movement log auditing.
  - 📊 **ACCOUNTS**: Revenue auditing, challan confirmation, and financial summary reporting.
- **Role Shortcuts**: Built-in test credential selector on the login screen for quick role testing.

### 2. Customer CRM Module
- **Customer Account Fields**: Customer Name, Mobile Number, Email, Business Name, Optional GST Number, Address, Status (`LEAD`, `ACTIVE`, `INACTIVE`), Customer Type (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`), Follow-up Date, and Notes.
- **Search & Filters**: Instant multi-attribute search across names, mobile, business, and status.
- **Activity Timeline**: Dedicated follow-up activity log attached to every customer account.

### 3. Product & Inventory Module
- **Product Catalog**: Product Name, SKU/Code (Unique constraint), Category, Unit Price, Current Stock, Minimum Stock Alert Threshold, and Warehouse Location.
- **Live Stock Alerts**: Automated **Low Stock Warnings** (🔴 triggered when `currentStock <= minStockAlert`).
- **Stock Movement Log Audit Trail**: Comprehensive tracking of every stock change (`IN` for intake, `OUT` for dispatch) with `quantityChanged`, `reason`, `createdBy` user, and timestamp.
- **Negative Stock Protection**: Backend API validation blocks any stock deduction that would result in negative stock, returning explicit HTTP 400 errors.

### 4. Sales Challan & Invoicing Module
- **Auto Sequential Numbering**: Automatically formats challan numbers e.g. `CHAL-2026-0001`, `CHAL-2026-0002`.
- **Price & Name Snapshot Data**: Stores `productNameSnapshot` and `unitPriceSnapshot` in line items to preserve historical price integrity even if catalog prices change later.
- **Atomic Stock Deduction on Confirmation**:
  - `DRAFT` status allows preparing orders without immediate inventory deduction.
  - Saving as or transitioning to `CONFIRMED` performs atomic validation checking warehouse stock availability for all products. If stock is sufficient, it deducts inventory atomically and creates `StockLog` audit entries (`movementType: 'OUT'`).
- **Printable Delivery Note & Invoice**: Official document preview with company header (Fundsroom Infotech), customer billing address, itemized breakdown, totals, signature blocks, and `window.print()` support.

### 5. ERP Executive Overview Dashboard
- Aggregated real-time KPIs: Total Customers, Active Leads, Total Inventory Units, Low Stock Alert Count, Confirmed Orders, and Total Confirmed Revenue (₹).
- System Architecture status badges (Neon Cloud PostgreSQL status, JWT Auth status, Backend REST API Health).

---

## 🔑 Test System Credentials

| Role | Email | Password | Access Privileges |
|---|---|---|---|
| 👑 **Admin** | `admin@fundsroom.com` | `admin123` | Unrestricted Access |
| 💼 **Sales** | `sales@fundsroom.com` | `admin123` | CRM, Sales Challans, Inventory Read |
| 📦 **Warehouse** | `warehouse@fundsroom.com` | `admin123` | Inventory, Stock Movements, Challan Dispatch |
| 📊 **Accounts** | `accounts@fundsroom.com` | `admin123` | Challan Auditing, Revenue Dashboard |

---

## 🛠 Tech Stack

- **Database**: Cloud PostgreSQL on **Neon** (`ep-aged-flower-azk5brgu.c-3.ap-southeast-1.aws.neon.tech`).
- **Backend**: Node.js, Express.js (TypeScript), Prisma ORM, JWT (`jsonwebtoken`), `bcryptjs`, `cors`, `zod`.
- **Frontend**: React 18 (TypeScript), Vite, Tailwind CSS, Lucide Icons, Axios.
- **Testing & Tooling**: Postman v2.1 Collection, Git, ts-node-dev.

---

## ⚙️ How the Server was Set Up & Running Locally

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Environment Variables Setup
The backend uses a `.env` file located in `backend/.env`:
```env
PORT=5000
DATABASE_URL="postgresql://neondb_owner:npg_tNBX7vw5xZId@ep-aged-flower-azk5brgu.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="fundsroom_erp_secret_key_2026_secure"
NODE_ENV="development"
```

### 2. Backend Setup & Database Migration
```bash
cd backend
npm install

# Generate Prisma Client & push schema to Neon PostgreSQL
npx prisma generate
npx prisma db push

# Seed initial test credentials, CRM leads & inventory catalog
npm run prisma:seed

# Start backend REST API server (runs on http://localhost:5000)
npm run dev
```

### 3. Frontend Setup
```bash
# Open a new terminal window
cd frontend
npm install

# Start Vite frontend dev server (runs on http://localhost:3000)
npm run dev
```

Open your browser at `http://localhost:3000` to access the portal.

---

## 📬 Postman API Collection

A full Postman collection is exported at `docs/postman_collection.json`.

### How to Import & Use:
1. Open Postman and click **Import**.
2. Select [docs/postman_collection.json](file:///c:/OneDrive/Desktop/Project/Pro-Projects/fundsroom_assignment/docs/postman_collection.json).
3. The collection includes pre-configured environment variables (`{{baseUrl}}` = `https://fundsroom-mini-erp-qcuy.onrender.com/api`) and Bearer token headers for:
   - `POST /api/auth/login` (Login with Admin/Sales/Warehouse/Accounts credentials)
   - `GET /api/auth/me` (Profile Check)
   - `POST /api/auth/logout`
   - `GET /api/customers`, `POST /api/customers`, `POST /api/customers/:id/notes`
   - `GET /api/products`, `POST /api/products`, `POST /api/products/:id/stock`
   - `GET /api/challans`, `POST /api/challans`, `PATCH /api/challans/:id/status`

---

## 🏗 Architecture & Design Decisions

1. **Transactional Data Consistency**: Prisma `$transaction` is used during Challan Confirmation and Stock Movements to ensure that stock levels, stock audit logs, and challan status changes occur atomically.
2. **Snapshot Pricing Pattern**: Line items store immutable name and price snapshots to safeguard financial reports against catalog updates.
3. **Responsive Glassmorphism UI**: Built with modern Tailwind CSS dark slate design system, curated color palettes, and subtle micro-animations.

---

## 🌐 Live Deployment Overview

- **Frontend**: Deployed on **Render Static Site** at [https://fundsroom-erp-app.onrender.com/](https://fundsroom-erp-app.onrender.com/).
- **Backend**: Deployed on **Render Web Service** at [https://fundsroom-mini-erp-qcuy.onrender.com/api](https://fundsroom-mini-erp-qcuy.onrender.com/api).
- **Database**: Cloud PostgreSQL hosted on **Neon**.

---

## 📝 Submission Details
- **Company**: Fundsroom Infotech Pvt. Ltd.
- **Assignment**: Full Stack Developer Case Study — Mini ERP + CRM Operations Portal
- **Submission Form**: [Google Form Link](https://forms.gle/42khMh6vsBLvmefAA)
