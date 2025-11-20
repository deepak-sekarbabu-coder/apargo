'use client';

import { createContext, useContext } from 'react';

const NonceContext = createContext<string>('');

export function NonceProvider({
    children,
    nonce,
}: {
    children: React.ReactNode;
    nonce: string;
}) {
    return <NonceContext.Provider value={nonce}>{children}</NonceContext.Provider>;
}

export function useNonce() {
    return useContext(NonceContext);
}
