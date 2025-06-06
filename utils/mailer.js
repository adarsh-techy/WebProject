const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

exports.sendBookingConfirmation = async (email, bookingDetails) => {
  const mailOptions = {
    from: `EventHub <${process.env.EMAIL_USERNAME}>`,
    to: email,
    subject: `Booking Confirmation: ${bookingDetails.eventName}`,
    text: generateTextMessage(bookingDetails),
    html: generateHtmlMessage(bookingDetails),
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

function generateTextMessage(booking) {
  return `
    Booking Confirmed

Event: ${booking.eventName}
Date: ${booking.eventDate}
Venue: ${booking.venue}
Tickets: ${booking.quantity} x ${booking.ticketPrice}
Total: ${booking.totalPrice}

BookingRef: ${booking.bookingRef}

present this qr code at the venue for entry:${booking.qrCodeUrl}
    `;
}

function generateHtmlEmail(booking) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #e50914;">🎟 Your Booking is Confirmed!</h2>
    
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
      <h3>${booking.eventName}</h3>
      <p><strong>Date:</strong> ${booking.eventDate}</p>
      <p><strong>Venue:</strong> ${booking.venue}</p>
      
      <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 5px;">
        <p>Tickets: ${booking.quantity} x $${booking.ticketPrice}</p>
        <p><strong>Total:</strong> $${booking.totalPrice}</p>
        <p>Reference: ${booking.bookingRef}</p>
      </div>
      
      <p>Present your QR code at the venue for entry:</p>
      <img src="${booking.qrCodeUrl}" alt="QR Code" style="max-width: 150px;">
    </div>
    
    <p style="margin-top: 20px;">Need help? Contact us at support@eventhub.com</p>
  </div>
  `;
}
