"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import {
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/forms/field";
import { contactSchema, type ContactInput } from "@/lib/validation";
import { useUiStore } from "@/store/ui";

const subjects = [
  "General enquiry",
  "Product availability",
  "Bespoke commission",
  "Existing order request",
  "Delivery & regional shipping",
  "Showroom appointment",
  "Trade & interior design",
];

export function ContactForm() {
  const [sent, setSent] = useState<ContactInput | null>(null);
  const pushToast = useUiStore((state) => state.pushToast);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (values: ContactInput) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSent(values);
    reset();
    pushToast({
      title: "Message recorded",
      description: "Demonstration only — no email was sent.",
      variant: "success",
    });
  };

  if (sent) {
    return (
      <div className="border border-line/60 bg-parchment p-6 sm:p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-bronze/40 bg-ivory text-bronze">
          <Check size={18} strokeWidth={1.6} />
        </span>
        <h2 className="mt-4 font-display text-2xl text-ink">
          Thank you, {sent.name.split(" ")[0]}.
        </h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
          Your message about <span className="text-ink">{sent.subject}</span> has
          been recorded in this browser. A concierge would normally reply to{" "}
          <span className="text-ink">{sent.email}</span> within one working day.
        </p>
        <div className="mt-4 border border-line/70 bg-ivory/60 p-3.5 text-[10.5px] leading-relaxed text-muted">
          <strong className="font-medium text-ink">Demonstration notice:</strong> no
          email was sent and nothing was stored on a server. Connect a form endpoint
          (or email service) before launch.
        </div>
        <button
          type="button"
          onClick={() => setSent(null)}
          className="mt-5 bg-bronze px-5 py-3 text-[10px] uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-bronze-dark"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="border border-line/60 bg-parchment p-5 sm:p-7"
    >
      <h2 className="font-display text-2xl text-ink">Write to the atelier</h2>
      <p className="mt-1 text-[11.5px] text-muted">
        We reply to enquiries within one working day, Monday to Saturday.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <TextField
          label="Your name"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />
        <TextField
          label="Email address"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <TextField
          label="Telephone (optional)"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <SelectField
          label="Subject"
          error={errors.subject?.message}
          {...register("subject")}
        >
          <option value="">Select a subject</option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </SelectField>
      </div>

      <TextAreaField
        label="Message"
        className="mt-3"
        rows={5}
        placeholder="Tell us how we can help."
        error={errors.message?.message}
        {...register("message")}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 flex h-[50px] w-full items-center justify-center gap-2 bg-bronze text-[10px] uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-bronze-dark disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            Sending…
          </>
        ) : (
          <>
            Send message
            <ArrowRight size={12} strokeWidth={1.5} />
          </>
        )}
      </button>
      <p className="mt-2.5 text-center text-[9.5px] leading-relaxed text-muted">
        Demonstration form · validated locally, not connected to an email service.
      </p>
    </form>
  );
}
