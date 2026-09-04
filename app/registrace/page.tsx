'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    birthNumber: '', // Rodné číslo bez lomítka (VS pro platby)
    birthDate: '',
    address: '',
    clothingSize: 'M',
    goals: '',
    customer_note: '',
  });

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'birthNumber') {
      // Automaticky odfiltruje lomítka, mezery a nečíselné znaky, max 10 číslic
      const cleaned = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, birthNumber: cleaned }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSizeSelect = (size: string) => {
    setFormData(prev => ({ ...prev, clothingSize: size }));
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validace shody hesel
    if (formData.password !== formData.confirmPassword) {
      setError('Hesla se neshodují.');
      return;
    }

    // Validace rodného čísla (9 nebo 10 číslic)
    if (formData.birthNumber && (formData.birthNumber.length < 9 || formData.birthNumber.length > 10)) {
      setError('Rodné číslo musí mít 9 nebo 10 číslic (bez lomítka).');
      return;
    }

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

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.92V6.75" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Zkontroluj si e-mail</h1>
          <p className="text-gray-600 mb-6">
            Na adresu <span className="font-semibold text-gray-900">{registeredEmail}</span> jsme ti právě poslali potvrzovací odkaz.
          </p>
          <button
            onClick={() => router.push('/prihlaseni')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition shadow-md"
          >
            Přejít na přihlášení
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-6 py-12">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-200">
        <h1 className="text-3xl font-bold mb-2 text-center text-emerald-600">Registrace člena</h1>
        <p className="text-gray-500 text-center mb-8">Staň se součástí týmu EMS Znojmo.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm text-center animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" method="POST" action="#">
          {/* Jméno a Příjmení */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold mb-2 text-gray-700">Jméno *</label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                autoComplete="given-name"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                placeholder="Jan"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold mb-2 text-gray-700">Příjmení *</label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                autoComplete="family-name"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                placeholder="Novák"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-2 text-gray-700">E-mail *</label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              placeholder="jan.novak@email.cz"
            />
          </div>

          {/* Hesla */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2 text-gray-700">Heslo *</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2 text-gray-700">Potvrzení hesla *</label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none transition focus:ring-2 focus:ring-emerald-500 ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword 
                  ? 'border-red-400' 
                  : 'border-gray-300'
                }`}
                placeholder="••••••••"
              />
            </div>
          </div>
          
          {/* Přepínač zobrazení hesla */}
          <div className="flex items-center gap-2 -mt-2">
            <input 
              type="checkbox" 
              id="show-pass" 
              onChange={() => setShowPassword(!showPassword)}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="show-pass" className="text-xs text-gray-500 cursor-pointer select-none">Zobrazit hesla</label>
          </div>

          {/* Telefon, Rodné číslo a Datum Narození */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold mb-2 text-gray-700">Telefon *</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                autoComplete="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                placeholder="+420 123 456 789"
              />
            </div>

            <div>
              <label htmlFor="birthNumber" className="block text-sm font-semibold mb-2 text-gray-700">
                Rodné číslo <span className="text-xs font-normal text-gray-400">(bez lomítka) *</span>
              </label>
              <input
                id="birthNumber"
                type="text"
                name="birthNumber"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                required
                value={formData.birthNumber}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition font-mono"
                placeholder="9931121234"
              />
            </div>

            <div>
              <label htmlFor="birthDate" className="block text-sm font-semibold mb-2 text-gray-700">Datum narození</label>
              <input
                id="birthDate"
                type="date"
                name="birthDate"
                autoComplete="bday"
                value={formData.birthDate || ''}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>
          </div>

          {/* Adresa a Velikost */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-semibold mb-2 text-gray-700">Adresa trvalého bydliště</label>
              <input
                id="address"
                type="text"
                name="address"
                autoComplete="street-address"
                value={formData.address}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                placeholder="Ulice 123, Znojmo"
              />
            </div>

            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Velikost EMS</label>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 flex items-center justify-between focus:ring-2 focus:ring-emerald-500 transition"
              >
                <span>{formData.clothingSize}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 transition ${isDropdownOpen ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </button>
              {isDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-2xl py-1 overflow-hidden">
                  {sizes.map((size) => (
                    <button key={size} type="button" onClick={() => handleSizeSelect(size)} className="w-full text-left px-4 py-2 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">{size}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tlačítko */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition duration-200 shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Registruji...
              </>
            ) : 'Dokončit registraci'}
          </button>
        </form>
      </div>
    </div>
  );
}