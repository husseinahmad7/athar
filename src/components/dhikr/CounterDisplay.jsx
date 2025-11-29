import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, RotateCcw, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CounterDisplay({ 
  count, 
  target, 
  onIncrement, 
  onDecrement, 
  onReset,
  onComplete,
  dhikrText 
}) {
  const [showRipple, setShowRipple] = useState(false);
  const percentage = Math.min((count / target) * 100, 100);
  const isComplete = count >= target;
  
  const handleIncrement = () => {
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 600);
    onIncrement();
    
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Main Counter */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 border-0 shadow-2xl">
          {/* Progress Bar */}
          <div 
            className="absolute bottom-0 left-0 h-2 bg-amber-400 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
          
          <div className="p-8 text-center">
            {/* Counter Button */}
            <button
              onClick={handleIncrement}
              className={`relative mx-auto mb-6 w-48 h-48 rounded-full bg-white shadow-2xl 
                         flex items-center justify-center cursor-pointer
                         transform transition-all duration-200 hover:scale-105 active:scale-95
                         ${showRipple ? 'ripple-effect' : ''}`}
            >
              <div>
                <div className="text-7xl font-bold text-emerald-600 mb-1">
                  {count}
                </div>
                <div className="text-sm text-gray-500 font-semibold">
                  من {target}
                </div>
              </div>
            </button>
            
            {/* Dhikr Text */}
            <div className="text-white mb-4" dir="rtl">
              <p className="text-3xl font-arabic-bold leading-relaxed whitespace-pre-wrap">
                {dhikrText}
              </p>
            </div>
            
            {/* Progress Text */}
            <div className="text-white/90 text-lg font-semibold">
              {isComplete ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-6 h-6" />
                  <span>مبارك! تم إكمال الذكر</span>
                </div>
              ) : (
                <span>متبقي {target - count}</span>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
      
      {/* Control Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          onClick={onDecrement}
          variant="outline"
          size="lg"
          disabled={count === 0}
          className="h-14 border-2"
        >
          <Minus className="w-5 h-5" />
        </Button>
        
        <Button
          onClick={onReset}
          variant="outline"
          size="lg"
          className="h-14 border-2"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
        
        <Button
          onClick={onComplete}
          disabled={!isComplete}
          size="lg"
          className="h-14 bg-amber-500 hover:bg-amber-600 disabled:opacity-50"
        >
          <CheckCircle2 className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Tap Instructions */}
      <div className="text-center text-sm text-gray-600 font-arabic" dir="rtl">
        <p>اضغط على الدائرة للعد</p>
      </div>
    </div>
  );
}