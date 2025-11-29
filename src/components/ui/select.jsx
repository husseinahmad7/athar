import * as React from "react"
import { cn } from "@/utils"

const SelectContext = React.createContext();

const Select = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Extract items from children to get labels
  const items = React.useMemo(() => {
    const itemsList = [];
    React.Children.forEach(children, child => {
      if (child.type === SelectContent) {
        React.Children.forEach(child.props.children, item => {
          if (item && item.props && item.props.value !== undefined) {
            itemsList.push({
              value: item.props.value,
              label: item.props.children
            });
          }
        });
      }
    });
    return itemsList;
  }, [children]);
  
  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen, items }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { isOpen, setIsOpen } = React.useContext(SelectContext);
  
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder }) => {
  const { value, items } = React.useContext(SelectContext);
  
  const selectedItem = items.find(item => item.value === value);
  
  return (
    <span className={selectedItem ? "text-gray-900" : "text-gray-500"}>
      {selectedItem ? selectedItem.label : placeholder}
    </span>
  );
};

const SelectContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const { isOpen, setIsOpen } = React.useContext(SelectContext);
  
  if (!isOpen) return null;
  
  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={() => setIsOpen(false)}
      />
      <div
        ref={ref}
        className={cn(
          "absolute z-50 mt-1 w-full max-h-96 overflow-hidden rounded-lg border bg-white shadow-lg",
          className
        )}
        {...props}
      >
        <div className="overflow-y-auto p-1">
          {children}
        </div>
      </div>
    </>
  );
});
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef(({ className, children, value: itemValue, ...props }, ref) => {
  const { value, onValueChange, setIsOpen } = React.useContext(SelectContext);
  const isSelected = value === itemValue;
  
  return (
    <div
      ref={ref}
      onClick={() => {
        onValueChange(itemValue);
        setIsOpen(false);
      }}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none hover:bg-emerald-100 focus:bg-emerald-100 transition-colors",
        isSelected && "bg-emerald-50 font-semibold",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
