'use client';

import dynamic from 'next/dynamic';

const App = dynamic(() => import('@/App'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-foreground/10" />
        <div className="h-4 w-32 bg-foreground/10 rounded-full" />
      </div>
    </div>
  ),
});

export default function Home() {
  return <App />;
}
