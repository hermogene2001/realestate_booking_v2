-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TENANT',
    "password" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "wallet_address" TEXT,
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" TEXT,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "backup_codes" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "properties" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "owner_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "price_eth" TEXT NOT NULL,
    "deposit_eth" TEXT NOT NULL,
    "images" JSONB NOT NULL DEFAULT '[]',
    "bedrooms" INTEGER NOT NULL DEFAULT 1,
    "bathrooms" INTEGER NOT NULL DEFAULT 1,
    "area" REAL NOT NULL DEFAULT 0,
    "amenities" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_doc" TEXT,
    "qr_code" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "properties_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tenant_id" INTEGER NOT NULL,
    "property_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "tx_hash" TEXT,
    "escrow_amount" TEXT,
    "blockchain_booking_id" INTEGER,
    "payment_method" TEXT,
    "payment_status" TEXT DEFAULT 'PENDING',
    "currency" TEXT DEFAULT 'ETH',
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "tenant_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "owner_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "timeout_at" DATETIME,
    "promo_code_id" INTEGER,
    "discount_applied" REAL NOT NULL DEFAULT 0,
    "total_amount" TEXT,
    "remaining_amount" TEXT,
    "remaining_paid" BOOLEAN NOT NULL DEFAULT false,
    "remaining_tx_hash" TEXT,
    "full_paid_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "bookings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bookings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "property_id" INTEGER NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "photos" JSONB NOT NULL DEFAULT '[]',
    "owner_reply" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reviews_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "booking_id" INTEGER NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "from_address" TEXT NOT NULL,
    "to_address" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fraud_alerts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fraud_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "id_doc_front" TEXT NOT NULL,
    "id_doc_back" TEXT NOT NULL,
    "selfie" TEXT,
    "verified_at" DATETIME,
    "rejection_reason" TEXT,
    "reviewed_by" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "property_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "favorites_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "availabilities" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "property_id" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "is_booked" BOOLEAN NOT NULL DEFAULT false,
    "booking_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "availabilities_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "availabilities_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "booking_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETH',
    "payment_method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "transaction_id" TEXT,
    "provider_ref" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "paid_at" DATETIME,
    "refunded_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "messages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sender_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "property_id" INTEGER,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "messages_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discount_percent" REAL NOT NULL DEFAULT 0,
    "discount_amount" REAL NOT NULL DEFAULT 0,
    "max_uses" INTEGER NOT NULL DEFAULT 0,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "valid_from" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "booking_id" INTEGER NOT NULL,
    "raised_by" INTEGER NOT NULL,
    "against" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolved_by" INTEGER,
    "resolved_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "disputes_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "disputes_raised_by_fkey" FOREIGN KEY ("raised_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "disputes_against_fkey" FOREIGN KEY ("against") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "cover_image" TEXT,
    "author_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "published_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "insurances" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "booking_id" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "policy_number" TEXT NOT NULL,
    "coverage_amount" REAL NOT NULL,
    "premium" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "valid_from" DATETIME NOT NULL,
    "valid_until" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "insurances_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reward_tokens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "booking_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reward_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agents" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "license_number" TEXT NOT NULL,
    "agency" TEXT,
    "specialty" TEXT,
    "rating" REAL NOT NULL DEFAULT 0,
    "total_sales" INTEGER NOT NULL DEFAULT 0,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "agents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "virtual_tours" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "property_id" INTEGER NOT NULL,
    "tour_url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "virtual_tours_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "smart_devices" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "property_id" INTEGER NOT NULL,
    "device_type" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "smart_devices_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "corporate_accounts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "company_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "address" TEXT,
    "discount_percent" REAL NOT NULL DEFAULT 0,
    "monthly_limit" REAL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "community_events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "event_date" DATETIME NOT NULL,
    "organizer_id" INTEGER NOT NULL,
    "max_attendees" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "community_events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "events" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "secret" TEXT NOT NULL DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "long_term_rentals" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "property_id" INTEGER NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "monthly_rent" REAL NOT NULL,
    "deposit" REAL NOT NULL DEFAULT 0,
    "lease_start" DATETIME NOT NULL,
    "lease_end" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "payment_day" INTEGER NOT NULL DEFAULT 1,
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "terms" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "long_term_rentals_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "long_term_rentals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "maintenance_requests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "property_id" INTEGER NOT NULL,
    "tenant_id" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "cost" REAL NOT NULL DEFAULT 0,
    "photos" JSONB NOT NULL DEFAULT '[]',
    "assigned_to" INTEGER,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "maintenance_requests_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "maintenance_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "maintenance_requests_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "booking_id" INTEGER NOT NULL,
    "property_id" INTEGER NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "platform_fee" REAL NOT NULL,
    "owner_receives" REAL NOT NULL,
    "total_amount" REAL NOT NULL,
    "commission_rate" REAL NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paid_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "property_documents" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "property_id" INTEGER NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "rejection_reason" TEXT,
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" DATETIME,
    "reviewed_by" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "property_documents_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "property_documents_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "property_shares" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "property_id" INTEGER NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "share_count" REAL NOT NULL,
    "price_per_share" TEXT NOT NULL,
    "total_shares" REAL NOT NULL,
    "shares_for_sale" REAL NOT NULL,
    "is_on_chain" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "property_shares_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "property_shares_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "share_purchases" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "property_share_id" INTEGER NOT NULL,
    "buyer_id" INTEGER NOT NULL,
    "share_count" REAL NOT NULL,
    "total_price" TEXT NOT NULL,
    "tx_hash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "share_purchases_property_share_id_fkey" FOREIGN KEY ("property_share_id") REFERENCES "property_shares" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "share_purchases_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_reputations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "total_score" INTEGER NOT NULL DEFAULT 0,
    "count" INTEGER NOT NULL DEFAULT 0,
    "average" REAL NOT NULL DEFAULT 0,
    "last_updated" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_reputations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_wallet_address_key" ON "users"("wallet_address");

-- CreateIndex
CREATE INDEX "properties_district_idx" ON "properties"("district");

-- CreateIndex
CREATE INDEX "properties_price_eth_idx" ON "properties"("price_eth");

-- CreateIndex
CREATE INDEX "properties_lat_lng_idx" ON "properties"("lat", "lng");

-- CreateIndex
CREATE INDEX "bookings_tenant_id_idx" ON "bookings"("tenant_id");

-- CreateIndex
CREATE INDEX "bookings_property_id_idx" ON "bookings"("property_id");

-- CreateIndex
CREATE INDEX "bookings_status_timeout_at_idx" ON "bookings"("status", "timeout_at");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_booking_id_key" ON "reviews"("booking_id");

-- CreateIndex
CREATE INDEX "reviews_property_id_idx" ON "reviews"("property_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_tx_hash_key" ON "transactions"("tx_hash");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_user_id_key" ON "verifications"("user_id");

-- CreateIndex
CREATE INDEX "verifications_status_idx" ON "verifications"("status");

-- CreateIndex
CREATE INDEX "favorites_user_id_idx" ON "favorites"("user_id");

-- CreateIndex
CREATE INDEX "favorites_property_id_idx" ON "favorites"("property_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_property_id_key" ON "favorites"("user_id", "property_id");

-- CreateIndex
CREATE UNIQUE INDEX "availabilities_booking_id_key" ON "availabilities"("booking_id");

-- CreateIndex
CREATE INDEX "availabilities_property_id_idx" ON "availabilities"("property_id");

-- CreateIndex
CREATE INDEX "availabilities_date_idx" ON "availabilities"("date");

-- CreateIndex
CREATE INDEX "availabilities_is_booked_idx" ON "availabilities"("is_booked");

-- CreateIndex
CREATE UNIQUE INDEX "payments_booking_id_key" ON "payments"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transaction_id_key" ON "payments"("transaction_id");

-- CreateIndex
CREATE INDEX "payments_booking_id_idx" ON "payments"("booking_id");

-- CreateIndex
CREATE INDEX "payments_user_id_idx" ON "payments"("user_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_payment_method_idx" ON "payments"("payment_method");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_receiver_id_idx" ON "messages"("receiver_id");

-- CreateIndex
CREATE INDEX "messages_property_id_idx" ON "messages"("property_id");

-- CreateIndex
CREATE INDEX "messages_is_read_idx" ON "messages"("is_read");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- CreateIndex
CREATE INDEX "promo_codes_code_idx" ON "promo_codes"("code");

-- CreateIndex
CREATE INDEX "promo_codes_is_active_idx" ON "promo_codes"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_booking_id_key" ON "disputes"("booking_id");

-- CreateIndex
CREATE INDEX "disputes_booking_id_idx" ON "disputes"("booking_id");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "disputes_raised_by_idx" ON "disputes"("raised_by");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_status_idx" ON "blog_posts"("status");

-- CreateIndex
CREATE INDEX "blog_posts_author_id_idx" ON "blog_posts"("author_id");

-- CreateIndex
CREATE UNIQUE INDEX "insurances_booking_id_key" ON "insurances"("booking_id");

-- CreateIndex
CREATE INDEX "insurances_booking_id_idx" ON "insurances"("booking_id");

-- CreateIndex
CREATE INDEX "insurances_policy_number_idx" ON "insurances"("policy_number");

-- CreateIndex
CREATE INDEX "reward_tokens_user_id_idx" ON "reward_tokens"("user_id");

-- CreateIndex
CREATE INDEX "reward_tokens_type_idx" ON "reward_tokens"("type");

-- CreateIndex
CREATE UNIQUE INDEX "agents_user_id_key" ON "agents"("user_id");

-- CreateIndex
CREATE INDEX "agents_user_id_idx" ON "agents"("user_id");

-- CreateIndex
CREATE INDEX "agents_license_number_idx" ON "agents"("license_number");

-- CreateIndex
CREATE INDEX "virtual_tours_property_id_idx" ON "virtual_tours"("property_id");

-- CreateIndex
CREATE INDEX "smart_devices_property_id_idx" ON "smart_devices"("property_id");

-- CreateIndex
CREATE INDEX "smart_devices_device_type_idx" ON "smart_devices"("device_type");

-- CreateIndex
CREATE UNIQUE INDEX "corporate_accounts_contact_email_key" ON "corporate_accounts"("contact_email");

-- CreateIndex
CREATE INDEX "community_events_event_date_idx" ON "community_events"("event_date");

-- CreateIndex
CREATE INDEX "webhooks_is_active_idx" ON "webhooks"("is_active");

-- CreateIndex
CREATE INDEX "long_term_rentals_property_id_idx" ON "long_term_rentals"("property_id");

-- CreateIndex
CREATE INDEX "long_term_rentals_tenant_id_idx" ON "long_term_rentals"("tenant_id");

-- CreateIndex
CREATE INDEX "long_term_rentals_status_idx" ON "long_term_rentals"("status");

-- CreateIndex
CREATE INDEX "maintenance_requests_property_id_idx" ON "maintenance_requests"("property_id");

-- CreateIndex
CREATE INDEX "maintenance_requests_status_idx" ON "maintenance_requests"("status");

-- CreateIndex
CREATE INDEX "maintenance_requests_priority_idx" ON "maintenance_requests"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_booking_id_key" ON "commissions"("booking_id");

-- CreateIndex
CREATE INDEX "commissions_owner_id_idx" ON "commissions"("owner_id");

-- CreateIndex
CREATE INDEX "commissions_status_idx" ON "commissions"("status");

-- CreateIndex
CREATE INDEX "property_documents_property_id_idx" ON "property_documents"("property_id");

-- CreateIndex
CREATE INDEX "property_documents_status_idx" ON "property_documents"("status");

-- CreateIndex
CREATE INDEX "property_documents_document_type_idx" ON "property_documents"("document_type");

-- CreateIndex
CREATE INDEX "property_shares_property_id_idx" ON "property_shares"("property_id");

-- CreateIndex
CREATE INDEX "property_shares_owner_id_idx" ON "property_shares"("owner_id");

-- CreateIndex
CREATE INDEX "share_purchases_buyer_id_idx" ON "share_purchases"("buyer_id");

-- CreateIndex
CREATE INDEX "share_purchases_property_share_id_idx" ON "share_purchases"("property_share_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_reputations_user_id_key" ON "user_reputations"("user_id");

-- CreateIndex
CREATE INDEX "user_reputations_user_id_idx" ON "user_reputations"("user_id");

