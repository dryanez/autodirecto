import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { Upload, Download, Wand2, Loader2, Settings, Gauge, Wrench, Fuel, Image as ImageIcon, Move, ZoomIn, Users } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface CarData {
  brand: string;
  model: string;
  year: string;
  price: string;
  engine: string;
  mileage: string;
  maintenance: string;
  owners: string;
  fuel: string;
  logo: string | null;
  image: string | null;
}

interface PreviewProps {
  data: CarData;
  imagePos: { x: number; y: number };
  imageScale: number;
  onImagePosChange: (pos: { x: number; y: number }) => void;
}

const Preview = React.forwardRef<HTMLDivElement, PreviewProps>(({ data, imagePos, imageScale, onImagePosChange }, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - imagePos.x, y: e.clientY - imagePos.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    onImagePosChange({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={ref}
      className={`relative w-[1080px] h-[1350px] bg-[#171719] overflow-hidden font-sans shadow-2xl ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Image Layer */}
      {data.image && (
        <div 
          className="absolute inset-0 w-full h-full origin-center"
          style={{
            backgroundImage: `url(${data.image})`,
            backgroundSize: `${imageScale}%`,
            backgroundPosition: `calc(50% + ${imagePos.x}px) calc(50% + ${imagePos.y}px)`,
            backgroundRepeat: 'no-repeat'
          }}
        />
      )}

      {/* Elegant Top Gradient */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#171719]/90 via-[#171719]/40 to-transparent pointer-events-none z-10"></div>

      {/* Header Section */}
      <div className="absolute top-[60px] left-[60px] right-[60px] z-20 pointer-events-none flex justify-between items-start">
        <div className="flex flex-col">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-[1px] w-12 bg-[#b5b5b3]"></div>
            <p className="text-[#b5b5b3] text-[20px] tracking-[0.5em] uppercase font-medium">
              {data.brand || 'MARCA'}
            </p>
          </div>
          <h1 className="text-[#F1F1F1] text-[80px] font-light tracking-tight uppercase leading-[0.9]">
            {data.model || 'MODELO'}
          </h1>
          <p className="text-[#F1F1F1] text-[32px] font-light tracking-widest mt-2 opacity-80">
            {data.year || 'AÑO'}
          </p>
        </div>

        {/* Company Logo */}
        <div className="flex flex-col items-end">
          <div className="backdrop-blur-md bg-[#171719]/40 p-6 rounded-xl flex items-center justify-center shadow-2xl border border-[#F1F1F1]/10 w-[300px] h-[120px]">
            {data.logo ? (
              <img src={data.logo} alt="Company Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-[#b5b5b3] text-[14px] font-medium tracking-[0.2em] uppercase text-center">Tu Logo Aquí</span>
            )}
          </div>
        </div>
      </div>

      {/* Elegant Bottom Gradient */}
      <div className="absolute bottom-0 left-0 w-full h-[700px] bg-gradient-to-t from-[#171719] via-[#171719]/80 to-transparent pointer-events-none z-10 flex flex-col justify-end p-[60px]">
        
        {/* Glassmorphism Info Card */}
        <div className="w-full backdrop-blur-xl bg-[#171719]/40 border border-[#F1F1F1]/10 rounded-3xl p-10 flex flex-col gap-8 shadow-2xl">
          
          {/* Price Section */}
          <div className="flex justify-between items-end border-b border-[#F1F1F1]/10 pb-8">
            <div className="flex flex-col">
              <span className="text-[#b5b5b3] text-[16px] uppercase tracking-[0.4em] font-medium mb-2">Precio de Venta</span>
              <p className="text-[#F1F1F1] text-[72px] font-light tracking-tighter leading-none">{data.price || '$0'}</p>
            </div>
            <div className="text-right mb-2">
               <span className="inline-block px-5 py-2 border border-[#b5b5b3]/30 rounded-full text-[#b5b5b3] text-[12px] tracking-[0.3em] uppercase font-medium">
                 Selección Premium
               </span>
            </div>
          </div>

          {/* Specs Grid - Minimalist */}
          <div className="grid grid-cols-3 gap-y-8 gap-x-4">
            {/* Spec Item */}
            <div className="flex flex-col gap-2">
              <span className="text-[#b5b5b3] text-[12px] font-medium uppercase tracking-[0.2em]">Motor</span>
              <span className="text-[#F1F1F1] text-[22px] font-light tracking-wide">{data.engine || '-'}</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[#b5b5b3] text-[12px] font-medium uppercase tracking-[0.2em]">Kilometraje</span>
              <span className="text-[#F1F1F1] text-[22px] font-light tracking-wide">{data.mileage || '-'}</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[#b5b5b3] text-[12px] font-medium uppercase tracking-[0.2em]">Combustible</span>
              <span className="text-[#F1F1F1] text-[22px] font-light tracking-wide uppercase">{data.fuel || '-'}</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[#b5b5b3] text-[12px] font-medium uppercase tracking-[0.2em]">Dueños</span>
              <span className="text-[#F1F1F1] text-[22px] font-light tracking-wide uppercase">{data.owners || '-'}</span>
            </div>
            <div className="flex flex-col gap-2 col-span-2">
              <span className="text-[#b5b5b3] text-[12px] font-medium uppercase tracking-[0.2em]">Mantenciones</span>
              <span className="text-[#F1F1F1] text-[22px] font-light tracking-wide uppercase">{data.maintenance || '-'}</span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
});

export default function App() {
  const [data, setData] = useState<CarData>({
    brand: 'MERCEDES',
    model: 'C200 AMG',
    year: '2017',
    price: '$20.990.000',
    engine: '2.0 lts',
    mileage: '97.000 kms',
    maintenance: 'MANTENCIONES AL DÍA',
    owners: '3 DUEÑOS',
    fuel: 'bencina',
    logo: null,
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1080&auto=format&fit=crop',
  });

  const [imagePos, setImagePos] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(150);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('A white Mercedes C200 AMG parked on a sunny street, professional car photography, 4k');
  const previewRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!previewRef.current) return;
    try {
      const dataUrl = await toPng(previewRef.current, { cacheBust: true, pixelRatio: 1 });
      const link = document.createElement('a');
      link.download = `${data.brand}-${data.model}-overlay.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
      alert('Error al descargar la imagen. Por favor, inténtalo de nuevo.');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setData({ ...data, image: event.target?.result as string });
        setImagePos({ x: 0, y: 0 });
        setImageScale(150);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setData({ ...data, logo: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateImage = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: '3:4',
            imageSize: '1K',
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          const imageUrl = `data:image/png;base64,${base64EncodeString}`;
          setData({ ...data, image: imageUrl });
          setImagePos({ x: 0, y: 0 });
          setImageScale(150);
          break;
        }
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Error al generar la imagen. Por favor, inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[#171719] flex flex-col md:flex-row font-sans">
      {/* Sidebar / Controls */}
      <div className="w-full md:w-1/3 lg:w-[400px] bg-[#171719] border-r border-[#4c4b4b]/50 p-8 overflow-y-auto h-screen shadow-2xl z-10 text-[#F1F1F1]">
        <div className="flex items-center gap-4 mb-10">
          <div className="bg-[#F1F1F1] p-2.5 rounded-xl">
            <ImageIcon className="w-5 h-5 text-[#171719]" />
          </div>
          <h1 className="text-xl font-light tracking-[0.2em] uppercase">Estudio</h1>
        </div>

        <div className="space-y-10">
          {/* Image Source Section */}
          <div className="space-y-5">
            <h3 className="text-[11px] font-semibold text-[#b5b5b3] uppercase tracking-[0.2em] border-b border-[#4c4b4b]/50 pb-3">1. Imagen</h3>
            
            <div className="space-y-5">
              <div>
                <label className="flex items-center justify-center w-full h-14 px-4 transition bg-[#171719] border border-[#4c4b4b] border-dashed rounded-xl appearance-none cursor-pointer hover:border-[#b5b5b3] focus:outline-none">
                  <span className="flex items-center space-x-3">
                    <Upload className="w-4 h-4 text-[#b5b5b3]" />
                    <span className="text-sm font-medium text-[#b5b5b3]">Subir Foto</span>
                  </span>
                  <input type="file" name="file_upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-[#4c4b4b]/50"></div>
                <span className="flex-shrink-0 mx-4 text-[#b5b5b3] text-[10px] font-medium uppercase tracking-widest">O Generar con IA</span>
                <div className="flex-grow border-t border-[#4c4b4b]/50"></div>
              </div>

              <div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full px-4 py-3 border border-[#4c4b4b] rounded-xl focus:ring-1 focus:ring-[#b5b5b3] focus:border-[#b5b5b3] text-sm bg-[#171719] text-[#F1F1F1] placeholder-[#4c4b4b] transition-colors resize-none"
                  rows={3}
                  placeholder="Describe el auto..."
                />
                <button
                  onClick={generateImage}
                  disabled={isGenerating || !prompt}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-[#F1F1F1] hover:bg-white text-[#171719] py-3 px-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold tracking-wide"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {isGenerating ? 'Generando...' : 'Generar Imagen'}
                </button>
              </div>

              {/* Image Controls */}
              <div className="pt-2">
                <label className="flex items-center gap-2 text-[11px] font-semibold text-[#b5b5b3] uppercase tracking-[0.1em] mb-4">
                  <ZoomIn className="w-3.5 h-3.5" />
                  Escala
                </label>
                <input 
                  type="range" 
                  min="50" 
                  max="300" 
                  value={imageScale} 
                  onChange={(e) => setImageScale(Number(e.target.value))}
                  className="w-full h-1 bg-[#4c4b4b] rounded-lg appearance-none cursor-pointer accent-[#F1F1F1]"
                />
                <div className="flex items-center gap-3 mt-5 text-[11px] text-[#b5b5b3] bg-[#171719] border border-[#4c4b4b]/50 p-3.5 rounded-xl">
                  <Move className="w-4 h-4 shrink-0" />
                  <span>Arrastra la imagen de vista previa para reposicionarla.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Car Details Section */}
          <div className="space-y-5">
            <h3 className="text-[11px] font-semibold text-[#b5b5b3] uppercase tracking-[0.2em] border-b border-[#4c4b4b]/50 pb-3">2. Detalles</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium text-[#b5b5b3] uppercase tracking-wider mb-1.5">Marca</label>
                  <input type="text" name="brand" value={data.brand} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-[#4c4b4b] rounded-xl focus:ring-1 focus:ring-[#b5b5b3] focus:border-[#b5b5b3] text-sm uppercase bg-[#171719] text-[#F1F1F1] transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[#b5b5b3] uppercase tracking-wider mb-1.5">Año</label>
                  <input type="text" name="year" value={data.year} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-[#4c4b4b] rounded-xl focus:ring-1 focus:ring-[#b5b5b3] focus:border-[#b5b5b3] text-sm bg-[#171719] text-[#F1F1F1] transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[#b5b5b3] uppercase tracking-wider mb-1.5">Modelo</label>
                <input type="text" name="model" value={data.model} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-[#4c4b4b] rounded-xl focus:ring-1 focus:ring-[#b5b5b3] focus:border-[#b5b5b3] text-sm uppercase bg-[#171719] text-[#F1F1F1] transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[#b5b5b3] uppercase tracking-wider mb-1.5">Precio</label>
                <input type="text" name="price" value={data.price} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-[#4c4b4b] rounded-xl focus:ring-1 focus:ring-[#b5b5b3] focus:border-[#b5b5b3] text-sm font-bold bg-[#171719] text-[#F1F1F1] transition-colors" />
              </div>
            </div>
          </div>

          {/* Specs Section */}
          <div className="space-y-5">
            <h3 className="text-[11px] font-semibold text-[#b5b5b3] uppercase tracking-[0.2em] border-b border-[#4c4b4b]/50 pb-3">3. Especificaciones</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-medium text-[#b5b5b3] uppercase tracking-wider mb-1.5">Motor</label>
                <input type="text" name="engine" value={data.engine} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-[#4c4b4b] rounded-xl focus:ring-1 focus:ring-[#b5b5b3] focus:border-[#b5b5b3] text-sm bg-[#171719] text-[#F1F1F1] transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[#b5b5b3] uppercase tracking-wider mb-1.5">Kilometraje</label>
                <input type="text" name="mileage" value={data.mileage} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-[#4c4b4b] rounded-xl focus:ring-1 focus:ring-[#b5b5b3] focus:border-[#b5b5b3] text-sm bg-[#171719] text-[#F1F1F1] transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[#b5b5b3] uppercase tracking-wider mb-1.5">Mantenciones</label>
                <input type="text" name="maintenance" value={data.maintenance} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-[#4c4b4b] rounded-xl focus:ring-1 focus:ring-[#b5b5b3] focus:border-[#b5b5b3] text-sm uppercase bg-[#171719] text-[#F1F1F1] transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[#b5b5b3] uppercase tracking-wider mb-1.5">Dueños</label>
                <input type="text" name="owners" value={data.owners} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-[#4c4b4b] rounded-xl focus:ring-1 focus:ring-[#b5b5b3] focus:border-[#b5b5b3] text-sm uppercase bg-[#171719] text-[#F1F1F1] transition-colors" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-medium text-[#b5b5b3] uppercase tracking-wider mb-1.5">Tipo de Combustible</label>
                <input type="text" name="fuel" value={data.fuel} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-[#4c4b4b] rounded-xl focus:ring-1 focus:ring-[#b5b5b3] focus:border-[#b5b5b3] text-sm uppercase bg-[#171719] text-[#F1F1F1] transition-colors" />
              </div>
            </div>
          </div>

          {/* Company Section */}
          <div className="space-y-5">
            <h3 className="text-[11px] font-semibold text-[#b5b5b3] uppercase tracking-[0.2em] border-b border-[#4c4b4b]/50 pb-3">4. Marca</h3>
            <div>
              <label className="block text-[10px] font-medium text-[#b5b5b3] uppercase tracking-wider mb-2">Logo de la Empresa</label>
              <label className="flex items-center justify-center w-full h-14 px-4 transition bg-[#171719] border border-[#4c4b4b] border-dashed rounded-xl appearance-none cursor-pointer hover:border-[#b5b5b3] focus:outline-none">
                <span className="flex items-center space-x-3">
                  <Upload className="w-4 h-4 text-[#b5b5b3]" />
                  <span className="text-sm font-medium text-[#b5b5b3]">Subir Logo</span>
                </span>
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>

        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0a0a0a] overflow-hidden relative">
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-[#F1F1F1] hover:bg-white text-[#171719] px-6 py-3 rounded-xl font-bold shadow-xl transition transform hover:scale-105"
          >
            <Download className="w-5 h-5" />
            Descargar Imagen Lista
          </button>
        </div>

        {/* Scaled container for the preview */}
        <div className="relative flex items-center justify-center w-full h-full">
          <div 
            className="origin-center shadow-2xl ring-1 ring-white/10"
            style={{
              transform: 'scale(min(1, min(calc(100vw * 0.6 / 1080), calc(100vh * 0.8 / 1350))))',
            }}
          >
            <Preview 
              data={data} 
              ref={previewRef} 
              imagePos={imagePos}
              imageScale={imageScale}
              onImagePosChange={setImagePos}
            />
          </div>
        </div>
        
        <p className="mt-6 text-[#b5b5b3] text-sm text-center max-w-md">
          La vista previa está reducida para ajustarse a tu pantalla. La imagen descargada será de alta calidad (1080x1350).
        </p>
      </div>
    </div>
  );
}
