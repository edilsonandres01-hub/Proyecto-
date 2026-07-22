import { Suspense } from 'react';
import SimClient from './SimClient';

export default function SimPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#0b1410] text-[#e8f0e4]">
          Cargando simulador…
        </main>
      }
    >
      <SimClient />
    </Suspense>
  );
}
