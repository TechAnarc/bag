import React from 'react';
import { cn } from "@/lib/utils";
import { Check, Clock, Package, Truck, CheckCircle2, AlertCircle } from "lucide-react";

const states = [
  { id: 'CREATED', label: 'Created', icon: Clock },
  { id: 'PAYMENT_CONFIRMED', label: 'Paid', icon: CheckCircle2 },
  { id: 'PROCESSING', label: 'Processing', icon: Package },
  { id: 'PACKED', label: 'Packed', icon: Package },
  { id: 'SHIPPED', label: 'Shipped', icon: Truck },
  { id: 'DELIVERED', label: 'Delivered', icon: Check },
];

export const OrderStateTracker = ({ currentStatus }: { currentStatus: string }) => {
  const currentIndex = states.findIndex(s => s.id === currentStatus);
  const isFailed = currentStatus === 'FAILED' || currentStatus === 'CANCELLED';

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
        <div 
          className={cn(
            "absolute top-1/2 left-0 h-0.5 transition-all duration-500 -translate-y-1/2 z-0 bg-indigo-500",
            isFailed && "bg-rose-500"
          )}
          style={{ width: `${(Math.max(0, currentIndex) / (states.length - 1)) * 100}%` }}
        />

        {states.map((state, index) => {
          const Icon = state.icon;
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={state.id} className="relative z-10 flex flex-col items-center">
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isActive ? "bg-indigo-600 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]" : "bg-slate-900 border-slate-700",
                  isCurrent && "scale-125 ring-4 ring-indigo-500/20"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-500")} />
              </div>
              <span className={cn(
                "absolute -bottom-6 text-[10px] font-bold uppercase tracking-tighter whitespace-nowrap",
                isActive ? "text-white" : "text-slate-500"
              )}>
                {state.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {isFailed && (
        <div className="mt-10 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-rose-400 text-xs font-medium">
          <AlertCircle size={14} />
          Order reached terminal state: {currentStatus}
        </div>
      )}
    </div>
  );
};
