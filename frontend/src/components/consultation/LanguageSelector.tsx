import React from 'react';
import { Languages } from 'lucide-react';

interface LanguageSelectorProps {
  conversationLanguage: string;
  onConversationLanguageChange: (lang: string) => void;
  outputLanguage: string;
  onOutputLanguageChange: (lang: string) => void;
  detectedLanguage?: string;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  conversationLanguage,
  onConversationLanguageChange,
  outputLanguage,
  onOutputLanguageChange,
  detectedLanguage,
  disabled = false,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
        <Languages className="w-4 h-4 text-brand-600" />
        <span>Language Controls:</span>
      </div>

      {/* Conversation Language Selector */}
      <div className="flex items-center gap-1.5 text-xs">
        <label className="text-slate-500 font-medium">Input:</label>
        <select
          value={conversationLanguage}
          onChange={(e) => onConversationLanguageChange(e.target.value)}
          disabled={disabled}
          className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-brand-500 focus:outline-none disabled:opacity-60 cursor-pointer"
        >
          <option value="Auto Detect">Auto Detect</option>
          <option value="English">English</option>
          <option value="Malayalam">Malayalam (മലയാളം)</option>
          <option value="Malayalam + English">Malayalam + English (Mixed)</option>
        </select>
      </div>

      {/* Output Clinical Language */}
      <div className="flex items-center gap-1.5 text-xs">
        <label className="text-slate-500 font-medium">Documentation:</label>
        <select
          value={outputLanguage}
          onChange={(e) => onOutputLanguageChange(e.target.value)}
          disabled={disabled}
          className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-brand-500 focus:outline-none disabled:opacity-60 cursor-pointer"
        >
          <option value="English">English (Standard EHR)</option>
          <option value="Malayalam">Malayalam</option>
        </select>
      </div>

      {/* Detected Language Badge */}
      {detectedLanguage && (
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-medium">
          <span>Detected:</span>
          <span className="font-semibold text-brand-800">{detectedLanguage}</span>
        </div>
      )}
    </div>
  );
};
