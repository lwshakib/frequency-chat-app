import { Resend } from "resend";
import { SendMailEnum, FROM_EMAIL } from "../constants";
import { RESEND_API_KEY } from "../env";

// Import email templates
import {
  resetPasswordTemplate,
  verifyEmailTemplate,
} from "./templates/index.js";

const resend = new Resend(RESEND_API_KEY);

export const sendEmail = async (purpose: SendMailEnum, context: any) => {
  try {
    let subject = "";
    let html = "";
    let text = "";

    if (purpose === SendMailEnum.VERIFY_EMAIL) {
      subject = "Verify Your Email Address - Frequency";
      const template = verifyEmailTemplate(context);
      html = template.html;
      text = template.text;
    } else if (purpose === SendMailEnum.RESET_PASSWORD) {
      subject = "Password Reset Request - Frequency";
      const template = resetPasswordTemplate(context);
      html = template.html;
      text = template.text;
    } else {
      throw new Error("Unsupported email purpose");
    }

    const { data, error } = await resend.emails.send({
      from: `Frequency <${FROM_EMAIL}>`,
      to: [context.to],
      subject,
      text,
      html,
    });

    if (error) {
      console.error("❌ Error sending email through Resend:", error);
      throw error;
    }

    console.log("✅ Email sent successfully:", data?.id);

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

// Skip verification on startup as Resend doesn't have a direct 'verify' like Nodemailer
export const verifyEmailConfig = async () => {
  return !!RESEND_API_KEY;
};
