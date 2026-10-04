# 🚀 PRODUCTION DEPLOYMENT GUIDE

**Complete guide for deploying Kigali Real Estate Platform to production**

---

## 📋 DEPLOYMENT OPTIONS

### Option 1: Docker (RECOMMENDED) ⭐
**Best for:** Full control, scalability, production-ready

### Option 2: Vercel + Railway
**Best for:** Quick deployment, managed services

### Option 3: AWS/GCP/Azure
**Best for:** Enterprise, full infrastructure control

---

## 🐳 OPTION 1: DOCKER DEPLOYMENT (RECOMMENDED)

### Prerequisites:
- Docker & Docker Compose installed
- Domain name (optional)
- SSL certificate (optional)

### Step 1: Create Production Environment File

Create `.env.production` in root directory:

```env
# Database
# SQLite database file; mount a persistent volume at /app/data.
DATABASE_URL=file:/app/data/dev.db

# Backend
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=another-secret-key-min-32-chars
BLOCKCHAIN_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
CONTRACT_ADDRESS=0xYourDeployedContractAddress
ADMIN_WALLET_ADDRESS=0xYourAdminWallet
FRONTEND_URL=https://yourdomain.com

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis
REDIS_URL=redis://redis:6379

# Sentry
SENTRY_DSN=https://your-dsn@sentry.io/project

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### Step 2: Build and Start

```bash
# Build all services
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Step 3: Run Database Migrations

```bash
# Access backend container
docker-compose exec backend sh

# Run migrations
npx prisma migrate deploy

# Exit container
exit
```

### Step 4: Access Platform

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/api-docs

### Step 5: Setup SSL (Optional)

Using Nginx + Let's Encrypt:

```bash
# Install nginx
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx

# Configure nginx
sudo nano /etc/nginx/sites-available/kigali-re

# Add configuration (see below)

# Enable site
sudo ln -s /etc/nginx/sites-available/kigali-re /etc/nginx/sites-enabled/

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

**Nginx Configuration:**

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## ▲ OPTION 2: VERCEL + RAILWAY (EASIEST)

### Backend (Railway):

1. **Push to GitHub**
```bash
git add .
git commit -m "Production ready"
git push origin main
```

2. **Deploy to Railway**
- Go to https://railway.app
- Click "New Project" → "Deploy from GitHub"
- Select your repository
- Choose `backend` directory
- Add environment variables
- Deploy!

3. **Add Environment Variables in Railway:**
```
DATABASE_URL=file:/app/data/dev.db
# For SQLite, mount persistent storage and use: file:/app/data/dev.db
JWT_SECRET=...
JWT_REFRESH_SECRET=...
BLOCKCHAIN_RPC_URL=...
CONTRACT_ADDRESS=...
ADMIN_WALLET_ADDRESS=...
FRONTEND_URL=https://your-frontend.vercel.app
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
REDIS_URL=redis://...
SENTRY_DSN=...
```

### Frontend (Vercel):

1. **Deploy to Vercel**
- Go to https://vercel.com
- Click "New Project"
- Import from GitHub
- Choose `frontend` directory
- Add environment variables
- Deploy!

2. **Add Environment Variables in Vercel:**
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

### Database (Railway MySQL):

1. In Railway dashboard
2. Click "New" → "Database" → "Add MySQL"
3. Copy the DATABASE_URL
4. Add to backend environment variables

### Redis (Railway Redis):

1. In Railway dashboard
2. Click "New" → "Database" → "Add Redis"
3. Copy the REDIS_URL
4. Add to backend environment variables

---

## ☁️ OPTION 3: AWS DEPLOYMENT

### Architecture:
- Frontend: S3 + CloudFront
- Backend: EC2 or ECS
- Database: RDS MySQL
- Cache: ElastiCache Redis
- Storage: S3 for uploads

### Quick Setup:

```bash
# 1. Create RDS MySQL instance
aws rds create-db-instance \
  --db-instance-identifier kigali-mysql \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --master-username admin \
  --master-user-password your-password \
  --allocated-storage 20

# 2. Create ElastiCache Redis
aws elasticache create-cache-cluster \
  --cache-cluster-id kigali-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1

# 3. Deploy backend to ECS
# (See AWS ECS documentation)

# 4. Deploy frontend to S3 + CloudFront
aws s3 sync frontend/out s3://your-bucket-name
```

---

## 🔒 SECURITY CHECKLIST

### Before Deploying:

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (min 32 chars)
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Enable database backups
- [ ] Configure rate limiting
- [ ] Set up error monitoring (Sentry)
- [ ] Enable logging
- [ ] Remove debug mode
- [ ] Set production NODE_ENV
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable 2FA for admin accounts
- [ ] Test backup and restore

---

## 📊 MONITORING SETUP

### 1. Sentry (Error Tracking)

```bash
# Create account at https://sentry.io
# Create new project
# Copy DSN to .env

SENTRY_DSN=https://your-dsn@sentry.io/project
```

### 2. Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p kigali_realestate > backup_$DATE.sql

# Keep last 7 days
find . -name "backup_*.sql" -mtime +7 -delete
```

### 3. Log Management

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Export logs
docker-compose logs > logs_$(date +%Y%m%d).txt
```

---

## 🚀 DEPLOYMENT COMMANDS

### Docker:
```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# Update
docker-compose pull
docker-compose up -d --build

# View logs
docker-compose logs -f
```

### Railway/Vercel:
```bash
# Push to GitHub
git add .
git commit -m "Update"
git push

# Auto-deploys on push to main branch
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

- [ ] Test all features
- [ ] Verify email sending works
- [ ] Test payment processing
- [ ] Check blockchain transactions
- [ ] Verify 2FA functionality
- [ ] Test KYC submission
- [ ] Check admin dashboard
- [ ] Verify analytics tracking
- [ ] Test rate limiting
- [ ] Check error monitoring (Sentry)
- [ ] Verify database backups
- [ ] Test mobile responsiveness
- [ ] Check PWA installation
- [ ] Verify API documentation
- [ ] Test all API endpoints
- [ ] Monitor performance
- [ ] Set up alerts

---

## 🆘 TROUBLESHOOTING

### Backend won't start:
```bash
# Check logs
docker-compose logs backend

# Common issues:
# - DATABASE_URL incorrect
# - Port already in use
# - Missing environment variables
```

### Frontend build fails:
```bash
# Check Node version
node -v  # Should be 18+

# Clear cache
cd frontend
rm -rf .next
npm run build
```

### Database connection issues:
```bash
# Test connection
docker-compose exec mysql mysql -u root -p

# Check if running
docker-compose ps mysql
```

---

## 📈 PERFORMANCE OPTIMIZATION

### Production Optimizations:

1. **Enable Redis Caching**
```env
REDIS_URL=redis://redis:6379
```

2. **Database Indexes** (Already added)
- All frequently queried fields indexed
- Composite indexes for complex queries

3. **CDN for Static Assets**
- Use CloudFront (AWS) or Cloudflare
- Cache images, CSS, JS

4. **Enable Compression**
```javascript
// Add to backend/index.ts
import compression from 'compression';
app.use(compression());
```

5. **Optimize Images**
- Use WebP format
- Implement lazy loading
- Use CDN for image delivery

---

## 🎉 DEPLOYMENT COMPLETE!

Your platform is now:
- ✅ Production-ready
- ✅ Secure
- ✅ Scalable
- ✅ Monitored
- ✅ Backed up

**URLs:**
- Frontend: https://yourdomain.com
- API: https://api.yourdomain.com
- Docs: https://api.yourdomain.com/api-docs
- Admin: https://yourdomain.com/admin

**Congratulations! Your platform is LIVE!** 🚀🌍
