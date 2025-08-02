# PrimaTyre - Tire Management System API

**PrimaTyre** adalah sistem manajemen ban (tire management system) yang dikembangkan oleh Prima Jaya Persada. Sistem ini menyediakan REST API untuk mengelola seluruh lifecycle ban mulai dari stok, instalasi, inspeksi, hingga removal pada unit kendaraan.

## 🚀 Fitur Utama

- **Manajemen Stok Ban**: Tracking serial number, merk, ukuran, dan harga ban
- **Manajemen Unit**: Konfigurasi kendaraan dan posisi ban
- **Aktivitas Ban**: Pencatatan instalasi dan removal ban
- **Inspeksi Ban**: Monitoring kondisi ban dan analisis
- **Action Tyre**: Workflow tindakan pada ban
- **Export Data**: Export ke Excel untuk reporting
- **Authentication**: JWT dan API Key authentication
- **Role Management**: Sistem role user

## 🛠️ Tech Stack

- **Backend**: Express.js dengan TypeScript
- **Database**: SQL Server (dengan opsi PostgreSQL)
- **ORM**: Prisma
- **Authentication**: JWT + bcryptjs
- **Export**: ExcelJS
- **CORS**: Configured untuk frontend integration

## 📋 Prerequisites

- Node.js (v18 atau lebih tinggi)
- SQL Server atau PostgreSQL
- npm atau yarn

## 🚀 Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/UnOxLast/PrimaTyre-PrismaExpress.git
cd tire-primajaya
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Buat file `.env` di root directory dan konfigurasi database connection:

```bash
# Database Configuration
DATABASE_URL="sqlserver://localhost:1433;database=primatyre;user=sa;password=yourpassword;trustServerCertificate=true"

# Server Configuration  
PORT=8080

# JWT Secret (ganti dengan secret yang aman)
JWT_SECRET="your-jwt-secret-key"
```

> **Catatan**: Sesuaikan connection string dengan konfigurasi SQL Server Anda

### 4. Database Setup

#### Untuk SQL Server (default):
```bash
# Generate Prisma Client
npx prisma generate

# Run database migration
npm run migrate

# Atau push schema langsung
npm run push
```

#### Untuk PostgreSQL (opsional):
1. Uncomment provider postgresql di `prisma/schema.prisma`
2. Comment provider sqlserver
3. Update DATABASE_URL untuk PostgreSQL
4. Jalankan migration

### 5. Seed Database (Opsional)

```bash
npm run devSeed
```

## 🎯 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Development** | `npm run dev` | Jalankan development server dengan nodemon |
| **Build** | `npm run build` | Compile TypeScript ke JavaScript |
| **Start** | `npm start` | Jalankan production server |
| **Migration** | `npm run migrate` | Database migration dengan nama lazy |
| **Push Schema** | `npm run push` | Push schema ke database |
| **Seed** | `npm run devSeed` | Seed database dengan data sample |
| **Queries** | `npm run queries` | Jalankan test queries |
| **Caching** | `npm run caching` | Test caching functionality |

## 📡 API Endpoints

### Authentication
- `POST /login` - User login

### Core Endpoints
- `GET|POST|PUT|DELETE /tyre` - Manajemen ban
- `GET|POST|PUT|DELETE /unit` - Manajemen unit kendaraan  
- `GET|POST|PUT|DELETE /activity` - Aktivitas ban
- `GET|POST|PUT|DELETE /inspection` - Inspeksi ban
- `GET|POST|PUT|DELETE /actionTyre` - Aksi pada ban
- `GET|POST|PUT|DELETE /user` - Manajemen user

### Utility Endpoints
- `GET /dropdown` - Data dropdown/master data
- `GET /export` - Export data ke Excel

### Health Check
- `GET /ping` - Health check endpoint

## 🗃️ Database Schema

### Core Models
- **Tyre**: Data ban (tread, posisi, status)
- **StockTyre**: Stok ban (serial number, merk, ukuran)
- **Unit**: Unit kendaraan 
- **ActivityTyre**: Log aktivitas ban (install/remove)
- **InspectionTyre**: Data inspeksi ban
- **ActionTyre**: Workflow aksi pada ban

### Master Data
- **Site**: Lokasi/site
- **Merk**: Merk ban
- **TyreSize**: Ukuran ban
- **RemovePurpose**: Tujuan removal
- **RemoveReason**: Alasan removal
- **AirCondition**: Kondisi udara

### Configuration
- **UnitTyrePosition**: Posisi ban pada unit
- **UnitTyreAmount**: Konfigurasi jumlah ban per unit

### Authentication
- **User**: Data user
- **RoleUser**: Role user
- **ApiKey**: API key management

## 🔧 Development

### Project Structure
```
src/
├── controllers/     # Business logic
├── routes/         # API routes  
├── middlewares/    # Auth & validation
└── types/         # Type definitions

prisma/
├── schema.prisma   # Database schema
└── migrations/     # Database migrations
```

### Database Migration
```bash
# Create new migration
npx prisma migrate dev --name your-migration-name

# Reset database (development only!)
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Open Prisma Studio
npx prisma studio
```

## 🚦 Production Deployment

### Build untuk Production
```bash
npm run build
npm start
```

### Environment Variables untuk Production
```bash
DATABASE_URL="your-production-database-url"
PORT=8080
JWT_SECRET="your-secure-jwt-secret"
```

## 📋 API Documentation

### Authentication Headers
```
Authorization: Bearer <jwt-token>
x-api-key: <your-api-key>
```

### Response Format
```json
{
  "success": true,
  "message": "Success message",
  "data": {...}
}
```

## 🐛 Troubleshooting

### Database Connection Issues
1. Pastikan SQL Server berjalan di `localhost:1433`
2. Periksa username/password di DATABASE_URL
3. Pastikan database `primatyre` sudah dibuat
4. Untuk development, gunakan `trustServerCertificate=true`

### Migration Issues
```bash
# Reset database (development only)
npx prisma migrate reset

# Push schema langsung tanpa migration
npx prisma db push
```

### Common Commands
```bash
# Check Prisma version
npx prisma version

# Format schema
npx prisma format

# Generate client
npx prisma generate
```

## 📝 Version Info

- **Version**: 1.0.0
- **Node.js**: ≥18.0.0
- **Prisma**: ^6.7.0
- **Express**: ^5.1.0
- **TypeScript**: ^5.8.2

## 👥 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

Untuk pertanyaan atau dukungan, silakan hubungi tim Prima Jaya Persada.

---

**Developed by Prima Jaya Persada** 🚛🔧
