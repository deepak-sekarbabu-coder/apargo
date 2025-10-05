'use client';

import { ArrowUp, Clock, Mic, Search, TrendingUp, X } from 'lucide-react';

import * as React from 'react';

import { cn } from '@/lib/utils';

import { useDeviceInfo } from '@/hooks/use-mobile';

// Types for search functionality
interface SearchSuggestion {
  id: string;
  text: string;
  type?: 'suggestion' | 'recent' | 'trending';
  category?: string;
}

// Minimal local speech recognition type definitions (avoids lib.dom dependency variability)
// These are intentionally partial and cover only members we use.
type MinimalSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult:
    | ((event: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string } }> }) => void)
    | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

// Hook for voice search functionality
export function useVoiceSearch() {
  const [isSupported, setIsSupported] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const recognitionRef = React.useRef<MinimalSpeechRecognition | null>(null);

  React.useEffect(() => {
    const win = window as unknown as {
      SpeechRecognition?: new () => MinimalSpeechRecognition;
      webkitSpeechRecognition?: new () => MinimalSpeechRecognition;
    };
    const SpeechRecognition: (new () => MinimalSpeechRecognition) | undefined =
      win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = event => {
        const current = event.resultIndex;
        const seg = event.results[current][0];
        if (seg) setTranscript(seg.transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = event => {
        setError(event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = React.useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setError(null);
      recognitionRef.current.start();
    }
  }, [isListening]);

  const stopListening = React.useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
  };
}

// Hook for search suggestions and recent searches
export function useSearchSuggestions() {
  const [suggestions, setSuggestions] = React.useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);

  React.useEffect(() => {
    // Load recent searches from localStorage
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        // Ignore invalid JSON
      }
    }
  }, []);

  const addRecentSearch = React.useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setRecentSearches(prev => {
      const updated = [trimmed, ...prev.filter(item => item !== trimmed)].slice(0, 10);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentSearches = React.useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  }, []);

  const generateSuggestions = React.useCallback((query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    // Mock suggestions - in real app, this would be an API call
    const mockSuggestions: SearchSuggestion[] = [
      { id: '1', text: `${query} properties`, type: 'suggestion' },
      { id: '2', text: `${query} for rent`, type: 'suggestion' },
      { id: '3', text: `${query} real estate`, type: 'suggestion' },
      { id: '4', text: `luxury ${query}`, type: 'suggestion' },
    ];

    setSuggestions(mockSuggestions);
  }, []);

  return {
    suggestions,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    generateSuggestions,
  };
}

// Enhanced search input component
interface EnhancedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  enableVoiceSearch?: boolean;
  enableSuggestions?: boolean;
  showRecentSearches?: boolean;
  className?: string;
  disabled?: boolean;
}

export const EnhancedSearchInput = React.forwardRef<HTMLInputElement, EnhancedSearchInputProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      onSuggestionSelect,
      placeholder = 'Search properties...',
      enableVoiceSearch = true,
      enableSuggestions = true,
      showRecentSearches = true,
      className,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const { isMobile, isTouchDevice } = useDeviceInfo();
    const [isFocused, setIsFocused] = React.useState(false);
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const {
      isSupported: isVoiceSupported,
      isListening,
      transcript,
      startListening,
      stopListening,
    } = useVoiceSearch();

    const {
      suggestions,
      recentSearches,
      addRecentSearch,
      clearRecentSearches,
      generateSuggestions,
    } = useSearchSuggestions();

    // Handle voice search transcript
    React.useEffect(() => {
      if (transcript) {
        onChange(transcript);
      }
    }, [transcript, onChange]);

    // Generate suggestions when value changes
    React.useEffect(() => {
      if (enableSuggestions && isFocused) {
        generateSuggestions(value);
      }
    }, [value, enableSuggestions, isFocused, generateSuggestions]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (value.trim()) {
        addRecentSearch(value);
        onSubmit?.(value);
        setShowSuggestions(false);
      }
    };

    const handleSuggestionClick = (suggestion: SearchSuggestion) => {
      onChange(suggestion.text);
      addRecentSearch(suggestion.text);
      onSuggestionSelect?.(suggestion);
      setShowSuggestions(false);
      inputRef.current?.focus();
    };

    const handleFocus = () => {
      setIsFocused(true);
      setShowSuggestions(true);
    };

    const handleBlur = () => {
      // Delay to allow suggestion clicks
      setTimeout(() => {
        setIsFocused(false);
        setShowSuggestions(false);
      }, 200);
    };

    const handleClear = () => {
      onChange('');
      inputRef.current?.focus();
    };

    const handleVoiceToggle = () => {
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
    };

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!, []);

    const displaySuggestions =
      showSuggestions && (suggestions.length > 0 || recentSearches.length > 0);

    return (
      <div className={cn('relative w-full', className)}>
        {/* Search Input */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />

            <input
              ref={inputRef}
              type="search"
              value={value}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled || isListening}
              className={cn(
                'w-full pl-10 pr-20 py-2.5 bg-background border border-input rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
                'placeholder:text-muted-foreground',
                // Mobile optimizations
                (isMobile || isTouchDevice) && 'min-h-[44px] text-base',
                // Voice search active state
                isListening && 'bg-red-50 border-red-300',
                className
              )}
              style={{
                fontSize: isMobile || isTouchDevice ? '16px' : undefined,
                touchAction: 'manipulation',
              }}
              autoComplete="off"
              {...props}
            />

            {/* Action buttons */}
            <div className="absolute right-2 flex items-center gap-1">
              {/* Clear button */}
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-md touch-manipulation transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Voice search button */}
              {enableVoiceSearch && isVoiceSupported && (
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className={cn(
                    'p-1.5 rounded-md touch-manipulation transition-colors',
                    isListening
                      ? 'text-red-600 bg-red-100'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
                >
                  <Mic className={cn('h-4 w-4', isListening && 'animate-pulse')} />
                </button>
              )}

              {/* Submit button */}
              <button
                type="submit"
                className="p-1.5 text-primary hover:text-primary/80 rounded-md touch-manipulation transition-colors"
                aria-label="Search"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>

        {/* Voice search indicator */}
        {isListening && (
          <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 animate-pulse" />
              Listening... Speak now
            </div>
          </div>
        )}

        {/* Suggestions dropdown */}
        {displaySuggestions && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
            {/* Recent searches */}
            {showRecentSearches && recentSearches.length > 0 && !value && (
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Recent searches</span>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.slice(0, 5).map((search, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        handleSuggestionClick({
                          id: `recent-${index}`,
                          text: search,
                          type: 'recent',
                        })
                      }
                      className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-md flex items-center gap-2 touch-manipulation"
                    >
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-1">
                {suggestions.map(suggestion => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center gap-2 touch-manipulation"
                  >
                    {suggestion.type === 'trending' ? (
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <Search className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span>{suggestion.text}</span>
                    {suggestion.category && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {suggestion.category}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);
EnhancedSearchInput.displayName = 'EnhancedSearchInput';

// Search filters component
type SearchPrimitive = string | number | boolean;

interface SearchFilter<T extends SearchPrimitive = SearchPrimitive> {
  id: string;
  label: string;
  type: 'select' | 'range' | 'checkbox';
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  value?: T;
}

interface SearchFiltersProps<T extends SearchPrimitive = SearchPrimitive> {
  filters: SearchFilter<T>[];
  values: Record<string, T | undefined>;
  onChange: (filterId: string, value: T) => void;
  className?: string;
}

export const SearchFilters = React.forwardRef<HTMLDivElement, SearchFiltersProps>(
  ({ filters, values, onChange, className }, ref) => {
    const { isMobile } = useDeviceInfo();
    const [isExpanded, setIsExpanded] = React.useState(!isMobile);

    return (
      <div ref={ref} className={cn('space-y-4', className)}>
        {/* Toggle button for mobile */}
        {isMobile && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-3 bg-muted rounded-lg text-sm font-medium"
          >
            Filters
            <ArrowUp className={cn('h-4 w-4 transition-transform', !isExpanded && 'rotate-180')} />
          </button>
        )}

        {/* Filters */}
        {(isExpanded || !isMobile) && (
          <div
            className={cn(
              'grid gap-4',
              isMobile ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            )}
          >
            {filters.map(filter => (
              <div key={filter.id} className="space-y-2">
                <label className="text-sm font-medium text-foreground">{filter.label}</label>

                {filter.type === 'select' && (
                  <select
                    value={(values[filter.id] as string) || ''}
                    onChange={e => onChange(filter.id, e.target.value as SearchPrimitive)}
                    className="w-full p-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">All</option>
                    {filter.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}

                {filter.type === 'range' && (
                  <div className="space-y-1">
                    <input
                      type="range"
                      min={filter.min}
                      max={filter.max}
                      value={
                        typeof values[filter.id] === 'number'
                          ? (values[filter.id] as number)
                          : filter.min
                      }
                      onChange={e =>
                        onChange(filter.id, parseInt(e.target.value) as SearchPrimitive)
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{filter.min}</span>
                      <span>
                        {typeof values[filter.id] === 'number'
                          ? (values[filter.id] as number)
                          : filter.min}
                      </span>
                      <span>{filter.max}</span>
                    </div>
                  </div>
                )}

                {filter.type === 'checkbox' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={values[filter.id] === true}
                      onChange={e => onChange(filter.id, e.target.checked as SearchPrimitive)}
                      className="rounded border-input"
                    />
                    <span className="text-sm">{filter.label}</span>
                  </label>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);
SearchFilters.displayName = 'SearchFilters';
