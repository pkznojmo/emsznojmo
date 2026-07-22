'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function ObnovaHeslaPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 1. Základní validace
    if (password.length < 6) {
      setError('Heslo musí mít alespoň 6 znaků.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Hesla se neshodují.');
      return;
    }

    setLoading(true);

    try {
      // 2. Aktualizace hesla přihlášeného uživatele (díky auth/callback session)
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSuccess('Heslo bylo úspěšně změněno! Přesměrovávám na přihlášení...');

      // 3. Po 2 sekundách přesměrujeme na login
      setTimeout(() => {
        router.push('/prihlaseni');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Nastala chybička při změně hesla.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
        <h1 className="text-3xl font-bold mb-2 text-center text-emerald-600">Nové heslo</h1>
        <p className="text-gray-500 text-center mb-8">Zadej své nové heslo k účtu EMS.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl mb-6 text-sm text-center font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handlePasswordUpdate} className="space-y-5">
          {/* Nové heslo */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Nové heslo</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              placeholder="••••••••"
            />
          </div>

          {/* Potvrzení hesla */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Potvrzení nového hesla</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              placeholder="••••••••"
            />
          </div>

          {/* Tlačítko pro odeslání */}
          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition duration-200 shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ukládám nové heslo...
              </>
            ) : (
              'Uložit nové heslo'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}