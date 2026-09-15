// src/tools/qr/studio/QrStudioView.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  QrCode, 
  Wifi, 
  User, 
  MessageCircle, 
  Coins, 
  Mail, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Palette, 
  Sliders, 
  Scan, 
  RefreshCw, 
  Upload, 
  ShieldCheck, 
  ExternalLink, 
  Layers, 
  Smartphone 
} from 'lucide-react';
import { 
  formatQrPayload, 
  renderQrToCanvas, 
  exportQrAsSvg 
} from './engine';
import type { 
  QrDataType, 
  DotStyle, 
  QrDesignConfig, 
  WifiData, 
  VCardData, 
  WhatsAppData, 
  CryptoData, 
  EmailData, 
  SmsData 
} from './engine';

const PRESET_COLORS = [
  '#0f172a', '#2563eb', '#0891b2', '#059669', '#7c3aed', '#db2777', '#ea580c', '#000000'
];

export const QrStudioView = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'create' | 'scan'>('create');
  const [dataType, setDataType] = useState<QrDataType>('url');

  // Data States
  const [urlText, setUrlText] = useState('https://leoloon.com');
  const [wifi, setWifi] = useState<WifiData>({ ssid: 'Leoloon_Office_5G', password: 'ultra-secret-key', encryption: 'WPA', hidden: false });
  const [vcard, setVcard] = useState<VCardData>({ firstName: 'Alex', lastName: 'Vance', phone: '+1 555 019 283', email: 'alex@leoloon.com', company: 'Leoloon Studio', title: 'Lead Architect', website: 'https://leoloon.com' });
  const [whatsapp, setWhatsapp] = useState<WhatsAppData>({ phone: '+94771234567', message: 'Hello! Inquiring about your software suite.' });
  const [crypto, setCrypto] = useState<CryptoData>({ coin: 'BTC', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', amount: '0.005' });
  const [email, setEmail] = useState<EmailData>({ to: 'support@leoloon.com', subject: 'Project Collaboration', body: 'Hi Team,\n\nI love your zero-server utility suite!' });
  const [sms, setSms] = useState<SmsData>({ phone: '+1555123456', message: 'Hey! Check out this QR code tool.' });
  const [plainText, setPlainText] = useState('Leoloon 100% Client-Side Private Suite');

  // Styling Config State
  const [config, setConfig] = useState<QrDesignConfig>({
    dotStyle: 'rounded',
    eyeOuterStyle: 'rounded',
    eyeInnerStyle: 'square',
    fgColor: '#0f172a',
    bgColor: '#ffffff',
    transparentBg: false,
    eyeColor: '#2563eb',
    gradientType: 'linear-diag',
    gradientColor2: '#2563eb',
    logoDataUrl: undefined,
    logoSizePercent: 22,
    frameStyle: 'none',
    frameText: 'SCAN ME',
    frameColor: '#0f172a',
  });

  // UI state
  const [copied, setCopied] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [downloadResolution, setDownloadResolution] = useState<1024 | 2048>(1024);

  // Scanner state
  const [decodedResult, setDecodedResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrImageInputRef = useRef<HTMLInputElement>(null);

  // Compute the raw QR payload
  const currentPayload = formatQrPayload(dataType, {
    urlText,
    wifi,
    vcard,
    whatsapp,
    crypto,
    email,
    sms,
    plainText,
  });

  // Render QR Code onto Canvas
  const updateQrCanvas = useCallback(async () => {
    if (!canvasRef.current) return;
    setIsRendering(true);
    try {
      await renderQrToCanvas(canvasRef.current, currentPayload, config, 1024);
    } catch {
      // Ignored
    } finally {
      setIsRendering(false);
    }
  }, [currentPayload, config]);

  useEffect(() => {
    updateQrCanvas();
  }, [updateQrCanvas]);

  // Handle Logo Upload
  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setConfig((prev) => ({ ...prev, logoDataUrl: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Download High-Res PNG
  const handleDownloadPng = async () => {
    const tempCanvas = document.createElement('canvas');
    await renderQrToCanvas(tempCanvas, currentPayload, config, downloadResolution);

    const a = document.createElement('a');
    a.href = tempCanvas.toDataURL('image/png');
    a.download = `qr-code-${downloadResolution}px.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download Vector SVG
  const handleDownloadSvg = async () => {
    const svgString = await exportQrAsSvg(currentPayload, config);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-code-vector.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy Canvas Image to Clipboard
  const handleCopyImage = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      try {
        navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        alert('Browser clipboard image write not supported.');
      }
    });
  };

  // Scan & Decode from Uploaded Image (Using BarcodeDetector API if available)
  const handleScanImage = async (file: File) => {
    setIsScanning(true);
    setDecodedResult(null);

    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise((res) => {
      img.onload = () => res(null);
    });

    if ('BarcodeDetector' in window) {
      try {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(img);
        if (barcodes.length > 0) {
          setDecodedResult(barcodes[0].rawValue);
        } else {
          setDecodedResult('No QR code detected in this image.');
        }
      } catch {
        setDecodedResult('Scanning error: BarcodeDetector failed.');
      }
    } else {
      setDecodedResult('Browser does not support native BarcodeDetector API. (Works on Chrome/Edge)');
    }
    setIsScanning(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-white">
              Professional QR Studio Pro
            </h4>
            <span className="text-[11px] text-slate-400">
              WiFi Auto-Connect • vCard • Custom Eyes & Gradients • 4K Print & SVG
            </span>
          </div>
        </div>

        {/* Create / Scan switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'create'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Create & Design
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
              activeTab === 'scan'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Scan className="w-3.5 h-3.5" /> Decode QR
          </button>
        </div>
      </div>

      {activeTab === 'scan' ? (
        /* ==================== SCANNER TAB ==================== */
        <div className="max-w-xl mx-auto p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-center space-y-6">
          <div
            onClick={() => qrImageInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 rounded-2xl p-10 cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-950/50"
          >
            <input
              type="file"
              ref={qrImageInputRef}
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleScanImage(e.target.files[0])}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-500 mx-auto flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">
              Upload QR Code Image to Decode
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Supports PNG, JPG, WebP screenshot or photo
            </p>
          </div>

          {isScanning && (
            <div className="flex items-center justify-center gap-2 text-xs text-sky-500 font-medium">
              <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing QR matrix...
            </div>
          )}

          {decodedResult && (
            <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-50/50 dark:bg-sky-950/20 text-left space-y-2">
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 block">
                Decoded Content:
              </span>
              <p className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                {decodedResult}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ==================== CREATE & DESIGN TAB ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Configuration Panel (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Data Type Selector */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-500" /> Select QR Payload Type
              </span>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {[
                  { id: 'url', label: 'URL', icon: ExternalLink },
                  { id: 'wifi', label: 'WiFi', icon: Wifi },
                  { id: 'vcard', label: 'vCard', icon: User },
                  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
                  { id: 'crypto', label: 'Crypto', icon: Coins },
                  { id: 'email', label: 'Email', icon: Mail },
                  { id: 'sms', label: 'SMS', icon: Smartphone },
                  { id: 'text', label: 'Text', icon: FileText },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSel = dataType === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setDataType(item.id as QrDataType)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-center transition-all ${
                        isSel
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px]">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Data Input Fields */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                {dataType === 'url' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Target Website Link
                    </label>
                    <input
                      type="url"
                      value={urlText}
                      onChange={(e) => setUrlText(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                )}

                {dataType === 'wifi' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Network Name (SSID)
                        </label>
                        <input
                          type="text"
                          value={wifi.ssid}
                          onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                          className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Password
                        </label>
                        <input
                          type="text"
                          value={wifi.password}
                          onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                          className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {(['WPA', 'WEP', 'nopass'] as const).map((enc) => (
                          <button
                            key={enc}
                            onClick={() => setWifi({ ...wifi, encryption: enc })}
                            className={`px-2 py-1 rounded text-[11px] border ${
                              wifi.encryption === enc ? 'bg-sky-600 text-white' : 'border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            {enc}
                          </button>
                        ))}
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-500">
                        <input
                          type="checkbox"
                          checked={wifi.hidden}
                          onChange={(e) => setWifi({ ...wifi, hidden: e.target.checked })}
                          className="rounded accent-sky-500"
                        />
                        <span>Hidden Network</span>
                      </label>
                    </div>
                  </div>
                )}

                {dataType === 'vcard' && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={vcard.firstName}
                      onChange={(e) => setVcard({ ...vcard, firstName: e.target.value })}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={vcard.lastName}
                      onChange={(e) => setVcard({ ...vcard, lastName: e.target.value })}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    />
                    <input
                      type="tel"
                      placeholder="Mobile Phone"
                      value={vcard.phone}
                      onChange={(e) => setVcard({ ...vcard, phone: e.target.value })}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    />
                    <input
                      type="email"
                      placeholder="Work Email"
                      value={vcard.email}
                      onChange={(e) => setVcard({ ...vcard, email: e.target.value })}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    />
                    <input
                      type="text"
                      placeholder="Company"
                      value={vcard.company}
                      onChange={(e) => setVcard({ ...vcard, company: e.target.value })}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    />
                    <input
                      type="text"
                      placeholder="Job Title"
                      value={vcard.title}
                      onChange={(e) => setVcard({ ...vcard, title: e.target.value })}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    />
                  </div>
                )}

                {dataType === 'whatsapp' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Phone with Country Code
                      </label>
                      <input
                        type="text"
                        value={whatsapp.phone}
                        onChange={(e) => setWhatsapp({ ...whatsapp, phone: e.target.value })}
                        placeholder="+94771234567"
                        className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Pre-filled Message
                      </label>
                      <input
                        type="text"
                        value={whatsapp.message}
                        onChange={(e) => setWhatsapp({ ...whatsapp, message: e.target.value })}
                        className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                      />
                    </div>
                  </div>
                )}

                {dataType === 'crypto' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {(['BTC', 'ETH', 'SOL', 'USDT'] as const).map((coin) => (
                        <button
                          key={coin}
                          onClick={() => setCrypto({ ...crypto, coin })}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                            crypto.coin === coin ? 'bg-sky-600 text-white' : 'border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {coin}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Wallet Address"
                      value={crypto.address}
                      onChange={(e) => setCrypto({ ...crypto, address: e.target.value })}
                      className="w-full p-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    />
                  </div>
                )}

                {dataType === 'email' && (
                  <div className="space-y-3">
                    <input
                      type="email"
                      placeholder="Recipient Email"
                      value={email.to}
                      onChange={(e) => setEmail({ ...email, to: e.target.value })}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    />
                    <input
                      type="text"
                      placeholder="Subject"
                      value={email.subject}
                      onChange={(e) => setEmail({ ...email, subject: e.target.value })}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    />
                    <textarea
                      rows={2}
                      placeholder="Email Body"
                      value={email.body}
                      onChange={(e) => setEmail({ ...email, body: e.target.value })}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    />
                  </div>
                )}

                {dataType === 'sms' && (
                  <div className="space-y-3">
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={sms.phone}
                      onChange={(e) => setSms({ ...sms, phone: e.target.value })}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    />
                    <input
                      type="text"
                      placeholder="SMS Message"
                      value={sms.message}
                      onChange={(e) => setSms({ ...sms, message: e.target.value })}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    />
                  </div>
                )}

                {dataType === 'text' && (
                  <textarea
                    rows={3}
                    value={plainText}
                    onChange={(e) => setPlainText(e.target.value)}
                    placeholder="Enter any text or note..."
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                )}
              </div>
            </div>

            {/* 2. Visual Designer & Eye Customization */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-500" /> Dot Patterns & Corner Eye Architecture
              </span>

              {/* Dot Shape */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Matrix Body Style
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'square', label: 'Classic' },
                    { id: 'rounded', label: 'Smooth' },
                    { id: 'dots', label: 'Dots' },
                    { id: 'diamond', label: 'Diamond' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setConfig({ ...config, dotStyle: d.id as DotStyle })}
                      className={`py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-all ${
                        config.dotStyle === d.id
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Eye Shapes */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Eye Outer Ring
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['square', 'rounded', 'circle'] as const).map((style) => (
                      <button
                        key={style}
                        onClick={() => setConfig({ ...config, eyeOuterStyle: style })}
                        className={`py-1.5 text-xs font-medium rounded-lg border capitalize ${
                          config.eyeOuterStyle === style ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600' : 'border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Eye Inner Pupil
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['square', 'circle', 'diamond'] as const).map((style) => (
                      <button
                        key={style}
                        onClick={() => setConfig({ ...config, eyeInnerStyle: style })}
                        className={`py-1.5 text-xs font-medium rounded-lg border capitalize ${
                          config.eyeInnerStyle === style ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600' : 'border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color & Gradient Settings */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-sky-500" /> Color Palette & Gradient
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col}
                      onClick={() => setConfig({ ...config, fgColor: col, eyeColor: col })}
                      className="w-7 h-7 rounded-full border border-white dark:border-slate-900 shadow-sm transition-transform hover:scale-110"
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Primary Color</label>
                    <input
                      type="color"
                      value={config.fgColor}
                      onChange={(e) => setConfig({ ...config, fgColor: e.target.value })}
                      className="w-full h-8 rounded-lg cursor-pointer bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Gradient End</label>
                    <input
                      type="color"
                      value={config.gradientColor2}
                      onChange={(e) => setConfig({ ...config, gradientColor2: e.target.value, gradientType: 'linear-diag' })}
                      className="w-full h-8 rounded-lg cursor-pointer bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Corner Eye Color</label>
                    <input
                      type="color"
                      value={config.eyeColor}
                      onChange={(e) => setConfig({ ...config, eyeColor: e.target.value })}
                      className="w-full h-8 rounded-lg cursor-pointer bg-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.transparentBg}
                      onChange={(e) => setConfig({ ...config, transparentBg: e.target.checked })}
                      className="rounded accent-sky-500"
                    />
                    <span>Transparent Background (PNG)</span>
                  </label>
                </div>
              </div>

              {/* Logo & Frame Settings */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Center Brand Logo
                  </label>
                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1 text-slate-600 dark:text-slate-300"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Logo
                    </button>
                    {config.logoDataUrl && (
                      <button
                        onClick={() => setConfig({ ...config, logoDataUrl: undefined })}
                        className="px-2 text-xs font-bold text-rose-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Scan Me Frame CTA
                  </label>
                  <select
                    value={config.frameStyle}
                    onChange={(e) => setConfig({ ...config, frameStyle: e.target.value as any })}
                    className="w-full p-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  >
                    <option value="none">No Frame</option>
                    <option value="bottom-pill">Bottom "SCAN ME" Pill</option>
                    <option value="top-header">Top Header Badge</option>
                  </select>
                </div>
              </div>

            </div>

          </div>

          {/* Right Live Preview & High-Res Export (5 Cols) */}
          <div className="lg:col-span-5 space-y-5 sticky top-6">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md space-y-6 text-center">
              
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-500" /> Live Canvas Render
                </span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> ECC 30% Auto-Fixed
                </span>
              </div>

              {/* The Live Render Canvas */}
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto rounded-2xl p-4 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden shadow-sm">
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full object-contain rounded-lg transition-all"
                />
                {isRendering && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xs flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-sky-500 animate-spin" />
                  </div>
                )}
              </div>

              {/* Export Buttons */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>Export Resolution:</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setDownloadResolution(1024)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        downloadResolution === 1024 ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      1K Print
                    </button>
                    <button
                      onClick={() => setDownloadResolution(2048)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        downloadResolution === 2048 ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      4K Ultra
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDownloadPng}
                    className="py-3 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Download PNG
                  </button>

                  <button
                    onClick={handleDownloadSvg}
                    className="py-3 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Vector SVG
                  </button>
                </div>

                <button
                  onClick={handleCopyImage}
                  className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center justify-center gap-1.5 transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied QR Image!' : 'Copy to Clipboard'}
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                100% In-Browser Rendering • ISO/IEC 18004 Compliant
              </p>

            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default QrStudioView;