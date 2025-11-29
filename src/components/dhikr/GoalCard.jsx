import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, CheckCircle2, Clock, Trash2, Edit, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

const goalTypeNames = {
  daily_streak: 'سلسلة يومية',
  dhikr_streak: 'سلسلة ذكر محدد',
  total_count: 'إجمالي العدد',
  specific_dhikr: 'ذكر محدد',
  combination: 'مجموعة',
  monthly_target: 'هدف شهري'
};

export default function GoalCard({ goal, onEdit, onDelete, onReset, onClick }) {
  const currentValue = goal.current_value || 0;
  const targetValue = goal.target_value || 1;
  const progress = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
  const isCompleted = goal.is_completed;

  // Get appropriate label based on goal type
  const getProgressLabel = () => {
    switch (goal.goal_type) {
      case 'daily_streak':
        return `${currentValue} / ${targetValue} أيام`;
      case 'dhikr_streak':
        return `${currentValue} / ${targetValue} أيام`;
      case 'total_count':
        return `${currentValue} / ${targetValue} تكرار`;
      case 'specific_dhikr':
        return `${currentValue} / ${targetValue} تكرار`;
      case 'combination':
        return `${currentValue} / ${targetValue} تكرار`;
      case 'monthly_target':
        return `${currentValue} / ${targetValue} شهريًا`;
      default:
        return `${currentValue} / ${targetValue}`;
    }
  };

  // Get additional info based on goal type
  const getAdditionalInfo = () => {
    if ((goal.goal_type === 'daily_streak' || goal.goal_type === 'dhikr_streak') && goal.streak_count > 0) {
      return `السلسلة الحالية: ${goal.streak_count} يوم`;
    }
    if (goal.goal_type === 'monthly_target' && goal.current_month) {
      const [year, month] = goal.current_month.split('-');
      const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                          'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      return `الشهر الحالي: ${monthNames[parseInt(month) - 1]} ${year}`;
    }
    if (goal.last_activity_date) {
      const lastDate = new Date(goal.last_activity_date);
      const today = new Date();
      const diffTime = today - lastDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return 'آخر نشاط: اليوم';
      } else if (diffDays === 1) {
        return 'آخر نشاط: أمس';
      } else if (diffDays < 7) {
        return `آخر نشاط: منذ ${diffDays} أيام`;
      }
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card
        className={`border-2 transition-all duration-300 cursor-pointer ${
          isCompleted
            ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300'
            : 'bg-white border-gray-200 hover:border-emerald-300 hover:shadow-lg'
        }`}
        onClick={() => onClick?.(goal)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1" dir="rtl">
              <div className="flex items-center gap-2 mb-2">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Target className="w-5 h-5 text-amber-600" />
                )}
                <h3 className="text-lg font-arabic-bold text-gray-900">
                  {goal.title}
                </h3>
              </div>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-arabic">
                {goalTypeNames[goal.goal_type]}
              </Badge>
            </div>
            <div className="flex gap-1">
              {isCompleted && onReset && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReset(goal);
                  }}
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-blue-600"
                  title="إعادة تعيين الهدف"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
              {!isCompleted && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(goal);
                  }}
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-emerald-600"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(goal.id);
                }}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4" dir="rtl">
          {/* Description */}
          {goal.description && (
            <p className="text-sm text-gray-600 font-arabic">
              {goal.description}
            </p>
          )}

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-gray-700">
                {Math.round(progress)}%
              </span>
              <span className="text-gray-500 font-arabic">
                {getProgressLabel()}
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </div>
          </div>

          {/* Additional Info */}
          {getAdditionalInfo() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
              <p className="text-xs text-blue-800 font-arabic text-center">
                {getAdditionalInfo()}
              </p>
            </div>
          )}

          {/* Dates */}
          {(goal.start_date || goal.end_date) && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-4 h-4" />
              <span>
                {goal.start_date && new Date(goal.start_date).toLocaleDateString('ar-SA')}
                {goal.start_date && goal.end_date && ' - '}
                {goal.end_date && new Date(goal.end_date).toLocaleDateString('ar-SA')}
              </span>
            </div>
          )}

          {/* Reward Message */}
          {isCompleted && goal.reward_message && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3">
              <p className="text-sm text-amber-900 font-arabic text-center">
                🎉 {goal.reward_message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}