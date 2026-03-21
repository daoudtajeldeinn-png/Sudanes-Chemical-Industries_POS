'use client';

import { useRouter } from 'next/navigation';

export default function BackButton({ className = "btn-secondary text-sm flex items-center gap-1", label = "الرجوع" }) {
  const router = useRouter();
  
  return (
    <button onClick={() => router.back()} className={className}>
      <span>🔙</span> {label}
    </button>
  );
}
