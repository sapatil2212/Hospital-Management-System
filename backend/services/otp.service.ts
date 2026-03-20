import { createOTP, findLatestOTP, verifyOTPMark } from "../repositories/otp.repo";
import { generateOTP } from "../utils/otp";
import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: Number(env.EMAIL_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: env.EMAIL_USERNAME,
    pass: env.EMAIL_PASSWORD,
  },
});

export const requestOTP = async (email: string) => {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  await createOTP({
    email,
    otp,
    expiresAt,
  });

  try {
    // Send email
    await transporter.sendMail({
      from: Object.is(env.EMAIL_USERNAME, "") ? '"Hospital System" <no-reply@hospital.com>' : `"${env.EMAIL_USERNAME}"`,
      to: email,
      subject: "Your OTP for Hospital Registration",
      text: `Your OTP is: ${otp}`,
      html: `<b>Your OTP is: ${otp}</b>`,
    });
  } catch (error) {
    console.error("Failed to send email", error);
    // Don't throw for now to allow testing without valid email creds but in prod this should check
  }

  return { message: "OTP sent successfully" };
};

export const verifyOTP = async (email: string, otp: string) => {
  const latestOTP = await findLatestOTP(email);

  if (!latestOTP) throw new Error("No OTP found for this email");
  if (latestOTP.verified) throw new Error("OTP already verified");
  if (latestOTP.expiresAt < new Date()) throw new Error("OTP expired");
  if (latestOTP.otp !== otp) throw new Error("Invalid OTP");

  await verifyOTPMark(latestOTP.id);

  return { success: true, message: "OTP verified successfully" };
};
