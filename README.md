Synergo Transport Order
Aplicație web pentru gestionarea comenzilor de transport rutier, cu extracție automată de date din documente PDF/CMR folosind Amazon Textract.
Construită cu același stack ca Synergo Driver: React + TypeScript + Vite + Tailwind CSS, hostat pe Vercel.
---
✨ Funcționalități
Drag & Drop PDF — trage un CMR, confirmare de transport sau orice document în zona de import
Extracție AI — Amazon Textract identifică automat câmpurile: client, transportator, nr. înmatriculare, tarif, date, adrese
Formular complet — structură identică cu modulul Rutier din Synergo: Client, Tarif, Planificare, Detalii Rută
Editare manuală — toate câmpurile rămân editabile după extracție
Branding Novasoft — culori și font Franklin Gothic conform identității vizuale Synergo
---
🏗️ Arhitectură
```
Browser (React)
    │
    │  PDF as base64
    ▼
Vercel API Route (/api/extract.ts)
    │
    │  AWS SDK
    ▼
Amazon Textract
    │
    │  perechi cheie-valoare + text brut
    ▼
mapTextractToOrder()  →  populează formularul
```
---
🚀 Setup local
1. Clonează repository-ul
```bash
git clone https://github.com/boncicaadi-blip/synergo-transport-order.git
cd synergo-transport-order
```
2. Instalează dependințele
```bash
npm install
```
3. Configurează variabilele de mediu
Copiază fișierul de exemplu:
```bash
cp .env.example .env.local
```
Completează cu credențialele tale AWS:
```env
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
```
4. Pornește în development
```bash
npm run dev
```
Aplicația rulează la `http://localhost:5173`
> **Notă:** API route-ul `/api/extract` necesită Vercel CLI pentru a rula local. Alternativ, poți testa direct după deploy pe Vercel.
---
☁️ Deploy pe Vercel
Varianta 1 — Import din GitHub (recomandat)
Mergi la vercel.com/new
Selectează repository-ul `synergo-transport-order`
Vercel detectează automat Vite — lasă setările default
Adaugă Environment Variables:
`AWS_REGION`
`AWS_ACCESS_KEY_ID`
`AWS_SECRET_ACCESS_KEY`
Click Deploy
Varianta 2 — Vercel CLI
```bash
npm install -g vercel
vercel --prod
```
---
🔑 Configurare AWS Textract
Creare utilizator IAM
Mergi la AWS Console → IAM
Users → Create user
Nume: `synergo-textract`
Permissions → Attach policies directly → caută și bifează `AmazonTextractFullAccess`
Create user
Generare Access Keys
Click pe userul creat → tab Security credentials
Create access key → Use case: Application running outside AWS
Copiază `Access key ID` și `Secret access key` în `.env.local`
> ⚠️ Secret key-ul se afișează o singură dată — salvează-l imediat.
---
📁 Structura proiectului
```
synergo-transport-order/
├── api/
│   └── extract.ts              # Vercel Serverless Function → AWS Textract
├── src/
│   ├── components/
│   │   └── PdfDropZone.tsx     # Componentă drag & drop
│   ├── types/
│   │   └── TransportOrder.ts   # Tipuri TypeScript + structura comenzii
│   ├── utils/
│   │   └── mapTextractToOrder.ts  # Mapare răspuns Textract → câmpuri formular
│   ├── App.tsx                 # Formularul principal
│   ├── main.tsx
│   └── index.css
├── .env.example
├── vercel.json
├── tailwind.config.js
├── vite.config.ts
└── package.json
```
---
🗺️ Câmpuri extrase automat
Câmp formular	Ce caută în document
Client	expeditor, sender, client
Număr comandă	C######, CMD-###, NR. ###
Data	DD.MM.YYYY, DD/MM/YYYY
Transportator	transportator, carrier
Nr. înmatriculare	format auto (ex: DB47WLI)
Semiremorci	semiremorca, trailer
Șofer	sofer, driver
Tarif + Monedă	cifre urmate de EUR/RON/USD
Referință	referinta, reference
Dacă un câmp nu este detectat automat, poate fi completat manual.
---
🛠️ Tehnologii
Tehnologie	Rol
React 18 + TypeScript	UI + type safety
Vite	Build tool
Tailwind CSS	Stilizare
Amazon Textract	OCR + extracție structurată
AWS SDK v3	Client Textract
Vercel Serverless	API route securizat (credențiale AWS)
Lucide React	Iconițe
---
📌 Legătură cu Synergo
Aplicația este un proof of concept pentru automatizarea introducerii comenzilor de transport în Synergo™, platforma ERP/TMS dezvoltată de Novasoft Solutions SRL pentru industria de transport rutier și logistică.
---
Dezvoltat de Novasoft Solutions SRL — nova-soft.ro
