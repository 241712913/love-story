import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  User,
  Save,
  Plus,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Quote,
  Stars,
  ChevronDown,
  Camera,
  X,
  Edit3
} from 'lucide-react';

/*
========================================
GEMINI API CONFIGURATION
========================================
*/
const apiKey = ""; // API Key otomatis terisi di environment

export default function App() {
  const [bio, setBio] = useState({
    partner1: 'Arauna', // Cowo duluan
    partner2: 'Yemima', // Cewe kedua
    photo1: null,
    photo2: null,
    ourStory: 'Tuliskan momen yang selalu ingin kalian kenang bersama...',
    anniversary: ''
  });
  const [photos, setPhotos] = useState([]);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Gallery Upload Modal States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [tempPhoto, setTempPhoto] = useState(null);
  const [tempCaption, setTempCaption] = useState('');
  
  // Gemini States
  const [aiLoading, setAiLoading] = useState(false);
  const [memoryNote, setMemoryNote] = useState('');
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  
  const fileInputRef = useRef(null);
  const profile1Ref = useRef(null);
  const profile2Ref = useRef(null);
  const narrativeRef = useRef(null);

  // Load Data
  useEffect(() => {
    try {
      const savedBio = localStorage.getItem('love_story_bio');
      const savedPhotos = localStorage.getItem('love_story_photos');
      const savedMemory = localStorage.getItem('love_story_memory');
      if (savedBio) setBio(JSON.parse(savedBio));
      if (savedPhotos) setPhotos(JSON.parse(savedPhotos));
      if (savedMemory) setMemoryNote(savedMemory);
    } catch (err) {
      console.error('LOAD ERROR:', err);
    }
  }, []);

  const saveBio = () => {
    localStorage.setItem('love_story_bio', JSON.stringify(bio));
    setIsEditingBio(false);
  };

  const scrollToNarrative = () => {
    narrativeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleProfileUpload = (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setBio(prev => ({ ...prev, [target]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempPhoto(reader.result);
      setShowUploadModal(true);
      setUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const confirmUpload = () => {
    const newPhoto = { 
      id: Date.now(), 
      url: tempPhoto, 
      caption: tempCaption || 'Momen manis kita',
      createdAt: new Date().toISOString() 
    };
    const updatedPhotos = [newPhoto, ...photos];
    setPhotos(updatedPhotos);
    localStorage.setItem('love_story_photos', JSON.stringify(updatedPhotos));
    
    setShowUploadModal(false);
    setTempPhoto(null);
    setTempCaption('');
  };

  const deletePhoto = (id) => {
    const updatedPhotos = photos.filter((p) => p.id !== id);
    setPhotos(updatedPhotos);
    localStorage.setItem('love_story_photos', JSON.stringify(updatedPhotos));
  };

  /*
  ========================================
  GEMINI API INTEGRATIONS
  ========================================
  */

  const fetchGemini = async (prompt, systemPrompt = "") => {
    let retries = 0;
    const maxRetries = 5;
    while (retries < maxRetries) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined
          })
        });
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
      } catch (err) {
        retries++;
        await new Promise(res => setTimeout(res, Math.pow(2, retries) * 1000));
      }
    }
    throw new Error("Gagal menghubungi AI.");
  };







  return (
    <div className="min-h-screen bg-[#FFF9F9] text-[#5C4540] font-sans selection:bg-rose-200/50">
      
      {/* Upload Modal for Gallery */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#5C4540]/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-fade-up relative">
            <button onClick={() => setShowUploadModal(false)} className="absolute top-6 right-6 text-rose-300 hover:text-rose-500 transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-2xl font-serif text-[#5C4540] mb-6 text-center">Tambah Kenangan</h3>
            
            <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-rose-50 border-2 border-rose-100">
              <img src={tempPhoto} alt="Preview" className="w-full h-full object-cover" />
            </div>
            
            <div className="space-y-4">
              <label className="text-xs font-bold text-rose-400 uppercase tracking-widest ml-2 block">Momen apa ini?</label>
              <textarea 
                className="w-full bg-rose-50/50 border border-rose-100 p-4 rounded-2xl outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none text-[#5C4540]" 
                placeholder="Tuliskan cerita manis di balik foto ini..."
                rows={3}
                value={tempCaption}
                onChange={(e) => setTempCaption(e.target.value)}
              />
              <button 
                onClick={confirmUpload}
                className="w-full bg-[#D49A89] hover:bg-[#C28573] text-white py-4 rounded-full font-bold tracking-widest text-sm transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2"
              >
                <Save size={18} /> SIMPAN MOMEN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <header className="fixed top-0 left-0 w-full z-[100] px-8 py-8 flex justify-between items-center pointer-events-none">
        <div className="bg-white/70 backdrop-blur-md border border-rose-100 px-6 py-2.5 rounded-full pointer-events-auto shadow-sm flex items-center gap-3">
          <Heart size={14} className="text-[#D49A89] fill-[#D49A89]" />
          <span className="text-[10px] font-bold tracking-[0.6em] uppercase text-[#5C4540]">
            {bio.partner1} & {bio.partner2}
          </span>
        </div>
        <div className="pointer-events-auto flex gap-4">
          <button 
            onClick={() => isEditingBio ? saveBio() : setIsEditingBio(true)} 
            className={`group px-6 py-3 transition-all duration-500 rounded-full border border-rose-100 shadow-sm flex items-center gap-2 text-xs font-bold tracking-widest ${isEditingBio ? 'bg-[#D49A89] text-white' : 'bg-white/80 text-[#D49A89] hover:bg-white'}`}
          >
            {isEditingBio ? <><Save size={16} /> SIMPAN</> : <><Edit3 size={16} /> EDIT</>}
          </button>
        </div>
      </header>

      {/* Sweet Hero Section */}
      <section className="relative h-screen w-full flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[10%] left-[15%] w-[40vw] h-[40vw] bg-[#FFE4E1]/60 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-[10%] right-[15%] w-[45vw] h-[45vw] bg-[#FFF0F5]/80 rounded-full blur-[100px] animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 text-center animate-fade-in space-y-6">
          <div className="flex items-center justify-center gap-4 opacity-70 mb-4">
             <Stars size={16} className="text-[#D49A89]" />
             <span className="text-[10px] font-bold tracking-[0.8em] text-[#D49A89] uppercase">Kisah Kasih Kita</span>
             <Stars size={16} className="text-[#D49A89]" />
          </div>
          
          <h1 className="text-7xl md:text-[11rem] font-serif font-medium tracking-tight leading-[0.9] text-[#5C4540]">
            Love<br/>
            <span className="italic font-light text-[#D49A89]">Story</span>
          </h1>

          <p className="text-lg md:text-xl font-serif italic text-[#8B736A] mt-6">
            Menyimpan setiap detik manis yang {bio.partner1} & {bio.partner2} lewati bersama.
          </p>

          <button onClick={scrollToNarrative} className="pt-16 animate-bounce text-[#D49A89] inline-flex items-center justify-center transition-transform hover:-translate-y-1">
            <ChevronDown size={32} strokeWidth={1.5} />
          </button>
        </div>
      </section>

      {/* Split Profile Section */}
      <section className="relative py-24 px-6 md:px-12 max-w-7xl mx-auto">
        
        <div className="flex justify-center mb-10 relative z-10">
           {isEditingBio ? (
             <button onClick={saveBio} className="px-8 py-3 bg-[#D49A89] text-white rounded-full text-xs font-bold tracking-[0.2em] shadow-lg flex items-center gap-2 hover:bg-[#C28573] transition-colors animate-fade-in">
               <Save size={16} /> SIMPAN IDENTITAS KITA
             </button>
           ) : (
             <button onClick={() => setIsEditingBio(true)} className="px-8 py-3 bg-white border border-rose-100 text-rose-400 rounded-full text-xs font-bold tracking-[0.2em] shadow-sm flex items-center gap-2 hover:bg-rose-50 transition-colors animate-fade-in">
               <Edit3 size={16} /> UBAH IDENTITAS
             </button>
           )}
        </div>

        <div className="bg-white rounded-[4rem] shadow-[0_20px_60px_rgba(235,214,210,0.4)] border border-rose-50 p-8 md:p-16 relative">
          
          <div className="hidden lg:flex absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 z-20 w-24 h-24 bg-[#FFF9F9] rounded-full border-4 border-white shadow-lg items-center justify-center">
            <Heart size={32} className="text-[#D49A89] fill-[#D49A89] animate-pulse" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 relative">
            
            {/* Profile Left (Him - Arauna) */}
            <div className="relative group text-center lg:text-right flex flex-col items-center lg:items-end">
              <div className="w-56 h-72 md:w-72 md:h-96 rounded-[3rem] overflow-hidden bg-stone-50 border-[8px] border-white shadow-xl relative mb-6">
                {bio.photo1 ? (
                  <img src={bio.photo1} alt={bio.partner1} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 gap-2">
                    <ImageIcon size={40} />
                    <span className="text-xs font-serif italic">Foto {bio.partner1}</span>
                  </div>
                )}
                {isEditingBio && (
                  <button onClick={() => profile1Ref.current.click()} className="absolute inset-0 bg-[#5C4540]/40 flex flex-col items-center justify-center text-white backdrop-blur-sm transition-all opacity-100 hover:bg-[#5C4540]/60">
                    <Camera size={32} className="mb-2" />
                    <span className="text-xs font-bold tracking-widest uppercase">Ubah Foto</span>
                  </button>
                )}
                <input type="file" hidden ref={profile1Ref} accept="image/*" onChange={(e) => handleProfileUpload(e, 'photo1')} />
              </div>
              <div className="space-y-2 w-full max-w-[280px]">
                <span className="text-[10px] font-bold tracking-[0.4em] text-stone-400 uppercase">Him</span>
                {isEditingBio ? (
                  <input 
                    className="w-full bg-transparent border-b-2 border-stone-200 text-4xl font-serif text-[#5C4540] text-center lg:text-right outline-none focus:border-stone-400 placeholder:text-stone-200 pb-2" 
                    value={bio.partner1} 
                    onChange={e => setBio({...bio, partner1: e.target.value})} 
                    placeholder="Nama Cowok"
                  />
                ) : (
                  <h2 className="text-4xl font-serif text-[#5C4540]">{bio.partner1}</h2>
                )}
              </div>
            </div>

            {/* Profile Right (Her - Yemima) */}
            <div className="relative group text-center lg:text-left flex flex-col items-center lg:items-start">
              <div className="w-56 h-72 md:w-72 md:h-96 rounded-[3rem] overflow-hidden bg-rose-50 border-[8px] border-white shadow-xl relative mb-6">
                {bio.photo2 ? (
                  <img src={bio.photo2} alt={bio.partner2} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-rose-300 gap-2">
                    <ImageIcon size={40} />
                    <span className="text-xs font-serif italic">Foto {bio.partner2}</span>
                  </div>
                )}
                {isEditingBio && (
                  <button onClick={() => profile2Ref.current.click()} className="absolute inset-0 bg-[#5C4540]/40 flex flex-col items-center justify-center text-white backdrop-blur-sm transition-all opacity-100 hover:bg-[#5C4540]/60">
                    <Camera size={32} className="mb-2" />
                    <span className="text-xs font-bold tracking-widest uppercase">Ubah Foto</span>
                  </button>
                )}
                <input type="file" hidden ref={profile2Ref} accept="image/*" onChange={(e) => handleProfileUpload(e, 'photo2')} />
              </div>
              <div className="space-y-2 w-full max-w-[280px]">
                <span className="text-[10px] font-bold tracking-[0.4em] text-rose-400 uppercase">Her</span>
                {isEditingBio ? (
                  <input 
                    className="w-full bg-transparent border-b-2 border-rose-200 text-4xl font-serif text-[#5C4540] text-center lg:text-left outline-none focus:border-rose-400 placeholder:text-rose-200 pb-2" 
                    value={bio.partner2} 
                    onChange={e => setBio({...bio, partner2: e.target.value})} 
                    placeholder="Nama Cewek"
                  />
                ) : (
                  <h2 className="text-4xl font-serif text-[#5C4540]">{bio.partner2}</h2>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Narrative Section */}
      <section ref={narrativeRef} className="relative py-24 px-6 md:px-12 max-w-5xl mx-auto">
        <div className="relative">
          <Quote size={80} className="absolute -top-10 -left-6 md:-left-12 text-[#FFE4E1] opacity-60 z-0" />
          
          <div className="relative z-10">
            {isEditingBio ? (
              <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-rose-100 space-y-6 animate-fade-up">
                <h3 className="text-2xl font-serif text-[#5C4540] mb-6">Ubah Kisah Kalian</h3>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-2">Tanggal Jadi (Anniversary)</label>
                  <input type="date" className="w-full bg-rose-50/50 border border-rose-100 p-4 rounded-2xl outline-none focus:border-rose-400 text-[#5C4540]" value={bio.anniversary} onChange={e => setBio({...bio, anniversary: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-2">Catatan Rindu Kita</label>
                  <textarea className="w-full h-64 bg-rose-50/50 border border-rose-100 p-6 rounded-[2rem] outline-none focus:border-rose-400 resize-none leading-relaxed text-md text-[#5C4540]" value={bio.ourStory} onChange={e => setBio({...bio, ourStory: e.target.value})} />
                </div>
                <button onClick={saveBio} className="w-full bg-[#D49A89] hover:bg-[#C28573] text-white py-5 rounded-full font-bold tracking-widest text-sm transition-all shadow-lg flex items-center justify-center gap-3">
                  <Save size={20} /> SIMPAN CERITA
                </button>
              </div>
            ) : (
              <div className="space-y-16 text-center">
                <p className="text-[11px] font-bold tracking-[0.6em] text-rose-400 uppercase">
                  Bersama Sejak {bio.anniversary ? new Date(bio.anniversary).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Hari Itu'}
                </p>
                <p className="text-3xl md:text-4xl font-serif italic leading-relaxed text-[#5C4540]">
                  "{bio.ourStory}"
                </p>
              </div>
            )}
          </div>

          {!isEditingBio && (
            <div className="pt-24 space-y-10">
              <div className="bg-gradient-to-br from-white to-[#FFF0F5] p-10 md:p-16 rounded-[4rem] border border-rose-100 shadow-[0_20px_50px_rgba(235,214,210,0.3)] flex flex-col items-center text-center space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-rose-200/30 rounded-full blur-3xl" />
                <Sparkles size={36} className="text-[#D49A89]" />
                <div className="max-w-xl">
                  <h4 className="text-3xl font-serif text-[#5C4540] mb-4">Kotak Kenangan</h4>
                  <p className="text-[#8B736A] leading-relaxed italic text-sm">Tulis kenangan manis yang ingin kalian simpan bersama.</p>
                </div>
                
                <div className="w-full space-y-4">
                  <textarea 
                    className="w-full h-48 bg-white/60 backdrop-blur-md border border-rose-100 p-6 rounded-[2rem] outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all resize-none text-[#5C4540] placeholder:text-[#8B736A]/50" 
                    placeholder="Tulis kenangan manis kalian di sini..."
                    value={memoryNote}
                    onChange={(e) => setMemoryNote(e.target.value)}
                  />
                  <button 
                    onClick={() => {
                      localStorage.setItem('love_story_memory', memoryNote);
                      alert('Kenangan tersimpan! ❤️');
                    }}
                    className="w-full bg-[#D49A89] hover:bg-[#C28573] text-white py-4 rounded-full font-bold tracking-widest text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> SIMPAN KENANGAN
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Sweet Gallery Section */}
      <section className="py-32 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 text-center md:text-left">
            <div>
              <span className="text-[#D49A89] text-[11px] font-bold uppercase tracking-[0.4em] mb-3 block italic">Memories</span>
              <h2 className="text-5xl md:text-7xl font-serif font-medium tracking-tight text-[#5C4540] leading-none">Galeri Kenangan</h2>
            </div>
            <button 
              onClick={() => fileInputRef.current.click()} 
              disabled={uploading}
              className="bg-[#5C4540] text-white px-10 py-4 rounded-full font-bold text-[11px] tracking-[0.2em] hover:bg-[#4A3733] transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 md:mb-1 w-full md:w-auto"
            >
              {uploading ? <Loader2 className="animate-spin" size={18}/> : <Plus size={18}/>} 
              TAMBAH FOTO
            </button>
            <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileSelect} />
          </div>

          {photos.length === 0 ? (
            <div className="w-full h-80 flex flex-col items-center justify-center bg-[#FFF9F9] border-2 border-dashed border-rose-200 rounded-[3rem] text-rose-300">
              <ImageIcon size={64} className="mb-4 opacity-50" />
              <p className="font-serif italic text-2xl">Belum ada foto manis yang tersimpan...</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
              {photos.map((photo) => (
                <div key={photo.id} className="break-inside-avoid relative group rounded-[2rem] overflow-hidden bg-rose-50 shadow-md hover:shadow-xl transition-all duration-500">
                  <img src={photo.url} alt="Memory" className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-[#5C4540]/90 via-[#5C4540]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                    <div className="translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                      <p className="text-white font-serif italic text-lg leading-tight mb-3 drop-shadow-md">"{photo.caption}"</p>
                      <div className="flex justify-between items-center border-t border-white/20 pt-3">
                        <span className="text-[9px] font-bold tracking-widest text-rose-200 uppercase">
                          {new Date(photo.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <button onClick={() => deletePhoto(photo.id)} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-rose-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sweet Footer */}
      <footer className="py-32 text-center bg-[#FFF9F9]">
        <div className="max-w-2xl mx-auto space-y-10 px-8">
          <Heart size={40} className="mx-auto text-[#D49A89] fill-[#FFE4E1] animate-pulse" />
          <h3 className="text-3xl font-serif italic text-[#5C4540] leading-relaxed">"Karena bersamamu, setiap hari adalah puisi yang indah."</h3>
          <div className="pt-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-rose-400">
              For {bio.partner1} & {bio.partner2}
            </p>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@300;400;600;700&display=swap');

        .font-serif { font-family: 'Playfair Display', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fade-in { animation: fadeIn 1.5s ease-out forwards; }
        .animate-fade-up { animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        body { 
          background-color: #FFF9F9;
          margin: 0;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          scroll-behavior: smooth;
        }
        
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #FFF9F9; }
        ::-webkit-scrollbar-thumb { background: #E5C3BB; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #D49A89; }
      `}} />

    </div>
  );
}