import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Check } from 'lucide-react';
import { suggestTagline } from '@/lib/generators/tagline';
import { cn } from '@/lib/utils';

interface SmartTaglineFieldProps {
  productName: string;
  categoryId: string;
  value: string;
  onChange: (val: string) => void;
  theme?: 'light' | 'dark';
}

export function SmartTaglineField({ productName, categoryId, value, onChange, theme = 'light' }: SmartTaglineFieldProps) {
  const [suggestion, setSuggestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (productName && categoryId) {
      const timeout = setTimeout(() => {
        const suggested = suggestTagline(productName, categoryId);
        setSuggestion(suggested);
      }, 500);
      return () => clearTimeout(timeout);
    } else {
      setSuggestion('');
    }
  }, [productName, categoryId]);

  const applySuggestion = () => {
    onChange(suggestion);
    setSuggestion('');
  };

  const inputBg = theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <Label htmlFor="prod-tagline">Short Tagline</Label>
        {suggestion && suggestion !== value && (
          <button 
            type="button"
            onClick={applySuggestion}
            className="text-[10px] font-bold text-indigo-500 flex items-center gap-1 hover:text-indigo-400 transition-colors uppercase tracking-widest pb-1"
          >
            <Sparkles className="w-3 h-3" />
            Apply AI Suggestion
          </button>
        )}
      </div>
      
      <div className="relative">
        <Input 
          id="prod-tagline" 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className={cn(inputBg, "pr-10")} 
          placeholder="e.g. Handcrafted luxury tote bag designed for daily elegance"
        />
        {value && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
             <Check className="w-4 h-4 text-emerald-500" />
          </div>
        )}
      </div>

      {suggestion && suggestion !== value && (
        <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-3 animate-in fade-in slide-in-from-top-2">
           <p className={cn("text-[10px] uppercase font-black tracking-widest text-indigo-500 mb-1", theme === 'dark' ? "" : "")}>
             AI Recommendation
           </p>
           <p className={cn("text-[11px] leading-relaxed", theme === 'dark' ? "text-slate-300" : "text-slate-600")}>
             "{suggestion}"
           </p>
        </div>
      )}
    </div>
  );
}
