'use client';

import { useState, useRef } from 'react';
import { Search, Mic, Loader2, Linkedin, MapPin, Building2, Briefcase, Calendar, MessageCircle, Sparkles, Twitter, Users, Globe, Crown, Star, ChevronDown, ChevronUp, ExternalLink, Bot } from 'lucide-react';
import type { Contact } from '@/types';

interface LinkedInProfile {
  url: string;
  name?: string;
  title?: string;
  company?: string;
  confidence: 'high' | 'medium' | 'low';
  reason?: string;
}

interface WebSearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

interface SearchContact extends Contact {
  _score?: number;
  _matchReason?: string;
  _matchedFields?: string[];
  _linkedinProfiles?: LinkedInProfile[];
  _webResults?: WebSearchResult[];
  _isSearchingWeb?: boolean;
  _agentSummary?: string;
  _agentConfidence?: 'high' | 'medium' | 'low';
  _searchSource?: 'agent' | 'simple';
}

export default function FindContact() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [results, setResults] = useState<SearchContact[]>([]);
  const [topScore, setTopScore] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [agentExplanation, setAgentExplanation] = useState<string>('');
  const [searchSource, setSearchSource] = useState<'agent' | 'simple' | ''>('');

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Agentic voice search using LangGraph
  const search = async (q?: string, useVoiceAgent = false) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setAgentExplanation('');

    try {
      // Use voice-search API with LangGraph agent
      const endpoint = useVoiceAgent ? '/api/voice-search' : '/api/search';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, useAgent: true }),
      });
      const data = await response.json();
      setResults(data.results || []);
      setTopScore(data.topScore || 0);
      setAgentExplanation(data.explanation || '');
      setSearchSource(data.source || '');
    } catch (err) {
      setResults([]);
      setAgentExplanation('');
    } finally {
      setIsSearching(false);
    }
  };

  // Transcribe audio using OpenAI Whisper
  const transcribeAudio = async (blob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.text || '';
      }
    } catch (err) {
      console.error('Transcription failed:', err);
    }
    return '';
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        // Transcribe and search
        setIsTranscribing(true);
        const transcribedText = await transcribeAudio(blob);
        setIsTranscribing(false);

        if (transcribedText) {
          setQuery(transcribedText);
          // Use the agentic voice search
          await search(transcribedText, true);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  // Toggle voice recording
  const handleVoice = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const suggestions = [
    { label: 'Real estate', query: 'real estate property' },
    { label: 'Tech', query: 'tech software' },
    { label: 'Recent', query: 'last month' },
    { label: 'Investors', query: 'investor funding' },
  ];

  const enrichContact = async (contact: SearchContact) => {
    setEnrichingId(contact.id);
    try {
      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contact.id,
          email: contact.email,
          name: contact.name,
          company: contact.company,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(prev => prev.map(c =>
          c.id === contact.id
            ? { ...c, enrichment: data.enrichment, linkedin_url: data.linkedin_url || c.linkedin_url }
            : c
        ));
        setExpandedId(contact.id);
      }
    } catch (err) {
      console.error('Enrichment failed:', err);
    } finally {
      setEnrichingId(null);
    }
  };

  // Web search for LinkedIn profiles and related info using AI agent
  const searchWeb = async (contact: SearchContact) => {
    setResults(prev => prev.map(c =>
      c.id === contact.id ? { ...c, _isSearchingWeb: true } : c
    ));

    try {
      const response = await fetch('/api/websearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contact.name,
          company: contact.company,
          location: contact.location || contact.meeting_location,
          role: contact.role,
          context: contact.raw_context,
          useAgent: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(prev => prev.map(c =>
          c.id === contact.id
            ? {
                ...c,
                _linkedinProfiles: data.linkedinProfiles || [],
                _webResults: data.webResults || [],
                _agentSummary: data.summary,
                _agentConfidence: data.confidence,
                _searchSource: data.source,
                _isSearchingWeb: false,
              }
            : c
        ));
        setExpandedId(contact.id);
      }
    } catch (err) {
      console.error('Web search failed:', err);
      setResults(prev => prev.map(c =>
        c.id === contact.id ? { ...c, _isSearchingWeb: false } : c
      ));
    }
  };

  // Generate avatar color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      'from-green-400 to-green-600',
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600',
      'from-orange-400 to-orange-600',
      'from-pink-400 to-pink-600',
      'from-cyan-400 to-cyan-600',
      'from-indigo-400 to-indigo-600',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  // Get match quality badge
  const getMatchQuality = (score: number, isTop: boolean) => {
    if (isTop && score > 0) {
      return { label: 'Best Match', color: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white', icon: Crown };
    }
    if (score >= topScore * 0.8) {
      return { label: 'Great Match', color: 'bg-green-100 text-green-700', icon: Star };
    }
    if (score >= topScore * 0.5) {
      return { label: 'Good Match', color: 'bg-blue-100 text-blue-700', icon: null };
    }
    return { label: 'Partial Match', color: 'bg-gray-100 text-gray-600', icon: null };
  };

  // Get priority info (3 levels, green spectrum)
  const getPriorityInfo = (value: number) => {
    if (value >= 67) return { label: 'High', color: 'text-green-700' };
    if (value >= 34) return { label: 'Medium', color: 'text-green-500' };
    return { label: 'Low', color: 'text-green-400' };
  };

  return (
    <div className="space-y-4 animate-in">
      {/* Search Box */}
      <div className="card overflow-hidden">
        <div className="p-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search()}
                placeholder="Search by name, industry, location, tags..."
                className="input pl-9"
              />
            </div>
            <button
              onClick={handleVoice}
              disabled={isTranscribing}
              className={`btn-icon relative ${
                isRecording
                  ? 'bg-red-500 text-white recording-pulse'
                  : isTranscribing
                  ? 'bg-purple-500 text-white'
                  : ''
              }`}
              title={isRecording ? 'Tap to stop' : isTranscribing ? 'Transcribing...' : 'Voice search'}
            >
              {isTranscribing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Mic size={16} />
              )}
            </button>
            <button onClick={() => search(query, true)} disabled={isSearching || isTranscribing || !query.trim()} className="btn-primary">
              {isSearching ? <Loader2 className="animate-spin" size={16} /> : 'Search'}
            </button>
          </div>
          {/* Voice status indicator */}
          {(isRecording || isTranscribing) && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              {isRecording && (
                <>
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-600 font-medium">Recording... Tap mic to stop</span>
                </>
              )}
              {isTranscribing && (
                <>
                  <Loader2 size={12} className="animate-spin text-purple-500" />
                  <span className="text-purple-600 font-medium">Transcribing with AI...</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="px-3 pb-3 flex gap-2 flex-wrap">
          {suggestions.map((s) => (
            <button
              key={s.label}
              onClick={() => { setQuery(s.query); search(s.query, true); }}
              className="text-xs px-2.5 py-1.5 bg-gray-50 text-gray-500 rounded-md hover:bg-gray-100 hover:text-gray-700 transition-all"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isSearching && (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bot className="text-white animate-pulse" size={24} />
          </div>
          <p className="text-sm font-medium text-gray-700">AI Agent searching...</p>
          <p className="text-xs text-gray-400 mt-1">Analyzing your network with LangGraph</p>
        </div>
      )}

      {/* No results */}
      {!isSearching && hasSearched && results.length === 0 && (
        <div className="card p-12 text-center">
          <Search className="mx-auto text-gray-300 mb-3" size={32} />
          <p className="font-medium text-gray-700">No contacts found</p>
          {agentExplanation ? (
            <p className="text-sm text-gray-500 mt-2">{agentExplanation}</p>
          ) : (
            <p className="text-sm text-gray-400 mt-1">Try different keywords or add more contacts</p>
          )}
        </div>
      )}

      {/* Results */}
      {!isSearching && results.length > 0 && (
        <div className="space-y-3">
          {/* Agent Explanation */}
          {agentExplanation && searchSource === 'agent' && (
            <div className="card p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-700">AI Analysis</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded font-medium">LangGraph</span>
                  </div>
                  <p className="text-sm text-gray-600">{agentExplanation}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-gray-400 font-medium">
              {results.length} contact{results.length !== 1 ? 's' : ''} found
            </p>
            {results.length > 1 && (
              <p className="text-xs text-gray-400">Sorted by relevance</p>
            )}
          </div>

          {results.map((contact, index) => {
            const isTopMatch = index === 0;
            const matchQuality = getMatchQuality(contact._score || 0, isTopMatch);
            const MatchIcon = matchQuality.icon;

            return (
              <div
                key={contact.id}
                className={`card overflow-hidden transition-all ${
                  isTopMatch
                    ? 'ring-2 ring-yellow-400/50 shadow-lg shadow-yellow-100'
                    : 'hover:border-gray-300'
                }`}
              >
                {/* Match Quality Banner for Top Result */}
                {isTopMatch && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-2 border-b border-yellow-100 flex items-center gap-2">
                    <Crown size={14} className="text-yellow-600" />
                    <span className="text-xs font-semibold text-yellow-700">Best Match for "{query}"</span>
                  </div>
                )}

                {/* Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    {contact.enrichment?.avatar ? (
                      <img
                        src={contact.enrichment.avatar}
                        alt={contact.name}
                        className={`w-12 h-12 rounded-xl object-cover flex-shrink-0 ${isTopMatch ? 'ring-2 ring-yellow-400' : ''}`}
                      />
                    ) : (
                      <div className={`w-12 h-12 bg-gradient-to-br ${getAvatarColor(contact.name)} rounded-xl flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 ${isTopMatch ? 'ring-2 ring-yellow-400' : ''}`}>
                        {contact.name?.charAt(0) || '?'}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 truncate">{contact.name}</h3>
                            {!isTopMatch && MatchIcon && (
                              <MatchIcon size={12} className="text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                          {(contact.role || contact.enrichment?.employment?.title) && (
                            <p className="text-sm text-gray-500 truncate">
                              {contact.enrichment?.employment?.title || contact.role}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {contact.linkedin_url ? (
                            <a
                              href={contact.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 flex items-center justify-center text-[#0A66C2] hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Linkedin size={16} />
                            </a>
                          ) : (
                            <button
                              onClick={() => searchWeb(contact)}
                              disabled={contact._isSearchingWeb}
                              className="h-8 px-2.5 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Find LinkedIn & web info"
                            >
                              {contact._isSearchingWeb ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Globe size={14} />
                              )}
                              <span className="hidden sm:inline">Find</span>
                            </button>
                          )}
                          {!contact.enrichment && contact.company && (
                            <button
                              onClick={() => enrichContact(contact)}
                              disabled={enrichingId === contact.id}
                              className="h-8 px-2.5 flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {enrichingId === contact.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Sparkles size={14} />
                              )}
                              <span className="hidden sm:inline">Enrich</span>
                            </button>
                          )}
                          {contact.enrichment?.twitter_handle && (
                            <a
                              href={`https://twitter.com/${contact.enrichment.twitter_handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#1DA1F2] hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Twitter size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Match Reason Badges */}
                  {contact._matchReason && (
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide">Matched:</span>
                      <div className="flex flex-wrap gap-1">
                        {contact._matchedFields?.map((field) => (
                          <span
                            key={field}
                            className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded font-medium"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-gray-500">
                    {(contact.company || contact.enrichment?.company_info?.name) && (
                      <span className="flex items-center gap-1.5">
                        <Building2 size={12} className="text-gray-400" />
                        {contact.enrichment?.company_info?.name || contact.company}
                      </span>
                    )}
                    {(contact.location || contact.meeting_location || contact.enrichment?.company_info?.location) && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-gray-400" />
                        {contact.meeting_location || contact.enrichment?.company_info?.location || contact.location}
                      </span>
                    )}
                    {(contact.industry || contact.enrichment?.company_info?.industry) && (
                      <span className="flex items-center gap-1.5">
                        <Briefcase size={12} className="text-gray-400" />
                        {contact.enrichment?.company_info?.industry || contact.industry}
                      </span>
                    )}
                    {contact.enrichment?.company_info?.employees_range && (
                      <span className="flex items-center gap-1.5">
                        <Users size={12} className="text-gray-400" />
                        {contact.enrichment.company_info.employees_range}
                      </span>
                    )}
                    {(contact.met_date || contact.created_at) && (
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-gray-400" />
                        {formatDate(contact.met_date || contact.created_at)}
                      </span>
                    )}
                  </div>

                  {/* Priority Bar */}
                  {contact.priority !== undefined && contact.priority > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <Star size={12} className="text-green-500" />
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-200 via-green-400 to-green-600 transition-all duration-200"
                          style={{ width: `${contact.priority}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-medium ${getPriorityInfo(contact.priority).color}`}>
                        {getPriorityInfo(contact.priority).label}
                      </span>
                    </div>
                  )}
                </div>

                {/* AI Agent Summary */}
                {contact._agentSummary && (expandedId === contact.id) && (
                  <div className="px-4 pb-3">
                    <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <Sparkles size={12} className="text-white" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">AI Analysis</span>
                        {contact._searchSource === 'agent' && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded font-medium">
                            LangGraph Agent
                          </span>
                        )}
                        {contact._agentConfidence && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ml-auto ${
                            contact._agentConfidence === 'high'
                              ? 'bg-green-100 text-green-700'
                              : contact._agentConfidence === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {contact._agentConfidence === 'high' ? 'High confidence' : contact._agentConfidence === 'medium' ? 'Medium confidence' : 'Low confidence'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">{contact._agentSummary}</p>
                    </div>
                  </div>
                )}

                {/* LinkedIn Profile Suggestions */}
                {contact._linkedinProfiles && contact._linkedinProfiles.length > 0 && (expandedId === contact.id) && (
                  <div className="px-4 pb-3">
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Linkedin size={14} className="text-[#0A66C2]" />
                        <span className="text-xs font-semibold text-gray-700">Find on LinkedIn</span>
                      </div>
                      <div className="space-y-2">
                        {contact._linkedinProfiles.map((profile, idx) => (
                          <a
                            key={idx}
                            href={profile.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all group"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-[#0A66C2] rounded-lg flex items-center justify-center">
                                <Linkedin size={14} className="text-white" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-700 group-hover:text-[#0A66C2]">
                                  {profile.title || 'Search LinkedIn'}
                                </p>
                                {profile.reason && (
                                  <p className="text-[10px] text-gray-400">{profile.reason}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                profile.confidence === 'high'
                                  ? 'bg-green-100 text-green-700'
                                  : profile.confidence === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {profile.confidence === 'high' ? 'Best' : profile.confidence === 'medium' ? 'Try this' : 'Maybe'}
                              </span>
                              <ExternalLink size={12} className="text-gray-400 group-hover:text-blue-500" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Web Search Results */}
                {contact._webResults && contact._webResults.length > 0 && (expandedId === contact.id) && (
                  <div className="px-4 pb-3">
                    <div className="p-3 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Search size={14} className="text-gray-500" />
                        <span className="text-xs font-semibold text-gray-700">Web Results</span>
                      </div>
                      <div className="space-y-2">
                        {contact._webResults.slice(0, 3).map((result, idx) => (
                          <a
                            key={idx}
                            href={result.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-2 bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-700 group-hover:text-blue-600 truncate">
                                  {result.title}
                                </p>
                                <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">
                                  {result.snippet}
                                </p>
                                <p className="text-[9px] text-gray-300 mt-1">{result.source}</p>
                              </div>
                              <ExternalLink size={10} className="text-gray-300 group-hover:text-blue-400 flex-shrink-0 mt-0.5" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Toggle expand for web search results */}
                {(contact._linkedinProfiles || contact._webResults) && !contact.enrichment && (
                  <div className="px-4 pb-2">
                    <button
                      onClick={() => setExpandedId(expandedId === contact.id ? null : contact.id)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                    >
                      {expandedId === contact.id ? (
                        <>
                          <ChevronUp size={12} />
                          Hide results
                        </>
                      ) : (
                        <>
                          <ChevronDown size={12} />
                          Show search results
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Enriched Company Info */}
                {contact.enrichment?.company_info && (expandedId === contact.id) && (
                  <div className="px-4 pb-3">
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                      <div className="flex items-start gap-3">
                        {contact.enrichment.company_info.logo && (
                          <img
                            src={contact.enrichment.company_info.logo}
                            alt={contact.enrichment.company_info.name}
                            className="w-10 h-10 rounded-lg object-contain bg-white p-1"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            {contact.enrichment.company_info.name}
                          </p>
                          {contact.enrichment.company_info.description && (
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {contact.enrichment.company_info.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {contact.enrichment.company_info.domain && (
                              <a
                                href={`https://${contact.enrichment.company_info.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                              >
                                <Globe size={10} />
                                {contact.enrichment.company_info.domain}
                              </a>
                            )}
                            {contact.enrichment.company_info.linkedin_handle && (
                              <a
                                href={`https://linkedin.com/company/${contact.enrichment.company_info.linkedin_handle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-[#0A66C2] hover:underline"
                              >
                                <Linkedin size={10} />
                                Company
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bio */}
                {contact.enrichment?.bio && (expandedId === contact.id) && (
                  <div className="px-4 pb-3">
                    <p className="text-xs text-gray-500 italic">"{contact.enrichment.bio}"</p>
                  </div>
                )}

                {/* Toggle expand for enriched contacts */}
                {contact.enrichment && (
                  <div className="px-4 pb-2">
                    <button
                      onClick={() => setExpandedId(expandedId === contact.id ? null : contact.id)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                    >
                      {expandedId === contact.id ? (
                        <>
                          <ChevronUp size={12} />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown size={12} />
                          Show company details
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Tags */}
                {contact.tags && contact.tags.length > 0 && (
                  <div className="px-4 pb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {contact.tags.slice(0, 8).map((tag, i) => {
                        const colors = ['tag', 'tag-blue', 'tag-purple', 'tag-orange'];
                        return <span key={i} className={colors[i % colors.length]}>{tag}</span>;
                      })}
                      {contact.tags.length > 8 && (
                        <span className="tag-gray">+{contact.tags.length - 8}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Context */}
                {contact.raw_context && (
                  <div className="px-4 pb-4">
                    <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                      <MessageCircle size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-500 line-clamp-2 italic">"{contact.raw_context}"</p>
                    </div>
                  </div>
                )}

                {/* Event badge */}
                {contact.event_type && (
                  <div className="px-4 pb-4">
                    <span className="tag-gray">{contact.event_type}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!hasSearched && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="text-gray-400" size={28} />
          </div>
          <p className="font-medium text-gray-700">Search your network</p>
          <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
            Find contacts by name, company, industry, location, or any tag
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="tag">real estate</span>
            <span className="tag-blue">phoenix</span>
            <span className="tag-purple">investor</span>
            <span className="tag-orange">tech</span>
          </div>
        </div>
      )}
    </div>
  );
}
