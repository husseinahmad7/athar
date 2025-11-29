import React, { useState } from 'react';
import { api } from '@/api/db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trophy } from 'lucide-react';
import GoalCard from '@/components/dhikr/GoalCard';
import { toast } from 'sonner';

const GOAL_TYPES = [
  { value: 'daily_streak', label: 'سلسلة يومية (أي ذكر)', description: 'إكمال أي ذكر لأيام متتالية' },
  { value: 'dhikr_streak', label: 'سلسلة ذكر محدد', description: 'إكمال ذكر معين لأيام متتالية' },
  { value: 'total_count', label: 'إجمالي العدد', description: 'عدد تراكمي لجميع الأذكار' },
  { value: 'specific_dhikr', label: 'ذكر محدد', description: 'عدد تراكمي لذكر معين' },
  { value: 'combination', label: 'مجموعة أذكار', description: 'عدد تراكمي لمجموعة أذكار' },
  { value: 'monthly_target', label: 'هدف شهري', description: 'هدف شهري يتجدد كل شهر' }
];

export default function Goals() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showDhikrDialog, setShowDhikrDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_type: 'daily_streak',
    target_value: 7,
    reward_message: '',
    dhikr_ids: [],
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });
  
  const queryClient = useQueryClient();
  
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => api.entities.Goal.list('-created_date', 50)
  });
  
  const { data: dhikrs = [] } = useQuery({
    queryKey: ['dhikrs-for-goals'],
    queryFn: () => api.entities.Dhikr.filter({ is_active: true })
  });
  
  const createMutation = useMutation({
    mutationFn: (data) => api.entities.Goal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      setIsDialogOpen(false);
      resetForm();
      toast.success('تم إنشاء الهدف بنجاح');
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Goal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      setIsDialogOpen(false);
      resetForm();
      toast.success('تم تحديث الهدف بنجاح');
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Goal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      toast.success('تم حذف الهدف');
    }
  });

  const resetGoalMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Goal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      toast.success('تم إعادة تعيين الهدف بنجاح');
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      goal_type: 'daily_streak',
      target_value: 7,
      reward_message: '',
      dhikr_ids: [],
      start_date: new Date().toISOString().split('T')[0],
      end_date: ''
    });
    setEditingGoal(null);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation: dhikr_streak requires at least one dhikr
    if (formData.goal_type === 'dhikr_streak' && formData.dhikr_ids.length === 0) {
      toast.error('يجب اختيار ذكر واحد على الأقل لسلسلة الذكر المحدد');
      return;
    }

    // Validation: specific_dhikr and combination require dhikr selection
    if ((formData.goal_type === 'specific_dhikr' || formData.goal_type === 'combination') && formData.dhikr_ids.length === 0) {
      toast.error('يجب اختيار الأذكار المطلوبة لهذا النوع من الأهداف');
      return;
    }

    // Prepare goal data
    const goalData = {
      ...formData,
      current_value: editingGoal ? (formData.current_value || 0) : 0,
      is_completed: editingGoal ? (formData.is_completed || false) : false
    };

    // Clear dhikr_ids for goal types that don't use them
    if (goalData.goal_type === 'daily_streak' || goalData.goal_type === 'total_count' || goalData.goal_type === 'monthly_target') {
      goalData.dhikr_ids = [];
    }

    // For specific_dhikr, set dhikr_id from first selected dhikr
    if (goalData.goal_type === 'specific_dhikr' && goalData.dhikr_ids.length > 0) {
      goalData.dhikr_id = goalData.dhikr_ids[0];
    }

    console.log('Submitting goal:', goalData);

    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, data: goalData });
    } else {
      createMutation.mutate(goalData);
    }
  };
  
  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      goal_type: goal.goal_type,
      target_value: goal.target_value,
      reward_message: goal.reward_message || '',
      dhikr_ids: goal.dhikr_ids || [],
      start_date: goal.start_date,
      end_date: goal.end_date || ''
    });
    setIsDialogOpen(true);
  };

  const handleResetGoal = (goal) => {
    // Reset the goal to start fresh with same settings
    const resetData = {
      current_value: 0,
      streak_count: 0,
      daily_progress: 0,
      monthly_progress: 0,
      is_completed: false,
      last_activity_date: null,
      last_reset_date: null,
      current_month: null,
      start_date: new Date().toISOString().split('T')[0]
    };

    resetGoalMutation.mutate({ id: goal.id, data: resetData });
  };

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50 islamic-pattern" dir="rtl">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-arabic-bold text-gray-900">
              أهدافي
            </h1>
            <p className="text-gray-600 font-arabic mt-1">
              حدد أهدافك وتابع تقدمك
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 font-arabic"
                onClick={resetForm}
              >
                <Plus className="w-5 h-5 ml-2" />
                إضافة هدف جديد
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-arabic-bold">
                  {editingGoal ? 'تعديل الهدف' : 'إنشاء هدف جديد'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title" className="font-arabic">عنوان الهدف *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    className="font-arabic"
                    placeholder="مثال: أذكار الصباح لمدة أسبوع"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="font-arabic">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="font-arabic"
                    placeholder="وصف تفصيلي للهدف..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="goal_type" className="font-arabic">نوع الهدف</Label>
                  <Select
                    value={formData.goal_type}
                    onValueChange={(value) => setFormData({...formData, goal_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value} className="font-arabic">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="target_value" className="font-arabic">القيمة المستهدفة</Label>
                  <Input
                    id="target_value"
                    type="number"
                    min="1"
                    value={formData.target_value}
                    onChange={(e) => setFormData({...formData, target_value: Number(e.target.value)})}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1 font-arabic">
                    {formData.goal_type === 'daily_streak' && 'عدد الأيام المتتالية المطلوبة (أي ذكر)'}
                    {formData.goal_type === 'dhikr_streak' && 'عدد الأيام المتتالية المطلوبة (للذكر المحدد)'}
                    {formData.goal_type === 'total_count' && 'إجمالي عدد التكرارات المطلوبة (تراكمي)'}
                    {formData.goal_type === 'specific_dhikr' && 'عدد التكرارات المطلوبة للذكر المحدد (تراكمي)'}
                    {formData.goal_type === 'combination' && 'عدد التكرارات المطلوبة لمجموعة الأذكار (تراكمي)'}
                    {formData.goal_type === 'monthly_target' && 'عدد التكرارات المطلوبة شهريًا (يتم إعادة التعيين كل شهر)'}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="reward_message" className="font-arabic">رسالة المكافأة</Label>
                  <Input
                    id="reward_message"
                    value={formData.reward_message}
                    onChange={(e) => setFormData({...formData, reward_message: e.target.value})}
                    className="font-arabic"
                    placeholder="مبارك! لقد حققت هدفك 🎉"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date" className="font-arabic">تاريخ البداية</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date" className="font-arabic">تاريخ النهاية (اختياري)</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    />
                  </div>
                </div>
                
                {/* Dhikr Selection - Disabled for daily_streak and total_count */}
                {formData.goal_type !== 'daily_streak' && formData.goal_type !== 'total_count' && formData.goal_type !== 'monthly_target' && (
                  <div>
                    <Label className="font-arabic">
                      الأذكار المحددة لهذا الهدف
                      {formData.goal_type === 'dhikr_streak' && <span className="text-red-500 mr-1">*</span>}
                    </Label>
                    <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                      {dhikrs.map(dhikr => (
                        <label key={dhikr.id} className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={formData.dhikr_ids.includes(dhikr.id)}
                            onChange={(e) => {
                              const ids = e.target.checked
                                ? [...formData.dhikr_ids, dhikr.id]
                                : formData.dhikr_ids.filter(id => id !== dhikr.id);
                              setFormData({...formData, dhikr_ids: ids});
                            }}
                            className="mt-1 rounded"
                          />
                          <span className="font-arabic text-sm">{dhikr.arabic_text}</span>
                        </label>
                      ))}
                    </div>
                    {formData.goal_type === 'dhikr_streak' && formData.dhikr_ids.length === 0 && (
                      <p className="text-xs text-red-500 mt-1 font-arabic">يجب اختيار ذكر واحد على الأقل</p>
                    )}
                  </div>
                )}

                {/* Info message for goal types that don't need dhikr selection */}
                {(formData.goal_type === 'daily_streak' || formData.goal_type === 'total_count' || formData.goal_type === 'monthly_target') && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800 font-arabic">
                      {formData.goal_type === 'daily_streak' && 'هذا الهدف يتتبع أي ذكر تقوم بإكماله'}
                      {formData.goal_type === 'total_count' && 'هذا الهدف يتتبع جميع الأذكار'}
                      {formData.goal_type === 'monthly_target' && 'هذا الهدف يتتبع جميع الأذكار شهريًا'}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1 font-arabic"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-amber-600 hover:bg-amber-700 font-arabic"
                  >
                    {editingGoal ? 'حفظ التعديلات' : 'إنشاء الهدف'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Active Goals */}
        <div>
          <h2 className="text-2xl font-arabic-bold text-gray-900 mb-4">
            الأهداف النشطة
          </h2>
          
          {isLoading ? (
            <div className="text-center py-12 text-gray-500 font-arabic">
              جاري التحميل...
            </div>
          ) : activeGoals.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-arabic mb-4">
                لم تضف أي أهداف بعد
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 font-arabic"
              >
                ابدأ بإنشاء هدف
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeGoals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onClick={(g) => {
                    setSelectedGoal(g);
                    setShowDhikrDialog(true);
                  }}
                  onEdit={() => handleEdit(goal)}
                  onDelete={(id) => {
                    if (confirm('هل تريد حذف هذا الهدف؟')) {
                      deleteMutation.mutate(id);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div>
            <h2 className="text-2xl font-arabic-bold text-gray-900 mb-4">
              الأهداف المكتملة
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedGoals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onClick={(g) => {
                    setSelectedGoal(g);
                    setShowDhikrDialog(true);
                  }}
                  onEdit={() => handleEdit(goal)}
                  onReset={(g) => {
                    if (confirm('هل تريد إعادة تعيين هذا الهدف والبدء من جديد؟')) {
                      handleResetGoal(g);
                    }
                  }}
                  onDelete={(id) => {
                    if (confirm('هل تريد حذف هذا الهدف؟')) {
                      deleteMutation.mutate(id);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Related Dhikrs Dialog */}
      <Dialog open={showDhikrDialog} onOpenChange={setShowDhikrDialog}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-arabic-bold">
              الأذكار المرتبطة بالهدف
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedGoal && (
              <>
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                  <h3 className="font-arabic-bold text-lg mb-2">{selectedGoal.title}</h3>
                  <p className="text-sm text-gray-600 font-arabic">{selectedGoal.description}</p>
                  <div className="mt-3 flex items-center gap-4">
                    <span className="text-sm font-semibold">
                      التقدم: {selectedGoal.current_value || 0} / {selectedGoal.target_value}
                    </span>
                    <span className="text-sm text-emerald-600 font-bold">
                      {Math.round(((selectedGoal.current_value || 0) / selectedGoal.target_value) * 100)}%
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-arabic-bold text-gray-900">الأذكار:</h4>
                  {selectedGoal.goal_type === 'specific_dhikr' && (selectedGoal.dhikr_id || (selectedGoal.dhikr_ids && selectedGoal.dhikr_ids.length > 0)) && (
                    <div className="bg-white border-2 border-emerald-200 rounded-lg p-3">
                      {(() => {
                        const dhikrId = selectedGoal.dhikr_id || (selectedGoal.dhikr_ids && selectedGoal.dhikr_ids[0]);
                        const dhikr = dhikrs.find(d => String(d.id) === String(dhikrId));
                        return dhikr ? (
                          <p className="font-arabic text-lg">{dhikr.arabic_text}</p>
                        ) : (
                          <p className="text-gray-500 font-arabic">ذكر محدد (ID: {dhikrId})</p>
                        );
                      })()}
                    </div>
                  )}
                  {selectedGoal.goal_type === 'combination' && selectedGoal.dhikr_ids && (
                    <div className="space-y-2">
                      {(Array.isArray(selectedGoal.dhikr_ids) ? selectedGoal.dhikr_ids : []).map(dhikrId => {
                        const dhikr = dhikrs.find(d => String(d.id) === String(dhikrId));
                        return dhikr ? (
                          <div key={dhikrId} className="bg-white border-2 border-emerald-200 rounded-lg p-3">
                            <p className="font-arabic text-lg">{dhikr.arabic_text}</p>
                          </div>
                        ) : (
                          <div key={dhikrId} className="bg-gray-100 border rounded-lg p-3">
                            <p className="text-gray-500 font-arabic text-sm">ذكر غير موجود (ID: {dhikrId})</p>
                          </div>
                        );
                      })}
                      {(!selectedGoal.dhikr_ids || selectedGoal.dhikr_ids.length === 0) && (
                        <p className="text-gray-500 font-arabic text-sm">لم يتم تحديد أذكار</p>
                      )}
                    </div>
                  )}
                  {selectedGoal.goal_type === 'total_count' && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                      <p className="text-gray-700 font-arabic">جميع الأذكار</p>
                      <p className="text-sm text-gray-500 mt-1">يتم احتساب جميع الأذكار التي تقوم بها</p>
                    </div>
                  )}
                  {selectedGoal.goal_type === 'daily_streak' && (
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3">
                      <p className="text-gray-700 font-arabic">سلسلة يومية</p>
                      <p className="text-sm text-gray-500 mt-1">قم بأي ذكر يومياً للحفاظ على السلسلة</p>
                    </div>
                  )}
                  {selectedGoal.goal_type === 'monthly_target' && (
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3">
                      <p className="text-gray-700 font-arabic">هدف شهري</p>
                      <p className="text-sm text-gray-500 mt-1">أكمل الهدف خلال الشهر</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
