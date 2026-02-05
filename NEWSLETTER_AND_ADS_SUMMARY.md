# Newsletter & Ads/Sponsorships Feature Summary

## Overview

The schema now includes comprehensive support for:
- **Newsletter Management**: Send newsletters to contacts from the marketing database
- **Ads & Sponsorships**: Sell advertising space and manage sponsorships
- **Performance Tracking**: Track opens, clicks, conversions, and revenue

---

## Newsletter System

### Contact Model Updates

**New Fields:**
- `newsletterSubscribed` (Boolean, default: true) - Separate from general optOut
- `newsletterPreferences` (JSON) - Categories/interests: `{ categories: [], interests: [] }`
- `newsletterLastSentAt` (DateTime?) - Track last newsletter sent to this contact
- `newsletterUnsubscribedAt` (DateTime?) - Track when they unsubscribed

**Key Features:**
- Contacts default to subscribed when created
- Newsletter preferences stored as JSON for flexibility
- Separate newsletter opt-out from general marketing opt-out
- Track engagement per contact

### NewsletterCampaign Model

**Purpose:** Manage newsletter campaigns and track performance

**Fields:**
- `subject` - Email subject line
- `content` - Plain text content
- `htmlContent` - HTML formatted content
- `status` - "draft", "scheduled", "sending", "sent", "cancelled"
- `scheduledAt` - When to send (for scheduled campaigns)
- `sentAt` - When campaign was sent
- Performance metrics:
  - `totalRecipients` - How many received it
  - `openedCount` - How many opened
  - `clickedCount` - How many clicked links
  - `bounceCount` - How many bounced
  - `unsubscribeCount` - How many unsubscribed

**Relations:**
- Links to `NewsletterRecipient[]` - Individual recipient tracking
- Links to `AdPlacement[]` - Ads included in newsletter

### NewsletterRecipient Model

**Purpose:** Track individual recipient engagement per campaign

**Fields:**
- Links to `campaignId` and `contactId`
- `email` - Recipient email (denormalized for performance)
- `sentAt` - When email was sent to this recipient
- `openedAt` - When recipient opened email
- `clickedAt` - When recipient clicked a link
- `bounced` - Whether email bounced
- `unsubscribed` - Whether recipient unsubscribed from this campaign

**Use Cases:**
- Track which contacts opened/clicked specific campaigns
- Identify engaged vs. unengaged contacts
- A/B testing different campaign content
- Re-engagement campaigns for inactive contacts

---

## Ads & Sponsorships System

### Advertiser Model

**Purpose:** Manage advertiser/sponsor companies

**Fields:**
- Company information (name, companyName, website)
- Contact details (email, phone, contactName, contactTitle)
- Address information
- `status` - "active", "inactive", "pending"
- `stripeCustomerId` - For billing
- `notes` - Internal notes about advertiser

**Relations:**
- Links to `AdCampaign[]` - Their campaigns
- Links to `AdInvoice[]` - Their invoices

### AdCampaign Model

**Purpose:** Manage advertising campaigns

**Fields:**
- `name` - Campaign name
- `description` - Campaign details
- `startDate` / `endDate` - Campaign duration
- `status` - "draft", "active", "paused", "completed", "cancelled"
- Billing:
  - `budget` - Total campaign budget
  - `billingType` - "flat_rate", "cpc" (cost per click), "cpm" (cost per mille/1000 impressions), "monthly"
  - `billingAmount` - Amount charged
  - `totalSpent` - Amount spent so far
- Performance:
  - `impressions` - Number of times ad was shown
  - `clicks` - Number of clicks

**Relations:**
- Links to `Advertiser` - Who owns the campaign
- Links to `AdPlacement[]` - Where ads are placed

### AdPlacement Model

**Purpose:** Manage where ads appear and track performance

**Fields:**
- `placementType` - Where ad appears:
  - "homepage" - Main landing page
  - "course_page" - Individual course pages
  - "newsletter_header" - Top of newsletter
  - "newsletter_footer" - Bottom of newsletter
  - "sidebar" - Sidebar on pages
  - "banner" - Banner ads
- `position` - Specific position ("top", "bottom", "left", "right", etc.)
- Ad content:
  - `adContent` - HTML content
  - `adImageUrl` - Image URL
  - `adLinkUrl` - Click-through URL
  - `altText` - Image alt text
- Performance:
  - `impressions` - Times shown
  - `clicks` - Times clicked
- `isActive` - Whether placement is currently active

**Relations:**
- Links to `AdCampaign` - Which campaign this placement belongs to
- Links to `NewsletterCampaign` (optional) - If placed in specific newsletter

### AdInvoice Model

**Purpose:** Bill advertisers separately from certificate/organization billing

**Fields:**
- `invoiceNumber` - Unique invoice number
- `amount` - Invoice amount
- `description` - What the invoice is for
- `billingPeriodStart` / `billingPeriodEnd` - Billing period
- `stripeInvoiceId` - Stripe invoice reference
- `status` - "draft", "open", "paid", "void", "uncollectible"
- `dueDate` / `paidAt` - Payment tracking

**Relations:**
- Links to `Advertiser` - Who to bill
- Optional link to `AdCampaign` - Which campaign this invoice is for

---

## Revenue Streams

### 1. Certificate Generation
- **Model:** Invoice (type: "certificate_batch")
- **Pricing:** $0.99 per certificate
- **Billing:** Per batch via Stripe

### 2. Monthly Hosting Fees
- **Model:** CourseSubscription
- **Pricing:** Monthly fee per course
- **Billing:** Recurring Stripe subscription

### 3. Newsletter Ads
- **Model:** AdInvoice
- **Pricing:** Based on billingType (flat_rate, cpc, cpm, monthly)
- **Billing:** Per campaign or monthly via Stripe

### 4. Website Ads
- **Model:** AdInvoice
- **Pricing:** Based on placement and billingType
- **Billing:** Per campaign or monthly via Stripe

---

## Workflow Examples

### Newsletter Workflow

1. **Create Campaign**
   - Admin creates NewsletterCampaign with content
   - Status: "draft"

2. **Select Recipients**
   - Query Contacts where `newsletterSubscribed = true` and `optOut = false`
   - Create NewsletterRecipient records for each contact

3. **Add Ads (Optional)**
   - Link AdPlacement records to campaign
   - Ads appear in newsletter header/footer

4. **Schedule/Send**
   - Set `scheduledAt` and status to "scheduled"
   - Or set status to "sending" and send immediately
   - Update `sentAt` when complete

5. **Track Performance**
   - Update `openedAt`, `clickedAt` via email tracking pixels/links
   - Update campaign totals (openedCount, clickedCount)
   - Handle bounces and unsubscribes

### Ad Campaign Workflow

1. **Onboard Advertiser**
   - Create Advertiser record
   - Set up Stripe customer
   - Status: "pending" → "active"

2. **Create Campaign**
   - Create AdCampaign with dates, budget, billingType
   - Status: "draft"

3. **Create Placements**
   - Create AdPlacement records for each location
   - Set ad content (HTML, images, links)
   - Link to campaign

4. **Activate Campaign**
   - Status: "draft" → "active"
   - Ads start showing on website/newsletters

5. **Track Performance**
   - Increment impressions when ad is shown
   - Increment clicks when ad is clicked
   - Update campaign totals

6. **Bill Advertiser**
   - Create AdInvoice based on billingType
   - Calculate amount (flat rate, or based on clicks/impressions)
   - Send via Stripe
   - Update status when paid

---

## Integration Points

### With Contact Database
- Contacts automatically added when certificates are generated
- Newsletter campaigns pull from Contact list
- Opt-out handling respects both `optOut` and `newsletterSubscribed`

### With Certificate System
- Contacts created from BulkCertificate generation
- Can target newsletters to contacts from specific batches/courses

### With Billing System
- Separate Stripe customers for Advertisers
- Separate invoices for ad revenue
- Can track ad revenue separately from certificate/hosting revenue

### With Newsletter System
- Ads can be embedded in newsletters via AdPlacement
- Newsletter performance affects ad visibility
- Can A/B test ad placements in newsletters

---

## Future Enhancements (Not in Schema Yet)

- **Email Template System** - Reusable newsletter templates
- **A/B Testing** - Test different subject lines, content, ad placements
- **Segmentation** - Advanced contact segmentation for targeted campaigns
- **Automation** - Automated newsletter sends based on triggers
- **Ad Rotation** - Multiple ads per placement with rotation logic
- **Ad Targeting** - Target ads based on contact preferences/course interests
- **Analytics Dashboard** - Visual reporting for campaigns and ads

---

## Notes

- All newsletter/ad fields are optional - won't break existing functionality
- Newsletter defaults to subscribed (opt-in by default)
- Ad performance tracking is manual initially (can be automated later)
- Separate billing system for ads allows independent revenue tracking
- Contacts can opt-out of newsletters while staying in database (for other uses)
