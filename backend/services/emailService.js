const nodemailer = require('nodemailer');

// Initialize Nodemailer Transporter with Gmail SMTP credentials
function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn('⚠️  EMAIL_USER or EMAIL_PASS not configured in .env. Email dispatch skipped.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.trim(),
      pass: pass.trim()
    }
  });
}

/**
 * Send HTML Slot Booking Confirmation Email to Patient
 */
async function sendBookingConfirmationEmail({ appointment, clinic, doctor }) {
  try {
    const rawPatientEmail = (appointment.patientEmail || appointment.email || '').trim();
    const clinicEmail = (process.env.EMAIL_USER || '').trim();
    
    // Primary recipient is patient if provided, otherwise clinic front desk
    const toEmail = rawPatientEmail || clinicEmail;
    if (!toEmail) {
      console.log(`ℹ️ No patient or clinic email configured. Confirmation email skipped.`);
      return { success: false, reason: 'no_email' };
    }

    const transporter = createTransporter();
    if (!transporter) return { success: false, reason: 'smtp_not_configured' };

    const clinicName = clinic?.name || 'Sanjeevani Multispeciality Clinic';
    const clinicAddress = clinic?.address || 'City Center Arcade, Vijayanagar, Mysuru';
    const clinicPhone = clinic?.phone || '+91 98450 12345';
    const doctorName = doctor?.name || appointment.doctorName || 'Consultant Specialist';
    const doctorSpeciality = doctor?.speciality || 'General Medicine / Specialist';
    const tokenNo = appointment.tokenNo || 'T-XX';
    const timeSlot = appointment.timeSlot || 'Scheduled Slot';
    const date = appointment.date || new Date().toISOString().split('T')[0];

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
          .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
          .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 0; font-size: 13px; opacity: 0.9; }
          .token-box { background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 12px; padding: 18px; text-align: center; margin: 24px; }
          .token-title { font-size: 11px; text-transform: uppercase; font-weight: 800; color: #15803d; letter-spacing: 1px; }
          .token-number { font-size: 36px; font-weight: 900; color: #166534; margin: 6px 0; }
          .token-sub { font-size: 12px; color: #15803d; font-weight: 600; }
          .details { padding: 0 24px 24px 24px; }
          .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .label { color: #64748b; font-weight: 600; }
          .value { color: #0f172a; font-weight: 700; text-align: right; }
          .instructions { background: #f8fafc; border-left: 4px solid #0d9488; padding: 14px 18px; margin: 20px 24px; border-radius: 4px; font-size: 12px; color: #334155; line-height: 1.6; }
          .footer { background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>Appointment Confirmed!</h1>
            <p>${clinicName} • Automated Booking System</p>
          </div>

          <div class="token-box">
            <div class="token-title">Your Live Queue Token</div>
            <div class="token-number">${tokenNo}</div>
            <div class="token-sub">Time Slot: ${timeSlot} (${date})</div>
          </div>

          <div class="details">
            <div class="row">
              <span class="label">Patient Name</span>
              <span class="value">${appointment.patientName}</span>
            </div>
            <div class="row">
              <span class="label">Patient Contact</span>
              <span class="value">${appointment.patientPhone}</span>
            </div>
            <div class="row">
              <span class="label">Consulting Doctor</span>
              <span class="value">${doctorName}</span>
            </div>
            <div class="row">
              <span class="label">Speciality</span>
              <span class="value">${doctorSpeciality}</span>
            </div>
            <div class="row">
              <span class="label">Reported Symptoms</span>
              <span class="value">${appointment.symptoms || 'General Checkup'}</span>
            </div>
            <div class="row">
              <span class="label">Clinic Address</span>
              <span class="value">${clinicAddress}</span>
            </div>
            <div class="row">
              <span class="label">Front Desk Phone</span>
              <span class="value">${clinicPhone}</span>
            </div>
          </div>

          <div class="instructions">
            <strong>Arrival Notice:</strong> Please reach the clinic 10 minutes prior to your allocated slot <strong>${timeSlot}</strong>. Show this confirmation email or present Token <strong>${tokenNo}</strong> at the reception counter.
          </div>

          <div class="footer">
            This is an automated confirmation sent on behalf of <strong>${clinicName}</strong> via OpsLoop Health Automation.<br>
            If you need to reschedule or cancel, please contact the front desk at ${clinicPhone}.
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"${clinicName}" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Confirmed: Token ${tokenNo} for ${appointment.patientName} with ${doctorName} at ${clinicName}`,
      html: htmlContent
    };

    // If patient provided an email, also CC the clinic front desk so the hospital receives it
    if (rawPatientEmail && clinicEmail && rawPatientEmail.toLowerCase() !== clinicEmail.toLowerCase()) {
      mailOptions.cc = clinicEmail;
    }

    const info = await transporter.sendMail(mailOptions);

    console.log(`📧 Slot confirmation email successfully delivered to ${toEmail} (CC: ${mailOptions.cc || 'none'}) (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('⚠️  Failed to send booking confirmation email:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send Welcome / Registration Email when a Doctor, Owner, or Graduate signs up
 */
async function sendRegistrationWelcomeEmail({ user, roleName, portalUrl }) {
  try {
    if (!user?.email) return { success: false, reason: 'no_email' };

    const transporter = createTransporter();
    if (!transporter) return { success: false, reason: 'smtp_not_configured' };

    const roleTitleMap = {
      doctor: 'Doctor Specialist',
      business_owner: 'Clinic Owner / Director',
      graduate: 'Graduate Operations Specialist',
      admin: 'Platform Administrator'
    };

    const displayRole = roleTitleMap[user.role] || roleName || 'Specialist';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }
          .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
          .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 800; }
          .body { padding: 24px; font-size: 13px; color: #334155; line-height: 1.6; }
          .role-badge { display: inline-block; background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 9999px; font-weight: 700; font-size: 11px; text-transform: uppercase; margin-bottom: 16px; }
          .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          .info-table td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
          .info-table td.label { font-weight: 600; color: #64748b; width: 40%; }
          .info-table td.val { font-weight: 700; color: #0f172a; }
          .btn { display: block; text-align: center; background: #4f46e5; color: #ffffff !important; text-decoration: none; font-weight: 700; padding: 12px 24px; border-radius: 10px; margin: 24px 0 10px 0; }
          .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>Welcome to OpsLoop Platform</h1>
            <p>Your account has been successfully created</p>
          </div>
          <div class="body">
            <div class="role-badge">${displayRole}</div>
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>Welcome to OpsLoop. You have been registered as a verified <strong>${displayRole}</strong>. You now have full access to your personalized operational dashboard.</p>
            
            <table class="info-table">
              <tr>
                <td class="label">Registered Email:</td>
                <td class="val">${user.email}</td>
              </tr>
              <tr>
                <td class="label">Assigned Role:</td>
                <td class="val">${displayRole}</td>
              </tr>
              <tr>
                <td class="label">Phone:</td>
                <td class="val">${user.phone || 'Configured in profile'}</td>
              </tr>
              <tr>
                <td class="label">Account Status:</td>
                <td class="val" style="color: #16a34a;">Active &amp; Authorized</td>
              </tr>
            </table>

            ${portalUrl ? `<a href="${portalUrl}" class="btn">Enter Your Workspace</a>` : ''}

            <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
              For security, please keep your login credentials private. You can now manage queues, review incoming AI requests, and sync live schedules.
            </p>
          </div>
          <div class="footer">
            OpsLoop Autonomous Platform • Powered by Gemini AI &amp; Certified Operators
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"OpsLoop Platform" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Welcome to OpsLoop: Your ${displayRole} Account is Ready`,
      html: htmlContent
    });

    console.log(`📧 Welcome registration email sent to ${user.email} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('⚠️  Failed to send welcome registration email:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  createTransporter,
  sendBookingConfirmationEmail,
  sendRegistrationWelcomeEmail
};
