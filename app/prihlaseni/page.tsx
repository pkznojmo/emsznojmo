'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // 1. Přihlášení uživatele
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Nesprávný e-mail nebo heslo.');
        }
        if (authError.message.includes('Email not confirmed')) {
          throw new Error('Tvůj e-mail ještě nebyl ověřen. Klikni na odkaz, který jsme ti poslali.');
        }
        throw new Error(authError.message);
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Odeslání žádosti o reset hesla
  const handleForgotPassword = async () => {
    setError('');
    setSuccess('');

    if (!email) {
      setError('Nejdříve vyplň svůj e-mail nahoru do pole.');
      return;
    }

    setResetLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        // Správný callback, který kód vymění za session a přesměruje na formulář
        redirectTo: `${window.location.origin}/auth/callback?next=/obnova-hesla`,
      });

      if (resetError) {
        throw new Error(resetError.message);
      }

      setSuccess('E-mail s odkazem pro obnovu hesla byl úspěšně odeslán! Zkontroluj si schránku.');
    } catch (err: any) {
      setError('Chyba při odesílání e-mailu: ' + err.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
        <h1 className="text-3xl font-bold mb-2 text-center text-emerald-600">Přihlášení</h1>
        <p className="text-gray-500 text-center mb-8">Vítej zpět! Přihlas se do svého účtu EMS.</p>

        {/* Chybová hláška */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm text-center font-medium">
            {error}
          </div>
        )}

        {/* Informace o úspěšném odeslání e-mailu */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl mb-6 text-sm text-center font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              placeholder="jan.novak@email.cz"
            />
          </div>

          {/* Heslo + zapomenuté heslo odkaz */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-gray-700">Heslo</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="text-xs text-emerald-600 hover:underline font-semibold disabled:opacity-50"
              >
                {resetLoading ? 'Odesílám...' : 'Zapomněl(a) jsi heslo?'}
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              placeholder="••••••••"
            />
          </div>

          {/* Tlačítko pro odeslání */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition duration-200 shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ověřuji údaje...
              </>
            ) : (
              'Přihlásit se'
            )}
          </button>
        </form>

        {/* Odkaz na registraci */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Nemáš ještě účet?{' '}
          <button
            type="button"
            onClick={() => router.push('/registrace')}
            className="text-emerald-600 font-semibold hover:underline"
          >
            Zaregistruj se
          </button>
        </div>
      </div>
    </div>
  );
}