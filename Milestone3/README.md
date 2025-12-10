# Milestone 3 - Next.js Frontend

HR System frontend built with Next.js 15, React 18, and TypeScript.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework

## Project Structure

```
Milestone3/
├── app/              # Next.js App Router pages
├── components/       # React components
│   └── figma/       # Figma-exported components
├── public/          # Static assets
└── styles/          # Global styles
```

## Components

### ImageWithFallback
A Next.js optimized image component with error fallback handling.

**Usage:**
```tsx
<ImageWithFallback 
  src="/path/to/image.jpg" 
  alt="Description" 
  width={200} 
  height={200} 
/>
```

**Props:**
- `src` (string): Image source URL
- `alt` (string): Alternative text
- `width` (number): Image width
- `height` (number): Image height
- `fill` (boolean): Fill parent container
- `priority` (boolean): Load image with priority
- All standard img attributes
