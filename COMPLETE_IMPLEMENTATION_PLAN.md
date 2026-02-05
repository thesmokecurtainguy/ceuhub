# Complete Implementation Plan - ceuHUB Multi-Tenant Platform

## Executive Summary

Transform ceuHUB from a single-tenant course platform into a multi-tenant SaaS platform supporting:
- **Organizations**: Manufacturers, Rep Firms, Individual Reps with hierarchical relationships
- **Bulk Certificate Generation**: CSV upload → auto-generate → auto-email ($0.99/certificate)
- **Self-Paced Course Hosting**: Monthly subscription per course with completion notifications
- **Certificate Templates**: AIA-focused, customizable per organization/accreditation type
- **Contact/Marketing Database**: Platform-owned, downloadable by organization admins
- **Billing System**: Stripe integration for per-certificate charges + monthly hosting fees

---

## Phase 1: Database Foundation ✅ (CURRENT)

### 1.1 Schema Updates
- [x] Create migration plan document
- [ ] Update `schema.prisma` with all new models
- [ ] Add 11 new models (Organization, BulkCertificate, etc.)
- [ ] Update 4 existing models (User, Course, Certificate, CompletionLog)
- [ ] Run Prisma migration
- [ ] Generate Prisma client

### 1.2 Data Migration
- [ ] Create migration script for existing data
- [ ] Create default organization for existing courses
- [ ] Link existing users to organizations
- [ ] Migrate existing certificates
- [ ] Verify data integrity

### 1.3 Breaking Changes Handling
- [ ] Update Certificate model usage (quizAttemptId now optional)
- [ ] Update Course queries to handle organizationId
- [ ] Update User model to handle roles
- [ ] Test existing features still work

---

## Phase 2: Core Organization System

### 2.1 Organization Management
- [ ] Organization CRUD API endpoints
- [ ] Organization hierarchy support (parent/child)
- [ ] Organization types (manufacturer, rep_firm, individual_rep)
- [ ] Organization settings page
- [ ] Organization profile management

### 2.2 User Roles & Permissions
- [ ] Role system: platform_admin, organization_admin, rep, student
- [ ] Permission middleware
- [ ] Role-based access control (RBAC)
- [ ] Organization member management
- [ ] User role assignment UI

### 2.3 Invitation System
- [ ] Invitation creation API
- [ ] Email invitation sending
- [ ] Invitation acceptance flow
- [ ] Invitation expiration handling
- [ ] Invitation management UI

---

## Phase 3: Certificate Template System

### 3.1 Template Management
- [ ] Template CRUD API (platform admin only)
- [ ] Template creation UI (admin dashboard)
- [ ] Template selection per organization
- [ ] Template preview functionality
- [ ] Template locking (no updates after creation)

### 3.2 Template Features
- [ ] HTML/CSS template storage
- [ ] Logo upload and management
- [ ] Variable substitution system
- [ ] AIA compliance validation
- [ ] Multiple templates per organization (by accreditation type)

### 3.3 PDF Generation Service
- [ ] PDF generation service (Puppeteer or cloud service)
- [ ] HTML to PDF conversion
- [ ] Certificate storage (Vercel Blob)
- [ ] Certificate URL generation
- [ ] Certificate regeneration support

---

## Phase 4: CSV Bulk Certificate System

### 4.1 CSV Upload
- [ ] CSV file upload endpoint
- [ ] CSV parsing and validation
- [ ] Required fields validation (Name, Email, AIA Number, Course info)
- [ ] Error handling (skip invalid rows, log errors)
- [ ] Max 100 rows per batch
- [ ] Immediate processing (no background jobs)

### 4.2 Certificate Generation
- [ ] Batch processing workflow
- [ ] Certificate number generation (CERT-Course#-Date-00001)
- [ ] Template application
- [ ] PDF generation per certificate
- [ ] Success/failure tracking
- [ ] Batch status tracking

### 4.3 Email System
- [ ] Certificate email to attendee (PDF attachment or link)
- [ ] Certificate email to rep/organization
- [ ] Customizable email templates per organization
- [ ] Email from organization email (or rep email)
- [ ] Opt-out link in email footer
- [ ] Email delivery tracking

### 4.4 Manual Updates & Regeneration
- [ ] Manual certificate data editing UI
- [ ] Certificate regeneration functionality
- [ ] Regeneration reason tracking
- [ ] Re-email certificates after regeneration
- [ ] Update contact database on regeneration

---

## Phase 5: Contact/Marketing Database

### 5.1 Contact Management
- [ ] Contact creation from certificate generation
- [ ] Contact deduplication (by email)
- [ ] Opt-out handling
- [ ] Contact data fields (name, email, location, AIA number)
- [ ] Contact update tracking

### 5.2 Contact Access
- [ ] Organization admin download (CSV export)
- [ ] Contact filtering and search
- [ ] Contact cannot be deleted (platform-owned)
- [ ] Contact export functionality
- [ ] Contact analytics (by organization, by course, etc.)

---

## Phase 6: Billing System

### 6.1 Stripe Integration
- [ ] Stripe account setup
- [ ] Stripe customer creation per organization
- [ ] Payment method management (cards on file)
- [ ] Payment method UI (add/remove cards)
- [ ] Default payment method selection

### 6.2 Per-Certificate Billing
- [ ] $0.99 per certificate charge
- [ ] Invoice generation per batch
- [ ] Stripe payment processing
- [ ] Payment failure handling
- [ ] Invoice history and download

### 6.3 Monthly Hosting Fees
- [ ] Course subscription creation
- [ ] Monthly fee calculation
- [ ] Stripe subscription management
- [ ] Subscription status tracking (active, cancelled, past_due)
- [ ] Subscription renewal handling
- [ ] Subscription cancellation

### 6.4 Invoice Management
- [ ] Invoice generation
- [ ] Invoice types (certificate_batch, subscription, monthly_hosting)
- [ ] Invoice status tracking
- [ ] Invoice history UI
- [ ] Stripe webhook handling

---

## Phase 7: Self-Paced Course Hosting

### 7.1 Course Hosting Setup
- [ ] Course hosting toggle (`isHosted` flag)
- [ ] Course subscription creation flow
- [ ] Course publishing workflow
- [ ] Course visibility settings
- [ ] Course access control

### 7.2 Completion Notifications
- [ ] Course completion detection
- [ ] Email to organization admin on completion
- [ ] Email to rep/presenter on completion
- [ ] Notification tracking in CompletionLog
- [ ] Notification preferences (if needed)

### 7.3 Course Management
- [ ] Course hosting dashboard
- [ ] Active subscriptions view
- [ ] Subscription management
- [ ] Course analytics (completions, enrollments)

---

## Phase 8: Certificate Numbering System

### 8.1 Number Generation
- [ ] Certificate number sequence tracking
- [ ] Format: CERT-{Course#}-{YYYYMMDD}-{00001}
- [ ] Per organization or per course numbering
- [ ] Sequential number generation
- [ ] Number uniqueness validation

### 8.2 Number Management
- [ ] Number sequence reset (if needed)
- [ ] Number format customization
- [ ] Number tracking and search
- [ ] Certificate lookup by number

---

## Phase 9: UI/UX Implementation

### 9.1 Organization Dashboard
- [ ] Organization overview
- [ ] Member management
- [ ] Invitation management
- [ ] Template selection
- [ ] Billing overview

### 9.2 CSV Upload Interface
- [ ] CSV upload form
- [ ] Upload progress indicator
- [ ] Batch status display
- [ ] Error log viewing
- [ ] Certificate list view
- [ ] Certificate detail/edit view

### 9.3 Certificate Management
- [ ] Certificate list (filterable, searchable)
- [ ] Certificate detail view
- [ ] Certificate regeneration UI
- [ ] Certificate download
- [ ] Certificate email resend

### 9.4 Contact Database UI
- [ ] Contact list view
- [ ] Contact search and filter
- [ ] Contact export (CSV download)
- [ ] Contact analytics dashboard

### 9.5 Billing Dashboard
- [ ] Payment methods management
- [ ] Invoice history
- [ ] Subscription management
- [ ] Usage statistics
- [ ] Billing settings

### 9.6 Course Hosting UI
- [ ] Course hosting toggle
- [ ] Subscription setup flow
- [ ] Active subscriptions list
- [ ] Completion notifications view

---

## Phase 10: API Development

### 10.1 Organization APIs
- [ ] `GET /api/organizations` - List organizations
- [ ] `POST /api/organizations` - Create organization
- [ ] `GET /api/organizations/[id]` - Get organization
- [ ] `PATCH /api/organizations/[id]` - Update organization
- [ ] `GET /api/organizations/[id]/members` - List members
- [ ] `POST /api/organizations/[id]/invitations` - Create invitation

### 10.2 Certificate Template APIs
- [ ] `GET /api/templates` - List templates (admin only)
- [ ] `POST /api/templates` - Create template (admin only)
- [ ] `GET /api/organizations/[id]/templates` - Get org templates
- [ ] `GET /api/templates/[id]/preview` - Preview template

### 10.3 Bulk Certificate APIs
- [ ] `POST /api/batches` - Upload CSV and create batch
- [ ] `GET /api/batches` - List batches
- [ ] `GET /api/batches/[id]` - Get batch details
- [ ] `GET /api/batches/[id]/certificates` - List certificates in batch
- [ ] `PATCH /api/certificates/[id]` - Update certificate
- [ ] `POST /api/certificates/[id]/regenerate` - Regenerate certificate
- [ ] `POST /api/certificates/[id]/resend-email` - Resend email

### 10.4 Contact APIs
- [ ] `GET /api/contacts` - List contacts (org admin only)
- [ ] `GET /api/contacts/export` - Export contacts CSV
- [ ] `POST /api/contacts/[id]/opt-out` - Opt out contact

### 10.5 Billing APIs
- [ ] `GET /api/billing/payment-methods` - List payment methods
- [ ] `POST /api/billing/payment-methods` - Add payment method
- [ ] `DELETE /api/billing/payment-methods/[id]` - Remove payment method
- [ ] `GET /api/billing/invoices` - List invoices
- [ ] `GET /api/billing/subscriptions` - List subscriptions
- [ ] `POST /api/billing/subscriptions` - Create subscription
- [ ] `DELETE /api/billing/subscriptions/[id]` - Cancel subscription

### 10.6 Webhook APIs
- [ ] `POST /api/webhooks/stripe` - Stripe webhook handler
- [ ] Webhook event processing
- [ ] Invoice paid handling
- [ ] Subscription status updates
- [ ] Payment method updates

---

## Phase 11: Security & Validation

### 11.1 Authentication & Authorization
- [ ] Organization-based access control
- [ ] Role-based permissions
- [ ] API route protection
- [ ] Organization context middleware
- [ ] User can only see their own certificates (reps)

### 11.2 Data Validation
- [ ] CSV validation (required fields, format)
- [ ] Email validation
- [ ] Certificate number validation
- [ ] Template validation (AIA compliance)
- [ ] Payment method validation

### 11.3 Security Measures
- [ ] Rate limiting (CSV uploads, API calls)
- [ ] File upload security (CSV only, size limits)
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Secure file storage

---

## Phase 12: Email System

### 12.1 Email Templates
- [ ] Certificate email template (customizable per org)
- [ ] Invitation email template
- [ ] Completion notification template
- [ ] Invoice email template
- [ ] Email template variables

### 12.2 Email Configuration
- [ ] Organization email settings
- [ ] Rep email settings
- [ ] Email sender configuration
- [ ] Email delivery tracking
- [ ] Email failure handling

---

## Phase 13: Testing & Quality Assurance

### 13.1 Unit Tests
- [ ] Certificate generation tests
- [ ] CSV parsing tests
- [ ] Certificate numbering tests
- [ ] Template rendering tests
- [ ] Billing calculation tests

### 13.2 Integration Tests
- [ ] CSV upload flow
- [ ] Certificate generation flow
- [ ] Email sending flow
- [ ] Stripe payment flow
- [ ] Organization creation flow

### 13.3 E2E Tests
- [ ] Complete CSV upload → certificate generation → email flow
- [ ] Course hosting → completion → notification flow
- [ ] Billing subscription flow
- [ ] Organization invitation flow

---

## Phase 14: Documentation

### 14.1 User Documentation
- [ ] Organization setup guide
- [ ] CSV upload guide
- [ ] Certificate template guide
- [ ] Billing guide
- [ ] Course hosting guide

### 14.2 Developer Documentation
- [ ] API documentation
- [ ] Database schema documentation
- [ ] Architecture overview
- [ ] Deployment guide
- [ ] Environment variables guide

---

## Phase 15: Deployment & Monitoring

### 15.1 Deployment
- [ ] Environment setup (dev, staging, prod)
- [ ] Database migration strategy
- [ ] Stripe webhook configuration
- [ ] Email service configuration
- [ ] File storage configuration

### 15.2 Monitoring
- [ ] Error logging
- [ ] Performance monitoring
- [ ] Certificate generation metrics
- [ ] Billing metrics
- [ ] Email delivery tracking

---

## Potential Missing Items (To Consider)

### ⚠️ Items We Discussed But Haven't Fully Planned:

1. **White-Labeling**
   - Custom domains per organization
   - Custom branding (colors, logos, CSS)
   - Remove "Powered by ceuHUB" branding
   - Custom email templates
   - **Schema Addition Needed**: Organization branding fields

2. **External Video Integration**
   - Support for YouTube, Vimeo, Wistia embeds
   - Video progress tracking
   - Video completion requirements
   - **Schema Addition Needed**: Video provider fields in Course/Slide models

3. **API Access for Embedding**
   - API key authentication
   - REST API for course data
   - Iframe embedding support
   - Webhook system for external integrations
   - **Schema Addition Needed**: API key model

4. **Advanced Features**
   - Certificate preview before generation
   - Template editor UI (visual builder)
   - Bulk certificate regeneration
   - Certificate search by number
   - Advanced reporting/analytics
   - Audit logging
   - Notification preferences
   - Course analytics dashboard

5. **Operational**
   - Admin dashboard for platform admins
   - System health monitoring
   - Backup and recovery procedures
   - Data retention policies
   - GDPR compliance (if needed)

---

## Implementation Priority

### MVP (Must Have)
1. ✅ Database schema
2. Organization system
3. CSV bulk certificate generation
4. Basic certificate templates (AIA)
5. Per-certificate billing ($0.99)
6. Contact database
7. Email system

### Phase 2 (Important)
8. Monthly hosting fees
9. Completion notifications
10. Certificate regeneration
11. Payment method management
12. Invoice system

### Phase 3 (Nice to Have)
13. White-labeling
14. External video integration
15. API access
16. Advanced analytics
17. Template editor UI

---

## Estimated Timeline

- **Phase 1 (Database)**: 1-2 weeks
- **Phase 2-4 (Core Features)**: 4-6 weeks
- **Phase 5-8 (Billing & Hosting)**: 3-4 weeks
- **Phase 9-10 (UI & API)**: 3-4 weeks
- **Phase 11-15 (Polish & Deploy)**: 2-3 weeks

**Total MVP**: ~12-16 weeks

---

## Key Decisions Needed

1. **PDF Generation**: Puppeteer (self-hosted) vs. PDFShift/HTMLtoPDF (cloud service)?
2. **Email Service**: Continue with Resend or switch?
3. **File Storage**: Continue with Vercel Blob or consider alternatives?
4. **White-Labeling**: Include in MVP or Phase 2?
5. **Video Integration**: Include in MVP or Phase 2?
6. **API Access**: Include in MVP or Phase 2?

---

## Success Metrics

- CSV upload success rate > 95%
- Certificate generation time < 5 seconds per certificate
- Email delivery rate > 98%
- Payment success rate > 99%
- System uptime > 99.9%
- User satisfaction score

---

## Notes

- All prices in USD
- Certificate numbering: CERT-{Course#}-{YYYYMMDD}-{00001}
- CSV max 100 rows per batch
- Immediate processing (no background jobs for MVP)
- Templates locked after creation
- Contacts platform-owned, downloadable by org admins
- Card must be on file for certificate generation
- Monthly hosting fees charged per course when `isHosted = true`
