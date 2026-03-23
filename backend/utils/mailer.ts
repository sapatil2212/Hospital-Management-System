import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USERNAME || process.env.SMTP_USER,
    pass: process.env.EMAIL_PASSWORD || process.env.SMTP_PASS,
  },
});

export const sendDoctorCredentials = async (opts: {
  to: string;
  name: string;
  email: string;
  password: string;
  hospitalName: string;
  loginUrl: string;
}) => {
  await transporter.sendMail({
    from: `"${opts.hospitalName}" <${process.env.EMAIL_USERNAME || process.env.SMTP_USER}>`,
    to: opts.to,
    subject: `Your Doctor Portal Credentials – ${opts.hospitalName}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Doctor Portal Credentials</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #f3f4f6;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">${opts.hospitalName}</p>
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#111827;">Doctor Portal Access</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <h2 style="margin:0 0 12px;font-size:16px;color:#111827;font-weight:600;">Welcome, Dr. ${opts.name}!</h2>
              <p style="margin:0 0 24px;font-size:14px;color:#4b5563;line-height:1.6;">
                Your doctor account has been successfully created. You can use the credentials below to log in to the hospital management system.
              </p>
              
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:28px;">
                <p style="margin:0 0 10px;font-size:13px;color:#6b7280;"><strong>Email Address:</strong> <span style="color:#111827;">${opts.email}</span></p>
                <p style="margin:0;font-size:13px;color:#6b7280;"><strong>Temporary Password:</strong> <code style="padding:4px 8px;background:#fff;border:1px solid #d1d5db;border-radius:4px;color:#111827;font-family:monospace;">${opts.password}</code></p>
              </div>

              <a href="${opts.loginUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Sign in to Portal →</a>
              
              <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.5;">
                For your security, please change your password as soon as you log in for the first time.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px 24px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;font-size:12px;color:#d1d5db;">© ${new Date().getFullYear()} ${opts.hospitalName} · Automated message</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
};

export const sendPatientWelcome = async (opts: {
  to: string;
  name: string;
  patientId: string;
  hospitalName: string;
  appointmentInfo?: { date: string; doctor: string; timeSlot: string } | null;
}) => {
  await transporter.sendMail({
    from: `"${opts.hospitalName}" <${process.env.EMAIL_USERNAME || process.env.SMTP_USER}>`,
    to: opts.to,
    subject: `Welcome to ${opts.hospitalName} – Your Patient ID`,
    html: `
      <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0ea5e9,#0369a1);padding:32px 24px;text-align:center;">
          <h1 style="color:#fff;font-size:22px;margin:0;">🏥 ${opts.hospitalName}</h1>
          <p style="color:#bae6fd;margin:8px 0 0;font-size:14px;">Patient Registration Confirmed</p>
        </div>
        <div style="padding:32px 24px;">
          <h2 style="color:#1e293b;font-size:18px;margin:0 0 8px;">Welcome, ${opts.name}!</h2>
          <p style="color:#64748b;font-size:14px;line-height:1.6;">You have been successfully registered at ${opts.hospitalName}. Please keep your Patient ID safe — you will need it for all future visits.</p>
          <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:20px;margin:24px 0;text-align:center;">
            <div style="font-size:12px;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Your Patient ID</div>
            <div style="font-size:28px;font-weight:800;color:#0c4a6e;font-family:monospace;letter-spacing:.1em;">${opts.patientId}</div>
          </div>
          ${
            opts.appointmentInfo
              ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:24px;">
            <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;">Your Appointment</div>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="font-size:13px;color:#64748b;padding:6px 0;width:100px;">Doctor</td><td style="font-size:13px;color:#1e293b;font-weight:600;">${opts.appointmentInfo.doctor}</td></tr>
              <tr><td style="font-size:13px;color:#64748b;padding:6px 0;">Date</td><td style="font-size:13px;color:#1e293b;font-weight:600;">${opts.appointmentInfo.date}</td></tr>
              <tr><td style="font-size:13px;color:#64748b;padding:6px 0;">Time</td><td style="font-size:13px;color:#1e293b;font-weight:600;">${opts.appointmentInfo.timeSlot}</td></tr>
            </table>
          </div>`
              : ""
          }
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">Please arrive 15 minutes early for your appointment. Bring this Patient ID to the reception desk. If you need to reschedule, please contact us at least 24 hours in advance.</p>
        </div>
      </div>
    `,
  });
};

export const sendAppointmentConfirmation = async (opts: {
  to: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  departmentName: string;
  appointmentDate: string;
  timeSlot: string;
  tokenNumber?: number | null;
  type: string;
  hospitalName: string;
}) => {
  await transporter.sendMail({
    from: `"${opts.hospitalName}" <${process.env.EMAIL_USERNAME || process.env.SMTP_USER}>`,
    to: opts.to,
    subject: `Appointment Confirmed – ${opts.hospitalName}`,
    html: `
      <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);padding:32px 24px;text-align:center;">
          <h1 style="color:#fff;font-size:22px;margin:0;">🏥 ${opts.hospitalName}</h1>
          <p style="color:#ddd6fe;margin:8px 0 0;font-size:14px;">Appointment Confirmed</p>
        </div>
        <div style="padding:32px 24px;">
          <h2 style="color:#1e293b;font-size:18px;margin:0 0 8px;">Hi, ${opts.patientName}!</h2>
          <p style="color:#64748b;font-size:14px;line-height:1.6;">Your appointment has been confirmed. Here are the details:</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin:24px 0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="font-size:13px;color:#64748b;padding:8px 0;font-weight:600;width:140px;">Patient ID</td><td style="font-size:13px;color:#1e293b;font-family:monospace;font-weight:700;">${opts.patientId}</td></tr>
              <tr><td style="font-size:13px;color:#64748b;padding:8px 0;font-weight:600;">Doctor</td><td style="font-size:13px;color:#1e293b;font-weight:600;">${opts.doctorName}</td></tr>
              <tr><td style="font-size:13px;color:#64748b;padding:8px 0;font-weight:600;">Department</td><td style="font-size:13px;color:#1e293b;">${opts.departmentName}</td></tr>
              <tr><td style="font-size:13px;color:#64748b;padding:8px 0;font-weight:600;">Date</td><td style="font-size:13px;color:#1e293b;font-weight:600;">${opts.appointmentDate}</td></tr>
              <tr><td style="font-size:13px;color:#64748b;padding:8px 0;font-weight:600;">Time</td><td style="font-size:13px;color:#1e293b;font-weight:600;">${opts.timeSlot}</td></tr>
              <tr><td style="font-size:13px;color:#64748b;padding:8px 0;font-weight:600;">Type</td><td style="font-size:13px;color:#1e293b;">${opts.type}</td></tr>
              ${opts.tokenNumber ? `<tr><td style="font-size:13px;color:#64748b;padding:8px 0;font-weight:600;">Token No.</td><td style="font-size:22px;font-weight:800;color:#7c3aed;">#${opts.tokenNumber}</td></tr>` : ""}
            </table>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">Please arrive 15 minutes before your scheduled time. Carry a valid photo ID and previous medical records if available.</p>
        </div>
      </div>
    `,
  });
};

export const sendSubDeptCredentials = async (opts: {
  to: string;
  name: string;
  email: string;
  password: string;
  deptName: string;
  deptType: string;
  hospitalName: string;
  loginUrl: string;
}) => {
  await transporter.sendMail({
    from: `"${opts.hospitalName}" <${process.env.EMAIL_USERNAME || process.env.SMTP_USER}>`,
    to: opts.to,
    subject: `Your ${opts.deptName} Portal Credentials – ${opts.hospitalName}`,
    html: `
      <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:32px 24px;text-align:center;">
          <h1 style="color:#fff;font-size:22px;margin:0;">🏥 ${opts.hospitalName}</h1>
          <p style="color:#c7d2fe;margin:8px 0 0;font-size:14px;">${opts.deptName} — Sub-Department Portal</p>
        </div>
        <div style="padding:32px 24px;">
          <h2 style="color:#1e293b;font-size:18px;margin:0 0 8px;">Welcome, ${opts.name}!</h2>
          <p style="color:#64748b;font-size:14px;line-height:1.6;">Your <strong>${opts.deptName}</strong> portal access has been created. Use the credentials below to log in.</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin:24px 0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="font-size:13px;color:#64748b;padding:8px 0;font-weight:600;width:120px;">Email</td>
                <td style="font-size:13px;color:#1e293b;padding:8px 0;">${opts.email}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#64748b;padding:8px 0;font-weight:600;">Password</td>
                <td style="font-size:13px;color:#1e293b;padding:8px 0;font-family:monospace;background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:4px 10px;">${opts.password}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#64748b;padding:8px 0;font-weight:600;">Department</td>
                <td style="font-size:13px;color:#1e293b;padding:8px 0;">${opts.deptName} (${opts.deptType})</td>
              </tr>
            </table>
          </div>
          <a href="${opts.loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;text-decoration:none;padding:12px 28px;border-radius:9px;font-size:14px;font-weight:700;">Login to Department Portal →</a>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">For security, please change your password after your first login. If you didn't expect this email, contact your hospital administrator.</p>
        </div>
      </div>
    `,
  });
};

export const sendPrescriptionEmail = async (opts: {
  to: string;
  patientName: string;
  prescriptionNo: string;
  doctorName: string;
  doctorSpecialization: string;
  departmentName: string;
  diagnosis: string;
  medications: string;
  labTests: string;
  advice: string;
  followUpDate: string | null;
  hospitalName: string;
  date: string;
}) => {
  let medsHtml = "";
  try {
    const meds = JSON.parse(opts.medications);
    if (meds.length > 0) {
      medsHtml = `<table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr style="background:#f8fafc;"><th style="text-align:left;padding:8px 10px;font-size:12px;color:#64748b;border-bottom:2px solid #e2e8f0;">Medication</th><th style="text-align:left;padding:8px 10px;font-size:12px;color:#64748b;border-bottom:2px solid #e2e8f0;">Dosage</th><th style="text-align:left;padding:8px 10px;font-size:12px;color:#64748b;border-bottom:2px solid #e2e8f0;">Frequency</th><th style="text-align:left;padding:8px 10px;font-size:12px;color:#64748b;border-bottom:2px solid #e2e8f0;">Duration</th><th style="text-align:left;padding:8px 10px;font-size:12px;color:#64748b;border-bottom:2px solid #e2e8f0;">Instructions</th></tr>
        ${meds.map((m: any) => `<tr><td style="padding:8px 10px;font-size:13px;color:#1e293b;border-bottom:1px solid #f1f5f9;font-weight:600;">${m.name}</td><td style="padding:8px 10px;font-size:13px;color:#475569;border-bottom:1px solid #f1f5f9;">${m.dosage}</td><td style="padding:8px 10px;font-size:13px;color:#475569;border-bottom:1px solid #f1f5f9;">${m.frequency}</td><td style="padding:8px 10px;font-size:13px;color:#475569;border-bottom:1px solid #f1f5f9;">${m.duration}</td><td style="padding:8px 10px;font-size:13px;color:#475569;border-bottom:1px solid #f1f5f9;">${m.instructions || "—"}</td></tr>`).join("")}
      </table>`;
    }
  } catch {}

  let testsHtml = "";
  try {
    const tests = JSON.parse(opts.labTests);
    if (tests.length > 0) {
      testsHtml = `<div style="margin:16px 0;"><p style="font-size:13px;font-weight:700;color:#1e293b;margin:0 0 8px;">Lab Tests Recommended:</p><ul style="margin:0;padding-left:20px;">${tests.map((t: any) => `<li style="font-size:13px;color:#475569;margin-bottom:4px;">${t.name} <span style="color:#94a3b8;">(${t.urgency})</span></li>`).join("")}</ul></div>`;
    }
  } catch {}

  await transporter.sendMail({
    from: `"${opts.hospitalName}" <${process.env.EMAIL_USERNAME || process.env.SMTP_USER}>`,
    to: opts.to,
    subject: `Your Prescription ${opts.prescriptionNo} – ${opts.hospitalName}`,
    html: `
      <div style="font-family:'Inter',Arial,sans-serif;max-width:650px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0ea5e9,#0369a1);padding:32px 24px;text-align:center;">
          <h1 style="color:#fff;font-size:22px;margin:0;">🏥 ${opts.hospitalName}</h1>
          <p style="color:#bae6fd;margin:8px 0 0;font-size:14px;">Digital Prescription</p>
        </div>
        <div style="padding:32px 24px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:24px;">
            <div>
              <p style="margin:0;font-size:12px;color:#94a3b8;font-weight:600;">PRESCRIPTION NO</p>
              <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:#0c4a6e;font-family:monospace;">${opts.prescriptionNo}</p>
            </div>
            <div style="text-align:right;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">Date: ${opts.date}</p>
            </div>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:20px;">
            <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;font-weight:600;">PATIENT</p>
            <p style="margin:0;font-size:16px;font-weight:700;color:#1e293b;">${opts.patientName}</p>
          </div>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin-bottom:20px;">
            <p style="margin:0 0 4px;font-size:12px;color:#059669;font-weight:600;">CONSULTING DOCTOR</p>
            <p style="margin:0;font-size:15px;font-weight:700;color:#1e293b;">Dr. ${opts.doctorName}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#64748b;">${opts.doctorSpecialization} · ${opts.departmentName}</p>
          </div>
          ${opts.diagnosis ? `<div style="margin-bottom:16px;"><p style="font-size:13px;font-weight:700;color:#1e293b;margin:0 0 4px;">Diagnosis:</p><p style="font-size:13px;color:#475569;margin:0;">${opts.diagnosis}</p></div>` : ""}
          ${medsHtml ? `<div style="margin-bottom:16px;"><p style="font-size:13px;font-weight:700;color:#1e293b;margin:0 0 4px;">Medications:</p>${medsHtml}</div>` : ""}
          ${testsHtml}
          ${opts.advice ? `<div style="margin-bottom:16px;"><p style="font-size:13px;font-weight:700;color:#1e293b;margin:0 0 4px;">Advice:</p><p style="font-size:13px;color:#475569;margin:0;white-space:pre-line;">${opts.advice}</p></div>` : ""}
          ${opts.followUpDate ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;margin-top:16px;"><p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">📅 Follow-up Date: ${opts.followUpDate}</p></div>` : ""}
          <p style="color:#94a3b8;font-size:11px;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:16px;">This is a digitally generated prescription from ${opts.hospitalName}. Please consult your doctor before making any changes to the prescribed medications.</p>
        </div>
      </div>
    `,
  });
};

export const sendFinanceCredentials = async (
  to: string,
  name: string,
  password: string,
  hospitalName: string
) => {
  await transporter.sendMail({
    from: `"${hospitalName}" <${process.env.EMAIL_USERNAME || process.env.SMTP_USER}>`,
    to,
    subject: `Your Finance Department Credentials – ${hospitalName}`,
    html: `
      <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#f59e0b,#b45309);padding:32px 24px;text-align:center;">
          <h1 style="color:#fff;font-size:22px;margin:0;">🏥 ${hospitalName}</h1>
          <p style="color:#fef3c7;margin:8px 0 0;font-size:14px;">Finance Department Portal Access</p>
        </div>
        <div style="padding:32px 24px;">
          <h2 style="color:#1e293b;font-size:18px;margin:0 0 8px;">Welcome, ${name}!</h2>
          <p style="color:#64748b;font-size:14px;line-height:1.6;">Your Finance Department head account has been created. Use the credentials below to access the Finance Portal.</p>
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 10px;font-size:13px;color:#78350f;"><strong>Login Email:</strong> <span style="color:#1e293b;">${to}</span></p>
            <p style="margin:0;font-size:13px;color:#78350f;"><strong>Password:</strong> <code style="padding:4px 10px;background:#fff;border:1px solid #fde68a;border-radius:6px;color:#1e293b;font-family:monospace;">${password}</code></p>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">Please change your password after your first login. If you didn't expect this email, contact your hospital administrator.</p>
        </div>
      </div>
    `,
  });
};

export const sendStaffCredentials = async (opts: {
  to: string;
  name: string;
  email: string;
  password: string;
  role: string;
  hospitalName: string;
  loginUrl: string;
}) => {
  await transporter.sendMail({
    from: `"${opts.hospitalName}" <${process.env.EMAIL_USERNAME || process.env.SMTP_USER}>`,
    to: opts.to,
    subject: `Your Staff Portal Credentials – ${opts.hospitalName}`,
    html: `
      <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#10b981,#059669);padding:32px 24px;text-align:center;">
          <h1 style="color:#fff;font-size:22px;margin:0;">🏥 ${opts.hospitalName}</h1>
          <p style="color:#d1fae5;margin:8px 0 0;font-size:14px;">Staff Portal Access</p>
        </div>
        <div style="padding:32px 24px;">
          <h2 style="color:#1e293b;font-size:18px;margin:0 0 8px;">Welcome, ${opts.name}!</h2>
          <p style="color:#64748b;font-size:14px;line-height:1.6;">Your staff account has been created with the role of <strong>${opts.role}</strong>. Use the credentials below to access your portal.</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin:24px 0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="font-size:13px;color:#64748b;padding:8px 0;font-weight:600;width:120px;">Email</td>
                <td style="font-size:13px;color:#1e293b;padding:8px 0;">${opts.email}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#64748b;padding:8px 0;font-weight:600;">Password</td>
                <td style="font-size:13px;color:#1e293b;padding:8px 0;font-family:monospace;background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:4px 10px;">${opts.password}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#64748b;padding:8px 0;font-weight:600;">Role</td>
                <td style="font-size:13px;color:#1e293b;padding:8px 0;">${opts.role}</td>
              </tr>
            </table>
          </div>
          <a href="${opts.loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;padding:12px 28px;border-radius:9px;font-size:14px;font-weight:700;">Login to Portal →</a>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;"><strong>Important:</strong> You must change your password after your first login. If you didn't expect this email, contact your hospital administrator immediately.</p>
        </div>
      </div>
    `,
  });
};
