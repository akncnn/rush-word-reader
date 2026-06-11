import React, { useState, useEffect, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Sürümü direkt kütüphaneden çekip unpkg üzerinden .js (legacy) worker'ı bağla
const PDFJS_VERSION = pdfjsLib.version; 
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;


const FastReader = () => {
  const [text, setText] = useState(() => localStorage.getItem('reader_text') || "");
  const [words, setWords] = useState(() => {
    const saved = localStorage.getItem('reader_text');
    return saved ? saved.trim().split(/\s+/) : [];
  });
  const [currentIndex, setCurrentIndex] = useState(() => Number(localStorage.getItem('reader_index')) || 0);
  const [wpm, setWpm] = useState(() => Number(localStorage.getItem('reader_wpm')) || 300);
  const [theme, setTheme] = useState(() => localStorage.getItem('reader_theme') || 'dark');
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [startPage, setStartPage] = useState(1);

  const themes = {
    dark: {
      bg: "bg-[#1E1E1E]", card: "bg-[#2A2A2A]", cardb: "bg-[#2A2A2B]", text: "text-[#E4E4E4]", subText: "text-[#A0A0A0]",
      accent: "bg-[#4A90E2]", accentText: "text-[#4A90E2]", btnText: "text-[#E4E4E4]", border: "border-[#333333]", progressBg: "bg-gray-700"
    },
    light: {
      bg: "bg-[#F5F5F5]", card: "bg-[#FFFFFF]", text: "text-[#2B2B2B]", subText: "text-[#6B6B6B]",
      accent: "bg-[#4A90E2]", accentText: "text-[#4A90E2]", btnText: "text-[#6B6B6B]", border: "border-[#E0E0E0]", progressBg: "bg-gray-300"
    }
  };
  const activeTheme = themes[theme];

  useEffect(() => { localStorage.setItem('reader_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('reader_wpm', wpm.toString()); }, [wpm]);
  useEffect(() => {
    if (!isPlaying || currentIndex % 10 === 0) {
      localStorage.setItem('reader_index', currentIndex.toString());
    }
  }, [currentIndex, isPlaying]);
  useEffect(() => { localStorage.setItem('reader_text', text); }, [text]);

  const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file || file.type !== 'application/pdf') return;

  setIsLoading(true);
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // v3.x için güvenli yükleme ayarları
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      disableFontFace: true, 
      isEvalSupported: false
    });
    
    const pdf = await loadingTask.promise;
    setTotalPages(pdf.numPages);
    
    let fullText = "";
    // Mobilde şişme yapmaması için ilk 100 sayfayı baz alalım
    const endPage = Math.min(pdf.numPages, 100); 

    for (let i = startPage; i <= endPage; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      
      // Metin parçalarını güvenli bir şekilde birleştir
      const strings = content.items
        .map(item => item.str || "")
        .filter(str => str.trim() !== "");
        
      fullText += strings.join(" ") + " ";
    }

    if (!fullText.trim()) throw new Error("Metin bulunamadı");

    setText(fullText);
    setWords(fullText.trim().split(/\s+/));
    setCurrentIndex(0);
    setIsPlaying(false);

  } catch (error) {
    console.error("Hata detayı:", error);
    alert("PDF yüklenemedi. Sürüm uyumsuzluğu veya dosya boyutu hatası.");
  } finally {
    setIsLoading(false);
  }
};

  const stats = useMemo(() => {
    const total = words.length;
    const remaining = total - currentIndex;
    const progress = total > 0 ? (currentIndex / total) * 100 : 0;
    const remainingSeconds = total > 0 ? Math.ceil((remaining / wpm) * 60) : 0;
    return { progress, minutes: Math.floor(remainingSeconds / 60), seconds: remainingSeconds % 60, remaining };
  }, [words, currentIndex, wpm]);

  const handleStart = () => {
    if (isPlaying) setIsPlaying(false);
    else if (words.length > 0) setIsPlaying(true);
    else if (text.trim() !== "") {
      setWords(text.trim().split(/\s+/));
      setCurrentIndex(0);
      setIsPlaying(true);
    }
  };

  const resetReader = () => {
    setWords([]);
    setCurrentIndex(0);
    setIsPlaying(false);
    setText("");
    localStorage.removeItem('reader_text');
    localStorage.removeItem('reader_index');
  };

  const formatWord = (word) => {
    if (!word) return { pre: "", mid: "", post: "" };
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const len = cleanWord.length;
    let index = len <= 3 ? 0 : len <= 6 ? 1 : len <= 9 ? 2 : 3;
    return { pre: word.substring(0, index), mid: word.substring(index, index + 1), post: word.substring(index + 1) };
  };

  useEffect(() => {
    let timer;
    if (isPlaying && words.length > 0 && currentIndex < words.length) {
      const rawWord = words[currentIndex];
      let interval = (60 / wpm) * 1000;
      if (/[.?!]/.test(rawWord)) interval *= 2.0;
      else if (/[,;]/.test(rawWord)) interval *= 1.5;
      timer = setTimeout(() => setCurrentIndex(prev => prev + 1), interval);
    } else if (currentIndex >= words.length && words.length > 0) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, words, wpm]);

  return (
    <div className={`flex flex-col items-center px-4 py-6 md:p-8 min-h-screen transition-colors duration-500 overflow-x-hidden w-full ${activeTheme.bg} ${activeTheme.text}`}>
      
      {/* Header */}
      <div className="w-full max-w-lg flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h1 className={`text-xl font-bold ${activeTheme.accentText}`}>RSVP Reader v1.5</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={resetReader} 
              className={`flex-1 sm:flex-none px-4 py-2 rounded-full text-[10px] font-bold border transition-all duration-300
                ${theme === 'dark' 
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-700 hover:bg-zinc-700' 
                  : 'bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50'}`}
            >
              Sıfırla
            </button>
            
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
              className={`flex-1 sm:flex-none px-4 py-2 rounded-full text-[10px] font-bold border transition-all duration-300
                ${theme === 'dark' 
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-700 hover:bg-zinc-700' 
                  : 'bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50'}`}
            >
              {theme === 'dark' ? '☀️ Açık' : '🌙 Koyu'}
            </button>
          </div>
        </div>
      </div>

      {/* İstatistik Paneli */}
      <div className="w-full max-w-md flex justify-between px-1 mb-2 text-[9px] md:text-[11px] uppercase tracking-widest font-bold opacity-70">
        <span>Kalan: {stats.remaining} kelime</span>
        <span>Tahmini: {stats.minutes > 0 ? `${stats.minutes} dk ` : ""}{stats.seconds} sn</span>
      </div>

      {/* Okuma Alanı */}
      <div className={`relative w-full max-w-md h-36 md:h-44 ${activeTheme.card} rounded-2xl flex flex-col items-center justify-center border shadow-lg mb-6 overflow-hidden ${activeTheme.border}`}>
        {isLoading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        ) : words.length > 0 && currentIndex < words.length ? (
          <div className="text-2xl sm:text-3xl md:text-5xl font-mono flex tracking-tight px-2 w-full justify-center break-all">
            <span className="text-right flex-1 opacity-30 truncate">{formatWord(words[currentIndex]).pre}</span>
            <span className="text-red-500 font-bold shrink-0">{formatWord(words[currentIndex]).mid}</span>
            <span className="text-left flex-1 opacity-30 truncate">{formatWord(words[currentIndex]).post}</span>
          </div>
        ) : (
          <p className="text-xs italic opacity-50 px-6 text-center">PDF yükleyin veya metin yapıştırın.</p>
        )}
        <div className={`absolute bottom-0 left-0 w-full h-1.5 ${activeTheme.progressBg}`}>
          <div className={`h-full transition-all duration-300 ${activeTheme.accent}`} style={{ width: `${stats.progress}%` }}></div>
        </div>
      </div>

      {/* Teknik Kontroller & PDF Upload */}
      <div className={`w-full max-w-md md:max-w-lg space-y-4 ${activeTheme.card} p-4 md:p-6 rounded-2xl border shadow-xl ${activeTheme.border}`}>
        {!isPlaying && (
          <div className="space-y-4">
            <div className={`relative border-2 border-dashed ${activeTheme.border} rounded-xl p-4 text-center hover:border-blue-400`}>
              <input type="file" accept="application/pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <p className={`text-sm font-bold ${activeTheme.accentText}`}>📄 PDF Yükle</p>
            </div>
            <textarea className={`w-full p-4 text-sm ${activeTheme.bg} rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#4A90E2] resize-none ${activeTheme.border}`} placeholder="Metni buraya yapıştırın..." rows="3" value={text} onChange={(e) => setText(e.target.value)} />
          </div>
        )}

        {!isPlaying && (
          <div className="flex items-center justify-between gap-2 p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <label className="text-[9px] font-bold uppercase opacity-60">Başlangıç:</label>
            <div className="flex items-center gap-1">
              <input type="number" min="1" max={totalPages || 1000} value={startPage} onChange={(e) => setStartPage(Number(e.target.value))} className={`w-12 p-1 rounded bg-transparent border ${activeTheme.border} text-center text-xs`} />
              {totalPages > 0 && <span className="text-[9px] opacity-40">/ {totalPages}</span>}
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <label className="text-[9px] font-black opacity-40 uppercase">HIZ (WPM)</label>
            <div className="flex items-center gap-2">
              <input type="number" value={wpm} onChange={(e) => setWpm(Number(e.target.value))} className={`w-14 px-1 py-1 rounded-lg font-bold text-center text-xs border ${activeTheme.card} ${activeTheme.accentText} ${activeTheme.border}`} />
            </div>
          </div>
          <input type="range" min="100" max="1000" step="10" value={wpm} onChange={(e) => setWpm(Number(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#4A90E2] bg-gray-600" />
        </div>
        <button 
          onClick={handleStart} 
          disabled={isLoading} 
          className={`w-full py-4 rounded-xl font-bold text-base transition-all active:scale-95 shadow-lg border-2
            ${isPlaying 
              ? "bg-orange-500 border-orange-600 text-white" 
              : theme === 'dark' 
                ? "bg-white text-black border-white" // Koyu temada buton BEYAZ olmalı
                : "bg-black text-white border-black" // Açık temada buton SİYAH olmalı
            } 
            disabled:opacity-50`}
        >
          {isPlaying ? "DURAKLAT" : words.length > 0 ? (currentIndex > 0 ? "DEVAM ET" : "BAŞLAT") : "BAŞLAT"}
        </button>
      </div>
    </div>
  );
};

export default FastReader;