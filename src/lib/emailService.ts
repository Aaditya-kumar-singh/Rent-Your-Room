import nodemailer from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface BookingNotificationData {
  ownerName: string;
  seekerName: string;
  roomTitle: string;
  roomAddress: string;
  bookingId: string;
  amount: number;
  requestDate: string;
  message?: string;
}

interface BookingResponseData {
  seekerName: string;
  ownerName: string;
  roomTitle: string;
  roomAddress: string;
  bookingId: string;
  status: "confirmed" | "cancelled";
  responseDate: string;
  ownerMessage?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const config: EmailConfig = {
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASS || "",
      },
    };

    this.transporter = nodemailer.createTransport(config);
  }

  private async sendEmail(
    to: string,
    template: EmailTemplate,
    from?: string
  ): Promise<boolean> {
    try {
      // Check if email is configured
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("Email service not configured. Missing EMAIL_USER or EMAIL_PASS environment variables.");
        console.error("Please configure email settings in .env.local file.");
        return false;
      }

      const mailOptions = {
        from: from || process.env.EMAIL_FROM || "noreply@roomrental.com",
        to,
        subject: template.subject,
        text: template.text,
        html: template.html,
      };

      console.log(`Attempting to send email to: ${to}`);
      console.log(`Email subject: ${template.subject}`);
      
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to: ${to}`);
      return true;
    } catch (error) {
      console.error("Email sending failed:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      return false;
    }
  }

  private createBookingRequestTemplate(
    data: BookingNotificationData
  ): EmailTemplate {
    const subject = `New Booking Request for ${data.roomTitle}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .booking-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Booking Request</h1>
            </div>
            <div class="content">
              <p>Hello ${data.ownerName},</p>
              <p>You have received a new booking request for your room listing.</p>
              
              <div class="booking-details">
                <h3>Booking Details</h3>
                <p><strong>Room:</strong> ${data.roomTitle}</p>
                <p><strong>Location:</strong> ${data.roomAddress}</p>
                <p><strong>Seeker:</strong> ${data.seekerName}</p>
                <p><strong>Amount:</strong> ₹${data.amount.toLocaleString()}</p>
                <p><strong>Request Date:</strong> ${data.requestDate}</p>
                <p><strong>Booking ID:</strong> ${data.bookingId}</p>
                ${
                  data.message
                    ? `<p><strong>Message:</strong> ${data.message}</p>`
                    : ""
                }
              </div>
              
              <p>Please review the booking request and respond as soon as possible.</p>
              
              <div style="text-align: center;">
                <a href="${
                  process.env.NEXTAUTH_URL
                }/dashboard" class="button">View Dashboard</a>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated message from Room Rental Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      New Booking Request
      
      Hello ${data.ownerName},
      
      You have received a new booking request for your room listing.
      
      Booking Details:
      - Room: ${data.roomTitle}
      - Location: ${data.roomAddress}
      - Seeker: ${data.seekerName}
      - Amount: ₹${data.amount.toLocaleString()}
      - Request Date: ${data.requestDate}
      - Booking ID: ${data.bookingId}
      ${data.message ? `- Message: ${data.message}` : ""}
      
      Please review the booking request and respond as soon as possible.
      
      Visit your dashboard: ${process.env.NEXTAUTH_URL}/dashboard
    `;

    return { subject, html, text };
  }

  private createBookingResponseTemplate(
    data: BookingResponseData
  ): EmailTemplate {
    const isConfirmed = data.status === "confirmed";
    const subject = `Booking ${isConfirmed ? "Confirmed" : "Cancelled"}: ${
      data.roomTitle
    }`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: ${
              isConfirmed ? "#10B981" : "#EF4444"
            }; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .booking-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking ${isConfirmed ? "Confirmed" : "Cancelled"}</h1>
            </div>
            <div class="content">
              <p>Hello ${data.seekerName},</p>
              <p>Your booking request has been ${
                isConfirmed ? "confirmed" : "cancelled"
              } by the property owner.</p>
              
              <div class="booking-details">
                <h3>Booking Details</h3>
                <p><strong>Room:</strong> ${data.roomTitle}</p>
                <p><strong>Location:</strong> ${data.roomAddress}</p>
                <p><strong>Owner:</strong> ${data.ownerName}</p>
                <p><strong>Status:</strong> ${
                  isConfirmed ? "Confirmed" : "Cancelled"
                }</p>
                <p><strong>Response Date:</strong> ${data.responseDate}</p>
                <p><strong>Booking ID:</strong> ${data.bookingId}</p>
                ${
                  data.ownerMessage
                    ? `<p><strong>Owner's Message:</strong> ${data.ownerMessage}</p>`
                    : ""
                }
              </div>
              
              ${
                isConfirmed
                  ? "<p>Congratulations! Your booking has been confirmed. You can now proceed with the next steps.</p>"
                  : "<p>We apologize that your booking request was not accepted. Please continue searching for other available rooms.</p>"
              }
              
              <div style="text-align: center;">
                <a href="${
                  process.env.NEXTAUTH_URL
                }/dashboard" class="button">View Dashboard</a>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated message from Room Rental Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Booking ${isConfirmed ? "Confirmed" : "Cancelled"}
      
      Hello ${data.seekerName},
      
      Your booking request has been ${
        isConfirmed ? "confirmed" : "cancelled"
      } by the property owner.
      
      Booking Details:
      - Room: ${data.roomTitle}
      - Location: ${data.roomAddress}
      - Owner: ${data.ownerName}
      - Status: ${isConfirmed ? "Confirmed" : "Cancelled"}
      - Response Date: ${data.responseDate}
      - Booking ID: ${data.bookingId}
      ${data.ownerMessage ? `- Owner's Message: ${data.ownerMessage}` : ""}
      
      ${
        isConfirmed
          ? "Congratulations! Your booking has been confirmed. You can now proceed with the next steps."
          : "We apologize that your booking request was not accepted. Please continue searching for other available rooms."
      }
      
      Visit your dashboard: ${process.env.NEXTAUTH_URL}/dashboard
    `;

    return { subject, html, text };
  }

  async sendBookingRequestNotification(
    ownerEmail: string,
    data: BookingNotificationData
  ): Promise<boolean> {
    const template = this.createBookingRequestTemplate(data);
    return this.sendEmail(ownerEmail, template);
  }

  async sendBookingResponseNotification(
    seekerEmail: string,
    data: BookingResponseData
  ): Promise<boolean> {
    const template = this.createBookingResponseTemplate(data);
    return this.sendEmail(seekerEmail, template);
  }

  async sendPaymentConfirmationNotification(
    ownerEmail: string,
    data: {
      ownerName: string;
      seekerName: string;
      roomTitle: string;
      bookingId: string;
      amount: number;
      paymentDate: string;
    }
  ): Promise<boolean> {
    const subject = `Payment Received for Booking ${data.bookingId}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .payment-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Received</h1>
            </div>
            <div class="content">
              <p>Hello ${data.ownerName},</p>
              <p>Great news! Payment has been received for your room booking.</p>
              
              <div class="payment-details">
                <h3>Payment Details</h3>
                <p><strong>Room:</strong> ${data.roomTitle}</p>
                <p><strong>Tenant:</strong> ${data.seekerName}</p>
                <p><strong>Amount:</strong> ₹${data.amount.toLocaleString()}</p>
                <p><strong>Payment Date:</strong> ${data.paymentDate}</p>
                <p><strong>Booking ID:</strong> ${data.bookingId}</p>
              </div>
              
              <p>The booking is now confirmed and you can prepare the room for your new tenant.</p>
              
              <div style="text-align: center;">
                <a href="${
                  process.env.NEXTAUTH_URL
                }/dashboard" class="button">View Dashboard</a>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated message from Room Rental Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Payment Received
      
      Hello ${data.ownerName},
      
      Great news! Payment has been received for your room booking.
      
      Payment Details:
      - Room: ${data.roomTitle}
      - Tenant: ${data.seekerName}
      - Amount: ₹${data.amount.toLocaleString()}
      - Payment Date: ${data.paymentDate}
      - Booking ID: ${data.bookingId}
      
      The booking is now confirmed and you can prepare the room for your new tenant.
      
      Visit your dashboard: ${process.env.NEXTAUTH_URL}/dashboard
    `;

    return this.sendEmail(ownerEmail, { subject, html, text });
  }

  async sendOTP(email: string, otp: string): Promise<boolean> {
    const subject = "Your Verification Code";
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; text-align: center; }
            .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; margin: 20px 0; padding: 10px; background: white; border-radius: 5px; display: inline-block; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verification Code</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Your verification code is:</p>
              
              <div class="otp-code">${otp}</div>
              
              <p>This code will expire in 10 minutes. Do not share this code with anyone.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Room Rental Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Your Verification Code
      
      Hello,
      
      Your verification code is: ${otp}
      
      This code will expire in 10 minutes. Do not share this code with anyone.
    `;

    return this.sendEmail(email, { subject, html, text });
  }
}

export const emailService = new EmailService();
export type { BookingNotificationData, BookingResponseData };
