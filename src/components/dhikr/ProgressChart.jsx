import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function ProgressChart({ data, type = 'bar' }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500 font-arabic" dir="rtl">
          لا توجد بيانات للعرض
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2" dir="rtl">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-arabic-bold text-gray-900">
            إحصائيات التقدم
          </h3>
        </div>
      </CardHeader>
      
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {type === 'bar' ? (
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <Bar 
                dataKey="value" 
                fill="#059669" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#059669" 
                strokeWidth={3}
                dot={{ fill: '#059669', r: 5 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}