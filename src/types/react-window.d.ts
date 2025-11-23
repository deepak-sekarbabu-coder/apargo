declare module 'react-window' {
  import * as React from 'react';

  export type CSSDirection = 'ltr' | 'rtl';
  export type Layout = 'horizontal' | 'vertical';
  export type ScrollAlignment = 'auto' | 'smart' | 'center' | 'end' | 'start';

  export interface ListProps {
    children: React.ComponentType<{ index: number; style: React.CSSProperties }>;
    className?: string;
    direction?: CSSDirection;
    height: number | string;
    initialScrollOffset?: number;
    innerElementType?: React.ElementType;
    innerRef?: React.Ref<unknown>;
    innerTagName?: string;
    itemCount: number;
    itemData?: unknown;
    itemKey?: (index: number, data: unknown) => React.Key;
    itemSize: number | ((index: number) => number);
    layout?: Layout;
    onItemsRendered?: (props: {
      overscanStartIndex: number;
      overscanStopIndex: number;
      visibleStartIndex: number;
      visibleStopIndex: number;
    }) => void;
    onScroll?: (props: {
      scrollDirection: 'forward' | 'backward';
      scrollOffset: number;
      scrollUpdateWasRequested: boolean;
    }) => void;
    outerElementType?: React.ElementType;
    outerRef?: React.Ref<unknown>;
    outerTagName?: string;
    overscanCount?: number;
    style?: React.CSSProperties;
    useIsScrolling?: boolean;
    width: number | string;
  }

  export class VariableSizeList extends React.Component<ListProps> {
    scrollTo(scrollOffset: number): void;
    scrollToItem(index: number, align?: ScrollAlignment): void;
    resetAfterIndex(index: number, shouldForceUpdate?: boolean): void;
  }

  export class FixedSizeList extends React.Component<ListProps> {
    scrollTo(scrollOffset: number): void;
    scrollToItem(index: number, align?: ScrollAlignment): void;
  }
}
