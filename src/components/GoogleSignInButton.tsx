import React, { useState } from 'react';
import { GoogleIcon } from './GoogleIcon';
import { GoogleAuthDialog } from './GoogleAuthDialog';

interface GoogleSignInButtonProps {
  onSuccess: (data: { token: string; user: { id: string; email: string; name: string; avatar?: string }; isNewUser?: boolean }) => void;
  defaultEmail?: string;
  className?: string;
  text?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  defaultEmail,
  className = '',
  text = 'Sign in with Google'
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    // If Google Identity Services (GSI) is configured in window
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        // You could trigger prompt or standard dialog
      } catch (e) {
        console.warn('GSI prompt failed, opening modal dialog', e);
      }
    }
    setIsDialogOpen(true);
  };

  const handleAuthSuccess = (data: any) => {
    setIsDialogOpen(false);
    onSuccess(data);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl border border-slate-300 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-400 active:scale-[0.99] cursor-pointer disabled:opacity-60 ${className}`}
      >
        <GoogleIcon className="w-5 h-5 shrink-0" />
        <span>{text}</span>
      </button>

      <GoogleAuthDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={handleAuthSuccess}
        defaultEmail={defaultEmail}
      />
    </>
  );
};
