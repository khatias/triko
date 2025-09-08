#  Triko  

Triko is an e-commerce web application built with **Next.js**.  
It provides a modern shopping experience with responsive design and multilingual support.  

--

## ✨ Features  

-  **Responsive Design** – Optimized for mobile, tablet, and desktop  
-  **Internationalisation (i18n)** – Supports **Georgian** and **English**  
-  **Contact Form** – Users can easily send messages via integrated email service
-  **UI/UX** – Tailwind CSS v4 with custom design system  


--

## 🚀 Tech Stack  

- **Framework:** [Next.js](https://nextjs.org/)  
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)  
- **Internationalisation:** [next-intl](https://next-intl-docs.vercel.app/)  
- **Email Service:** [Nodemailer](https://nodemailer.com/) with SMTP support  


--

## ⚙️ Installation  

```bash
# Clone the repository
git clone https://github.com/khatias/triko.git

# Navigate into the project
cd triko

# Install dependencies
npm install

# Run development server
npm run dev
```

App will be available at: [http://localhost:3000](http://localhost:3000)  

---

## 🌍 Internationalisation (i18n)  

We use **next-intl** for multilingual support.  
Currently supported locales:  

- 🇬🇪 Georgian (`ka`)  
- 🇺🇸 English (`en`)  

### 📂 Setup  

- Translation files:  
  ```
  /messages/en.json
  /messages/ka.json
  ```
- Config:  
  - `src/i18n/request.ts` → request-scoped configuration  
  - `app/[locale]/layout.tsx` → wraps app with `NextIntlClientProvider`  

### 🖥️ Usage Example  

```tsx
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('HomePage');
  return <h1>{t('title')}</h1>;
}
```

**messages/en.json**
```json
{ "HomePage": { "title": "Welcome to our store!" } }
```

**messages/ka.json**
```json
{ "HomePage": { "title": "მოგესალმებით ჩვენს მაღაზიაში!" } }
```

### 🌐 Switching Languages  

- Locale comes from the URL (`/en/...`, `/ka/...`)  
- A **LanguageSwitcher** component is included for changing languages  

--

---

## 📩 Contact Page  

The **Contact** page includes a responsive form where users can send inquiries directly from the website.  

### 🔧 Implementation  

- Uses **react-hook-form** for validation  
- Honeypot field to prevent spam submissions  
- **Sonner toast** notifications for success/error feedback  
- Server-side handling with **Nodemailer**  

### 📂 Structure  

- `src/components/contact/ContactForm.tsx` → Contact form component  
- `src/app/[locale]/contact/page.tsx` → Contact page with form and cover image  
- `src/utils/contact/sendEmail.ts` → Email sending utility  

