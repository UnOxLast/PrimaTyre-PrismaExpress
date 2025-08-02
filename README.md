# PrimaTyre - Tire Management System API

**PrimaTyre** adalah sistem manajemen ban (tire management system) yang dikembangkan oleh Prima Jaya Persada. Sistem ini menyediakan REST API untuk mengelola seluruh lifecycle ban mulai dari stok, instalasi, inspeksi, hingga removal pada unit kendaraan.

## 🚀 Fitur Utama

- **Manajemen Stok Ban**: Tracking serial number, merk, ukuran, dan harga ban
- **Manajemen Unit**: Konfigurasi kendaraan dan posisi ban
- **Aktivitas Ban**: Pencatatan instalasi dan removal ban dengan business logic otomatis
- **Inspeksi Ban**: Monitoring kondisi ban dan analisis
- **Action Tyre**: Workflow tindakan pada ban
- **Export Data**: Export ke Excel dengan formatting dan conditional logic
- **Authentication**: JWT dan API Key authentication
- **Role Management**: Sistem role user
- **Version Management**: Automated versioning dengan build number dan timestamp
- **Date Handling**: Timezone-aware date formatting (Asia/Jakarta)
- **Business Logic**: Conditional date fields berdasarkan tipe aktivitas (install/remove)

## 🛠️ Tech Stack

- **Backend**: Express.js dengan TypeScript
- **Database**: SQL Server (dengan opsi PostgreSQL)
- **ORM**: Prisma
- **Authentication**: JWT + bcryptjs
- **Export**: ExcelJS dengan conditional formatting
- **Date Processing**: date-fns-tz untuk timezone handling
- **CORS**: Configured untuk frontend integration
- **Build Tools**: tsx, nodemon untuk development

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
| **Development** | `npm run dev` | Jalankan development server dengan nodemon (auto-update version) |
| **Build** | `npm run build` | Compile TypeScript ke JavaScript (auto-update version) |
| **Start** | `npm start` | Jalankan production server |
| **Migration** | `npm run migrate` | Database migration dengan nama lazy |
| **Push Schema** | `npm run push` | Push schema ke database |
| **Seed** | `npm run devSeed` | Seed database dengan data sample |
| **Queries** | `npm run queries` | Jalankan test queries |
| **Caching** | `npm run caching` | Test caching functionality |
| **Versioning** | `npm run version:update` | Update version info dengan timestamp |

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
- `POST /export` - Export data ke Excel dengan filtering dan conditional formatting

### Health Check
- `GET /ping` - Health check endpoint
- `GET /version` - Informasi versi aplikasi dengan timestamp

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

## � Excel Export Features

### Advanced Export Logic
- **Conditional Date Columns**: Logic tanggal berbeda untuk install-only vs remove+install
- **Timezone Support**: Otomatis format tanggal ke Asia/Jakarta
- **Smart Filtering**: Filter berdasarkan dateTimeWork, dateTimeDone, atau fallback ke createdAt
- **Chronological Sorting**: Data diurutkan berdasarkan tanggal yang sebenarnya ditampilkan
- **Role-based Access**: Filtering data berdasarkan role user dan site

### Export Parameters
```json
{
  "siteId": "number (optional for admin)",
  "startDate": "string (YYYY-MM-DD format)",
  "endDate": "string (YYYY-MM-DD format)", 
  "roleId": "number (1=admin, others=site-specific)"
}
```

### Business Logic
- **Install Only**: Menggunakan `dateTimeDone` untuk tanggal pengerjaan
- **Remove + Install**: Menggunakan `dateTimeWork` untuk tanggal pengerjaan  
- **Fallback**: Jika kedua tanggal null, gunakan `createdAt`
- **Automatic Sorting**: Data diurutkan berdasarkan tanggal yang ditampilkan di Excel

## �🔧 Development

### Project Structure
```
src/
├── controllers/     # Business logic dengan conditional date handling
├── routes/         # API routes  
├── middlewares/    # Auth & validation
├── types/         # Type definitions
└── version-info.json # Auto-generated version info

scripts/
└── update-version.ts # Version automation script

prisma/
├── schema.prisma   # Database schema
└── migrations/     # Database migrations
```

### Automated Versioning
Sistem otomatis update version info pada setiap build/dev:
- **Version**: Semantic versioning dari package.json
- **Build Number**: Unix timestamp unik
- **Date/Time**: Format Indonesia (WIB timezone)
- **Auto-trigger**: Pre-build dan pre-dev hooks

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
JWT_EXPIRES_IN=1h
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

### Excel Export API Example
```bash
# Export dengan filter tanggal
POST /export
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "siteId": 1,
  "startDate": "2025-08-01",
  "endDate": "2025-08-02",
  "roleId": 2
}
```

### Version Info API Example
```bash
# Get current version info
GET /version

Response:
{
  "version": "1.5.3",
  "date": "02-08-2025",
  "time": "16.59.29 WIB",
  "buildNumber": 1754128769728,
  "description": "PrimaTyre API Server"
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

### Excel Export Issues
1. **Data tidak urut**: Pastikan sorting logic menggunakan conditional date
2. **Timezone salah**: Periksa format `Asia/Jakarta` di date-fns-tz
3. **Filter tidak akurat**: Cek logic OR untuk dateTimeWork/dateTimeDone/createdAt
4. **Role permission**: Pastikan roleId dan siteId sesuai untuk filtering

### Version Management Issues
```bash
# Manual update version info
npm run version:update

# Check version endpoint
curl http://localhost:8080/version
```

### Performance Issues
1. **Large dataset export**: Gunakan date range filtering
2. **Memory usage**: Batasi jumlah data dengan pagination
3. **Database queries**: Monitor dengan Prisma logging

### Common Commands
```bash
# Check Prisma version
npx prisma version

# Format schema
npx prisma format

# Generate client
npx prisma generate

# Update version manually
npm run version:update

# Test specific functionality
npm run queries
npm run caching
```

## 📝 Version Info

- **Current Version**: 1.5.3 (Auto-updated)
- **Node.js**: ≥18.0.0
- **Prisma**: ^6.7.0
- **Express**: ^5.1.0
- **TypeScript**: ^5.8.2
- **ExcelJS**: ^4.4.0
- **date-fns-tz**: ^3.2.0

### Version Management
- Version info tersimpan di `src/version-info.json`
- Auto-update pada setiap build/development
- Menyertakan build number dan timestamp
- Accessible via `/version` endpoint

## � Recent Updates & Changelog

### Version 1.5.3 (Latest)
- ✅ **Excel Export Enhancement**: Conditional date logic untuk kolom TANGGAL JAM PENGERJAAN
- ✅ **Smart Sorting**: Data Excel diurutkan berdasarkan tanggal yang sebenarnya ditampilkan
- ✅ **Timezone Support**: Format tanggal otomatis ke Asia/Jakarta (WIB)
- ✅ **Business Logic**: Install-only vs Remove+Install menggunakan field tanggal berbeda
- ✅ **Fallback Handling**: Gunakan createdAt jika dateTimeWork dan dateTimeDone null
- ✅ **Automated Versioning**: Auto-update version info pada build/dev dengan timestamp
- ✅ **Filter Enhancement**: Conditional filtering sesuai dengan logic Excel export

### Previous Updates
- 🔧 **Performance**: Query optimization untuk export data
- 🔧 **Role-based Access**: Filtering berdasarkan site untuk non-admin users
- 🔧 **Error Handling**: Improved error messages dan validation
- 🔧 **API Documentation**: Enhanced endpoint documentation

## �👥 Contributing

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
