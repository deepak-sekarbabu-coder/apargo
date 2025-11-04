import * as React from 'react';

export const Root = ({ children, open }: any) => (
  <div data-open={open} data-testid="radix-dialog-root">
    {children}
  </div>
);
export const Trigger = ({ children }: any) => children;
export const Portal = ({ children }: any) => <>{children}</>;
export const Overlay = ({ children }: any) => <div>{children}</div>;
export const Content = React.forwardRef<HTMLDivElement, any>(({ className, children }, ref) => (
  <div ref={ref} role="dialog" className={className}>
    {children}
  </div>
));
export const Title = ({ children }: any) => <h2>{children}</h2>;
export const Description = ({ children }: any) => <p>{children}</p>;
export const Close = ({ children }: any) => <button>{children}</button>;
export const createDialogScope = () => {
  return () => {};
};
