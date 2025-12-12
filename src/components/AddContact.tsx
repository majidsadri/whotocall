'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Mic, Loader2, Check, Linkedin, X, Sparkles, MapPin, Building2, Briefcase, Calendar, Navigation, Clock, CheckCircle2, Star } from 'lucide-react';
import type { ExtractedTags } from '@/types';

export default function AddContact() {
  const [step, setStep] = useState<'input' | 'review' | 'done'>('input');
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [cardText, setCardText] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedTags | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Meeting location and date
  const [meetingLocation, setMeetingLocation] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [meetingDate, setMeetingDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });

  // Priority (0-100)
  const [priority, setPriority] = useState(50);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) return;

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'User-Agent': 'WhoToCall/1.0' } }
          );

          if (response.ok) {
            const data = await response.json();
            const parts = [];
            if (data.address?.suburb || data.address?.neighbourhood) {
              parts.push(data.address.suburb || data.address.neighbourhood);
            }
            if (data.address?.city || data.address?.town || data.address?.village) {
              parts.push(data.address.city || data.address.town || data.address.village);
            }
            if (data.address?.state) {
              parts.push(data.address.state);
            }
            if (data.address?.country && parts.length < 2) {
              parts.push(data.address.country);
            }
            setMeetingLocation(parts.join(', ') || '');
          }
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
        } finally {
          setIsGettingLocation(false);
        }
      },
      () => setIsGettingLocation(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = (e) => setCardImage(e.target?.result as string);
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/ocr', { method: 'POST', body: formData });
      if (response.ok) {
        const data = await response.json();
        setCardText(data.text);
      }
    } catch (err) {
      setError('Failed to scan card');
    } finally {
      setIsProcessing(false);
    }
  };

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      const response = await fetch('/api/transcribe', { method: 'POST', body: formData });
      if (response.ok) {
        const data = await response.json();
        if (data.text) setTranscript((prev) => (prev ? `${prev} ${data.text}` : data.text));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
        await transcribeAudio(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const processAndExtract = async () => {
    if (!transcript && !cardText) return;
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: transcript, cardText }),
      });
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      setExtractedData(data);
      setStep('review');
    } catch (err) {
      setError('Failed to extract info');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveContact = async () => {
    if (!extractedData) return;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...extractedData,
          linkedin_url: linkedinUrl || undefined,
          raw_context: transcript,
          met_date: meetingDate ? new Date(meetingDate).toISOString() : undefined,
          meeting_location: meetingLocation || undefined,
          priority,
        }),
      });
      if (!response.ok) throw new Error('Failed');
      setStep('done');
    } catch (err) {
      setError('Failed to save');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setStep('input');
    setCardImage(null);
    setCardText('');
    setAudioBlob(null);
    setTranscript('');
    setExtractedData(null);
    setLinkedinUrl('');
    setError(null);
    setMeetingDate(new Date().toISOString().slice(0, 16));
    setPriority(50);
    getCurrentLocation();
  };

  // Get priority label and color (3 levels, green spectrum)
  const getPriorityInfo = (value: number) => {
    if (value >= 67) return { label: 'High', color: 'text-green-700' };
    if (value >= 34) return { label: 'Medium', color: 'text-green-500' };
    return { label: 'Low', color: 'text-green-400' };
  };

  // Success state
  if (step === 'done') {
    return (
      <div className="card p-10 text-center animate-in">
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-500/20">
          <CheckCircle2 className="text-white" size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Contact Saved!</h2>
        <p className="text-sm text-gray-500 mb-8">
          Added to your network with <span className="font-semibold text-green-600">{extractedData?.tags?.length || 0} searchable tags</span>
        </p>
        <button onClick={reset} className="btn-primary w-full h-12">
          <Plus size={18} />
          Add Another Contact
        </button>
      </div>
    );
  }

  // Review state
  if (step === 'review' && extractedData) {
    return (
      <div className="space-y-4 animate-in">
        {/* Contact Preview Card */}
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-white font-bold text-xl">
                {extractedData.name?.charAt(0) || '?'}
              </div>
              <div className="text-white">
                <h2 className="font-bold text-lg">{extractedData.name || 'Unknown'}</h2>
                {extractedData.role && (
                  <p className="text-white/80 text-sm">{extractedData.role}</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-5 space-y-3">
            {extractedData.company && (
              <div className="flex items-center gap-3 text-gray-600">
                <Building2 size={16} className="text-gray-400" />
                <span className="text-sm">{extractedData.company}</span>
              </div>
            )}
            {extractedData.location && (
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin size={16} className="text-gray-400" />
                <span className="text-sm">{extractedData.location}</span>
              </div>
            )}
            {extractedData.industry && (
              <div className="flex items-center gap-3 text-gray-600">
                <Briefcase size={16} className="text-gray-400" />
                <span className="text-sm">{extractedData.industry}</span>
              </div>
            )}
            {meetingLocation && (
              <div className="flex items-center gap-3 text-gray-600">
                <Navigation size={16} className="text-gray-400" />
                <span className="text-sm">Met at: {meetingLocation}</span>
              </div>
            )}
          </div>

          {/* Priority Bar in Review */}
          <div className="px-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Priority</span>
              <span className={`text-xs font-semibold ${getPriorityInfo(priority).color}`}>
                {getPriorityInfo(priority).label}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-200 via-green-400 to-green-600 transition-all duration-200"
                style={{ width: `${priority}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        {extractedData.tags && extractedData.tags.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <span className="section-title">AI-Generated Tags</span>
                <span className="ml-2 badge-green">{extractedData.tags.length} tags</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {extractedData.tags.map((tag, i) => {
                const colors = ['tag', 'tag-blue', 'tag-purple', 'tag-orange'];
                return <span key={i} className={colors[i % colors.length]}>{tag}</span>;
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        {transcript && (
          <div className="card p-5">
            <span className="label block mb-3">Your Notes</span>
            <p className="text-sm text-gray-600 italic leading-relaxed">"{transcript}"</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={() => setStep('input')} className="btn-secondary flex-1 h-12">
            Back
          </button>
          <button onClick={saveContact} disabled={isProcessing} className="btn-primary flex-1 h-12">
            {isProcessing ? <Loader2 className="animate-spin\" size={18} /> : (
              <>
                <Check size={18} />
                Save Contact
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Input state
  return (
    <div className="space-y-4 animate-in pb-20">
      {/* Voice Recording - Primary Action */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                <Mic size={14} className="text-white" />
              </div>
              <div>
                <span className="section-title">Voice Notes</span>
                <p className="section-subtitle">Describe how you met</p>
              </div>
            </div>
            <span className="badge-green">Required</span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTranscribing}
              className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                isRecording
                  ? 'bg-red-500 recording-pulse shadow-lg shadow-red-500/30'
                  : isTranscribing
                  ? 'bg-gray-200'
                  : 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30'
              }`}
            >
              {isTranscribing ? (
                <Loader2 className="animate-spin text-gray-500" size={22} />
              ) : (
                <Mic className="text-white" size={22} />
              )}
            </button>
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {isTranscribing ? 'Transcribing...' : isRecording ? 'Recording...' : 'Tap to record'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isRecording ? 'Tap again to stop' : 'Tell me about this person'}
              </p>
            </div>
            {audioBlob && !isTranscribing && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-full">
                <Check size={14} className="text-green-600" />
                <span className="text-xs font-medium text-green-600">Done</span>
              </div>
            )}
          </div>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="How did you meet? What do they do? Any notable details..."
            className="textarea h-28"
          />
        </div>
      </div>

      {/* Business Card */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Camera size={14} className="text-gray-500" />
              </div>
              <div>
                <span className="section-title">Business Card</span>
                <p className="section-subtitle">Scan or upload photo</p>
              </div>
            </div>
            <span className="badge">Optional</span>
          </div>
        </div>

        <div className="p-5">
          {cardImage ? (
            <div className="relative rounded-xl overflow-hidden">
              <img src={cardImage} alt="Card" className="w-full" />
              <button
                onClick={() => { setCardImage(null); setCardText(''); }}
                className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X size={16} />
              </button>
              {isProcessing && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <Loader2 className="animate-spin text-green-500" size={28} />
                </div>
              )}
              {cardText && (
                <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur rounded-lg px-3 py-2">
                  <p className="text-xs text-white/80 truncate">Extracted: {cardText.slice(0, 50)}...</p>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-12 border-2 border-dashed border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50/30 transition-all group"
            >
              <Camera className="mx-auto text-gray-300 group-hover:text-green-500 mb-2 transition-colors" size={32} />
              <span className="text-sm text-gray-400 group-hover:text-green-600 transition-colors">
                Tap to scan or upload
              </span>
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
      </div>

      {/* Meeting Details */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Clock size={14} className="text-gray-500" />
              </div>
              <div>
                <span className="section-title">Meeting Details</span>
                <p className="section-subtitle">When & where you met</p>
              </div>
            </div>
            <span className="badge">Auto-filled</span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="label flex items-center gap-1.5 mb-2">
              <Calendar size={12} />
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label flex items-center gap-1.5 mb-2">
              <MapPin size={12} />
              Location
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.target.value)}
                placeholder="City, venue, or event name..."
                className="input flex-1"
              />
              <button
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="btn-icon flex-shrink-0"
                title="Get current location"
              >
                {isGettingLocation ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Navigation size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LinkedIn */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#0A66C2] rounded-lg flex items-center justify-center">
                <Linkedin size={14} className="text-white" />
              </div>
              <div>
                <span className="section-title">LinkedIn Profile</span>
                <p className="section-subtitle">Add their profile link</p>
              </div>
            </div>
            <span className="badge">Optional</span>
          </div>
        </div>
        <div className="p-5">
          <input
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="linkedin.com/in/username"
            className="input"
          />
        </div>
      </div>

      {/* Priority Slider */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Star size={14} className="text-white" />
              </div>
              <div>
                <span className="section-title">Priority Level</span>
                <p className="section-subtitle">How important is this contact?</p>
              </div>
            </div>
            <span className={`text-xs font-semibold ${getPriorityInfo(priority).color}`}>
              {getPriorityInfo(priority).label}
            </span>
          </div>
        </div>
        <div className="p-5">
          {/* Priority Bar Visual */}
          <div className="relative mb-4">
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-200 via-green-400 to-green-600 transition-all duration-200"
                style={{ width: `${priority}%` }}
              />
            </div>
            {/* Marker dots */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-0.5 pointer-events-none">
              {[0, 25, 50, 75, 100].map((mark) => (
                <div
                  key={mark}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    priority >= mark ? 'bg-white shadow' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Slider Input */}
          <input
            type="range"
            min="0"
            max="100"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="w-full h-2 appearance-none cursor-pointer bg-transparent
                       [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-gray-100
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-green-500
                       [&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing
                       [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
                       [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-green-500
                       [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing"
          />

          {/* Labels */}
          <div className="flex justify-between mt-2 text-[10px] text-gray-400 uppercase tracking-wider">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={processAndExtract}
        disabled={isProcessing || isTranscribing || (!transcript && !cardText)}
        className="btn-primary w-full h-14 text-base"
      >
        {isProcessing ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles size={20} />
            Extract & Generate Tags
          </>
        )}
      </button>
    </div>
  );
}

function Plus({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
