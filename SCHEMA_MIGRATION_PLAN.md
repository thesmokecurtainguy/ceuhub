# Schema Migration Plan - Multi-Tenant Platform

## Overview
This document outlines the database schema changes needed to transform ceuHUB into a multi-tenant platform supporting:
- Organizations (Manufacturers, Rep Firms, Individual Reps)
- CSV-based bulk certificate generation
- Certificate templates (AIA-focused, multiple per organization)
- Contact/marketing database
- Billing system (per-certificate + monthly hosting fees)
- Self-paced course hosting with completion notifications

## New Models

### 1. Organization
Represents manufacturers, rep firms, or individual reps.

```prisma
model Organization {
  id                String   @id @default(uuid())
  name              String
  type              String   // "manufacturer", "rep_firm", "individual_rep"
  parentId          String?  @map("parent_id") // For rep firms under manufacturers
  email             String
  phone             String?
  address           String?
  city              String?
  state             String?
  zip               String?
  aiaProviderNumber String?  @map("aia_provider_number")
  stripeCustomerId  String?  @unique @map("stripe_customer_id")
  // White-labeling fields
  customDomain      String?  @unique @map("custom_domain")
  primaryColor      String?  @map("primary_color")
  secondaryColor    String?  @map("secondary_color")
  logoUrl           String?  @map("logo_url")
  customCss         String?  @db.Text @map("custom_css")
  whiteLabelEnabled Boolean  @default(false) @map("white_label_enabled")
  removeBranding    Boolean  @default(false) @map("remove_branding")
  // API access fields
  apiKey            String?  @unique @map("api_key")
  apiEnabled        Boolean  @default(false) @map("api_enabled")
  webhookUrl        String?  @map("webhook_url")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  @@index([customDomain])
  @@index([apiKey])
  parent            Organization?  @relation("OrganizationHierarchy", fields: [parentId], references: [id])
  children          Organization[]  @relation("OrganizationHierarchy")
  members           OrganizationMember[]
  invitations       Invitation[]
  templates         CertificateTemplate[]
  courses           Course[]
  batches           BulkCertificateBatch[]
  subscriptions     CourseSubscription[]
  invoices          Invoice[]
  contacts          Contact[]

  @@index([parentId])
  @@index([type])
  @@map("organizations")
}
```

### 2. OrganizationMember
Links users to organizations with roles.

```prisma
model OrganizationMember {
  id             String   @id @default(uuid())
  organizationId String   @map("organization_id")
  userId         String   @map("user_id")
  role           String   // "admin", "rep", "viewer"
  createdAt       DateTime @default(now()) @map("created_at")

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId])
  @@index([organizationId])
  @@index([userId])
  @@map("organization_members")
}
```

### 3. Invitation
For inviting reps to join organizations.

```prisma
model Invitation {
  id             String   @id @default(uuid())
  organizationId String   @map("organization_id")
  email          String
  role           String
  token          String   @unique
  invitedBy      String   @map("invited_by") // userId
  acceptedAt     DateTime? @map("accepted_at")
  expiresAt      DateTime @map("expires_at")
  createdAt      DateTime @default(now()) @map("created_at")

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
  @@index([token])
  @@index([email])
  @@map("invitations")
}
```

### 4. CertificateTemplate
Templates per organization/accreditation type.

```prisma
model CertificateTemplate {
  id             String   @id @default(uuid())
  organizationId String   @map("organization_id")
  name           String
  accreditationType String @map("accreditation_type") // "AIA", "OSHA", etc.
  isDefault      Boolean  @default(false) @map("is_default")
  htmlTemplate   String   @db.Text @map("html_template")
  cssStyles      String?  @db.Text @map("css_styles")
  logoUrl        String?  @map("logo_url")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  batches        BulkCertificateBatch[]

  @@index([organizationId])
  @@index([accreditationType])
  @@map("certificate_templates")
}
```

### 5. BulkCertificateBatch
CSV upload batches.

```prisma
model BulkCertificateBatch {
  id                String   @id @default(uuid())
  organizationId    String   @map("organization_id")
  uploadedById      String   @map("uploaded_by_id") // User who uploaded
  templateId        String   @map("template_id")
  courseId          String?  @map("course_id") // Optional - for course-specific batches
  fileName          String   @map("file_name")
  totalRows         Int      @map("total_rows")
  successfulRows    Int      @default(0) @map("successful_rows")
  failedRows        Int      @default(0) @map("failed_rows")
  status            String   // "processing", "completed", "failed"
  errorLog          String?  @db.Text @map("error_log")
  createdAt         DateTime @default(now()) @map("created_at")
  completedAt       DateTime? @map("completed_at")

  organization      Organization @relation(fields: [organizationId], references: [id])
  uploadedBy        User         @relation(fields: [uploadedById], references: [id])
  template          CertificateTemplate @relation(fields: [templateId], references: [id])
  course            Course?            @relation(fields: [courseId], references: [id])
  certificates      BulkCertificate[]

  @@index([organizationId])
  @@index([uploadedById])
  @@index([status])
  @@map("bulk_certificate_batches")
}
```

### 6. BulkCertificate
Individual certificates from CSV uploads.

```prisma
model BulkCertificate {
  id                  String   @id @default(uuid())
  batchId             String   @map("batch_id")
  certificateNumber   String   @unique @map("certificate_number") // Format: CERT-Course#-Date-00001
  attendeeName        String   @map("attendee_name")
  attendeeEmail       String   @map("attendee_email")
  attendeeAiaNumber   String?  @map("attendee_aia_number")
  attendeeLocation    String?  @map("attendee_location")
  courseTitle          String   @map("course_title")
  courseNumber         String   @map("course_number")
  sessionNumber        String   @map("session_number")
  presentationDate     DateTime @map("presentation_date")
  presentationLocation String  @map("presentation_location")
  repName              String   @map("rep_name")
  repEmail             String   @map("rep_email")
  certificateUrl       String   @map("certificate_url")
  emailedToAttendeeAt  DateTime? @map("emailed_to_attendee_at")
  emailedToRepAt       DateTime? @map("emailed_to_rep_at")
  generatedAt          DateTime @default(now()) @map("generated_at")
  updatedAt            DateTime @updatedAt @map("updated_at")
  // Allow manual updates/regeneration
  lastRegeneratedAt    DateTime? @map("last_regenerated_at")
  regenerationReason   String?  @db.Text @map("regeneration_reason")

  batch                BulkCertificateBatch @relation(fields: [batchId], references: [id], onDelete: Cascade)
  contact              Contact?

  @@index([batchId])
  @@index([certificateNumber])
  @@index([attendeeEmail])
  @@index([repEmail])
  @@map("bulk_certificates")
}
```

### 7. Contact
Marketing database (platform-owned, downloadable by org admins).

```prisma
model Contact {
  id              String   @id @default(uuid())
  email           String
  name            String
  location        String?
  aiaNumber       String?  @map("aia_number")
  optOut          Boolean  @default(false) @map("opt_out")
  sourceBatchId   String?  @map("source_batch_id") // Which batch created this contact
  sourceCertificateId String? @unique @map("source_certificate_id")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  certificate     BulkCertificate? @relation(fields: [sourceCertificateId], references: [id])

  @@unique([email])
  @@index([email])
  @@index([optOut])
  @@index([sourceBatchId])
  @@map("contacts")
}
```

### 8. CourseSubscription
Monthly hosting fees per course/presentation.

```prisma
model CourseSubscription {
  id                String   @id @default(uuid())
  organizationId    String   @map("organization_id")
  courseId          String   @map("course_id")
  monthlyFee        Float    @map("monthly_fee") // In dollars
  status            String   // "active", "cancelled", "past_due"
  currentPeriodStart DateTime @map("current_period_start")
  currentPeriodEnd   DateTime @map("current_period_end")
  stripeSubscriptionId String? @unique @map("stripe_subscription_id")
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  organization      Organization @relation(fields: [organizationId], references: [id])
  course            Course       @relation(fields: [courseId], references: [id])

  @@unique([organizationId, courseId])
  @@index([organizationId])
  @@index([courseId])
  @@index([status])
  @@map("course_subscriptions")
}
```

### 9. PaymentMethod
Stripe payment methods (cards on file).

```prisma
model PaymentMethod {
  id                String   @id @default(uuid())
  organizationId    String   @map("organization_id")
  stripePaymentMethodId String @unique @map("stripe_payment_method_id")
  type              String   // "card"
  last4             String   @map("last_4")
  brand             String?  // "visa", "mastercard", etc.
  expMonth          Int?     @map("exp_month")
  expYear           Int?     @map("exp_year")
  isDefault         Boolean  @default(false) @map("is_default")
  createdAt         DateTime @default(now()) @map("created_at")

  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
  @@map("payment_methods")
}
```

### 10. Invoice
Billing records for certificate generation and subscriptions.

```prisma
model Invoice {
  id                String   @id @default(uuid())
  organizationId    String   @map("organization_id")
  invoiceNumber     String   @unique @map("invoice_number")
  type              String   // "certificate_batch", "subscription", "monthly_hosting"
  amount            Float
  description       String?  @db.Text
  stripeInvoiceId   String?  @unique @map("stripe_invoice_id")
  status            String   // "draft", "open", "paid", "void", "uncollectible"
  dueDate           DateTime? @map("due_date")
  paidAt            DateTime? @map("paid_at")
  createdAt         DateTime @default(now()) @map("created_at")

  organization      Organization @relation(fields: [organizationId], references: [id])

  @@index([organizationId])
  @@index([status])
  @@index([invoiceNumber])
  @@map("invoices")
}
```

### 11. CertificateNumberSequence
Track certificate numbering per org/course.

```prisma
model CertificateNumberSequence {
  id             String   @id @default(uuid())
  organizationId String?  @map("organization_id") // Optional - can be per org or per course
  courseId       String?  @map("course_id")
  prefix         String   // "CERT"
  lastNumber     Int      @default(0) @map("last_number")
  format         String   // "CERT-{course}-{date}-{number}"
  updatedAt      DateTime @updatedAt @map("updated_at")

  organization   Organization? @relation(fields: [organizationId], references: [id])
  course         Course?      @relation(fields: [courseId], references: [id])

  @@unique([organizationId, courseId])
  @@index([organizationId])
  @@index([courseId])
  @@map("certificate_number_sequences")
}
```

## Updates to Existing Models

### User
Add role and organization relationships.

```prisma
model User {
  // ... existing fields ...
  role           String?  // "platform_admin", "organization_admin", "rep", "student"
  
  // New relations
  organizationMemberships OrganizationMember[]
  uploadedBatches          BulkCertificateBatch[]
  
  // ... rest of existing relations ...
}
```

### Course
Link to organization, add subscription support.

```prisma
model Course {
  // ... existing fields ...
  organizationId String?  @map("organization_id")
  isHosted       Boolean  @default(false) @map("is_hosted") // Self-paced hosting enabled
  
  // New relations
  organization   Organization? @relation(fields: [organizationId], references: [id])
  subscription   CourseSubscription?
  batches        BulkCertificateBatch[]
  
  // ... rest of existing relations ...
}
```

### Certificate
Make quizAttemptId optional, support bulk certificates.

```prisma
model Certificate {
  // ... existing fields ...
  quizAttemptId  String?  @unique @map("quiz_attempt_id") // Now optional
  bulkCertificateId String? @unique @map("bulk_certificate_id") // Link to bulk cert
  certificateNumber String? @map("certificate_number") // Trackable number
  
  // Update relations
  quizAttempt    QuizAttempt? @relation(fields: [quizAttemptId], references: [id])
  bulkCertificate BulkCertificate? @relation(fields: [bulkCertificateId], references: [id])
  
  // ... rest of existing relations ...
}
```

### CompletionLog
Add notification tracking for self-paced courses.

```prisma
model CompletionLog {
  // ... existing fields ...
  organizationNotifiedAt DateTime? @map("organization_notified_at")
  repNotifiedAt         DateTime? @map("rep_notified_at")
  
  // ... rest of existing relations ...
}
```

## Migration Steps

1. **Create new tables** (Organization, OrganizationMember, etc.)
2. **Update existing tables** (add new fields, make fields optional)
3. **Migrate existing data**:
   - Create default organization for existing courses
   - Link existing users to organizations
   - Migrate existing certificates
4. **Add indexes** for performance
5. **Set up foreign key constraints**

## Notes

- Certificate numbering: Format `CERT-{Course#}-{YYYYMMDD}-{00001}` per org/course
- Contacts are platform-owned but downloadable by org admins (cannot delete)
- Monthly hosting fees charged per course when `isHosted = true`
- Email notifications sent to org/rep when self-paced course is completed
- CSV uploads max 100 rows, immediate processing
- $0.99 per certificate, card must be on file
- Templates locked after creation (no updates)


## Additional Schema Updates (White-Labeling, Video, API)

### Course Model - Video Integration
Added fields for external video support:
- `videoProvider` - "youtube", "vimeo", "wistia", "custom", "hosted"
- `requireVideoCompletion` - Boolean flag
- `isHosted` - Self-paced hosting enabled

### Slide Model - Video Integration  
Added fields for external video integration:
- `videoProvider` - Video provider type
- `videoEmbedUrl` - Embed URL for external videos
- `videoExternalId` - Provider-specific video ID
- `videoProgressTracking` - Track progress for external videos

### Organization Model - White-Labeling & API
Added fields for white-labeling:
- `customDomain` - Custom domain/subdomain per organization
- `primaryColor`, `secondaryColor` - Brand colors
- `logoUrl` - Organization logo
- `customCss` - Custom CSS styling
- `whiteLabelEnabled` - Enable white-labeling
- `removeBranding` - Remove "Powered by ceuHUB" branding

Added fields for API access:
- `apiKey` - Unique API key for external access
- `apiEnabled` - Enable API access
- `webhookUrl` - Webhook URL for notifications

These fields are all optional/nullable, so they won't break existing functionality and can be added incrementally.
