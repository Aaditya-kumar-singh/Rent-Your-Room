import '@testing-library/jest-dom'
import mongoose from 'mongoose'

// Mock environment variables for testing
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id'
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
process.env.RAZORPAY_KEY_ID = 'test-razorpay-key'
process.env.RAZORPAY_KEY_SECRET = 'test-razorpay-secret'

// Mock the MongoDB connection to avoid multiple connection issues
jest.mock('./src/lib/mongodb', () => {
    return jest.fn().mockResolvedValue(true)
})

// Close mongoose connection after all tests
afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close()
    }
})