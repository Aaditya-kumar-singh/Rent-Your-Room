import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import { createPaymentIntent } from "@/services/stripeService";
import Joi from "joi";

const createIntentSchema = Joi.object({
    bookingId: Joi.string().required(),
});

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { error, value } = createIntentSchema.validate(body);

        if (error) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: error.details[0].message } },
                { status: 400 }
            );
        }

        const { bookingId } = value;

        await connectDB();

        const booking = await Booking.findById(bookingId).populate("roomId", "title");
        if (!booking) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "Booking not found" } },
                { status: 404 }
            );
        }

        // Verify ownership
        if (booking.seekerId.toString() !== session.user.id) {
            return NextResponse.json(
                { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
                { status: 403 }
            );
        }

        // Create Payment Intent
        const amountInRupees = booking.payment.amount;
        const intentResult = await createPaymentIntent(amountInRupees, "inr", {
            bookingId: bookingId,
            userId: session.user.id,
            roomTitle: booking.roomId.title,
        });

        if (!intentResult.success || !intentResult.clientSecret) {
            return NextResponse.json(
                { success: false, error: { code: "STRIPE_ERROR", message: intentResult.error } },
                { status: 500 }
            );
        }

        // Save initial payment record
        const payment = new Payment({
            bookingId: booking._id,
            userId: session.user.id,
            paymentGatewayId: intentResult.paymentIntentId,
            orderId: intentResult.paymentIntentId, // Using Intent ID as 'orderId' for schema compatibility
            amount: Math.round(amountInRupees * 100),
            currency: "INR",
            status: "created",
            gateway: "stripe", // Assuming schema allows this or we might need to add it key
        });

        await payment.save();

        // Update booking
        booking.payment.orderId = intentResult.paymentIntentId;
        booking.payment.status = "pending";
        booking.payment.gateway = "stripe"; // Store gateway used
        await booking.save();

        return NextResponse.json({
            success: true,
            data: {
                clientSecret: intentResult.clientSecret,
                publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
            },
        });
    } catch (error: any) {
        console.error("Error creating payment intent:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: error.message } },
            { status: 500 }
        );
    }
}
