"use client";

import { useState } from "react";
import type { FormEvent } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = encodeURIComponent(form.subject || "Constellation Contact Form");
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
    );
    window.open(`mailto:hello@constellation.app?subject=${subject}&body=${body}`, "_self");
    setSent(true);
  }

  if (sent) {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <div className="text-aurora text-lg font-semibold">Message prepared</div>
        <p className="mt-2 text-sm text-starlight/60">
          Your email app should have opened with a pre-filled message.
        </p>
        <p className="mt-2 text-xs text-starlight/40">
          If it didn&apos;t open, email <a href="mailto:hello@constellation.app" className="text-aurora hover:underline">hello@constellation.app</a> directly.
        </p>
        <button
          onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
          className="button-ghost mt-4"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-8">
      <div className="text-xs uppercase tracking-[0.3em] text-aurora/70 mb-3">Send a Message</div>
      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-xs text-starlight/60">
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 p-2.5 text-sm text-starlight focus:outline-none focus:ring-1 focus:ring-aurora"
              placeholder="Your name"
            />
          </label>
          <label className="block text-xs text-starlight/60">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 p-2.5 text-sm text-starlight focus:outline-none focus:ring-1 focus:ring-aurora"
              placeholder="you@example.com"
            />
          </label>
        </div>
        <label className="block text-xs text-starlight/60">
          Subject
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 p-2.5 text-sm text-starlight focus:outline-none focus:ring-1 focus:ring-aurora"
            placeholder="What is this about?"
          />
        </label>
        <label className="block text-xs text-starlight/60">
          Message
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
            rows={5}
            className="mt-1.5 w-full rounded-xl bg-white/5 border border-white/10 p-2.5 text-sm text-starlight focus:outline-none focus:ring-1 focus:ring-aurora"
            placeholder="Your message..."
          />
        </label>
        <div className="flex justify-end">
          <button type="submit" className="button-primary">
            Send message
          </button>
        </div>
      </form>
    </div>
  );
}
