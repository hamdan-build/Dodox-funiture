"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Check,
  ImagePlus,
  Loader2,
  Paperclip,
  X,
} from "lucide-react";
import {
  CheckboxField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/forms/field";
import { atelierSchema, type AtelierInput } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui";

const furnitureTypes = [
  "Sofa or sectional",
  "Lounge or dining chair",
  "Dining table",
  "Bed or headboard",
  "Wardrobe or storage",
  "Desk or shelving",
  "Console or side table",
  "Full room commission",
  "Something else",
];

const materialOptions = [
  "Solid oak",
  "Solid teak",
  "Walnut",
  "Mahogany",
  "Ash",
  "Rattan & cane",
  "Bouclé or linen upholstery",
  "Leather",
  "Stone or travertine",
  "Guidance needed",
];

const finishOptions = [
  "Natural oil (matte)",
  "Smoked / fumed",
  "Chalk or pale wash",
  "Warm sand tone",
  "Dark walnut tone",
  "Brass or metal detailing",
  "Undecided — advise me",
];

const budgetOptions = [
  "Under 500,000 RWF",
  "500,000 – 1,500,000 RWF",
  "1,500,000 – 3,000,000 RWF",
  "3,000,000 – 6,000,000 RWF",
  "Above 6,000,000 RWF",
  "A full-room budget — discuss with atelier",
];

interface Attachment {
  id: string;
  name: string;
  url: string;
}

export function CustomAtelierForm() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [submitted, setSubmitted] = useState<AtelierInput | null>(null);
  const [reference, setReference] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pushToast = useUiStore((state) => state.pushToast);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AtelierInput>({
    resolver: zodResolver(atelierSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      furnitureType: "",
      dimensions: "",
      materials: "",
      finish: "",
      budget: "",
      description: "",
      contactPreference: "email",
      consent: false as unknown as true,
    },
  });

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 3 - attachments.length);
    if (incoming.length === 0) {
      pushToast({
        title: "Images only",
        description: "Please attach JPG, PNG or WebP reference images.",
        variant: "info",
      });
      return;
    }
    setAttachments((current) => [
      ...current,
      ...incoming.map((file) => ({
        id: `${file.name}-${Date.now()}`,
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    ]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((current) => {
      const target = current.find((attachment) => attachment.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return current.filter((attachment) => attachment.id !== id);
    });
  };

  const onSubmit = async (values: AtelierInput) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    const ref = `ATL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setReference(ref);
    setSubmitted(values);
    reset();
    setAttachments([]);
    pushToast({
      title: "Atelier enquiry received",
      description: `Reference ${ref}. This is a frontend demonstration — no email was sent.`,
      variant: "success",
    });
  };

  if (submitted) {
    return (
      <div className="border border-line/60 bg-parchment p-6 sm:p-10">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-bronze/40 bg-ivory text-bronze">
          <Check size={20} strokeWidth={1.6} />
        </span>
        <p className="eyebrow mt-5">Enquiry received</p>
        <h2 className="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">
          Thank you, {submitted.name.split(" ")[0]}.
        </h2>
        <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-muted">
          Your commission outline is recorded under reference{" "}
          <span className="font-medium text-ink">{reference}</span>. A DODOX
          designer would normally review it and reply within one working day.
        </p>

        <dl className="mt-6 grid gap-3 border-y border-line/70 py-5 sm:grid-cols-2">
          {[
            ["Piece", submitted.furnitureType],
            ["Approximate size", submitted.dimensions],
            ["Preferred material", submitted.materials],
            ["Finish", submitted.finish],
            ["Budget", submitted.budget],
            ["Preferred contact", submitted.contactPreference],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[9px] uppercase tracking-[0.14em] text-muted">
                {label}
              </dt>
              <dd className="mt-1 text-[12px] text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 border border-line/70 bg-ivory/60 p-4">
          <p className="text-[10.5px] leading-relaxed text-muted">
            <strong className="font-medium text-ink">Demonstration notice:</strong>{" "}
            this form validates and displays a success state locally. Nothing was
            emailed or stored on a server. Connect a backend endpoint before launch.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSubmitted(null);
              setReference("");
            }}
            className="bg-bronze px-5 py-3 text-[10px] uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-bronze-dark"
          >
            Submit another enquiry
          </button>
          <Link
            href="/shop"
            className="border border-line bg-ivory px-5 py-3 text-[10px] uppercase tracking-[0.16em] text-ink transition-colors hover:bg-shell"
          >
            Browse the collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="border border-line/60 bg-parchment p-5 sm:p-7"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line/70 pb-4">
        <h2 className="font-display text-2xl text-ink">Commission brief</h2>
        <span className="text-[9px] uppercase tracking-[0.14em] text-muted">
          Step 1 of 1
        </span>
      </div>

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
          label="Telephone / WhatsApp"
          type="tel"
          autoComplete="tel"
          placeholder="+250 7xx xxx xxx"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <SelectField
          label="Piece type"
          error={errors.furnitureType?.message}
          {...register("furnitureType")}
        >
          <option value="">Select a piece</option>
          {furnitureTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Approximate dimensions"
          placeholder="e.g. 240 × 96 × 78 cm, or room 4 × 5 m"
          error={errors.dimensions?.message}
          {...register("dimensions")}
        />
        <SelectField
          label="Preferred material"
          error={errors.materials?.message}
          {...register("materials")}
        >
          <option value="">Select a material</option>
          {materialOptions.map((material) => (
            <option key={material} value={material}>
              {material}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Finish & colour preference"
          error={errors.finish?.message}
          {...register("finish")}
        >
          <option value="">Select a finish</option>
          {finishOptions.map((finish) => (
            <option key={finish} value={finish}>
              {finish}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Indicative budget"
          error={errors.budget?.message}
          {...register("budget")}
        >
          <option value="">Select a range</option>
          {budgetOptions.map((budget) => (
            <option key={budget} value={budget}>
              {budget}
            </option>
          ))}
        </SelectField>
      </div>

      <TextAreaField
        label="Project description"
        className="mt-3"
        rows={4}
        placeholder="Tell us about the room, how the piece will be used, and any references you love."
        error={errors.description?.message}
        {...register("description")}
      />

      <div className="mt-4">
        <p className="field-label">Reference images (optional)</p>
        <div className="flex flex-wrap items-center gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative h-20 w-20 overflow-hidden border border-line bg-shell"
            >
              <Image
                src={attachment.url}
                alt={attachment.name}
                fill
                unoptimized
                sizes="80px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeAttachment(attachment.id)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/75 text-ivory"
                aria-label={`Remove ${attachment.name}`}
              >
                <X size={10} strokeWidth={1.8} />
              </button>
            </div>
          ))}
          {attachments.length < 3 ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 border border-dashed border-taupe bg-ivory/60 text-muted transition-colors hover:border-bronze hover:text-bronze"
            >
              <ImagePlus size={16} strokeWidth={1.4} />
              <span className="text-[8px] uppercase tracking-[0.08em]">Add image</span>
            </button>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => handleFiles(event.target.files)}
          />
        </div>
        <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted">
          <Paperclip size={10} strokeWidth={1.5} />
          Up to 3 images. Previews are local only — files are not uploaded.
        </p>
      </div>

      <fieldset className="mt-5">
        <legend className="field-label">Preferred contact</legend>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "email", label: "Email" },
            { value: "phone", label: "Telephone" },
            { value: "whatsapp", label: "WhatsApp" },
          ].map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 border border-line bg-ivory px-3.5 py-2.5 text-[11px] text-ink-soft transition-colors has-[:checked]:border-bronze has-[:checked]:bg-shell"
            >
              <input
                type="radio"
                value={option.value}
                className="sr-only"
                {...register("contactPreference")}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <CheckboxField
          label={
            <>
              I agree to be contacted by the DODOX atelier about this enquiry. This
              is a demonstration form and no data leaves this device.
            </>
          }
          error={errors.consent?.message}
          {...register("consent")}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "mt-5 flex h-[52px] w-full items-center justify-center gap-2 bg-bronze text-[10px] font-medium uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-bronze-dark disabled:opacity-60",
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Sending enquiry…
          </>
        ) : (
          <>
            Request quotation
            <ArrowRight size={13} strokeWidth={1.5} />
          </>
        )}
      </button>
      <p className="mt-2.5 text-center text-[9.5px] leading-relaxed text-muted">
        Frontend demonstration · your brief is validated locally and not sent to a
        server.
      </p>
    </form>
  );
}
