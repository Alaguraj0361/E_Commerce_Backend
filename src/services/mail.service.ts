import { sendEmail } from '../config/mail.js';
import { ENV } from '../config/env.js';

const BRAND_NAME = 'NALMARA FASHION';
const STORE_ADDRESS = 'Q4R8+3FC, 3rd Mile, Near Bus Stop, Thoothukudi, Tamil Nadu, 628008';
const STORE_PHONE = '+91 78712 07631';
const STORE_EMAIL = 'nalmarafashion@gmail.com';
const SITE_URL = ENV.FRONTEND_URL || 'https://nalmarafashion.vercel.app';

// Reusable Royal Email Header & Footer Shell
function getEmailShell(title: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #23120B; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container (600px Max) -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFDF9; border: 1.5px solid #D4AF37; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(56, 7, 37, 0.08);">
          
          <!-- Grand Royal Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #54013F 0%, #760159 50%, #3B012C 100%); padding: 32px 24px; text-align: center; border-bottom: 2px solid #D4AF37;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; padding: 4px 16px; border-radius: 20px; background: rgba(0,0,0,0.3); border: 1px solid #FFE59E; color: #FFE59E; font-size: 10px; font-weight: bold; letter-spacing: 0.2em; text-transform: uppercase;">
                      ✦ THOOTHUKUDI BOUTIQUE ✦
                    </span>
                    <h1 style="margin: 12px 0 4px 0; color: #FFFDF9; font-size: 26px; font-family: 'Georgia', serif; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase;">
                      NALMARA FASHION
                    </h1>
                    <p style="margin: 0; color: #FFE59E; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;">
                      Tradition Woven in Elegance • Pure Silk & Couture
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Email Body Content -->
          <tr>
            <td style="padding: 32px 28px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Royal Luxury Footer -->
          <tr>
            <td style="background-color: #280619; padding: 24px; text-align: center; border-top: 1.5px solid #D4AF37; color: #FFE59E;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="font-size: 12px; line-height: 1.6; color: #FAF0DD;">
                    <p style="margin: 0 0 6px 0; font-weight: bold; color: #FFE59E; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em;">
                      ${BRAND_NAME}
                    </p>
                    <p style="margin: 0 0 8px 0; color: #EDE3D2; font-size: 11.5px;">
                      📍 ${STORE_ADDRESS}
                    </p>
                    <p style="margin: 0 0 12px 0; color: #EDE3D2; font-size: 11.5px;">
                      📞 WhatsApp / Phone: <a href="tel:${STORE_PHONE}" style="color: #FFE59E; text-decoration: none;">${STORE_PHONE}</a> | ✉️ Email: <a href="mailto:${STORE_EMAIL}" style="color: #FFE59E; text-decoration: none;">${STORE_EMAIL}</a>
                    </p>
                    <p style="margin: 0; font-size: 10.5px; color: #BC9E65;">
                      © ${new Date().getFullYear()} NALMARA FASHION. All rights reserved. Handpicked Kanchipuram Silks & Atelier Tailoring.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// ============================================================================
// 1. WELCOME EMAIL (New User Registration)
// ============================================================================
export async function sendWelcomeEmail(user: {
  firstName: string;
  lastName?: string;
  email: string;
}): Promise<void> {
  const customerName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Valued Patron';
  const shopUrl = `${SITE_URL}/shop`;
  const accountUrl = `${SITE_URL}/account`;

  const html = getEmailShell(
    'Welcome to NALMARA FASHION',
    `
      <h2 style="font-family: 'Georgia', serif; font-size: 20px; color: #760159; margin-top: 0; margin-bottom: 12px;">
        Vanakkam &amp; Welcome, ${customerName}! 🌸
      </h2>
      <p style="font-size: 14px; line-height: 1.6; color: #4A3B2C; margin-bottom: 16px;">
        Thank you for joining the <strong>NALMARA FASHION</strong> family. We are delighted to welcome you to our curated sanctuary of authentic handwoven Kanchipuram silks, festive drapes, designer blouses, and custom tailoring.
      </p>

      <!-- Highlight Box -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF3E6; border: 1px solid #D4AF37; border-radius: 12px; margin: 20px 0; padding: 18px;">
        <tr>
          <td>
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #760159;">
              ✦ WHAT AWAITS YOU AT NALMARA
            </p>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #5C4934; line-height: 1.7;">
              <li><strong>Pure Zari Sarees:</strong> Kanchivaram, Semi-Kanchivaram &amp; Chettinad Cottons.</li>
              <li><strong>Bespoke Stitching:</strong> Master Aari bridal embroidery &amp; custom-fit blouse tailoring.</li>
              <li><strong>Fast Tamil Nadu Delivery:</strong> Dispatched from our Thoothukudi boutique in 24–48 hours.</li>
              <li><strong>WhatsApp Concierge:</strong> Live HD saree drape photos and custom sizing assistance.</li>
            </ul>
          </td>
        </tr>
      </table>

      <!-- Member Details -->
      <p style="font-size: 13px; color: #6E5A44; line-height: 1.5; margin-bottom: 24px;">
        Your registered email: <strong style="color: #23120B;">${user.email}</strong><br>
        You can track orders, save dream sarees to your wishlist, and manage delivery addresses in your account dashboard.
      </p>

      <!-- Action Button -->
      <div style="text-align: center; margin: 30px 0 10px 0;">
        <a href="${shopUrl}" style="display: inline-block; background: linear-gradient(135deg, #760159 0%, #940270 100%); color: #FFE59E; text-decoration: none; font-size: 13px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; padding: 14px 32px; border-radius: 50px; border: 1px solid #D4AF37; box-shadow: 0 4px 15px rgba(118, 1, 89, 0.3);">
          Explore Handpicked Collections →
        </a>
      </div>
    `
  );

  const text = `Vanakkam & Welcome to NALMARA FASHION, ${customerName}!\n\nThank you for creating an account with us. Your registered email is: ${user.email}.\n\nExplore our handpicked Kanchipuram silk sarees, bespoke stitching atelier, and festive couture at: ${shopUrl}\n\nStore Address: ${STORE_ADDRESS}\nWhatsApp Assistance: ${STORE_PHONE}`;

  await sendEmail({
    to: user.email,
    subject: 'Vanakkam & Welcome to NALMARA FASHION • Tradition Woven in Elegance',
    text,
    html,
  });
}

// ============================================================================
// 2. CHANGE PASSWORD / SECURITY ALERT EMAIL
// ============================================================================
export async function sendPasswordChangedEmail(user: {
  firstName: string;
  email: string;
}): Promise<void> {
  const customerName = user.firstName || 'Valued Patron';
  const timestamp = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const resetUrl = `${SITE_URL}/forgot-password`;

  const html = getEmailShell(
    'Password Updated - NALMARA FASHION',
    `
      <h2 style="font-family: 'Georgia', serif; font-size: 20px; color: #760159; margin-top: 0; margin-bottom: 12px;">
        Security Notice: Password Updated
      </h2>
      <p style="font-size: 14px; line-height: 1.6; color: #4A3B2C; margin-bottom: 16px;">
        Hello ${customerName},
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #4A3B2C; margin-bottom: 16px;">
        Your <strong>NALMARA FASHION</strong> account password was successfully updated on <strong>${timestamp} (IST)</strong>.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF0F5; border-left: 4px solid #760159; border-radius: 4px; margin: 20px 0; padding: 14px 18px;">
        <tr>
          <td style="font-size: 13px; color: #450035; line-height: 1.5;">
            <strong>Did you make this change?</strong><br>
            If you changed your password, you can safely disregard this confirmation email.
          </td>
        </tr>
      </table>

      <p style="font-size: 13px; line-height: 1.6; color: #8C1C13; margin-bottom: 24px;">
        ⚠️ <strong>If you did not perform this action</strong>, someone else may have gained access to your account. Please reset your password immediately and contact our concierge support:
      </p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" style="display: inline-block; background-color: #760159; color: #FFFDF9; text-decoration: none; font-size: 12px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; padding: 12px 28px; border-radius: 50px; border: 1px solid #D4AF37;">
          Secure My Account Immediately →
        </a>
      </div>
    `
  );

  const text = `Hello ${customerName},\n\nYour NALMARA FASHION account password was changed on ${timestamp} (IST).\n\nIf you did this, no further action is needed.\nIf you did NOT authorize this change, please reset your password immediately at: ${resetUrl}\n\nSupport: ${STORE_EMAIL} | ${STORE_PHONE}`;

  await sendEmail({
    to: user.email,
    subject: 'Security Alert: Password Changed Successfully • NALMARA FASHION',
    text,
    html,
  });
}

// ============================================================================
// 3. FORGOT PASSWORD / PASSWORD RESET REQUEST EMAIL
// ============================================================================
export async function sendPasswordResetEmail(
  user: { firstName: string; email: string },
  resetUrl: string
): Promise<void> {
  const customerName = user.firstName || 'Valued Patron';

  const html = getEmailShell(
    'Password Reset Request - NALMARA FASHION',
    `
      <h2 style="font-family: 'Georgia', serif; font-size: 20px; color: #760159; margin-top: 0; margin-bottom: 12px;">
        Password Reset Request
      </h2>
      <p style="font-size: 14px; line-height: 1.6; color: #4A3B2C; margin-bottom: 16px;">
        Hello ${customerName},
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #4A3B2C; margin-bottom: 20px;">
        We received a request to reset the password associated with your NALMARA FASHION account (<strong>${user.email}</strong>). Click the golden button below to choose a new password:
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #760159 0%, #940270 100%); color: #FFE59E; text-decoration: none; font-size: 13px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; padding: 14px 32px; border-radius: 50px; border: 1px solid #D4AF37; box-shadow: 0 4px 15px rgba(118, 1, 89, 0.3);">
          Reset My Password →
        </a>
      </div>

      <p style="font-size: 12px; line-height: 1.6; color: #7A6651; margin-top: 20px;">
        Or copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: #760159; word-break: break-all;">${resetUrl}</a>
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF3E6; border: 1px solid #D4AF37; border-radius: 8px; margin: 24px 0 0 0; padding: 14px;">
        <tr>
          <td style="font-size: 12px; color: #5C4934; line-height: 1.5;">
            ⏳ <strong>Security Note:</strong> This link is single-use and will automatically expire in <strong>1 hour</strong>. If you did not request this reset, your account remains secure and no action is required.
          </td>
        </tr>
      </table>
    `
  );

  const text = `Hello ${customerName},\n\nYou requested a password reset for your NALMARA FASHION account.\n\nClick the link below to set a new password:\n${resetUrl}\n\nThis link will expire in 1 hour.\nIf you did not make this request, you can safely ignore this email.`;

  await sendEmail({
    to: user.email,
    subject: 'Password Reset Request • NALMARA FASHION',
    text,
    html,
  });
}

// ============================================================================
// 4. ORDER PLACED / CONFIRMATION EMAIL
// ============================================================================
export async function sendOrderPlacedEmail(
  order: any,
  customerEmail?: string
): Promise<void> {
  const recipient = customerEmail || order.shippingAddress?.email || order.user?.email;
  if (!recipient) {
    console.warn('[Mail Service] Cannot send Order Placed email: No recipient email found for order', order.orderNumber);
    return;
  }

  const customerName = order.shippingAddress?.fullName || order.user?.firstName || 'Valued Patron';
  const trackUrl = `${SITE_URL}/track-order?id=${order.orderNumber}`;
  const paymentMethodLabel = order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : order.paymentMethod?.toUpperCase() || 'Prepaid Online';

  // Build items rows
  const itemsHtml = (order.items || [])
    .map(
      (item: any) => `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #EAE1D1; font-size: 13px; color: #23120B;">
            <strong>${item.name}</strong>
            ${item.sku ? `<br><span style="font-size: 10.5px; color: #7A6651;">SKU: ${item.sku}</span>` : ''}
          </td>
          <td align="center" style="padding: 12px 8px; border-bottom: 1px solid #EAE1D1; font-size: 13px; color: #5C4934;">
            ${item.quantity}
          </td>
          <td align="right" style="padding: 12px 8px; border-bottom: 1px solid #EAE1D1; font-size: 13px; font-weight: bold; color: #760159;">
            ₹${Number(item.price * item.quantity).toLocaleString('en-IN')}
          </td>
        </tr>
      `
    )
    .join('');

  const shippingAddr = order.shippingAddress;
  const addressStr = shippingAddr
    ? `${shippingAddr.addressLine1}${shippingAddr.addressLine2 ? ', ' + shippingAddr.addressLine2 : ''}, ${shippingAddr.city}, ${shippingAddr.state} - ${shippingAddr.postalCode}. Phone: ${shippingAddr.phone}`
    : 'Provided at checkout';

  const html = getEmailShell(
    `Order Confirmed: #${order.orderNumber}`,
    `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; padding: 6px 18px; border-radius: 50px; background-color: #FAF0F5; border: 1.5px solid #760159; color: #760159; font-size: 11px; font-weight: bold; letter-spacing: 0.15em; text-transform: uppercase;">
          ✓ Order Confirmed &amp; Dispatched Soon
        </span>
        <h2 style="font-family: 'Georgia', serif; font-size: 22px; color: #280619; margin: 12px 0 4px 0;">
          Thank You For Your Order, ${customerName}!
        </h2>
        <p style="margin: 0; font-size: 13px; color: #6E5A44;">
          Order Reference: <strong style="color: #760159; font-family: monospace; font-size: 14px;">#${order.orderNumber}</strong>
        </p>
      </div>

      <p style="font-size: 13.5px; line-height: 1.6; color: #4A3B2C; margin-bottom: 20px;">
        We have received your order at our <strong>Thoothukudi boutique</strong>. Our master weavers and quality inspectors are carefully packaging your parcel for express doorstep delivery.
      </p>

      <!-- Order Summary Table -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0; border: 1px solid #D4AF37; border-radius: 10px; overflow: hidden;">
        <thead>
          <tr style="background-color: #760159; color: #FFE59E;">
            <th align="left" style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">Item</th>
            <th align="center" style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">Qty</th>
            <th align="right" style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" align="right" style="padding: 8px 12px 4px 8px; font-size: 12px; color: #5C4934;">Subtotal:</td>
            <td align="right" style="padding: 8px 12px 4px 8px; font-size: 12px; color: #23120B;">₹${Number(order.subtotal || order.total).toLocaleString('en-IN')}</td>
          </tr>
          ${
            order.discount > 0
              ? `<tr>
                  <td colspan="2" align="right" style="padding: 4px 12px; font-size: 12px; color: #166534;">Coupon Discount (${order.couponCode || 'APPLIED'}):</td>
                  <td align="right" style="padding: 4px 12px; font-size: 12px; color: #166534;">-₹${Number(order.discount).toLocaleString('en-IN')}</td>
                </tr>`
              : ''
          }
          <tr>
            <td colspan="2" align="right" style="padding: 4px 12px; font-size: 12px; color: #5C4934;">Shipping Fee:</td>
            <td align="right" style="padding: 4px 12px; font-size: 12px; color: #23120B;">
              ${order.shippingFee === 0 || !order.shippingFee ? '<span style="color: #166534; font-weight: bold;">FREE</span>' : '₹' + Number(order.shippingFee).toLocaleString('en-IN')}
            </td>
          </tr>
          <tr style="background-color: #FAF3E6;">
            <td colspan="2" align="right" style="padding: 12px; font-size: 14px; font-weight: bold; color: #760159; border-top: 1.5px solid #D4AF37;">Grand Total:</td>
            <td align="right" style="padding: 12px; font-size: 16px; font-weight: 900; color: #760159; border-top: 1.5px solid #D4AF37;">₹${Number(order.total).toLocaleString('en-IN')}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Delivery & Payment Meta Cards -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
        <tr>
          <td width="50%" valign="top" style="background-color: #FAF7F2; padding: 14px; border-radius: 8px; border: 1px solid #EAE1D1;">
            <strong style="color: #760159; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 6px;">
              📍 Delivery Address:
            </strong>
            <span style="font-size: 12px; color: #4A3B2C; line-height: 1.5;">${addressStr}</span>
          </td>
          <td width="6%"></td>
          <td width="44%" valign="top" style="background-color: #FAF7F2; padding: 14px; border-radius: 8px; border: 1px solid #EAE1D1;">
            <strong style="color: #760159; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 6px;">
              💳 Payment Method:
            </strong>
            <span style="font-size: 12px; color: #4A3B2C; line-height: 1.5;">${paymentMethodLabel}</span>
          </td>
        </tr>
      </table>

      <!-- Track Button -->
      <div style="text-align: center; margin: 32px 0 10px 0;">
        <a href="${trackUrl}" style="display: inline-block; background: linear-gradient(135deg, #760159 0%, #940270 100%); color: #FFE59E; text-decoration: none; font-size: 13px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; padding: 14px 34px; border-radius: 50px; border: 1px solid #D4AF37; box-shadow: 0 4px 15px rgba(118, 1, 89, 0.3);">
          Track Your Live Delivery →
        </a>
      </div>
    `
  );

  const text = `Thank you for your order, ${customerName}!\n\nOrder Number: #${order.orderNumber}\nTotal Amount: ₹${Number(order.total).toLocaleString('en-IN')}\nPayment: ${paymentMethodLabel}\n\nTrack your parcel anytime at: ${trackUrl}\n\nStore Address: ${STORE_ADDRESS}\nWhatsApp Support: ${STORE_PHONE}`;

  await sendEmail({
    to: recipient,
    subject: `Order Confirmed: #${order.orderNumber} • NALMARA FASHION`,
    text,
    html,
  });
}

// ============================================================================
// 5. ORDER STATUS UPDATE EMAIL
// ============================================================================
export async function sendOrderStatusUpdateEmail(
  order: any,
  newStatus: string,
  note?: string,
  trackingNumber?: string,
  customerEmail?: string
): Promise<void> {
  const recipient = customerEmail || order.shippingAddress?.email || order.user?.email;
  if (!recipient) {
    console.warn('[Mail Service] Cannot send Order Status Update email: No recipient email found for order', order.orderNumber);
    return;
  }

  const customerName = order.shippingAddress?.fullName || order.user?.firstName || 'Valued Patron';
  const trackUrl = `${SITE_URL}/track-order?id=${order.orderNumber}`;
  const effectiveTracking = trackingNumber || order.trackingNumber;

  // Status-specific badges & descriptions
  let statusBadgeColor = '#760159';
  let statusBadgeBg = '#FAF0F5';
  let statusHeading = `Your Order #${order.orderNumber} has been updated to: ${newStatus}`;
  let statusMessage = note || `Your order status has been updated to ${newStatus}.`;

  switch (newStatus) {
    case 'Processing':
      statusHeading = `Your Order #${order.orderNumber} is Being Handcrafted &amp; Prepared`;
      statusMessage = note || 'Our artisans and store team in Thoothukudi are carefully preparing, steaming, and quality inspecting your saree and outfits.';
      break;
    case 'Packed':
      statusHeading = `Your Parcel is Safely Packed &amp; Ready for Courier Handover`;
      statusMessage = note || 'Your items have been safely packed in our signature moisture-proof royal packaging with quality seals intact.';
      break;
    case 'Shipped':
      statusBadgeColor = '#166534';
      statusBadgeBg = '#F0FDF4';
      statusHeading = `Your Order #${order.orderNumber} is On the Way! 🚚`;
      statusMessage = note || 'Your parcel has been handed over to our courier partner and is traveling to your delivery address.';
      break;
    case 'Delivered':
      statusBadgeColor = '#15803D';
      statusBadgeBg = '#DCFCE7';
      statusHeading = `Your Parcel Has Been Delivered! 🌸`;
      statusMessage = note || 'Your NALMARA FASHION parcel has been successfully delivered. We hope you adore your new attire!';
      break;
    case 'Cancelled':
      statusBadgeColor = '#991B1B';
      statusBadgeBg = '#FEF2F2';
      statusHeading = `Order #${order.orderNumber} Cancellation Notice`;
      statusMessage = note || 'This order has been cancelled. If any online payment was made, your refund will be processed back to your original source.';
      break;
  }

  const html = getEmailShell(
    `Order Update: #${order.orderNumber} is ${newStatus}`,
    `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; padding: 6px 18px; border-radius: 50px; background-color: ${statusBadgeBg}; border: 1.5px solid ${statusBadgeColor}; color: ${statusBadgeColor}; font-size: 11px; font-weight: bold; letter-spacing: 0.15em; text-transform: uppercase;">
          ● Current Status: ${newStatus}
        </span>
        <h2 style="font-family: 'Georgia', serif; font-size: 20px; color: #280619; margin: 14px 0 6px 0;">
          ${statusHeading}
        </h2>
        <p style="margin: 0; font-size: 13px; color: #6E5A44;">
          Order Reference: <strong style="color: #760159; font-family: monospace; font-size: 14px;">#${order.orderNumber}</strong>
        </p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #4A3B2C; margin-bottom: 20px;">
        Dear ${customerName},<br><br>
        ${statusMessage}
      </p>

      ${
        effectiveTracking
          ? `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF3E6; border: 1.5px solid #D4AF37; border-radius: 12px; margin: 20px 0; padding: 18px; text-align: center;">
              <tr>
                <td>
                  <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: bold; color: #760159; text-transform: uppercase; letter-spacing: 0.15em;">
                    📦 Courier Tracking Reference
                  </p>
                  <p style="margin: 0 0 6px 0; font-family: monospace; font-size: 16px; font-weight: bold; color: #23120B; letter-spacing: 0.08em;">
                    ${effectiveTracking}
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #6E5A44;">
                    Dispatched from Thoothukudi via Express Partner
                  </p>
                </td>
              </tr>
            </table>
          `
          : ''
      }

      <div style="text-align: center; margin: 32px 0 10px 0;">
        <a href="${trackUrl}" style="display: inline-block; background: linear-gradient(135deg, #760159 0%, #940270 100%); color: #FFE59E; text-decoration: none; font-size: 13px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; padding: 14px 34px; border-radius: 50px; border: 1px solid #D4AF37; box-shadow: 0 4px 15px rgba(118, 1, 89, 0.3);">
          View Live Tracking →
        </a>
      </div>
    `
  );

  const text = `Order Update for #${order.orderNumber}:\n\nStatus: ${newStatus}\n${statusMessage}\n${effectiveTracking ? `Tracking Number: ${effectiveTracking}\n` : ''}\nTrack online at: ${trackUrl}\n\nStore Address: ${STORE_ADDRESS}\nSupport Phone / WhatsApp: ${STORE_PHONE}`;

  await sendEmail({
    to: recipient,
    subject: `Order Update: #${order.orderNumber} is now ${newStatus} • NALMARA FASHION`,
    text,
    html,
  });
}
