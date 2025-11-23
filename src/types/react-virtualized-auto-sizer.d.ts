declare module 'react-virtualized-auto-sizer' {
  import * as React from 'react';

  export interface Size {
    height: number;
    width: number;
  }

  export interface AutoSizerProps {
    children: (size: Size) => React.ReactNode;
    className?: string;
    defaultHeight?: number;
    defaultWidth?: number;
    disableHeight?: boolean;
    disableWidth?: boolean;
    nonce?: string;
    onResize?: (size: Size) => void;
    style?: React.CSSProperties;
  }

  export default class AutoSizer extends React.Component<AutoSizerProps> {}
}
