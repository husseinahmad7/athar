import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const contentTypeColors = {
  hadith: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  tafsir: 'bg-purple-100 text-purple-800 border-purple-200',
  fiqh: 'bg-blue-100 text-blue-800 border-blue-200',
  wisdom: 'bg-amber-100 text-amber-800 border-amber-200',
  biography: 'bg-rose-100 text-rose-800 border-rose-200'
};

const contentTypeNames = {
  hadith: 'حديث شريف',
  tafsir: 'تفسير',
  fiqh: 'فقه',
  wisdom: 'حكمة',
  biography: 'سيرة'
};

export default function IslamicContentCard({ content }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-br from-cream-50 to-amber-50 border-2 border-amber-200 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              <Badge className={`${contentTypeColors[content.content_type]} border font-arabic`}>
                {contentTypeNames[content.content_type]}
              </Badge>
            </div>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-xl font-arabic-bold text-gray-900" dir="rtl">
            {content.title}
          </h3>
        </CardHeader>
        
        <CardContent className="space-y-4" dir="rtl">
          {/* Arabic Text */}
          <div className="bg-white rounded-lg p-4 border-r-4 border-emerald-500">
            <p className="text-xl font-arabic text-gray-900 leading-relaxed">
              {content.arabic_text}
            </p>
          </div>
          
          {/* Translation */}
          {content.translation && (
            <div className="bg-white/70 rounded-lg p-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {content.translation}
              </p>
            </div>
          )}
          
          {/* Source */}
          {content.source && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <span className="font-bold">المصدر:</span>
              <span className="font-arabic">{content.source}</span>
            </div>
          )}
          
          {/* Tags */}
          {content.tags && content.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {content.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="font-arabic">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}