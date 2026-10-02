import React from 'react';
import { Pill, HeartPulse, Eye, Sparkles, Package, Droplets, Sun, Moon, Cloud, Heart } from 'lucide-react';
import { MedicationCategory, RouteOfAdmin } from '../types/medication';

interface MedicationIconProps {
  imageUrl?: string;
  category?: MedicationCategory;
  route?: RouteOfAdmin;
  iconPreset?: string;
  colorTheme?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const MedicationIcon: React.FC<MedicationIconProps> = ({
  imageUrl,
  category = 'prescription',
  route = 'oral',
  iconPreset,
  name = 'Med',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-9 h-9 text-base rounded-xl',
    md: 'w-12 h-12 text-lg rounded-2xl',
    lg: 'w-16 h-16 text-2xl rounded-2xl',
    xl: 'w-24 h-24 text-4xl rounded-3xl',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  if (imageUrl) {
    return (
      <div
        className={`relative overflow-hidden bg-sky-50 border-2 border-white/80 shadow-sm flex items-center justify-center shrink-0 ${sizeClasses[size]} ${className}`}
      >
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover object-center"
          loading="lazy"
        />
      </div>
    );
  }

  // 新海誠童趣粉彩漸層風格
  const getThemeStyle = () => {
    switch (category) {
      case 'prescription':
        return 'bg-gradient-to-br from-sky-100 via-sky-50 to-blue-100 text-sky-600 border-sky-200/80 shadow-sky-100/50';
      case 'otc':
        return 'bg-gradient-to-br from-pink-100 via-rose-50 to-orange-100 text-rose-500 border-rose-200/80 shadow-rose-100/50';
      case 'supplement':
        return 'bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 text-amber-600 border-amber-200/80 shadow-amber-100/50';
      case 'herbal':
        return 'bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 text-emerald-600 border-emerald-200/80 shadow-emerald-100/50';
      case 'topical':
        return 'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 text-indigo-600 border-indigo-200/80 shadow-indigo-100/50';
      default:
        return 'bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 text-slate-600 border-slate-200/80 shadow-slate-100/50';
    }
  };

  const renderInnerIcon = () => {
    if (route === 'eyedrop') {
      return <Eye className={`${iconSizes[size]} transition-transform group-hover:scale-110`} />;
    }
    if (route === 'topical' || route === 'patch') {
      return <Droplets className={`${iconSizes[size]} transition-transform group-hover:scale-110`} />;
    }
    if (category === 'supplement') {
      return <Sparkles className={`${iconSizes[size]} text-amber-500 transition-transform group-hover:rotate-12`} />;
    }
    if (category === 'herbal') {
      return <HeartPulse className={`${iconSizes[size]} text-emerald-500 transition-transform group-hover:scale-110`} />;
    }
    if (iconPreset === 'packet_herbal') {
      return <Package className={`${iconSizes[size]} transition-transform group-hover:scale-110`} />;
    }
    return <Pill className={`${iconSizes[size]} transition-transform group-hover:rotate-45`} />;
  };

  return (
    <div
      className={`relative flex items-center justify-center border-2 shrink-0 transition-all shadow-sm ${getThemeStyle()} ${sizeClasses[size]} ${className}`}
    >
      {renderInnerIcon()}
      {/* 夢幻小光點 */}
      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white/90 shadow-2xs border border-white" />
    </div>
  );
};
