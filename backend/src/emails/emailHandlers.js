import { resendClient, sender, isEmailSendingAllowed } from "../lib/resend.js";
import { createWelcomeEmailTemplate } from "../emails/emailTemplates.js";
import { ENV } from "../lib/env.js";

/**
 * Send welcome email to new user
 * @param {string} email - Recipient email
 * @param {string} name - User's name
 * @param {string} clientURL - Client URL for email links
 * @returns {Object} - { success: boolean, message: string }
 */
export const sendWelcomeEmail = async (email, name, clientURL) => {
  try {
    // Check if email sending is allowed in current environment
    if (!isEmailSendingAllowed(email)) {
      console.warn(
        `[Email] Development mode: Skipping email to ${email}. To send emails in development, add the address to DEVELOPMENT_WHITELIST in resend.js`
      );
      return {
        success: false,
        message: "Email skipped in development mode (not in whitelist)",
        skipped: true,
      };
    }

    const { data, error } = await resendClient.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: email,
      subject: "Welcome to Chatify!",
      html: createWelcomeEmailTemplate(name, clientURL),
    });

    if (error) {
      console.error("[Email] Error sending welcome email:", error);
      return {
        success: false,
        message: `Failed to send welcome email: ${error.message}`,
        error,
      };
    }

    console.log(`[Email] Welcome email sent successfully to ${email}`, data);
    return {
      success: true,
      message: "Welcome email sent successfully",
      data,
    };
  } catch (error) {
    console.error("[Email] Unexpected error in sendWelcomeEmail:", error);
    return {
      success: false,
      message: `Unexpected error sending welcome email: ${error.message}`,
      error,
    };
  }
};
