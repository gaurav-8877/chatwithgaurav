import { Resend } from "resend";
import { ENV } from "./env.js";

export const resendClient = new Resend(ENV.RESEND_API_KEY);

export const sender = {
  email: ENV.EMAIL_FROM,
  name: ENV.EMAIL_FROM_NAME,
};

// Whitelist of emails allowed to receive emails in development mode
export const DEVELOPMENT_WHITELIST = [
  "gv88877@gmail.com", // Your email
  // Add other emails here that can receive emails in development
];

// Check if email sending is allowed for the given recipient
export const isEmailSendingAllowed = (recipientEmail) => {
  // In production, always allow
  if (ENV.NODE_ENV === "production") {
    return true;
  }
  
  // In development, only allow whitelisted emails
  return DEVELOPMENT_WHITELIST.includes(recipientEmail.toLowerCase());
};
