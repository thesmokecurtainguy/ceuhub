# Bulk Certificate Upload & Generation - Testing Guide

## Overview
This guide will help you test the Track 2 (Rep/Presenter) CSV bulk certificate upload and automatic email sending functionality.

## Prerequisites
1. **Environment Variables** (check `.env.local`):
   - `RESEND_API_KEY` - Required for sending emails
   - `RESEND_FROM_EMAIL` - Email address for sending (e.g., `"Your Org <noreply@yourdomain.com>"`)
   - `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token
   - `DATABASE_URL` - PostgreSQL connection string

2. **Database Setup**:
   - Run migrations: `npx prisma migrate dev`
   - Ensure you have at least one organization created
   - Ensure you have at least one course created for that organization

3. **User Setup**:
   - Log in as a user with `admin` or `rep` role in an organization

## Testing Steps

### Step 1: Navigate to Upload Page
1. Go to: `/org/[your-org-id]/certificates/upload`
2. You should see:
   - Course selection dropdown
   - File upload input
   - "Download Template" button
   - Upload button

### Step 2: Download Template CSV
1. Click "Download Template"
2. Open the downloaded CSV file
3. Verify it has these columns:
   - `Full Name`
   - `Email`
   - `AIA Number` (optional)
   - `Presentation Date` (format: MM/DD/YYYY)
   - `Presenter Name`
   - `Location`

### Step 3: Prepare Test CSV
Create a CSV file with at least 2-3 test rows:
```csv
Full Name,Email,AIA Number,Presentation Date,Presenter Name,Location
John Doe,john.doe@example.com,12345,02/15/2026,Jane Smith,New York Office
Jane Smith,jane.smith@example.com,,02/15/2026,Jane Smith,New York Office
```

**Important Notes:**
- Use your own email addresses for testing (or use test email services)
- Date format must be MM/DD/YYYY
- All required fields must be filled (AIA Number is optional)

### Step 4: Upload CSV
1. Select a course from the dropdown
2. Click "Choose File" and select your CSV
3. Click "Upload"
4. You should see:
   - Success message with number of certificates created
   - Any validation errors if present

### Step 5: Verify Upload
1. Navigate to `/org/[your-org-id]/certificates`
2. You should see:
   - A new batch entry
   - Status should show "completed" (for upload)
   - Number of successful/failed rows

### Step 6: Check Certificate Generation
The system automatically triggers certificate generation after upload. Check:

1. **Database** (optional - using Prisma Studio):
   ```bash
   npx prisma studio
   ```
   - Check `BulkCertificate` table - `certificateUrl` should be populated
   - Check `Certificate` table - new records should be created
   - Check `BulkCertificate.emailedToAttendeeAt` - should have timestamp

2. **Email Inbox**:
   - Check the email addresses you used in the CSV
   - You should receive emails with PDF attachments
   - Email subject: "Congratulations! Your AIA Certificate - [Course Title]"

### Step 7: Manual Generation (if needed)
If automatic generation didn't work, you can manually trigger it:

1. Get the `batchId` from the certificates page
2. Make a POST request to:
   ```
   POST /api/organizations/[org-id]/certificates/generate
   Body: { "batchId": "[batch-id]" }
   ```

## Troubleshooting

### Issue: "No pending certificates to generate"
- **Cause**: Certificates already have `certificateUrl` set
- **Solution**: Check if certificates were already generated

### Issue: Email not sending
- **Check**: `RESEND_API_KEY` is set correctly
- **Check**: `RESEND_FROM_EMAIL` is verified in Resend dashboard
- **Check**: Email addresses are valid
- **Check**: Server logs for errors

### Issue: PDF generation fails
- **Check**: `BLOB_READ_WRITE_TOKEN` is set
- **Check**: Course has all required fields (learningUnits, learningUnitsType, etc.)
- **Check**: Server logs for specific errors

### Issue: CSV validation errors
- **Check**: All required columns are present
- **Check**: Date format is MM/DD/YYYY
- **Check**: Email addresses are valid format
- **Check**: No more than 100 rows per upload

## Expected Behavior

1. **Upload**: CSV is parsed, validated, and records are created
2. **Generation**: PDFs are generated automatically (async)
3. **Email**: Emails are sent with PDF attachments
4. **Database**: 
   - `BulkCertificate` records created
   - `Contact` records upserted (for marketing)
   - `Certificate` records created
   - `User` and `Enrollment` records created if needed

## Next Steps for Stripe Integration

Once testing is complete:
1. Add Stripe payment processing before certificate generation
2. Charge $0.99 per certificate
3. Track payments in database
4. Only generate certificates after successful payment

## Support

If you encounter issues:
1. Check server logs (`npm run dev` terminal)
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Check database for data consistency
