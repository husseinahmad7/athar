import * as React from "react"
import { cn } from "@/utils"

const Dialog = ({ open, onOpenChange, children }) => {
  return (
    <>
      {React.Children.map(children, child => {
        if (child.type === DialogTrigger) {
          return React.cloneElement(child, { onClick: () => onOpenChange(true) });
        }
        if (child.type === DialogContent && open) {
          return React.cloneElement(child, { onClose: () => onOpenChange(false) });
        }
        return null;
      })}
    </>
  );
};

const DialogTrigger = React.forwardRef(({ className, children, onClick, ...props }, ref) => {
  return React.cloneElement(children, { onClick });
});

const DialogContent = React.forwardRef(({ className, children, onClose, ...props }, ref) => {
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        ref={ref}
        className={cn(
          "relative z-50 w-full max-w-lg bg-white rounded-xl shadow-lg p-6",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
});

const DialogHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-right mb-4", className)} {...props} />
);

const DialogTitle = ({ className, ...props }) => (
  <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
);

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle }
