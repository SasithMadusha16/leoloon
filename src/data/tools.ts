// src/data/tools.ts

export type ToolCategory = 'pdf' | 'image' | 'video' | 'audio' | 'text' | 'dev';

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  path: string;
  badge?: string;
  isPopular?: boolean;
}

export const TOOLS_DATA: Tool[] = [
  // ==========================================
  // 1. PDF POWER SUITE (8 Tools)
  // ==========================================
  {
    id: 'pdf-merge',
    name: 'PDF Merge',
    description: 'Combine multiple PDF files into one clean document in seconds.',
    category: 'pdf',
    icon: 'FilePlus',
    path: '/tools/pdf-merge',
    badge: 'Essential',
    isPopular: true,
  },
  {
    id: 'pdf-split',
    name: 'PDF Splitter',
    description: 'Extract custom page ranges or break down multi-page PDF documents.',
    category: 'pdf',
    icon: 'Scissors',
    path: '/tools/pdf-split',
    isPopular: true,
  },
  {
    id: 'pdf-to-image',
    name: 'PDF to JPG/PNG',
    description: 'Extract and convert PDF pages into high-resolution images locally.',
    category: 'pdf',
    icon: 'FileSpreadsheet',
    path: '/tools/pdf-to-image',
  },
  {
    id: 'image-to-pdf',
    name: 'Images to PDF',
    description: 'Bind multiple PNG, JPG, or WebP images into a single print-ready PDF.',
    category: 'pdf',
    icon: 'FileImage',
    path: '/tools/image-to-pdf',
  },
  {
    id: 'pdf-rotate',
    name: 'PDF Page Rotator',
    description: 'Permanently rotate upside-down or sideways pages by 90°, 180°, or 270°.',
    category: 'pdf',
    icon: 'RotateCw',
    path: '/tools/pdf-rotate',
  },
  {
    id: 'pdf-organize',
    name: 'PDF Page Manager',
    description: 'Delete unwanted pages or drag and reorder page sequences visually.',
    category: 'pdf',
    icon: 'Layers',
    path: '/tools/pdf-organize',
  },
  {
    id: 'pdf-watermark',
    name: 'PDF Watermark',
    description: 'Stamp custom text or confidentiality labels across all document pages.',
    category: 'pdf',
    icon: 'Stamp',
    path: '/tools/pdf-watermark',
  },
  {
    id: 'pdf-protect',
    name: 'PDF Encrypt & Protect',
    description: 'Set password protection and client-side encryption on sensitive PDF files.',
    category: 'pdf',
    icon: 'FileLock2',
    path: '/tools/pdf-protect',
    badge: 'Security',
  },

  // ==========================================
  // 2. IMAGE & AI STUDIO (8 Tools)
  // ==========================================
  {
    id: 'image-compressor',
    name: 'Image Compressor',
    description: 'Compress PNG & JPG file size by up to 80% without losing visual quality.',
    category: 'image',
    icon: 'Minimize2',
    path: '/tools/image-compressor',
    badge: 'Popular',
    isPopular: true,
  },
  {
    id: 'image-converter',
    name: 'Format Converter',
    description: 'Convert JPG, PNG to next-gen WebP & SVG formats with zero quality loss.',
    category: 'image',
    icon: 'RefreshCw',
    path: '/tools/image-converter',
  },
  {
    id: 'photo-editor',
    name: 'Photo Studio & Editor',
    description: 'Crop, rotate, adjust brightness/contrast, and apply stylish photo filters.',
    category: 'image',
    icon: 'Sliders',
    path: '/tools/photo-editor',
    badge: 'Studio',
    isPopular: true,
  },
  {
    id: 'bg-remover',
    name: 'AI Background Remover',
    description: 'Remove background from portraits and products instantly using local AI model.',
    category: 'image',
    icon: 'Sparkles',
    path: '/tools/bg-remover',
    badge: 'AI Local',
    isPopular: true,
  },
  {
    id: 'social-resizer',
    name: 'Social Media Resizer',
    description: 'Auto-crop and resize photos for Instagram, Facebook, and YouTube thumbnails.',
    category: 'image',
    icon: 'Crop',
    path: '/tools/social-resizer',
  },
  {
    id: 'image-censor',
    name: 'Image Blur & Censor',
    description: 'Highlight and pixelate faces, license plates, or sensitive credentials securely.',
    category: 'image',
    icon: 'EyeOff',
    path: '/tools/image-censor',
    badge: 'Privacy',
  },
  {
    id: 'palette-extractor',
    name: 'Color Palette Extractor',
    description: 'Extract dominant color palettes and HEX/RGB swatches from any uploaded photo.',
    category: 'image',
    icon: 'Palette',
    path: '/tools/palette-extractor',
  },
  {
    id: 'exif-stripper',
    name: 'EXIF Metadata Stripper',
    description: 'Wipe hidden GPS locations, camera serials, and timestamps before sharing photos.',
    category: 'image',
    icon: 'ShieldAlert',
    path: '/tools/exif-stripper',
  },

  // ==========================================
  // 3. VIDEO LAB (5 Tools - Client-Side)
  // ==========================================
  {
    id: 'video-trimmer',
    name: 'Video Trimmer & Cutter',
    description: 'Cut start and end timestamps or trim video clips with instant browser preview.',
    category: 'video',
    icon: 'Scissors',
    path: '/tools/video-trimmer',
    badge: 'Quick Edit',
    isPopular: true,
  },
  {
    id: 'video-compressor',
    name: 'Video Compressor',
    description: 'Downscale and compress MP4/WebM videos for WhatsApp, Discord, and email sharing.',
    category: 'video',
    icon: 'FileVideo',
    path: '/tools/video-compressor',
  },
  {
    id: 'video-to-mp3',
    name: 'Video to MP3 / Audio',
    description: 'Extract pure audio tracks from video clips without uploading to any cloud server.',
    category: 'video',
    icon: 'Music',
    path: '/tools/video-to-mp3',
  },
  {
    id: 'video-to-gif',
    name: 'Video to GIF Maker',
    description: 'Convert short video clips into high-quality looping animated GIF stickers.',
    category: 'video',
    icon: 'Film',
    path: '/tools/video-to-gif',
  },
  {
    id: 'mute-video',
    name: 'Mute Video / Strip Audio',
    description: 'Remove background audio, noise, or music tracks from your video clips cleanly.',
    category: 'video',
    icon: 'VolumeX',
    path: '/tools/mute-video',
  },

  // ==========================================
  // 4. VOICE & AUDIO STUDIO (2 Tools)
  // ==========================================
  {
    id: 'voice-enhancer',
    name: 'Voice Noise Cleaner',
    description: 'Enhance recorded voice notes, apply high-pass audio filters, and strip background hums.',
    category: 'audio',
    icon: 'Mic',
    path: '/tools/voice-enhancer',
    badge: 'Audio DSP',
    isPopular: true,
  },
  {
    id: 'speech-synthesis',
    name: 'Text-to-Speech Player',
    description: 'Listen to any written text using native browser speech engines and accent selectors.',
    category: 'audio',
    icon: 'Volume2',
    path: '/tools/speech-synthesis',
  },

  // ==========================================
  // 5. TEXT & WRITING SUITE (5 Tools)
  // ==========================================
  {
    id: 'text-diff',
    name: 'Text Diff Checker',
    description: 'Compare two text blocks and highlight additions, removals, and changes side-by-side.',
    category: 'text',
    icon: 'FileDiff',
    path: '/tools/text-diff',
    isPopular: true,
  },
  {
    id: 'word-counter',
    name: 'Word & Reading Stats',
    description: 'Instant stats on word count, reading time, characters, and sentences.',
    category: 'text',
    icon: 'Type',
    path: '/tools/word-counter',
  },
  {
    id: 'case-converter',
    name: 'Case & Slug Converter',
    description: 'Convert between UPPERCASE, lowercase, Title Case, camelCase, and URL slugs.',
    category: 'text',
    icon: 'CaseSensitive',
    path: '/tools/case-converter',
  },
  {
    id: 'markdown-preview',
    name: 'Markdown Live Studio',
    description: 'Live split-screen Markdown editor with immediate HTML preview and export.',
    category: 'text',
    icon: 'FileCode2',
    path: '/tools/markdown-preview',
  },
  {
    id: 'lorem-generator',
    name: 'Lorem Ipsum Generator',
    description: 'Generate customizable dummy text, sentences, or paragraphs for mockups.',
    category: 'text',
    icon: 'AlignLeft',
    path: '/tools/lorem-generator',
  },

  // ==========================================
  // 6. DEVELOPER & SECURITY HUB (4 Tools)
  // ==========================================
  {
    id: 'qr-studio',
    name: 'QR Code Studio',
    description: 'Generate customizable QR codes for links, Wi-Fi, and scan codes via webcam.',
    category: 'dev',
    icon: 'QrCode',
    path: '/tools/qr-studio',
    badge: 'Scanner',
    isPopular: true,
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter & Validator',
    description: 'Prettify, format, minify, and catch JSON syntax errors in real-time.',
    category: 'dev',
    icon: 'Braces',
    path: '/tools/json-formatter',
  },
  {
    id: 'base64-converter',
    name: 'Base64 Tool',
    description: 'Encode or decode text, images, and binary files directly to Base64.',
    category: 'dev',
    icon: 'Binary',
    path: '/tools/base64',
  },
  {
    id: 'password-generator',
    name: 'Secure Password Hub',
    description: 'Generate cryptographically strong passwords and test entropy strength.',
    category: 'dev',
    icon: 'KeyRound',
    path: '/tools/password-generator',
  },
];