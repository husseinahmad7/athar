import * as React from "react"
import { cn } from "@/utils"

const TabsContext = React.createContext();

const Tabs = ({ defaultValue, value: controlledValue, onValueChange, children, className }) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  
  const handleValueChange = (newValue) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1", className)}
    {...props}
  >
    {children}
  </div>
));
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef(({ className, children, value: triggerValue, ...props }, ref) => {
  const { value: currentValue, onValueChange } = React.useContext(TabsContext);
  const isActive = currentValue === triggerValue;
  
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onValueChange?.(triggerValue)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-600",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = ({ className, children, value: contentValue, ...props }) => {
  const { value: currentValue } = React.useContext(TabsContext);
  
  if (contentValue !== currentValue) return null;
  
  return (
    <div className={cn("mt-2", className)} {...props}>
      {children}
    </div>
  );
};
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent }
