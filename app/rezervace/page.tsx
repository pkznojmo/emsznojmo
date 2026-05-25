'use client';

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar, Clock, LogIn } from "lucide-react";
import { supabase } from "../../lib/supabase";

const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let h = 6; h <= 18; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < 18) slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export default function RezervacePage() {
  const router = useRouter();
  const [offset, setOffset] = useState(0); // 0 = tento týden, 1 = další týden
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]); // Formát "YYYY-MM-DD_HH:MM"

  // Generování dat pro zobrazení
  const visibleDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + (offset * 7) + i);
      dates.push({
        iso: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' })
      });
    }
    return dates;
  }, [offset]);

  useEffect(() => {
    const fetchReservations = async () => {
      const { data } = await supabase
        .from('reservations')
        .select('date, time')
        .eq('status', 'CONFIRMED');
      
      if (data) {
        // Ukládáme jako "YYYY-MM-DD_HH:MM" pro snadné porovnání
        setBookedSlots(data.map(r => `${r.date}_${r.time}`));
      }
    };
    fetchReservations();
  }, []);

  const handleRedirectToAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;
    router.push(`/dashboard/nova-lekce?date=${selectedDate}&time=${selectedTime}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <form onSubmit={handleRedirectToAuth} className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Přepínač týdnů */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
              <button type="button" onClick={() => setOffset(prev => Math.max(0, prev - 1))} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft /></button>
              <span className="font-bold text-gray-700">{offset === 0 ? "Tento týden" : "Příští týden"}</span>
              <button type="button" onClick={() => setOffset(prev => prev + 1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight /></button>
            </div>

            {/* Výběr data */}
            <div className="bg-white p-6 rounded-3xl border shadow-sm">
              <h2 className="text-xs font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
                <Calendar size={16} /> 1. Vyberte datum
              </h2>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {visibleDates.map((d) => (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => { setSelectedDate(d.iso); setSelectedTime(""); }}
                    className={`p-2 text-xs font-bold rounded-xl border-2 ${selectedDate === d.iso ? "bg-emerald-600 text-white border-emerald-600" : "bg-white border-gray-100"}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Výběr času */}
            <div className={`bg-white p-6 rounded-3xl border shadow-sm transition-opacity ${!selectedDate ? "opacity-50" : ""}`}>
              <h2 className="text-xs font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
                <Clock size={16} /> 2. Vyberte čas
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {TIME_SLOTS.map((time) => {
                  const isBooked = bookedSlots.includes(`${selectedDate}_${time}`);
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={isBooked || !selectedDate}
                      onClick={() => setSelectedTime(time)}
                      className={`p-2 text-sm font-bold rounded-xl border-2 ${
                        isBooked ? "bg-red-50 text-red-400 border-red-100 cursor-not-allowed"
                        : selectedTime === time ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white border-gray-100 hover:border-emerald-300"
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pravý sloupec */}
          <div className="bg-white p-6 rounded-3xl border shadow-lg h-fit">
            <h2 className="font-bold mb-4">Shrnutí rezervace</h2>
            <p className="text-sm text-gray-600 mb-4">Datum: {selectedDate || "Nebylo vybráno"}</p>
            <p className="text-sm text-gray-600 mb-6">Čas: {selectedTime || "Nebylo vybráno"}</p>
            <button type="submit" disabled={!selectedTime} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700">
              Pokračovat <LogIn size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}