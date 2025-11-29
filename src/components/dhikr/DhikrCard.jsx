import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Edit, Trash2, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const categoryColors = {
  morning: 'bg-orange-100 text-orange-800 border-orange-200',
  evening: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  after_prayer: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  before_sleep: 'bg-purple-100 text-purple-800 border-purple-200',
  general: 'bg-blue-100 text-blue-800 border-blue-200',
  quran: 'bg-amber-100 text-amber-800 border-amber-200',
  salawat: 'bg-pink-100 text-pink-800 border-pink-200',
  tasbih: 'bg-teal-100 text-teal-800 border-teal-200',
  dua: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  ziyarah: 'bg-rose-100 text-rose-800 border-rose-200'
};

const categoryNames = {
  morning: 'أذكار الصباح',
  evening: 'أذكار المساء',
  after_prayer: 'بعد الصلاة',
  before_sleep: 'قبل النوم',
  general: 'عام',
  quran: 'قرآن',
  salawat: 'صلوات',
  tasbih: 'تسبيح',
  dua: 'دعاء',
  ziyarah: 'زيارة'
};

export default function DhikrCard({ dhikr, onStart, onEdit, onDelete, onToggleFavorite, compact = false }) {
  // Helper function to truncate text
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-emerald-300 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1" dir="rtl">
              <p className="text-2xl font-arabic-bold text-gray-900 leading-relaxed">
                {truncateText(dhikr.arabic_text, 80)}
              </p>
            </div>
            {dhikr.is_favorite && (
              <Star className="w-5 h-5 text-amber-500 fill-amber-500 flex-shrink-0" />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2" dir="rtl">
            <Badge className={`${categoryColors[dhikr.category]} border font-arabic`}>
              {categoryNames[dhikr.category]}
            </Badge>
            <Badge variant="outline" className="font-bold">
              {dhikr.repetitions}×
            </Badge>
          </div>

          {/* Reward */}
          {dhikr.reward && !compact && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3" dir="rtl">
              <p className="text-sm text-amber-900 font-arabic">
                <span className="font-bold">الأجر: </span>
                {truncateText(dhikr.reward, 120)}
              </p>
            </div>
          )}
          
          {/* Source */}
          {dhikr.source && !compact && (
            <p className="text-xs text-gray-500 font-arabic" dir="rtl">
              المصدر: {dhikr.source}
            </p>
          )}
          
          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={() => onStart(dhikr)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-arabic"
            >
              <Play className="w-4 h-4 ml-2" />
              ابدأ
            </Button>
            {onToggleFavorite && (
              <Button 
                onClick={() => onToggleFavorite(dhikr)}
                variant="outline"
                size="icon"
                className={dhikr.is_favorite ? 'text-amber-500 border-amber-300' : ''}
              >
                <Star className={`w-4 h-4 ${dhikr.is_favorite ? 'fill-current' : ''}`} />
              </Button>
            )}
            <Button 
              onClick={() => onEdit(dhikr)}
              variant="outline"
              size="icon"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              onClick={() => onDelete(dhikr)}
              variant="outline"
              size="icon"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}