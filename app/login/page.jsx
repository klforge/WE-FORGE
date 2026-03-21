'use client';
import React from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ShieldCheck, Mail, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import './page.css';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const isSuspended = error === 'SUSPENDED' || error === 'CallbackRouteError'; 
  // NextAuth sometimes wraps the thrown error in CallbackRouteError

  if (status === 'authenticated') {
    router.push('/profile');
    return null;
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__icon">
          <ShieldCheck size={48} className="icon-glow" />
        </div>
        
        <h1 className="login-card__title">Member Portal</h1>
        <p className="login-card__subtitle">
          Exclusively for K L University Students. Use your official mail to access your workspace.
        </p>

        <div className="login-card__notice">
          <Mail size={16} />
          <span>Only @kluniversity.in domains allowed</span>
        </div>

        {isSuspended && (
          <div className="login-card__error" style={{ 
            background: 'rgba(255, 77, 77, 0.1)', 
            border: '1px solid rgba(255, 77, 77, 0.2)', 
            color: '#ff4d4d', 
            padding: '12px', 
            borderRadius: '12px', 
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '16px',
            lineHeight: '1.4'
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>
              Your account is suspended. If you think this is an error, contact <strong>forge@kluniversity.in</strong>
            </span>
          </div>
        )}

        <button 
          onClick={() => signIn('azure-ad', { callbackUrl: '/profile' })}
          className="login-btn"
        >
          <img src="https://authjs.dev/img/providers/azure.svg" alt="Microsoft" width={20} />
          Continue with Microsoft
          <ChevronRight size={16} />
        </button>

        <p className="login-card__footer">
          By continuing, you agree to the club's code of conduct and privacy guidelines.
        </p>
      </div>
    </div>
  );
}
