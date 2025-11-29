import React, { useState, useEffect } from 'react';
import { api } from '@/api/db';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const [formData, setFormData] = useState({
    latitude: 21.4225,
    longitude: 39.8262,
    hijri_adjustment: 0,
    fajr_angle: 12,
    maghrib_angle: 6
  });
  
  const queryClient = useQueryClient();
  
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const results = await api.entities.UserSettings.list();
      if (results.length > 0) {
        setFormData({
          latitude: results[0].latitude || 32.6027,
          longitude: results[0].longitude || 44.0197,
          hijri_adjustment: results[0].hijri_adjustment || 0,
          fajr_angle: results[0].fajr_angle || 12,
          maghrib_angle: results[0].maghrib_angle || 6
        });
        return results[0];
      }
      return null;
    }
  });
  
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings) {
        await api.entities.UserSettings.update(settings.id, data);
      } else {
        await api.entities.UserSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      toast.success('تم حفظ الإعدادات بنجاح');
    }
  });
  
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          toast.success('تم تحديد موقعك');
        },
        (error) => {
          toast.error('فشل الحصول على الموقع');
        }
      );
    } else {
      toast.error('المتصفح لا يدعم تحديد الموقع');
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50 islamic-pattern" dir="rtl">
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-arabic-bold text-gray-900 mb-2">
            الإعدادات
          </h1>
          <p className="text-gray-600 font-arabic">
            تخصيص التطبيق حسب موقعك
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <h2 className="text-xl font-arabic-bold text-gray-900">موقعك الجغرافي</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude" className="font-arabic">خط العرض</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({...formData, latitude: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="longitude" className="font-arabic">خط الطول</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({...formData, longitude: Number(e.target.value)})}
                  />
                </div>
              </div>
              
              <Button
                type="button"
                onClick={getCurrentLocation}
                variant="outline"
                className="w-full font-arabic"
              >
                <MapPin className="w-4 h-4 ml-2" />
                تحديد موقعي الحالي
              </Button>
              
              <div>
                <Label htmlFor="hijri_adjustment" className="font-arabic">تعديل التاريخ الهجري</Label>
                <Input
                  id="hijri_adjustment"
                  type="number"
                  value={formData.hijri_adjustment}
                  onChange={(e) => setFormData({...formData, hijri_adjustment: Number(e.target.value)})}
                />
                <p className="text-xs text-gray-500 mt-1">+/- أيام حسب رؤية الهلال</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fajr_angle" className="font-arabic">زاوية الفجر (بالدرجات)</Label>
                  <Input
                    id="fajr_angle"
                    type="number"
                    step="0.5"
                    value={formData.fajr_angle}
                    onChange={(e) => setFormData({...formData, fajr_angle: Number(e.target.value)})}
                  />
                  <p className="text-xs text-gray-500 mt-1">الفجر الصادق (12 درجة تحت الأفق)</p>
                </div>
                <div>
                  <Label htmlFor="maghrib_angle" className="font-arabic">زاوية المغرب (بالدرجات)</Label>
                  <Input
                    id="maghrib_angle"
                    type="number"
                    step="0.5"
                    value={formData.maghrib_angle}
                    onChange={(e) => setFormData({...formData, maghrib_angle: Number(e.target.value)})}
                  />
                  <p className="text-xs text-gray-500 mt-1">الغروب والحمرة المشرقية (6 درجة تحت الأفق)</p>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 font-arabic"
              >
                <Save className="w-4 h-4 ml-2" />
                حفظ الإعدادات
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
