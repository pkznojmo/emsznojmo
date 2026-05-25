'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    birthDate: '',
    address: '',
    clothingSize: 'M',
    goals: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Něco se pokazilo při komunikaci se serverem.');
      }

      setRegisteredEmail(formData.email);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 1. Stav po úspěšné registraci (Čekání na potvrzení e-mailu)
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.92V6.75" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Zkontroluj si e-mail</h1>
          <p className="text-gray-600 mb-6">
            Na adresu <span className="font-semibold text-gray-900">{registeredEmail}</span> jsme ti právě poslali potvrzovací odkaz. Pro aktivaci účtu na něj klikni.
          </p>
          <div className="pt-2">
            <button
              onClick={() => router.push('/prihlaseni')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition duration-200"
            >
              Přejít na přihlášení
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Hlavní formulář
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-200 my-8">
        <h1 className="text-3xl font-bold mb-2 text-center text-emerald-600">Registrace člena</h1>
        <p className="text-gray-500 text-center mb-8">Zadej své údaje pro přístup do rezervačního systému EMS.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Jméno a Příjmení */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Jméno *</label>
              <input
                type="text"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                placeholder="Jan"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Příjmení *</label>
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                placeholder="Novák"
              />
            </div>
          </div>

          {/* Email a Heslo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">E-mail *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                placeholder="jan.novak@email.cz"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Heslo *</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                placeholder="•••••••• (min. 6 znaků)"
              />
            </div>
          </div>

          {/* Telefon a Datum Narození */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Telefon *</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                placeholder="+420 123 456 789"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Datum narození</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate || ''}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Adresa a Velikost Oblečení */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Adresa trvalého bydliště</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                placeholder="Ulice 123, Znojmo"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Velikost EMS</label>
              <select
                name="clothingSize"
                value={formData.clothingSize}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              >
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>
          </div>

          {/* Fitness Cíle */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Jaké jsou tvé fitness cíle?</label>
            <textarea
              name="goals"
              rows={3}
              value={formData.goals}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition resize-none"
              placeholder="Např. redukce váhy, odstranění bolesti zad..."
            />
          </div>

          {/* Tlačítko */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition duration-200 shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Zpracovávám registraci...' : 'Dokončit registraci'}
          </button>
        </form>
      </div>
    </div>
  );
}