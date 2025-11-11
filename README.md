# Room Rental Platform

A comprehensive web application for property owners to list rooms and for users to search, view, and book accommodations.

## Features

- **Authentication**: Google OAuth and phone number verification
- **Room Management**: Create, edit, and manage room listings
- **Search & Discovery**: Advanced search with Google Maps integration
- **Booking System**: Secure booking with Aadhaar verification
- **Payment Integration**: Secure payment processing
- **Real-time Notifications**: Email and in-app notifications

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript, Vue.js 3 components, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with Google OAuth
- **Maps**: Google Maps JavaScript API
- **Payment**: Razorpay/Stripe integration

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- Google OAuth credentials
- Google Maps API key

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

4. Update `.env.local` with your actual API keys and database URL

5. Run the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Environment Variables

See `.env.example` for all required environment variables:

- `MONGODB_URI`: MongoDB connection string
- `NEXTAUTH_SECRET`: NextAuth.js secret key
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API key
- Payment gateway credentials (Razorpay/Stripe)
- File upload service credentials (Cloudinary)

## Project Structure

```
src/
├── app/                 # Next.js app directory
├── components/          # React components
│   └── vue/            # Vue.js components
├── lib/                # Utility libraries
├── models/             # Database models
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request
