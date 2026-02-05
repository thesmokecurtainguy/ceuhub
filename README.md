# ceuHUB

A self-paced continuing education platform where presenters can upload PDF presentations that get parsed into individual slides. Attendees progress through slides at their own pace, can watch optional presenter video overlays, take a 10-question multiple-choice quiz, and receive an automatically generated certificate upon passing (80% score).

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database:** PostgreSQL (Supabase or Neon)
- **ORM:** Prisma
- **Auth:** NextAuth.js with Email Magic Link + OAuth (Google, Apple, Facebook)
- **PDF Processing:** PDF.js or pdfjs-dist for client-side slide extraction
- **File Storage:** Vercel Blob
- **Email:** Resend
- **Certificate Generation:** puppeteer
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (Supabase or Neon recommended)
- Vercel account (for blob storage)
- Resend account (for email)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ceuhub
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in all required environment variables in `.env.local`.

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
ceuHUB/
├── app/                    # Next.js App Router pages
├── components/              # React components
├── lib/                     # Utility functions
├── prisma/                  # Prisma schema and migrations
├── types/                   # TypeScript types
└── public/                  # Static assets
```

## Environment Variables

See `.env.example` for all required environment variables.

## Database Schema

The project uses Prisma for database management. Key models include:

- `User` - User accounts
- `Course` - Course listings
- `Slide` - Individual course slides
- `Enrollment` - User course enrollments
- `Question` - Quiz questions
- `QuizAttempt` - Quiz submission records
- `Certificate` - Generated certificates
- `CompletionLog` - Completion tracking

See `prisma/schema.prisma` for full schema details.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Deployment

The project is configured for deployment on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy!

## License

[Your License Here]


