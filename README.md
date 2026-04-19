# Beautywell Esthetics — Website

A Next.js website for Beautywell Esthetics with:
- **Decap CMS** admin portal at `/admin` for managing pricing and offerings
- **Google Calendar** embed for showing live availability
- **Apple Calendar + Google Calendar** export from the booking confirmation
- One-click **Netlify** deployment

---

## 🚀 Quick Deploy to Netlify

### Step 1 — Push to GitHub

```bash
cd beautywell-esthetics
git init
git add .
git commit -m "Initial Beautywell site"
git remote add origin https://github.com/YOUR_USERNAME/beautywell-esthetics.git
git push -u origin main
```

### Step 2 — Connect to Netlify

1. Go to [netlify.com](https://netlify.com) and log in
2. Click **"Add new site" → "Import an existing project"**
3. Choose **GitHub** and select your `beautywell-esthetics` repo
4. Build settings auto-detect (Next.js). Confirm:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
5. Click **Deploy site**

---

## 🔐 Setting Up the Admin CMS Portal

Paulina logs in at **yourdomain.com/admin** to change prices and update offerings.

### Step 1 — Enable Netlify Identity

1. In Netlify, go to your site → **Site configuration → Identity**
2. Click **"Enable Identity"**
3. Under **Registration**, set to **"Invite only"** (so only Paulina can log in)

### Step 2 — Enable Git Gateway

1. Still in Identity settings, scroll to **Services → Git Gateway**
2. Click **"Enable Git Gateway"**

### Step 3 — Invite Paulina

1. In Identity → click **"Invite users"**
2. Enter Paulina's email
3. She'll receive an email to set her password

### Step 4 — Done!

Paulina visits **yourdomain.com/admin**, logs in, and can:
- ✏️ Change prices for any facial, waxing service, or add-on
- ➕ Add or remove services from the menu
- 📝 Edit descriptions and badge labels
- ⚙️ Update business hours, email, phone, policies
- 📅 Add her Google Calendar embed URL

Every save creates a Git commit — the site rebuilds automatically on Netlify in ~1 minute.

---

## 📅 Google Calendar Integration

### Embed your calendar on the site

1. Open **Google Calendar** (calendar.google.com)
2. Click the ⚙️ gear icon → **Settings**
3. In the left sidebar, click your calendar name (under "My calendars")
4. Scroll down to **"Integrate calendar"**
5. Copy the **Embed code** — you want the `src="..."` URL inside it
6. Log into the CMS at `/admin`
7. Go to **⚙️ Business Settings**
8. Paste the URL into **Google Calendar Embed URL**
9. Save — the calendar appears on the site within ~1 minute

> **Tip:** Make your business calendar public so visitors can see availability without needing to sign in. In Google Calendar settings → your calendar → "Make available to public".

---

## 🍎 Apple Calendar Integration

No setup needed! When a client completes a booking request, they see two buttons:
- **"Add to Apple Calendar"** — downloads a `.ics` file that opens in Apple Calendar, iCal, or Outlook
- **"Add to Google Calendar"** — opens Google Calendar pre-filled with the appointment details

Both buttons include a 1-hour reminder.

---

## 💻 Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

CMS admin at `/admin` requires Netlify Identity — it only works on the live Netlify URL, not locally.

---

## 📂 Project Structure

```
beautywell-esthetics/
├── content/                  ← All editable content (managed by CMS)
│   ├── services.json         ← Facial + waxing prices & descriptions
│   ├── addons.json           ← Add-on prices & descriptions
│   └── settings.json         ← Business info, hours, policies, calendar URL
├── public/
│   └── admin/
│       ├── index.html        ← Decap CMS app
│       └── config.yml        ← CMS field definitions
├── src/
│   ├── app/
│   │   ├── layout.tsx        ← Root HTML layout + fonts
│   │   ├── page.tsx          ← Main page (reads content JSON)
│   │   └── globals.css       ← All site styles
│   └── components/
│       ├── Nav.tsx           ← Sticky nav + mobile menu
│       ├── BookingForm.tsx   ← Multi-step booking form + calendar export
│       └── ContactForm.tsx   ← Contact form
├── netlify.toml              ← Netlify build config
└── README.md
```

---

## ✏️ Editing Content Without the CMS

You can also edit prices directly in the JSON files:

- **`content/services.json`** — facial and waxing prices, descriptions, duration
- **`content/addons.json`** — add-on prices and descriptions
- **`content/settings.json`** — business info, hours, policies, Google Calendar URL

After editing, commit and push — Netlify rebuilds automatically.

---

## 📧 Connecting the Booking Form to Email

Currently the booking form shows a confirmation screen but doesn't send an email. To receive booking requests in your inbox, add a **Netlify Form** or connect to **Formspree**:

### Option A — Netlify Forms (free, easiest)
Add `netlify` attribute to the form tag in `BookingForm.tsx` and Netlify will capture submissions. View them in your Netlify dashboard → Forms.

### Option B — Formspree
1. Create a free account at [formspree.io](https://formspree.io)
2. Get your form endpoint
3. Update the form's `action` attribute in `BookingForm.tsx`

---

_Built with Next.js 14 · Deployed on Netlify · CMS by Decap_
