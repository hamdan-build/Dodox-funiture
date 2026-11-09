import { z } from "zod";

const phone = z
  .string()
  .trim()
  .min(9, "Enter a telephone number we can reach you on.")
  .max(18, "That telephone number looks too long.")
  .regex(/^[+()\d\s-]+$/, "Use digits, spaces, brackets or a leading +.");

export const checkoutSchema = z.object({
  firstName: z.string().trim().min(2, "Enter your first name."),
  lastName: z.string().trim().min(2, "Enter your last name."),
  email: z.string().trim().email("Enter a valid email address."),
  phone,
  city: z.string().trim().min(2, "Enter your city."),
  district: z.string().trim().min(2, "Enter your district or neighbourhood."),
  address: z.string().trim().min(6, "Enter the delivery address."),
  landmark: z.string().trim().max(160).optional().or(z.literal("")),
  deliveryMethod: z.enum(["kigali-white-glove", "regional-courier"]),
  notes: z.string().trim().max(600, "Please keep notes under 600 characters.").optional().or(z.literal("")),
  consent: z.literal(true, {
    message: "Please confirm that you are submitting an order request.",
  }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const atelierSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().email("Enter a valid email address."),
  phone,
  furnitureType: z.string().min(1, "Select the type of piece."),
  dimensions: z.string().trim().min(3, "Share approximate dimensions or room size."),
  materials: z.string().min(1, "Choose a preferred material."),
  finish: z.string().min(1, "Choose a finish preference."),
  budget: z.string().min(1, "Select an indicative budget range."),
  description: z
    .string()
    .trim()
    .min(30, "Tell us a little more — at least 30 characters."),
  contactPreference: z.enum(["email", "phone", "whatsapp"]),
  consent: z.literal(true, {
    message: "Please agree to be contacted about this enquiry.",
  }),
});

export type AtelierInput = z.infer<typeof atelierSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .max(18, "That telephone number looks too long.")
    .optional()
    .or(z.literal("")),
  subject: z.string().min(1, "Choose a subject."),
  message: z.string().trim().min(20, "Please add a little more detail."),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const trackOrderSchema = z.object({
  reference: z
    .string()
    .trim()
    .min(6, "Enter the order reference from your confirmation.")
    .max(24, "That reference looks too long."),
  contact: z
    .string()
    .trim()
    .min(5, "Enter the email or telephone number used for the order."),
});

export type TrackOrderInput = z.infer<typeof trackOrderSchema>;

export const newsletterSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
