import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Check, RefreshCw } from 'lucide-react';
import { generateDescription } from '@/lib/generators/description';
import { cn } from '@/lib/utils';

interface SmartDescriptionFieldProps {
    productName: string;
    categoryId: string;
    tagline: string;
    value: string;
    onChange: (val: string) => void;
    theme?: 'light' | 'dark';
    platingType?: string;
    material?: string;
}

export function SmartDescriptionField({
    productName,
    categoryId,
    tagline,
    value,
    onChange,
    theme = 'light',
    platingType,
    material
}: SmartDescriptionFieldProps) {
    const [suggestion, setSuggestion] = useState('');

    const generateNewSuggestion = () => {
        if (productName && categoryId) {
            const suggested = generateDescription(tagline, productName, categoryId, platingType, material);
            setSuggestion(suggested);
        }
    };

    useEffect(() => {
        // Generate initial suggestion when context changes
        const timeout = setTimeout(generateNewSuggestion, 600);
        return () => clearTimeout(timeout);
    }, [productName, categoryId, tagline, platingType, material]);

    const applySuggestion = () => {
        onChange(suggestion);
        setSuggestion('');
    };

    const inputBg = theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200';
    const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <Label htmlFor="prod-desc">Product Description</Label>
                {suggestion && suggestion !== value && (
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={generateNewSuggestion}
                            className="text-[10px] font-bold text-slate-500 flex items-center gap-1 hover:text-indigo-500 transition-colors uppercase tracking-widest pb-1"
                            title="Regenerate different version"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Shuffle
                        </button>
                        <button
                            type="button"
                            onClick={applySuggestion}
                            className="text-[10px] font-bold text-indigo-500 flex items-center gap-1 hover:text-indigo-400 transition-colors uppercase tracking-widest pb-1"
                        >
                            <Sparkles className="w-3 h-3" />
                            Apply AI Version
                        </button>
                    </div>
                )}
            </div>

            <div className="relative">
                <Textarea
                    id="prod-desc"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={cn(inputBg, "min-h-[120px] pr-10 resize-none")}
                    placeholder="Describe your product here..."
                />
                {value && value.length > 50 && (
                    <div className="absolute right-3 top-4">
                        <Check className="w-4 h-4 text-emerald-500" />
                    </div>
                )}
            </div>

            {suggestion && suggestion !== value && (
                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-3 animate-in fade-in slide-in-from-top-2 border-l-2 border-l-indigo-500">
                    <div className="flex justify-between items-start mb-1">
                        <p className={cn("text-[10px] uppercase font-black tracking-widest text-indigo-500", theme === 'dark' ? "" : "")}>
                            Distinct Suggestion
                        </p>
                    </div>
                    <p className={cn("text-[11px] leading-relaxed italic line-clamp-3", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
                        "{suggestion}"
                    </p>
                </div>
            )}
        </div>
    );
}
