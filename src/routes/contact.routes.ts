import { Router, Request, Response } from 'express';
import { sendEmail } from '../config/mail.js';

const router = Router();

router.post('/enquiry', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, enquiryType, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required fields.',
      });
    }

    // 1. Send notification to admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL || 'support@effidoo.com',
      subject: `[EFFIDOO Enquiry] ${enquiryType || 'General'} from ${name}`,
      html: `
        <div style="font-family: serif; color: #1a1a1a; max-width: 600px; border: 1px solid #D4AF37; padding: 24px; border-radius: 12px; background: #FAF8F5;">
          <h2 style="color: #0B2518; border-bottom: 2px solid #D4AF37; padding-bottom: 8px;">New Customer Enquiry Received</h2>
          <p><strong>Customer Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>Enquiry Type:</strong> ${enquiryType || 'General'}</p>
          <p><strong>Message:</strong></p>
          <div style="background: #ffffff; padding: 16px; border-left: 4px solid #D4AF37; border-radius: 4px; font-style: italic;">
            ${message.replace(/\n/g, '<br/>')}
          </div>
          <p style="margin-top: 20px; font-size: 11px; color: #777;">Received via EFFIDOO Storefront Contact Form</p>
        </div>
      `,
    });

    // 2. Send customer acknowledgment email
    await sendEmail({
      to: email,
      subject: `Thank you for contacting EFFIDOO • We Received Your Enquiry`,
      html: `
        <div style="font-family: serif; color: #1a1a1a; max-width: 600px; border: 1px solid #D4AF37; padding: 24px; border-radius: 12px; background: #FAF8F5;">
          <h2 style="color: #0B2518; margin-bottom: 4px;">EFFIDOO COUTURE</h2>
          <p style="font-size: 11px; letter-spacing: 2px; color: #B8860B; text-transform: uppercase;">Tradition Meets Modern Royalty</p>
          <hr style="border: none; border-top: 1px solid #D4AF37; margin: 16px 0;" />
          <p>Dear ${name},</p>
          <p>Thank you for reaching out to EFFIDOO. Our bespoke styling concierge has received your enquiry regarding <strong>${enquiryType || 'our collections'}</strong>.</p>
          <p>A senior designer or dedicated stylist will review your request and get in touch with you within <strong>24 business hours</strong>.</p>
          <p>If your enquiry is urgent or you wish to schedule a private video consultation, please contact our concierge team at <strong style="color: #0B2518;">+91 78712 07631</strong>.</p>
          <br/>
          <p style="font-style: italic; color: #555;">With royal regards,<br/><strong>The EFFIDOO Concierge Team</strong></p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: 'Thank you! Your enquiry has been received. Our concierge team will reach out to you shortly.',
    });
  } catch (error) {
    console.error('[Contact Enquiry Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while submitting your enquiry. Please try again or contact us directly.',
    });
  }
});

export default router;
