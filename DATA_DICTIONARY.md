# Data Dictionary

Project: Kigali Real Estate Booking Platform  
Database: MySQL  
ORM source: `backend/prisma/schema.prisma`  
Generated on: 2026-06-01

This data dictionary documents the main database entities used by the real estate booking platform. Field names use the application/Prisma names, with the physical database table names shown in each section.

## Enumerations

### Role

| Value | Meaning |
| --- | --- |
| TENANT | User who rents or books properties. |
| OWNER | User who lists and manages properties. |
| ADMIN | System administrator. |

### PropertyStatus

| Value | Meaning |
| --- | --- |
| AVAILABLE | Property can be booked or rented. |
| BOOKED | Property has an active booking. |
| RENTED | Property is currently rented. |
| MAINTENANCE | Property is unavailable due to maintenance. |
| DELISTED | Property has been removed from public listing. |

### BookingStatus

| Value | Meaning |
| --- | --- |
| PENDING | Booking was created and awaits action. |
| ACCEPTED | Owner accepted the booking. |
| REJECTED | Owner rejected the booking. |
| LOCKED | Booking funds or escrow are locked. |
| COMPLETED | Booking finished successfully. |
| REFUNDED | Booking payment was refunded. |
| DISPUTED | Booking is under dispute. |
| CANCELLED | Booking was cancelled. |

### TransactionType

| Value | Meaning |
| --- | --- |
| DEPOSIT | Deposit payment transaction. |
| REMAINING | Remaining balance payment transaction. |
| RELEASE | Funds release transaction. |
| REFUND | Refund transaction. |
| CANCEL | Cancellation transaction. |
| FEE | Platform or service fee transaction. |

### TransactionStatus

| Value | Meaning |
| --- | --- |
| PENDING | Transaction is awaiting confirmation. |
| CONFIRMED | Transaction was confirmed. |
| FAILED | Transaction failed. |

### NotificationType

| Value | Meaning |
| --- | --- |
| BOOKING_CREATED | A booking was created. |
| DEPOSIT_CONFIRMED | A deposit was confirmed. |
| HANDOVER_PENDING | Property handover is pending. |
| FUNDS_RELEASED | Escrow funds were released. |
| REFUND_ISSUED | A refund was issued. |
| REVIEW_RECEIVED | A review was submitted. |
| PROPERTY_APPROVED | Property was approved. |
| PROPERTY_REJECTED | Property was rejected. |
| FRAUD_ALERT | Fraud alert was generated. |
| PAYMENT_FAILED | Payment failed. |
| TIMEOUT_WARNING | Booking timeout warning. |
| DISPUTE_RESOLVED | Dispute was resolved. |
| BOOKING_TIMEOUT | Booking timed out. |
| BOOKING_CANCELLED | Booking was cancelled. |
| DOCUMENT_UPLOADED | Property document was uploaded. |
| DOCUMENT_APPROVED | Property document was approved. |
| DOCUMENT_REJECTED | Property document was rejected. |
| KYC_APPROVED | KYC verification was approved. |
| KYC_REJECTED | KYC verification was rejected. |
| BOOKING_ACCEPTED | Booking was accepted. |
| BOOKING_REJECTED | Booking was rejected. |

## Tables

### users

Stores registered users, authentication data, roles, wallet details, and account status.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique user identifier. |
| name | String | Required | User full name. |
| email | String | Unique, required | User email address used for login. |
| phone | String | Required | User phone number. |
| role | Role | Default TENANT | User role in the platform. |
| password | String | Required | Hashed user password. |
| language | String | Default `en` | Preferred interface language. |
| walletAddress | String | Unique, nullable | Blockchain wallet address. |
| isBanned | Boolean | Default false | Whether the account is banned. |
| isVerified | Boolean | Default false | Whether the user account is verified. |
| twoFactorSecret | String | Nullable | Secret used for two-factor authentication. |
| twoFactorEnabled | Boolean | Default false | Whether two-factor authentication is enabled. |
| backupCodes | Json | Nullable | Two-factor backup codes. |
| createdAt | DateTime | Default now | Account creation timestamp. |
| updatedAt | DateTime | Auto updated | Last account update timestamp. |

Relations: owns properties, creates bookings, reviews, notifications, payments, messages, disputes, blog posts, reward tokens, KYC verification, agent profile, shares, and reputation.

### properties

Stores real estate listings and property metadata.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique property identifier. |
| ownerId | Int | FK users.id | Property owner. |
| title | String | Required | Listing title. |
| description | Text | Required | Detailed property description. |
| location | String | Required | Human-readable property location. |
| district | String | Indexed | Kigali district or administrative area. |
| lat | Float | Indexed with lng | Latitude coordinate. |
| lng | Float | Indexed with lat | Longitude coordinate. |
| priceEth | String | Indexed | Rental price stored as ETH/wei-compatible string. |
| depositEth | String | Required | Deposit amount stored as ETH/wei-compatible string. |
| images | Json | Default `[]` | Property image paths or URLs. |
| bedrooms | Int | Default 1 | Number of bedrooms. |
| bathrooms | Int | Default 1 | Number of bathrooms. |
| area | Float | Default 0 | Property area. |
| amenities | Json | Default `[]` | List of property amenities. |
| status | PropertyStatus | Default AVAILABLE | Current listing status. |
| isApproved | Boolean | Default false | Admin approval status. |
| isVerified | Boolean | Default false | Property verification status. |
| verificationDoc | String | Nullable | Verification document reference. |
| qrCode | String | Nullable | QR code reference for the property. |
| createdAt | DateTime | Default now | Listing creation timestamp. |
| updatedAt | DateTime | Auto updated | Last listing update timestamp. |

Relations: belongs to a user; has bookings, reviews, favorites, availability records, messages, virtual tours, smart devices, rentals, maintenance requests, documents, and shares.

### bookings

Stores rental booking requests, status, payment progress, and blockchain references.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique booking identifier. |
| tenantId | Int | FK users.id, indexed | User making the booking. |
| propertyId | Int | FK properties.id, indexed | Booked property. |
| status | BookingStatus | Default PENDING | Current booking status. |
| txHash | String | Nullable | Blockchain transaction hash for the booking. |
| escrowAmount | String | Nullable | Amount held in escrow. |
| blockchainBookingId | Int | Nullable | Booking identifier on the blockchain contract. |
| paymentMethod | String | Nullable | Payment method, such as ETHEREUM, MOMO, or CARD. |
| paymentStatus | String | Default PENDING | Payment status. |
| currency | String | Default ETH | Payment currency. |
| startDate | DateTime | Required | Booking start date. |
| endDate | DateTime | Required | Booking end date. |
| tenantConfirmed | Boolean | Default false | Whether tenant confirmed handover/completion. |
| ownerConfirmed | Boolean | Default false | Whether owner confirmed handover/completion. |
| timeoutAt | DateTime | Nullable, indexed with status | Deadline for timeout logic. |
| promoCodeId | Int | Nullable | Applied promo code identifier. |
| discountApplied | Float | Default 0 | Discount applied to the booking. |
| totalAmount | String | Nullable | Total payable amount. |
| remainingAmount | String | Nullable | Remaining balance. |
| remainingPaid | Boolean | Default false | Whether remaining amount was paid. |
| remainingTxHash | String | Nullable | Transaction hash for remaining payment. |
| fullPaidAt | DateTime | Nullable | Timestamp when full payment was completed. |
| createdAt | DateTime | Default now | Booking creation timestamp. |
| updatedAt | DateTime | Auto updated | Last booking update timestamp. |

Relations: belongs to a tenant and property; has transactions, review, availability, payment, dispute, and insurance.

### reviews

Stores tenant reviews for completed bookings and properties.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique review identifier. |
| userId | Int | FK users.id | Review author. |
| propertyId | Int | FK properties.id, indexed | Reviewed property. |
| bookingId | Int | FK bookings.id, unique | Booking associated with the review. |
| rating | Int | Required | Numeric rating. |
| comment | Text | Required | Review content. |
| photos | Json | Default `[]` | Review photo references. |
| ownerReply | Text | Nullable | Owner response to the review. |
| createdAt | DateTime | Default now | Review creation timestamp. |
| updatedAt | DateTime | Auto updated | Last review update timestamp. |

### notifications

Stores user-facing notification messages.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique notification identifier. |
| userId | Int | FK users.id, indexed with isRead | Recipient user. |
| type | NotificationType | Required | Notification category. |
| message | String | Required | Notification text. |
| metadata | Json | Nullable | Additional notification payload. |
| isRead | Boolean | Default false | Whether the notification was read. |
| createdAt | DateTime | Default now | Notification creation timestamp. |

### transactions

Stores blockchain or payment transaction records linked to bookings.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique transaction identifier. |
| bookingId | Int | FK bookings.id | Related booking. |
| txHash | String | Unique | Blockchain transaction hash. |
| type | TransactionType | Required | Transaction purpose. |
| amount | String | Required | Transaction amount. |
| fromAddress | String | Required | Sender wallet or account address. |
| toAddress | String | Required | Receiver wallet or account address. |
| status | TransactionStatus | Default PENDING | Transaction confirmation status. |
| createdAt | DateTime | Default now | Transaction creation timestamp. |

### fraud_alerts

Stores fraud detection alerts and investigation status.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique fraud alert identifier. |
| userId | Int | FK users.id, nullable | User associated with the alert. |
| alertType | String | Required | Type/category of fraud alert. |
| severity | String | Default medium | Alert severity level. |
| description | Text | Required | Alert details. |
| metadata | Json | Nullable | Supporting alert data. |
| isResolved | Boolean | Default false | Whether the alert has been resolved. |
| createdAt | DateTime | Default now | Alert creation timestamp. |

### verifications

Stores KYC verification documents and review state.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique verification identifier. |
| userId | Int | FK users.id, unique | User being verified. |
| status | String | Default PENDING, indexed | Verification status. |
| idDocFront | String | Required | Front side identity document path. |
| idDocBack | String | Required | Back side identity document path. |
| selfie | String | Nullable | Selfie image path. |
| verifiedAt | DateTime | Nullable | Approval timestamp. |
| rejectionReason | String | Nullable | Reason for rejection. |
| reviewedBy | Int | Nullable | Admin reviewer identifier. |
| createdAt | DateTime | Default now | Verification request timestamp. |
| updatedAt | DateTime | Auto updated | Last verification update timestamp. |

### favorites

Stores user wishlists or saved properties.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique favorite identifier. |
| userId | Int | FK users.id, indexed, cascade delete | User who saved the property. |
| propertyId | Int | FK properties.id, indexed, cascade delete | Saved property. |
| createdAt | DateTime | Default now | Favorite creation timestamp. |

Constraint: `userId + propertyId` is unique.

### availabilities

Stores property availability windows and booking occupancy.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique availability identifier. |
| propertyId | Int | FK properties.id, indexed, cascade delete | Related property. |
| date | DateTime | Indexed | Availability start date. |
| endDate | DateTime | Required | Availability end date. |
| isBooked | Boolean | Default false, indexed | Whether the period is booked. |
| bookingId | Int | FK bookings.id, unique, nullable | Booking occupying this period. |
| createdAt | DateTime | Default now | Availability record creation timestamp. |

### payments

Stores payment attempts and provider references.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique payment identifier. |
| bookingId | Int | FK bookings.id, unique, indexed | Related booking. |
| userId | Int | FK users.id, indexed | Paying user. |
| amount | Float | Required | Payment amount. |
| currency | String | Default ETH | Payment currency. |
| paymentMethod | String | Indexed | Payment method. |
| status | String | Default PENDING, indexed | Payment status. |
| transactionId | String | Unique, nullable | Internal or external transaction identifier. |
| providerRef | String | Nullable | Provider reference, such as MoMo or Stripe. |
| metadata | Json | Default `{}` | Extra payment metadata. |
| paidAt | DateTime | Nullable | Payment completion timestamp. |
| refundedAt | DateTime | Nullable | Refund timestamp. |
| createdAt | DateTime | Default now | Payment creation timestamp. |
| updatedAt | DateTime | Auto updated | Last payment update timestamp. |

### messages

Stores direct messages between users, optionally linked to a property.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique message identifier. |
| senderId | Int | FK users.id, indexed | Message sender. |
| receiverId | Int | FK users.id, indexed | Message recipient. |
| propertyId | Int | FK properties.id, indexed, nullable | Property context for the message. |
| content | Text | Required | Message body. |
| isRead | Boolean | Default false, indexed | Whether recipient has read the message. |
| createdAt | DateTime | Default now | Message creation timestamp. |

### promo_codes

Stores promotional discount codes.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique promo code identifier. |
| code | String | Unique, indexed | Promo code text. |
| description | Text | Nullable | Promo code description. |
| discountPercent | Float | Default 0 | Percentage discount. |
| discountAmount | Float | Default 0 | Fixed discount amount. |
| maxUses | Int | Default 0 | Maximum allowed uses. |
| usedCount | Int | Default 0 | Number of times used. |
| validFrom | DateTime | Default now | Start date for validity. |
| validUntil | DateTime | Nullable | End date for validity. |
| isActive | Boolean | Default true, indexed | Whether the code can be used. |
| createdAt | DateTime | Default now | Promo code creation timestamp. |

### disputes

Stores booking disputes between platform users.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique dispute identifier. |
| bookingId | Int | FK bookings.id, unique, indexed | Disputed booking. |
| raisedBy | Int | FK users.id, indexed | User who raised the dispute. |
| against | Int | FK users.id | User the dispute is against. |
| reason | Text | Required | Dispute reason. |
| status | String | Default OPEN, indexed | Current dispute status. |
| resolution | Text | Nullable | Resolution details. |
| resolvedBy | Int | Nullable | Admin resolver identifier. |
| resolvedAt | DateTime | Nullable | Resolution timestamp. |
| createdAt | DateTime | Default now | Dispute creation timestamp. |
| updatedAt | DateTime | Auto updated | Last dispute update timestamp. |

### blog_posts

Stores CMS blog posts.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique blog post identifier. |
| title | String | Required | Blog post title. |
| slug | String | Unique, indexed | URL-friendly post slug. |
| content | Text | Required | Full post content. |
| excerpt | Text | Nullable | Short summary. |
| coverImage | String | Nullable | Cover image path or URL. |
| authorId | Int | FK users.id, indexed | Post author. |
| status | String | Default DRAFT, indexed | Publishing status. |
| publishedAt | DateTime | Nullable | Publication timestamp. |
| createdAt | DateTime | Default now | Post creation timestamp. |
| updatedAt | DateTime | Auto updated | Last post update timestamp. |

### insurances

Stores insurance policies connected to bookings.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique insurance identifier. |
| bookingId | Int | FK bookings.id, unique, indexed | Insured booking. |
| provider | String | Required | Insurance provider. |
| policyNumber | String | Indexed | Policy number. |
| coverageAmount | Float | Required | Insurance coverage amount. |
| premium | Float | Required | Insurance premium. |
| status | String | Default ACTIVE | Policy status. |
| validFrom | DateTime | Required | Policy start date. |
| validUntil | DateTime | Required | Policy end date. |
| createdAt | DateTime | Default now | Policy creation timestamp. |

### reward_tokens

Stores user reward token balances and activity entries.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique reward token entry identifier. |
| userId | Int | FK users.id, indexed | Rewarded user. |
| amount | Float | Required | Token amount. |
| type | String | Indexed | Entry type, such as EARNING, REDEMPTION, or BONUS. |
| description | Text | Nullable | Reward explanation. |
| bookingId | Int | Nullable | Related booking identifier. |
| createdAt | DateTime | Default now | Reward entry creation timestamp. |

### agents

Stores professional agent profiles linked to users.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique agent identifier. |
| userId | Int | FK users.id, unique, indexed | User account for the agent. |
| licenseNumber | String | Indexed | Agent license number. |
| agency | String | Nullable | Agency name. |
| specialty | Text | Nullable | Agent specialty description. |
| rating | Float | Default 0 | Agent rating. |
| totalSales | Int | Default 0 | Total completed sales. |
| isVerified | Boolean | Default false | Whether the agent is verified. |
| verifiedAt | DateTime | Nullable | Verification timestamp. |
| createdAt | DateTime | Default now | Agent profile creation timestamp. |
| updatedAt | DateTime | Auto updated | Last profile update timestamp. |

### virtual_tours

Stores virtual tour media for properties.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique virtual tour identifier. |
| propertyId | Int | FK properties.id, indexed | Related property. |
| tourUrl | String | Required | Tour media URL. |
| type | String | Required | Tour type, such as 360_PHOTO or VIDEO. |
| title | String | Required | Tour title. |
| description | Text | Nullable | Tour description. |
| thumbnail | String | Nullable | Tour thumbnail image. |
| isActive | Boolean | Default true | Whether the tour is available. |
| createdAt | DateTime | Default now | Tour creation timestamp. |

### smart_devices

Stores smart home devices associated with properties.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique smart device identifier. |
| propertyId | Int | FK properties.id, indexed | Related property. |
| deviceType | String | Indexed | Device type, such as LOCK, THERMOSTAT, LIGHT, or CAMERA. |
| deviceId | String | Required | External device identifier. |
| name | String | Required | Device display name. |
| isOnline | Boolean | Default false | Device online state. |
| metadata | Json | Default `{}` | Extra device metadata. |
| createdAt | DateTime | Default now | Device creation timestamp. |

### corporate_accounts

Stores corporate customers and their booking discount details.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique corporate account identifier. |
| companyName | String | Required | Company name. |
| contactEmail | String | Unique | Company contact email. |
| contactPhone | String | Required | Company contact phone. |
| address | Text | Nullable | Company address. |
| discountPercent | Float | Default 0 | Corporate discount percentage. |
| monthlyLimit | Float | Nullable | Monthly booking or spend limit. |
| isActive | Boolean | Default true | Whether account is active. |
| createdAt | DateTime | Default now | Account creation timestamp. |

### community_events

Stores community events organized through the platform.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique event identifier. |
| title | String | Required | Event title. |
| description | Text | Required | Event description. |
| location | String | Nullable | Event location. |
| eventDate | DateTime | Indexed | Event date and time. |
| organizerId | Int | FK users.id | Event organizer. |
| maxAttendees | Int | Nullable | Maximum allowed attendees. |
| isActive | Boolean | Default true | Whether event is active. |
| createdAt | DateTime | Default now | Event creation timestamp. |

### webhooks

Stores external webhook subscriptions.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique webhook identifier. |
| url | String | Required | Destination webhook URL. |
| events | Json | Default `[]` | Subscribed event names. |
| isActive | Boolean | Default true, indexed | Whether webhook is active. |
| secret | String | Default empty string | Secret for signature verification. |
| createdAt | DateTime | Default now | Webhook creation timestamp. |

### long_term_rentals

Stores long-term lease records separate from short bookings.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique long-term rental identifier. |
| propertyId | Int | FK properties.id, indexed | Leased property. |
| tenantId | Int | FK users.id, indexed | Tenant. |
| monthlyRent | Float | Required | Monthly rent amount. |
| deposit | Float | Default 0 | Lease deposit amount. |
| leaseStart | DateTime | Required | Lease start date. |
| leaseEnd | DateTime | Required | Lease end date. |
| status | String | Default ACTIVE, indexed | Lease status. |
| paymentDay | Int | Default 1 | Day of month rent is due. |
| autoRenew | Boolean | Default false | Whether the lease auto-renews. |
| terms | Text | Nullable | Lease terms. |
| createdAt | DateTime | Default now | Rental creation timestamp. |
| updatedAt | DateTime | Auto updated | Last rental update timestamp. |

### maintenance_requests

Stores maintenance issues raised for properties.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique maintenance request identifier. |
| propertyId | Int | FK properties.id, indexed | Property needing maintenance. |
| tenantId | Int | FK users.id, nullable | Tenant who raised the issue. |
| title | String | Required | Request title. |
| description | Text | Required | Request details. |
| priority | String | Default MEDIUM, indexed | Priority level. |
| status | String | Default OPEN, indexed | Request status. |
| cost | Float | Default 0 | Maintenance cost. |
| photos | Json | Default `[]` | Supporting photo references. |
| assignedTo | Int | FK users.id, nullable | Assigned staff or user. |
| completedAt | DateTime | Nullable | Completion timestamp. |
| createdAt | DateTime | Default now | Request creation timestamp. |
| updatedAt | DateTime | Auto updated | Last request update timestamp. |

### commissions

Stores platform commission calculations for bookings.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique commission identifier. |
| bookingId | Int | Unique | Related booking identifier. |
| propertyId | Int | Required | Related property identifier. |
| ownerId | Int | Indexed | Property owner identifier. |
| platformFee | Float | Required | Platform commission amount. |
| ownerReceives | Float | Required | Amount payable to owner. |
| totalAmount | Float | Required | Total booking amount. |
| commissionRate | Float | Default 5 | Commission percentage. |
| status | String | Default PENDING, indexed | Commission payment status. |
| paidAt | DateTime | Nullable | Commission payment timestamp. |
| createdAt | DateTime | Default now | Commission creation timestamp. |
| updatedAt | DateTime | Auto updated | Last commission update timestamp. |

Note: this model stores booking, property, and owner identifiers without explicit Prisma relations.

### property_documents

Stores uploaded property ownership and verification documents.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique property document identifier. |
| propertyId | Int | FK properties.id, indexed, cascade delete | Related property. |
| documentType | String | Indexed | Document type, such as UPI, LAND_TITLE, LAND_CERTIFICATE, or CERTIFICATE_OF_LAND_REGISTRATION. |
| filePath | String | Required | Server file path. |
| fileName | String | Required | Original or stored file name. |
| fileSize | Int | Required | File size in bytes. |
| mimeType | String | Required | File MIME type. |
| status | String | Default PENDING_REVIEW, indexed | Review status. |
| rejectionReason | Text | Nullable | Reason for rejection. |
| uploadedAt | DateTime | Default now | Upload timestamp. |
| reviewedAt | DateTime | Nullable | Review timestamp. |
| reviewedBy | Int | FK users.id, nullable | Reviewing admin. |
| createdAt | DateTime | Default now | Record creation timestamp. |
| updatedAt | DateTime | Auto updated | Last document update timestamp. |

### property_shares

Stores fractional property share offerings.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique property share identifier. |
| propertyId | Int | FK properties.id, indexed | Shared property. |
| ownerId | Int | FK users.id, indexed | Share owner. |
| shareCount | Float | Required | Number of shares owned. |
| pricePerShare | String | Required | Price per share stored as wei-compatible string. |
| totalShares | Float | Required | Total shares for the property. |
| sharesForSale | Float | Required | Shares currently available for sale. |
| isOnChain | Boolean | Default false | Whether share data is recorded on-chain. |
| isActive | Boolean | Default true | Whether share offering is active. |
| createdAt | DateTime | Default now | Share record creation timestamp. |
| updatedAt | DateTime | Auto updated | Last share update timestamp. |

### share_purchases

Stores purchase records for fractional property shares.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique share purchase identifier. |
| propertyShareId | Int | FK property_shares.id, indexed | Share offering purchased. |
| buyerId | Int | FK users.id, indexed | User buying the shares. |
| shareCount | Float | Required | Number of shares purchased. |
| totalPrice | String | Required | Total price stored as wei-compatible string. |
| txHash | String | Nullable | Blockchain transaction hash. |
| status | String | Default COMPLETED | Purchase status. |
| createdAt | DateTime | Default now | Purchase creation timestamp. |

### user_reputations

Stores aggregate reputation scores for users.

| Field | Type | Key / Rule | Description |
| --- | --- | --- | --- |
| id | Int | PK, auto increment | Unique reputation identifier. |
| userId | Int | FK users.id, unique, indexed | User whose reputation is tracked. |
| totalScore | Int | Default 0 | Sum of reputation scores. |
| count | Int | Default 0 | Number of reputation entries. |
| average | Float | Default 0 | Average reputation score, scaled by 100 in application comments. |
| lastUpdated | DateTime | Nullable | Last recalculation timestamp. |
| createdAt | DateTime | Default now | Reputation record creation timestamp. |
| updatedAt | DateTime | Auto updated | Last reputation update timestamp. |

## Main Relationship Summary

| Parent | Child | Relationship |
| --- | --- | --- |
| users | properties | One owner can have many properties. |
| users | bookings | One tenant can have many bookings. |
| properties | bookings | One property can have many bookings. |
| bookings | transactions | One booking can have many transactions. |
| bookings | reviews | One booking can have one review. |
| users | reviews | One user can write many reviews. |
| properties | reviews | One property can receive many reviews. |
| users | notifications | One user can receive many notifications. |
| users | favorites | One user can favorite many properties. |
| properties | favorites | One property can be favorited by many users. |
| bookings | payments | One booking can have one payment record. |
| users | messages | Users can send and receive many messages. |
| bookings | disputes | One booking can have one dispute. |
| users | verifications | One user can have one KYC verification. |
| properties | property_documents | One property can have many verification documents. |
| properties | property_shares | One property can have many share offerings. |
| property_shares | share_purchases | One share offering can have many purchases. |
| users | user_reputations | One user can have one reputation aggregate. |

## Index And Constraint Summary

| Table | Important indexes / constraints |
| --- | --- |
| users | Unique email, unique walletAddress. |
| properties | Indexed district, priceEth, and lat/lng. |
| bookings | Indexed tenantId, propertyId, and status/timeoutAt. |
| reviews | Unique bookingId; indexed propertyId. |
| notifications | Indexed userId/isRead. |
| transactions | Unique txHash. |
| verifications | Unique userId; indexed status. |
| favorites | Unique userId/propertyId; indexed userId and propertyId. |
| availabilities | Unique bookingId; indexed propertyId, date, isBooked. |
| payments | Unique bookingId and transactionId; indexed userId, status, paymentMethod. |
| messages | Indexed senderId, receiverId, propertyId, isRead. |
| promo_codes | Unique code; indexed code and isActive. |
| disputes | Unique bookingId; indexed bookingId, status, raisedBy. |
| blog_posts | Unique slug; indexed slug, status, authorId. |
| insurances | Unique bookingId; indexed bookingId and policyNumber. |
| agents | Unique userId; indexed userId and licenseNumber. |
| property_documents | Indexed propertyId, status, documentType. |
| property_shares | Indexed propertyId and ownerId. |
| share_purchases | Indexed buyerId and propertyShareId. |
| user_reputations | Unique userId; indexed userId. |
