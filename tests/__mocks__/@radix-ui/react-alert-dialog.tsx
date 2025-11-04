import * as React from 'react';

export const Root = ({ children, open, onOpenChange }: any) => (
  <div data-open={open} data-testid="radix-alert-dialog-root">
    {children}
  </div>
);
export const Trigger = ({ children, asChild, ...props }: any) => {
  if (asChild) {
    // Pass through without introducing an extra button wrapper
    return React.cloneElement(children, { ...props });
  }
  return <button {...props}>{children}</button>;
};
export const Portal = ({ children }: any) => <>{children}</>;
export const Overlay = ({ children }: any) => <div>{children}</div>;
export const Content = React.forwardRef<HTMLDivElement, any>(({ className, children }, ref) => (
  <div ref={ref} role="alertdialog" className={className}>
    {children}
  </div>
));
export const Title = ({ children }: any) => <h2>{children}</h2>;
export const Description = ({ children }: any) => <p>{children}</p>;
export const Action = ({ children, ...props }: any) => <button {...props}>{children}</button>;
export const Cancel = ({ children }: any) => <button>{children}</button>;
export const createAlertDialogScope = () => {
  return () => {};
};
