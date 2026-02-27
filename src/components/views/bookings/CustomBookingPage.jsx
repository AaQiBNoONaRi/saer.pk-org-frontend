import React, { useState, useMemo, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Plane, Building2, Users, ChevronDown, ChevronUp,
  CheckCircle, ArrowLeft, Clock, Upload, X, Check,
  CreditCard, ArrowRight, FileText, Smartphone, Wallet, ArrowLeftRight,
  Truck, Utensils, MapPin, Globe, Star, Building, Info
} from 'lucide-react';
import SearchableSelect from '../../ui/SearchableSelect';

const API = 'http://localhost:8000';
const PKR = (n) => `PKR ${(Number(n) || 0).toLocaleString()}`;
const SAR = (n) => `SAR ${(Number(n) || 0).toLocaleString()}`;

const CountdownTimer = ({ deadline }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const hasToasted = useRef(false);

  useEffect(() => {
    if (!deadline || deadline === '-') {
      setTimeLeft('-');
      return;
    }

    const target = new Date(deadline).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        if (!hasToasted.current) {
          toast.error('Booking Expired! (EXPIRED if not confirmed)', {
            duration: 6000,
            position: 'top-right',
          });
          hasToasted.current = true;
        }
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${h}h ${m}m ${s}s`);
    };

    const timer = setInterval(updateTimer, 1000);
    updateTimer();
    return () => clearInterval(timer);
  }, [deadline]);

  if (timeLeft === 'EXPIRED') return <span className="text-rose-500 font-bold">EXPIRED</span>;
  if (timeLeft === '-') return <span className="text-slate-300">-</span>;

  return (
    <span className="tabular-nums">
      {timeLeft}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  HELPERS                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

const emptyCustomPax = (id, type, familyId, familyLabel, isFamilyHead = false) => ({
  id, type, familyId, familyLabel, isFamilyHead,
  title: '', firstName: '', lastName: '',
  passportNo: '', dob: '', passportIssue: '', passportExpiry: '',
  country: '', passportFile: null, passportPath: '',
  familyHeadName: '', familyHeadPassport: ''
});

const calculateAge = (dob) => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const isPaxComplete = (p) => {
  const basicFields = p.type && p.title && p.firstName && p.lastName &&
    p.passportNo && p.dob && p.passportIssue && p.passportExpiry && p.country && p.passportFile;

  if (!basicFields) return false;

  const age = calculateAge(p.dob);
  if (p.type === 'Adult' && age < 18) return false;
  if (p.type === 'Child' && (age >= 18 || age < 2)) return false;
  if (p.type === 'Infant' && age >= 2) return false;

  return true;
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  ATOMIC COMPONENTS                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

const StepIndicator = ({ step, label, active, done }) => (
  <div className={`flex items-center gap-3 transition-all duration-500 ${active ? 'opacity-100 scale-110' : done ? 'opacity-100' : 'opacity-40'}`}>
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-200 text-slate-500'
      }`}>
      {done ? <CheckCircle size={20} /> : step}
    </div>
    <span className={`hidden md:block text-[11px] font-black uppercase tracking-widest ${active ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
  </div>
);

const InputField = ({ label, placeholder, type = 'text', value, onChange }) => (
  <div className="space-y-2 text-left">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-blue-50 focus:bg-white focus:border-blue-200 transition-all"
    />
  </div>
);

const SelectField = ({ label, options, rawOptions, value, onChange }) => (
  <div className="space-y-2 text-left">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-blue-50 focus:bg-white focus:border-blue-200 transition-all appearance-none cursor-pointer"
    >
      <option value="">Select</option>
      {options.map((o, i) => (
        <option key={o} value={rawOptions ? rawOptions[i] : o}>{o}</option>
      ))}
    </select>
  </div>
);

const SearchableCountryField = ({ label, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState('');
  const COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
    'Bahrain', 'Bangladesh', 'Belgium', 'Bosnia and Herzegovina', 'Brazil', 'Bulgaria',
    'Cambodia', 'Canada', 'Chile', 'China', 'Colombia', 'Croatia', 'Cyprus', 'Czech Republic',
    'Denmark', 'Egypt', 'Ethiopia', 'Finland', 'France', 'Germany', 'Ghana', 'Greece', 'Guatemala',
    'Hungary', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
    'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Kyrgyzstan',
    'Lebanon', 'Libya', 'Luxembourg', 'Malaysia', 'Maldives', 'Malta', 'Mexico', 'Moldova', 'Morocco', 'Myanmar',
    'Nepal', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Oman',
    'Pakistan', 'Palestine', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
    'Romania', 'Russia', 'Saudi Arabia', 'Serbia', 'Singapore', 'Slovakia', 'Slovenia',
    'Somalia', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sudan', 'Sweden', 'Switzerland', 'Syria',
    'Taiwan', 'Tanzania', 'Thailand', 'Tunisia', 'Turkey', 'Turkmenistan',
    'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uzbekistan',
    'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
  ];
  const filtered = COUNTRIES.filter(c => c.toLowerCase().includes((term || value || '').toLowerCase()));
  return (
    <div className="space-y-2 text-left relative z-10">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <input
          type="text" value={value} placeholder="Search country..."
          onChange={e => { onChange(e.target.value); setTerm(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-blue-50 focus:bg-white focus:border-blue-200 transition-all"
        />
        {isOpen && filtered.length > 0 && (
          <div className="absolute z-[100] w-full mt-2 bg-white border-2 border-slate-300 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
            {filtered.slice(0, 10).map(c => (
              <button key={c} type="button"
                onMouseDown={() => { onChange(c); setTerm(''); setIsOpen(false); }}
                className="w-full px-5 py-3 text-left text-sm font-bold hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0 first:rounded-t-2xl last:rounded-b-2xl">
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PaymentMethodCard = ({ label, icon, active, disabled, onClick }) => (
  <button onClick={onClick} disabled={disabled}
    className={`p-4 rounded-2xl border-2 transition-all text-center space-y-2 ${active ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
      : disabled ? 'border-slate-200 bg-slate-50 opacity-40 cursor-not-allowed'
        : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
      }`}>
    <div className={`flex items-center justify-center ${active ? 'text-blue-600' : disabled ? 'text-slate-400' : 'text-slate-600'}`}>{icon}</div>
    <p className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-blue-600' : 'text-slate-900'}`}>{label}</p>
    {disabled && <p className="text-[9px] font-bold text-slate-400">Coming Soon</p>}
  </button>
);

/* ─────────────────────────────────────────────────────────────────────────── */
/*  PAX ACCORDION (Step 1)                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

const PaxAccordion = ({ pax, index, isOpen, onToggle, onChange, onPassportUpload }) => {
  const fileRef = useRef();
  const complete = isPaxComplete(pax);
  const typeColor = pax.type === 'Adult' ? 'blue' : pax.type === 'Child' ? 'emerald' : 'violet';
  const colorMap = {
    blue: { badge: 'bg-blue-50 text-blue-600', border: 'border-blue-200', ring: 'ring-blue-100' },
    emerald: { badge: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-200', ring: 'ring-emerald-100' },
    violet: { badge: 'bg-violet-50 text-violet-600', border: 'border-violet-200', ring: 'ring-violet-100' },
  };
  const c = colorMap[typeColor];

  return (
    <div className={`rounded-3xl border-2 transition-all duration-300 overflow-hidden ${isOpen ? `${c.border} shadow-xl ring-4 ${c.ring}` : 'border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-slate-200'
      }`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${isOpen ? `${c.badge} text-base` : 'bg-slate-100 text-slate-400 text-xs'
            }`}>
            {complete ? <Check size={18} className="text-green-500" /> : index + 1}
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-slate-900 uppercase leading-none">
              {pax.firstName ? `${pax.title} ${pax.firstName} ${pax.lastName}` : `Passenger ${index + 1}`}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {pax.type} · {pax.familyLabel}
              {pax.isFamilyHead ? ' · Family Head' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {complete && <span className="hidden sm:flex items-center gap-1 text-[9px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full"><Check size={10} /> Complete</span>}
          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${c.badge}`}>{pax.type}</span>
          {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 space-y-5 border-t border-slate-100 pt-5 bg-slate-50/50">
          {/* Row 1: Type, Title, Names */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SelectField
              label="Type"
              options={['Adult', 'Child', 'Infant']}
              value={pax.type}
              onChange={v => onChange('type', v)}
            />
            <SelectField
              label="Title"
              options={['Mr', 'Mrs', 'Ms', 'Mstr', 'Miss']}
              value={pax.title}
              onChange={v => onChange('title', v)}
            />
            <InputField label="First Name" placeholder="John" value={pax.firstName} onChange={v => onChange('firstName', v)} />
            <InputField label="Last Name" placeholder="Doe" value={pax.lastName} onChange={v => onChange('lastName', v)} />
          </div>

          {/* Row 2: Passport details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <InputField label="Passport No" placeholder="AB1234567" value={pax.passportNo} onChange={v => onChange('passportNo', v)} />
            <InputField label="Date of Birth" type="date" value={pax.dob} onChange={v => onChange('dob', v)} />
            <InputField label="Passport Issue" type="date" value={pax.passportIssue} onChange={v => onChange('passportIssue', v)} />
            <InputField label="Passport Expiry" type="date" value={pax.passportExpiry} onChange={v => onChange('passportExpiry', v)} />
          </div>

          {/* Row 3: Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SearchableCountryField label="Country" value={pax.country} onChange={v => onChange('country', v)} />
          </div>

          {/* Passport Upload */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Passport Image / PDF</label>
            {pax.passportFile ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-3 w-full sm:w-auto sm:inline-flex">
                <Check size={16} className="text-green-600 shrink-0" />
                <span className="text-xs font-black text-green-700 flex-1 sm:flex-none truncate">Uploaded</span>
                <span className="text-[10px] font-bold text-green-600 truncate hidden sm:block ml-1">— {pax.passportFile.name}</span>
                <button onClick={() => onChange('passportFile', null)} className="text-slate-400 hover:text-red-500 transition-colors ml-2 shrink-0">
                  <X size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-3 px-6 py-3 bg-slate-100 hover:bg-blue-50 border-2 border-dashed border-slate-300 hover:border-blue-400 text-slate-500 hover:text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
              >
                <Upload size={15} /> Upload Passport
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
              onChange={e => { if (e.target.files[0]) onChange('passportFile', e.target.files[0]); e.target.value = ''; }} />
          </div>

          {/* Validation Feedback */}
          {!complete && (pax.dob || pax.passportFile === null) && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-2xl">
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest flex items-center gap-2">
                <Info size={12} /> Validation Issues:
              </p>
              <ul className="mt-1 space-y-1">
                {!pax.passportFile && <li className="text-[10px] font-bold text-red-500">• Passport Image is required</li>}
                {pax.dob && (
                  <>
                    {pax.type === 'Adult' && calculateAge(pax.dob) < 18 && <li className="text-[10px] font-bold text-red-500">• Adult must be 18 years or older</li>}
                    {pax.type === 'Child' && (calculateAge(pax.dob) >= 18 || calculateAge(pax.dob) < 2) && <li className="text-[10px] font-bold text-red-500">• Child must be between 2 and 17 years old</li>}
                    {pax.type === 'Infant' && calculateAge(pax.dob) >= 2 && <li className="text-[10px] font-bold text-red-500">• Infant must be under 2 years old</li>}
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  STEP 1 — Passenger Info                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

const StepOnePassengers = ({ passengers, setPassengers, expandedPax, setExpandedPax, onNext }) => {
  const completedCount = passengers.filter(isPaxComplete).length;
  const allComplete = passengers.length > 0 && completedCount === passengers.length;

  const handleChange = (idx, field, val) => {
    setPassengers(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[4px]">Passenger Details</h3>
        <span className="text-xs font-black text-slate-500">{completedCount}/{passengers.length} complete</span>
      </div>

      {/* Group passengers by family */}
      {(() => {
        const families = [...new Set(passengers.map(p => p.familyId))];
        return families.map(famId => {
          const famPax = passengers.filter(p => p.familyId === famId);
          const famLabel = famPax[0]?.familyLabel || famId;
          return (
            <div key={famId} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users size={12} className="text-blue-600" />
                </div>
                <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest">{famLabel}</p>
                <div className="flex-1 h-px bg-blue-100" />
                <span className="text-[10px] font-bold text-slate-400">{famPax.length} pax</span>
              </div>
              {famPax.map(pax => {
                const globalIdx = passengers.findIndex(p => p.id === pax.id);
                return (
                  <PaxAccordion
                    key={pax.id}
                    pax={pax}
                    index={globalIdx}
                    isOpen={expandedPax === pax.id}
                    onToggle={() => setExpandedPax(prev => prev === pax.id ? -1 : pax.id)}
                    onChange={(field, val) => handleChange(globalIdx, field, val)}
                  />
                );
              })}
            </div>
          );
        });
      })()}

      {!allComplete && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-5 py-4 text-xs font-bold">
          {passengers.length === 0 ? (
            <>
              <Info size={16} className="shrink-0" />
              No passengers specified in calculator. Please go back and add at least one person.
            </>
          ) : (
            <>
              <Clock size={15} className="shrink-0" />
              {passengers.length - completedCount} passenger(s) still need information.
            </>
          )
          }
        </div>
      )}

      <button
        onClick={onNext}
        className={`w-full py-5 rounded-2xl font-black uppercase tracking-[3px] text-xs shadow-xl flex items-center justify-center gap-3 transition-all ${allComplete ? 'bg-blue-600 text-white shadow-blue-500/30 hover:scale-[1.02] active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        disabled={!allComplete}
      >
        {passengers.length === 0 ? 'Add Passengers First' : 'Review Booking'} <ArrowRight size={18} />
      </button>
    </div >
  );
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  STEP 2 — Review                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */

/* Section wrapper card */
const SectionCard = ({ icon, title, color, children }) => {
  const colors = {
    purple: { header: 'bg-purple-50 border-purple-100', icon: 'bg-purple-100 text-purple-600', title: 'text-purple-700' },
    blue: { header: 'bg-blue-50   border-blue-100', icon: 'bg-blue-100   text-blue-600', title: 'text-blue-700' },
    orange: { header: 'bg-orange-50 border-orange-100', icon: 'bg-orange-100 text-orange-600', title: 'text-orange-700' },
    emerald: { header: 'bg-emerald-50 border-emerald-100', icon: 'bg-emerald-100 text-emerald-600', title: 'text-emerald-700' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      <div className={`flex items-center gap-3 px-6 py-4 border-b ${c.header}`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${c.icon}`}>{icon}</div>
        <h4 className={`text-[11px] font-black uppercase tracking-widest ${c.title}`}>{title}</h4>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
};

const StepTwoReview = ({
  passengers, calculatorData, grandTotal, familyInvoices, isLoading, onEdit, onNext,
  discountGroup, discountAmount = 0, subtotal = 0
}) => {
  const {
    selectedFlight, selectedVehicle, selectedVisaRate,
    hotelRows = [], selectedOptions = [], riyalRate
  } = calculatorData;

  const hasService = (name) => selectedOptions.some(opt => opt.toLowerCase().includes(name));
  const exRate = riyalRate?.rate || 1;
  const filledHotels = hotelRows.filter(h => h.hotel_name);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in slide-in-from-right-4 duration-500">

      {/* ══ LEFT — Extra services ══ */}
      <div className="lg:col-span-7 space-y-6">

        {/* Extra services */}
        {(hasService('food') || hasService('ziyarat')) && (
          <div className="flex gap-3">
            {hasService('food') && (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-2xl text-xs font-black text-yellow-700">
                <Utensils size={14} /> Food Included
              </div>
            )}
            {hasService('ziyarat') && (
              <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 px-4 py-3 rounded-2xl text-xs font-black text-teal-700">
                <MapPin size={14} /> Ziyarat Included
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ RIGHT — Price Card ══ */}
      <div className="lg:col-span-5">
        <div className="bg-white rounded-3xl border-2 border-blue-50 shadow-lg overflow-hidden sticky top-6">
          <div className="p-6 border-b border-slate-100 bg-blue-50/30">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Price Breakdown</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{passengers.length} Passengers · {familyInvoices.length} Famil{familyInvoices.length === 1 ? 'y' : 'ies'}</p>
          </div>
          <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
            {familyInvoices.map((inv, fi) => (
              <div key={fi} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users size={10} className="text-blue-600" />
                  </div>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    Family {fi + 1} · {inv.familyPax} pax
                  </p>
                </div>
                <div className="space-y-1.5 pl-7">
                  {inv.totalVisaPKR > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5"><Globe size={10} className="text-purple-400" /> Visa</span>
                      <span className="font-bold text-slate-800">{PKR(inv.totalVisaPKR)}</span>
                    </div>
                  )}
                  {inv.totalTicketPKR > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5"><Plane size={10} className="text-blue-400" /> Tickets</span>
                      <span className="font-bold text-slate-800">{PKR(inv.totalTicketPKR)}</span>
                    </div>
                  )}
                  {inv.transportNet > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5"><Truck size={10} className="text-orange-400" /> Transport</span>
                      <span className="font-bold text-slate-800">{PKR(inv.transportNet)}</span>
                    </div>
                  )}
                  {inv.accomPKR > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1.5"><Building2 size={10} className="text-emerald-400" /> Hotels</span>
                      <span className="font-bold text-slate-800">{PKR(inv.accomPKR)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pt-1.5 border-t border-slate-100">
                    <span className="font-black text-slate-700">Subtotal</span>
                    <span className="font-black text-slate-900">{PKR(inv.netPKR)}</span>
                  </div>
                </div>
                {fi < familyInvoices.length - 1 && <div className="border-b border-slate-100 pt-1" />}
              </div>
            ))}
          </div>
          <div className="p-6 border-t-2 border-slate-100 bg-slate-50/50 space-y-4">

            {/* Grand Total */}
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-black uppercase tracking-widest text-slate-900">Grand Total</span>
              <span className="text-2xl font-black text-blue-600">{PKR(subtotal)}</span>
            </div>
            <button
              onClick={onNext}
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-[3px] text-xs shadow-lg flex items-center justify-center gap-3 transition-all ${isLoading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white shadow-blue-500/30 hover:scale-[1.02] active:scale-95'
                }`}
            >
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating Booking...</>
              ) : (
                <>Confirm & Proceed <CheckCircle size={18} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  STEP 3 — Payment                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */

const StepThreePayment = ({
  booking, totalAmount, paymentMethod, setPaymentMethod,
  paymentData, setPaymentData, expiryMins,
  onConfirm, isLoading, setIsLoading, setError,
  discountGroup = null, discountAmount = 0
}) => {
  const upd = (field, val) => setPaymentData(prev => ({ ...prev, [field]: val }));

  // Dynamic bank accounts
  const [beneficiaryAccounts, setBeneficiaryAccounts] = useState([]);
  const [agentAccounts, setAgentAccounts] = useState([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API}/api/bank-accounts/?include_system=true`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const orgAccs = data.filter(a => a.account_type === 'Organization');
          const agAccs = data.filter(a => a.account_type === 'Agency');
          setBeneficiaryAccounts(orgAccs.map(a => `${a.account_title ? a.account_title + ' - ' : ''}${a.bank_name} (Acc: ${a.account_number}) (Org)`));
          setAgentAccounts(agAccs.map(a => `${a.account_title ? a.account_title + ' - ' : ''}${a.bank_name} (Acc: ${a.account_number}) (Agency)`));
        }
      } catch (e) { console.error('Error fetching bank accounts:', e); }
    };
    fetchAccounts();
  }, []);

  const handleHoldBooking = () => {
    window.location.href = '/booking-history';
  };

  const handleConfirmOrder = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const id = booking._id || booking.id;

      if (!paymentData.amount || paymentData.amount <= 0) {
        alert('Invalid amount. Please enter a valid amount.');
        setIsLoading(false);
        return;
      }

      const isManualPayment = ['bank', 'cash'].includes(paymentMethod);

      if (isManualPayment && paymentMethod === 'bank' && !paymentData.beneficiaryAccount) {
        if (!window.confirm('⚠️ No beneficiary account selected. Continue anyway?')) { setIsLoading(false); return; }
      }

      if (isManualPayment && paymentMethod === 'cash' && (!paymentData.bankName || !paymentData.depositorName || !paymentData.depositorCNIC)) {
        if (!window.confirm('⚠️ Cash deposit details incomplete. Continue anyway?')) { setIsLoading(false); return; }
      }

      if (paymentMethod === 'transfer' && (!paymentData.transferAccount || !paymentData.transferAccountName || !paymentData.transferPhone || !paymentData.transferCNIC || !paymentData.transferAccountNumber)) {
        if (!window.confirm('⚠️ Transfer details incomplete. Continue anyway?')) {
          setIsLoading(false);
          return;
        }
      }

      if ((isManualPayment || paymentMethod === 'transfer') && (paymentMethod === 'bank' || paymentMethod === 'transfer') && !paymentData.slipFile) {
        if (!window.confirm('⚠️ No payment slip uploaded. Continue anyway?')) { setIsLoading(false); return; }
      }


      // Bank / Cash - Use centralized payments API
      const formData = new FormData();
      formData.append('booking_id', id);
      formData.append('booking_type', 'custom');
      formData.append('payment_method', paymentMethod);
      formData.append('amount', paymentData.amount);
      formData.append('payment_date', paymentData.date);
      if (paymentData.note) formData.append('note', paymentData.note);

      if (paymentMethod === 'cash') {
        formData.append('bank_name', paymentData.bankName || '');
        formData.append('depositor_name', paymentData.depositorName || '');
        formData.append('depositor_cnic', paymentData.depositorCNIC || '');
      } else if (paymentMethod === 'transfer') {
        formData.append('transfer_account', paymentData.transferAccount?.value || paymentData.transferAccount || '');
        formData.append('transfer_account_name', paymentData.transferAccountName || '');
        formData.append('transfer_phone', paymentData.transferPhone || '');
        formData.append('transfer_cnic', paymentData.transferCNIC || '');
        formData.append('transfer_account_number', paymentData.transferAccountNumber || '');
      } else {
        formData.append('beneficiary_account', paymentData.beneficiaryAccount || '');
        formData.append('agent_account', paymentData.agentAccount || '');
      }

      if (paymentData.slipFile) {
        formData.append('slip_file', paymentData.slipFile);
      }

      const res = await fetch(`${API}/api/payments/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Failed to submit payment request');
      }

      alert('✅ Booking confirmed! Payment pending verification.');
      setIsLoading(false); onConfirm();
    } catch (e) {
      setError(e.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">

      {/* Booking Reference */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Booking Reference</p>
            <p className="text-3xl font-black">{booking.booking_reference}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Total Amount</p>
            <p className="text-2xl font-black">{PKR(totalAmount)}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm font-bold text-blue-200">{booking.total_passengers} passengers</p>
          <span className="inline-block px-4 py-2 bg-blue-500 rounded-xl font-black text-sm uppercase">
            {booking.booking_status || 'Under Process'}
          </span>
        </div>
      </div>

      {expiryMins != null && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl px-5 py-4 text-xs font-bold">
          <Clock size={15} className="shrink-0" />
          This booking will expire in <strong>{expiryMins} minutes</strong> if not confirmed.
        </div>
      )}

      {/* Agency Discount (if applicable) */}
      {discountAmount > 0 && discountGroup && (
        <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <Check size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-green-900 uppercase tracking-tight">Agency Discount Applied</h3>
              <p className="text-xs font-bold text-green-600">{discountGroup.name}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Total Amount</span>
              <span className="text-lg font-bold text-slate-900">{PKR(totalAmount + discountAmount)}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-sm font-medium text-green-700">Discount Applied</span>
              <span className="text-lg font-bold text-green-600">- {PKR(discountAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-slate-900 uppercase">Amount After Discount</span>
              <span className="text-2xl font-black text-blue-600">{PKR(totalAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Select Payment Method</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <PaymentMethodCard label="Bank Transfer" icon={<Building2 size={24} />} active={paymentMethod === 'bank'} onClick={() => setPaymentMethod('bank')} />
          <PaymentMethodCard label="Cash" icon={<Wallet size={24} />} active={paymentMethod === 'cash'} onClick={() => setPaymentMethod('cash')} />
          <PaymentMethodCard
            label="Transfer"
            icon={<ArrowLeftRight size={24} />}
            active={paymentMethod === 'transfer'}
            onClick={() => setPaymentMethod('transfer')}
          />
          <PaymentMethodCard label="KuikPay" icon={<Smartphone size={24} />} active={false} disabled={true} onClick={() => { }} />
        </div>

        {/* Bank */}
        {(paymentMethod === 'bank') && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Beneficiary Account (Company)" options={beneficiaryAccounts.length > 0 ? beneficiaryAccounts : ['No accounts found']} value={paymentData.beneficiaryAccount} onChange={v => upd('beneficiaryAccount', v)} />
              <SelectField label="Agent Account" options={agentAccounts.length > 0 ? agentAccounts : ['No accounts found']} value={paymentData.agentAccount} onChange={v => upd('agentAccount', v)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Amount" type="number" placeholder="Enter amount" value={paymentData.amount} onChange={v => upd('amount', parseFloat(v) || 0)} />
              <InputField label="Date" type="date" value={paymentData.date} onChange={v => upd('date', v)} />
              <InputField label="Note (Optional)" placeholder="Add note" value={paymentData.note} onChange={v => upd('note', v)} />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Upload Payment Slip *</label>
              {paymentData.slipFile ? (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-3 mt-2">
                  <Check size={16} className="text-green-600" />
                  <span className="text-xs font-black text-green-700 flex-1 truncate">{paymentData.slipFile.name}</span>
                  <button onClick={() => upd('slipFile', null)} className="text-slate-400 hover:text-red-500"><X size={15} /></button>
                </div>
              ) : (
                <input type="file" accept="image/*,.pdf" onChange={e => { if (e.target.files[0]) upd('slipFile', e.target.files[0]); }}
                  className="mt-2 w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-blue-50 transition-all" />
              )}
            </div>
          </div>
        )}

        {paymentMethod === 'transfer' && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SearchableSelect
                label="Organization Account (Internal)"
                options={beneficiaryAccounts.filter(a => a.includes('(Org)') || a.includes('Organization')).map(a => ({ label: a, value: a }))}
                value={paymentData.transferAccount}
                onChange={(v) => upd('transferAccount', v)}
                placeholder="Select Organization Account..."
              />
              <InputField
                label="Client Account Number"
                placeholder="Enter client's account number"
                value={paymentData.transferAccountNumber}
                onChange={(v) => upd('transferAccountNumber', v)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Transfer Account Name"
                placeholder="Enter account name"
                value={paymentData.transferAccountName}
                onChange={(v) => upd('transferAccountName', v)}
              />
              <InputField
                label="Phone Number"
                placeholder="03XXXXXXXXX"
                value={paymentData.transferPhone}
                onChange={(v) => upd('transferPhone', v)}
              />
              <InputField
                label="CNIC Number"
                placeholder="12345-1234567-1"
                value={paymentData.transferCNIC}
                onChange={(v) => upd('transferCNIC', v)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Amount" type="number" placeholder="Enter amount" value={paymentData.amount} onChange={v => upd('amount', parseFloat(v) || 0)} />
              <InputField label="Date" type="date" value={paymentData.date} onChange={v => upd('date', v)} />
              <InputField label="Note (Optional)" placeholder="Add note" value={paymentData.note} onChange={v => upd('note', v)} />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Upload Payment Slip *</label>
              {paymentData.slipFile ? (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-3 mt-2">
                  <Check size={16} className="text-green-600" />
                  <span className="text-xs font-black text-green-700 flex-1 truncate">{paymentData.slipFile.name}</span>
                  <button onClick={() => upd('slipFile', null)} className="text-slate-400 hover:text-red-500"><X size={15} /></button>
                </div>
              ) : (
                <input type="file" accept="image/*,.pdf" onChange={e => { if (e.target.files[0]) upd('slipFile', e.target.files[0]); }}
                  className="mt-2 w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-blue-50 transition-all cursor-pointer" />
              )}
            </div>
          </div>
        )}

        {/* Cash */}
        {paymentMethod === 'cash' && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Bank Name" placeholder="Enter bank name" value={paymentData.bankName} onChange={v => upd('bankName', v)} />
              <InputField label="Depositor Name" placeholder="Full name" value={paymentData.depositorName} onChange={v => upd('depositorName', v)} />
              <InputField label="Depositor CNIC" placeholder="12345-1234567-1" value={paymentData.depositorCNIC} onChange={v => upd('depositorCNIC', v)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Amount" type="number" placeholder="Enter amount" value={paymentData.amount} onChange={v => upd('amount', parseFloat(v) || 0)} />
              <InputField label="Date" type="date" value={paymentData.date} onChange={v => upd('date', v)} />
            </div>
          </div>
        )}

        {/* Credit */}
        {paymentMethod === 'credit' && (
          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200 mt-4">
            <p className="text-sm font-bold text-blue-900">
              💳 <strong>Credit Payment:</strong> Your booking will be confirmed and the amount will be deducted from your agency's credit limit.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={handleHoldBooking} disabled={isLoading}
          className="py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-sm disabled:opacity-50">
          Hold Booking
        </button>
        <button onClick={handleConfirmOrder} disabled={isLoading}
          className="py-4 px-6 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
          {isLoading
            ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            : <>Confirm Order <ArrowRight size={18} /></>}
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  SUCCESS VIEW                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

const SuccessView = ({ booking, onBack }) => (
  <div className="min-h-screen flex items-center justify-center p-6 bg-white">
    <div className="max-w-md w-full text-center space-y-8 animate-in zoom-in-95 duration-700">
      <div className="w-24 h-24 bg-green-50 rounded-[40px] flex items-center justify-center text-green-500 mx-auto shadow-inner shadow-green-100/50">
        <CheckCircle size={48} className="animate-bounce" />
      </div>
      <div>
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Booking Secured!</h2>
        <p className="text-slate-500 font-medium mt-3">
          Your confirmation reference is <span className="text-blue-600 font-black">{booking.booking_reference}</span>.{' '}
          Payment verification is pending.
        </p>
      </div>
      <div className="bg-slate-50 rounded-3xl p-6 text-left space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Total Amount</span>
          <span className="font-black text-slate-900">{PKR(booking.total_amount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Passengers</span>
          <span className="font-black text-slate-900">{booking.total_passengers}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Status</span>
          <span className="font-black text-amber-600 uppercase">{booking.booking_status}</span>
        </div>
      </div>
      <div className="pt-6 space-y-3">
        <button
          onClick={() => window.location.href = '/booking-history'}
          className="w-full px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl"
        >
          View Booking History
        </button>
        <button
          onClick={() => window.location.reload()}
          className="w-full px-10 py-4 bg-slate-100 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all"
        >
          Book Another Ticket
        </button>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────── */
/*  SERVICES SUMMARY CARD (top banner)                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

const ServicesSummaryCard = ({ calculatorData }) => {
  const { selectedFlight, selectedVehicle, selectedVisaRate, hotelRows = [], selectedOptions = [], riyalRate } = calculatorData;
  const hasService = (name) => selectedOptions.some(opt => opt.toLowerCase().includes(name));

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custom Package Summary</h3>
      <div className="flex flex-wrap gap-3">
        {hasService('ticket') && selectedFlight && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-2xl text-xs font-black text-blue-700">
            <Plane size={14} />
            <span>{selectedFlight.departure_trip?.airline || selectedFlight.airline_name || 'Flight'}</span>
            <span className="text-blue-500">·</span>
            <span>{selectedFlight.departure_trip?.departure_city || selectedFlight.origin || ''} → {selectedFlight.departure_trip?.arrival_city || selectedFlight.destination || ''}</span>
          </div>
        )}
        {hasService('hotel') && hotelRows.filter(h => h.hotel_name).map((h, i) => (
          <div key={i} className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl text-xs font-black text-emerald-700">
            <Building2 size={14} />
            <span>{h.hotel_name}</span>
            <span className="text-emerald-500">·</span>
            <span>{h.city}</span>
            <span className="text-emerald-500">·</span>
            <span>{h.total_nights}N</span>
          </div>
        ))}
        {hasService('transport') && selectedVehicle && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-4 py-2 rounded-2xl text-xs font-black text-orange-700">
            <Truck size={14} /> Transport {selectedVehicle.sector ? `· ${selectedVehicle.sector}` : ''}
          </div>
        )}
        {hasService('visa') && selectedVisaRate && (
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 px-4 py-2 rounded-2xl text-xs font-black text-purple-700">
            <Globe size={14} /> Visa
          </div>
        )}
        {hasService('food') && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-2xl text-xs font-black text-yellow-700">
            <Utensils size={14} /> Food
          </div>
        )}
        {hasService('ziyarat') && (
          <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 px-4 py-2 rounded-2xl text-xs font-black text-teal-700">
            <MapPin size={14} /> Ziyarat
          </div>
        )}
        {riyalRate?.rate && (
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-4 py-2 rounded-2xl text-xs font-black text-slate-600">
            <Star size={14} /> Rate: 1 SAR = PKR {riyalRate.rate}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  MAIN PAGE                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

const CustomBookingPage = ({ calculatorData: initialData, onBack, resumeId }) => {
  const [calculatorData, setCalculatorData] = useState(initialData || {});
  const {
    families = [],
    hotelRows = [],
    selectedFlight,
    selectedVehicle,
    selectedVisaRate,
    riyalRate,
    selectedOptions = [],
    passengers: paxTotals = { adults: 0, children: 0, infants: 0 },
    foodRows = [],
    ziaratRows = [],
    foodPrices = [],
    ziaratPrices = []
  } = calculatorData || {};

  // ── Generate initial passengers from families ──
  const initPassengers = useMemo(() => {
    const list = [];
    let idx = 0;

    // Use families if available
    if (families && families.length > 0) {
      families.forEach((fam, fi) => {
        const famId = `family_${fi + 1}`;
        const famLabel = `Family ${fi + 1}`;
        for (let i = 0; i < (fam.adults || 0); i++) {
          list.push(emptyCustomPax(idx++, 'Adult', famId, famLabel, i === 0));
        }
        for (let i = 0; i < (fam.children || 0); i++) {
          list.push(emptyCustomPax(idx++, 'Child', famId, famLabel, false));
        }
        for (let i = 0; i < (fam.infants || 0); i++) {
          list.push(emptyCustomPax(idx++, 'Infant', famId, famLabel, false));
        }
      });
    } else {
      // Fallback: Use paxTotals to create a single default family
      const famId = `family_1`;
      const famLabel = `Family 1`;
      for (let i = 0; i < (paxTotals.adults || 0); i++) {
        list.push(emptyCustomPax(idx++, 'Adult', famId, famLabel, i === 0));
      }
      for (let i = 0; i < (paxTotals.children || 0); i++) {
        list.push(emptyCustomPax(idx++, 'Child', famId, famLabel, false));
      }
      for (let i = 0; i < (paxTotals.infants || 0); i++) {
        list.push(emptyCustomPax(idx++, 'Infant', famId, famLabel, false));
      }
    }
    return list;
  }, [families, paxTotals]);

  // ── State ──
  const [currentStep, setCurrentStep] = useState(resumeId ? 3 : 1);
  const [passengers, setPassengers] = useState(initPassengers);
  const [expandedPax, setExpandedPax] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [paymentData, setPaymentData] = useState({
    amount: 0, date: new Date().toISOString().split('T')[0], note: '',
    bankName: '', depositorName: '', depositorCNIC: '', slipFile: null,
    beneficiaryAccount: '', agentAccount: '',
    transferAccount: null, transferAccountName: '', transferPhone: '', transferCNIC: '',
    transferAccountNumber: ''
  });
  const [discountGroup, setDiscountGroup] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [isBooked, setIsBooked] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (resumeId) {
      const fetchBooking = async () => {
        try {
          const token = localStorage.getItem('access_token');
          const res = await fetch(`${API}/api/custom-bookings/${resumeId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setCreatedBooking(data);
            if (data.calculator_data) setCalculatorData(data.calculator_data);
            // Pre-fill payment amount from the booking
            if (data.total_amount) {
              setPaymentData(prev => ({ ...prev, amount: data.total_amount }));
            }
            // Map passengers if available
            if (data.passengers && data.passengers.length > 0) {
              const mappedPax = data.passengers.map((p, idx) => ({
                id: idx,
                type: (p.type || 'Adult').charAt(0).toUpperCase() + (p.type || 'Adult').slice(1).toLowerCase(),
                title: p.title || '',
                firstName: p.first_name || '',
                lastName: p.last_name || '',
                passportNo: p.passport_no || '',
                dob: p.dob || '',
                passportIssue: p.passport_issue || '',
                passportExpiry: p.passport_expiry || '',
                country: p.country || '',
                passportPath: p.passport_path || '',
                familyId: p.family_id || '',
                familyLabel: p.family_label || '',
                isFamilyHead: p.is_family_head || false,
                passportFile: null
              }));
              setPassengers(mappedPax);
            }
            setCurrentStep(3);
            window.history.pushState({ step: 3 }, '', `/custom-booking/step-3${window.location.search}`);
          }
        } catch (err) {
          console.error('Error fetching booking for resume:', err);
        }
      };
      fetchBooking();
    }
  }, [resumeId]);

  const updateStep = (step) => {
    setCurrentStep(step);
    window.history.pushState({ step }, '', `/custom-booking/step-${step}${window.location.search}`);
  };

  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state && e.state.step) {
        setCurrentStep(e.state.step);
      } else {
        setCurrentStep(1);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ── Pricing helpers ──
  const buildFamilyInvoice = (family, fi) => {
    const exchangeRate = riyalRate?.rate || 1;
    const isVisaPKR = riyalRate?.is_visa_pkr ?? false;
    const isHotelPKR = riyalRate?.is_hotel_pkr ?? false;
    const isTransPKR = riyalRate?.is_transport_pkr ?? true;
    const toPKR = (amount, isPKR) => isPKR ? Math.round(amount) : Math.round(amount * exchangeRate);

    const familyPax = (family.adults || 0) + (family.children || 0) + (family.infants || 0);

    // Accommodation — rate_sar field holds the native rate (SAR or PKR depending on flag)
    let accomNative = 0;
    if (family.assignments) {
      Object.entries(family.assignments).forEach(([hotelId, asgn]) => {
        const hotelRow = hotelRows.find(h => String(h.id) === String(hotelId));
        if (!hotelRow) return;
        accomNative += (asgn.rate_sar || 0) * (asgn.qty || 1) * (hotelRow.total_nights || 0);
      });
    }
    const accomPKR = toPKR(accomNative, isHotelPKR);

    // Transport — adult_selling is the native rate (SAR or PKR depending on flag)
    const transportNative = (selectedVehicle?.adult_selling || 0) * familyPax;
    const transportNet = toPKR(transportNative, isTransPKR);

    // Visa — native rate (SAR or PKR depending on flag)
    const adultVisaNative = Number(selectedVisaRate?.adult_selling || selectedVisaRate?.adult_rate || 0);
    const childVisaNative = Number(selectedVisaRate?.child_selling || selectedVisaRate?.child_rate || 0);
    const infantVisaNative = Number(selectedVisaRate?.infant_selling || selectedVisaRate?.infant_rate || 0);
    const totalVisaNative = (adultVisaNative * (family.adults || 0)) + (childVisaNative * (family.children || 0)) + (infantVisaNative * (family.infants || 0));
    const totalVisaPKR = toPKR(totalVisaNative, isVisaPKR);

    // Tickets — always PKR
    const totalTicketPKR = ((selectedFlight?.adult_selling || 0) * (family.adults || 0)) +
      ((selectedFlight?.child_selling || 0) * (family.children || 0)) +
      ((selectedFlight?.infant_selling || 0) * (family.infants || 0));

    // Food
    const isFoodPKR = riyalRate?.is_food_pkr ?? true;
    let foodNative = 0;
    foodRows.forEach(foodRow => {
      if (!foodRow.food_id) return;
      const item = foodPrices.find(f => String(f.id || f._id) === String(foodRow.food_id));
      if (!item) return;
      const start = foodRow.startDate ? new Date(foodRow.startDate) : null;
      const end = foodRow.endDate ? new Date(foodRow.endDate) : null;
      const days = start && end ? Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24))) : 1;
      foodNative += ((item.adult_selling || 0) * (family.adults || 0) +
        (item.child_selling || 0) * (family.children || 0) +
        (item.infant_selling || 0) * (family.infants || 0)) * days;
    });
    const foodPKR = toPKR(foodNative, isFoodPKR);

    // Ziarat
    const isZiaratPKR = riyalRate?.is_ziarat_pkr ?? true;
    let ziaratNative = 0;
    ziaratRows.forEach(zRow => {
      if (!zRow.ziarat_id) return;
      const item = ziaratPrices.find(z => String(z.id || z._id) === String(zRow.ziarat_id));
      if (!item) return;
      ziaratNative += (item.adult_selling || 0) * (family.adults || 0) +
        (item.child_selling || 0) * (family.children || 0) +
        (item.infant_selling || 0) * (family.infants || 0);
    });
    const ziaratPKR = toPKR(ziaratNative, isZiaratPKR);

    const netPKR = totalVisaPKR + totalTicketPKR + transportNet + accomPKR + foodPKR + ziaratPKR;

    return {
      familyPax, netPKR,
      // PKR totals per service
      accomPKR, transportNet, totalVisaPKR, totalTicketPKR, foodPKR, ziaratPKR,
      // Native SAR/PKR totals for audit (raw amounts before conversion)
      accomNative, transportNative, totalVisaNative, foodNative, ziaratNative,
      // Currency flags
      isVisaPKR, isHotelPKR, isTransPKR, isFoodPKR, isZiaratPKR,
    };
  };

  const familyInvoices = useMemo(() =>
    families.map((fam, fi) => buildFamilyInvoice(fam, fi)),
    [families, hotelRows, selectedFlight, selectedVehicle, selectedVisaRate, riyalRate]
  );

  const subtotal = useMemo(() =>
    familyInvoices.reduce((sum, inv) => sum + inv.netPKR, 0),
    [familyInvoices]
  );

  const grandTotal = useMemo(() => {
    const total = subtotal - discountAmount;
    return Math.max(0, total);
  }, [subtotal, discountAmount]);

  // Fetch discount groups
  React.useEffect(() => {
    const token = localStorage.getItem('access_token');
    const isAdmin = !!localStorage.getItem('admin_data');
    if (isAdmin) return;

    // Fetch agency details to get discount_group_id
    fetch(`${API}/api/agencies/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(async (agency) => {
        if (agency && agency.discount_group_id) {
          // Fetch the specific discount group
          const discountRes = await fetch(`${API}/api/discounts/${agency.discount_group_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (discountRes.ok) {
            const discount = await discountRes.json();
            setDiscountGroup(discount);
          }
        }
      })
      .catch(() => { });
  }, []);

  // Calculate discount when discount group is loaded
  React.useEffect(() => {
    if (discountGroup && discountGroup.package_discount) {
      if (discountGroup.package_discount_type === 'percentage') {
        // Calculate percentage discount
        const percentageDiscount = (subtotal * discountGroup.package_discount) / 100;
        setDiscountAmount(Math.round(percentageDiscount));
      } else {
        // Fixed discount
        setDiscountAmount(discountGroup.package_discount);
      }
    } else {
      setDiscountAmount(0);
    }
  }, [discountGroup, subtotal]);

  // ── Build rooms_selected payload ──
  const buildRoomsSelected = () => {
    const rooms = [];
    families.forEach((fam, fi) => {
      Object.entries(fam.assignments || {}).forEach(([hotelId, asgn]) => {
        const hotelRow = hotelRows.find(h => String(h.id) === String(hotelId));
        rooms.push({
          family_id: `family_${fi + 1}`,
          hotel_id: hotelId,
          hotel_name: hotelRow?.hotel_name || '',
          city: hotelRow?.city || '',
          room_type: asgn.roomType || asgn.room_type || '',
          quantity: asgn.qty || 1,
          nights: hotelRow?.total_nights || 0,
          rate_sar: asgn.rate_sar || 0,
          rate_pkr: riyalRate?.is_hotel_pkr
            ? Math.round(asgn.rate_sar || 0)
            : Math.round((asgn.rate_sar || 0) * (riyalRate?.rate || 1))
        });
      });
    });
    return rooms;
  };

  // ── Build package_details payload ──
  const buildPackageDetails = () => {
    const exchangeRate = riyalRate?.rate || 1;
    const isHotelPKR = riyalRate?.is_hotel_pkr ?? false;
    const isTransPKR = riyalRate?.is_transport_pkr ?? true;
    const isVisaPKR = riyalRate?.is_visa_pkr ?? false;
    const toPKR = (amount, isPKR) => isPKR ? Math.round(amount) : Math.round(amount * exchangeRate);

    return {
      services_selected: selectedOptions,

      flight: selectedFlight ? {
        id: selectedFlight._id || selectedFlight.id,
        // Departure leg
        departure_trip: selectedFlight.departure_trip ? (() => {
          const dt = selectedFlight.departure_trip;
          const depDT = dt.departure_datetime ? new Date(dt.departure_datetime) : null;
          const arrDT = dt.arrival_datetime ? new Date(dt.arrival_datetime) : null;
          return {
            airline: dt.airline || '',
            flight_number: dt.flight_number || '',
            departure_city: dt.departure_city || '',
            arrival_city: dt.arrival_city || '',
            departure_date: depDT ? depDT.toISOString().split('T')[0] : (dt.departure_date || ''),
            arrival_date: arrDT ? arrDT.toISOString().split('T')[0] : (dt.arrival_date || ''),
            departure_time: depDT ? depDT.toTimeString().slice(0, 5) : (dt.departure_time || ''),
            arrival_time: arrDT ? arrDT.toTimeString().slice(0, 5) : (dt.arrival_time || ''),
          };
        })() : null,
        // Return leg
        return_trip: selectedFlight.return_trip ? (() => {
          const rt = selectedFlight.return_trip;
          const depDT = rt.departure_datetime ? new Date(rt.departure_datetime) : null;
          const arrDT = rt.arrival_datetime ? new Date(rt.arrival_datetime) : null;
          return {
            airline: rt.airline || '',
            flight_number: rt.flight_number || '',
            departure_city: rt.departure_city || '',
            arrival_city: rt.arrival_city || '',
            departure_date: depDT ? depDT.toISOString().split('T')[0] : (rt.departure_date || ''),
            arrival_date: arrDT ? arrDT.toISOString().split('T')[0] : (rt.arrival_date || ''),
            departure_time: depDT ? depDT.toTimeString().slice(0, 5) : (rt.departure_time || ''),
            arrival_time: arrDT ? arrDT.toTimeString().slice(0, 5) : (rt.arrival_time || ''),
          };
        })() : null,
        adult_selling: selectedFlight.adult_selling || 0,
        child_selling: selectedFlight.child_selling || 0,
        infant_selling: selectedFlight.infant_selling || 0,
        adult_pkr: selectedFlight.adult_selling || 0,
        child_pkr: selectedFlight.child_selling || 0,
        infant_pkr: selectedFlight.infant_selling || 0,
      } : null,

      hotels: hotelRows.filter(h => h.hotel_name).map(h => ({
        id: h.hotel_id || h.id,
        name: h.hotel_name,
        city: h.city,
        check_in: h.check_in,
        check_out: h.check_out,
        total_nights: h.total_nights,
        stars: h.stars || '',
        address: h.address || '',
      })),

      transport: selectedVehicle ? {
        id: selectedVehicle._id || selectedVehicle.id,
        vehicle_type: selectedVehicle.vehicle_type || '',
        vehicle_name: selectedVehicle.vehicle_name || '',
        sector: selectedVehicle.sector || '',
        sector_id: selectedVehicle.sector_id || '',
        // ── Sector routing info for invoice/order delivery route display ──
        big_sector_id: selectedVehicle.big_sector || selectedVehicle.big_sector_id || null,
        small_sector_ids: selectedVehicle.small_sector_ids || [],
        // Embed full small sector details if already resolved (city names, types)
        small_sectors: selectedVehicle.small_sectors || selectedVehicle.small_sectors_details || [],
        adult_selling: selectedVehicle.adult_selling || 0,
        child_selling: selectedVehicle.child_selling || 0,
        infant_selling: selectedVehicle.infant_selling || 0,
        adult_pkr: toPKR(selectedVehicle.adult_selling || 0, isTransPKR),
        child_pkr: toPKR(selectedVehicle.child_selling || 0, isTransPKR),
        infant_pkr: toPKR(selectedVehicle.infant_selling || 0, isTransPKR),
        is_pkr: isTransPKR,
      } : null,

      visa: selectedVisaRate ? {
        id: selectedVisaRate._id || selectedVisaRate.id,
        title: selectedVisaRate.title || '',
        adult_selling: selectedVisaRate.adult_selling || selectedVisaRate.adult_rate || 0,
        child_selling: selectedVisaRate.child_selling || selectedVisaRate.child_rate || 0,
        infant_selling: selectedVisaRate.infant_selling || selectedVisaRate.infant_rate || 0,
        adult_pkr: toPKR(selectedVisaRate.adult_selling || selectedVisaRate.adult_rate || 0, isVisaPKR),
        child_pkr: toPKR(selectedVisaRate.child_selling || selectedVisaRate.child_rate || 0, isVisaPKR),
        infant_pkr: toPKR(selectedVisaRate.infant_selling || selectedVisaRate.infant_rate || 0, isVisaPKR),
        is_pkr: isVisaPKR,
      } : null,

      riyal_rate: exchangeRate,
      is_hotel_pkr: isHotelPKR,
      is_transport_pkr: isTransPKR,
      is_visa_pkr: isVisaPKR,
      families_count: families.length,
      food_included: foodRows.some(r => r.food_id),
      ziyarat_included: ziaratRows.some(r => r.ziarat_id),
      food_rows: foodRows.filter(r => r.food_id).map(r => ({
        food_id: r.food_id,
        city: r.city || '',
        start_date: r.startDate || '',
        end_date: r.endDate || '',
        self_pickup: r.selfPickup || false
      })),
      ziarat_rows: ziaratRows.filter(r => r.ziarat_id).map(r => ({
        ziarat_id: r.ziarat_id,
        city: r.city || '',
        visit_date: r.visitDate || '',
        self: r.self || false
      })),
      family_breakdown: families.map((fam, fi) => ({
        family_id: `family_${fi + 1}`,
        adults: fam.adults || 0,
        children: fam.children || 0,
        infants: fam.infants || 0,
      }))
    };
  };

  // ── Upload single passport ──
  const uploadPassport = async (file, token) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API}/api/custom-bookings/upload-passport`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd
    });
    if (res.ok) { const d = await res.json(); return d.path || ''; }
    return '';
  };

  // ── Create booking (called on Step 2 "Confirm & Proceed") ──
  const handleCreateBooking = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');

      // Upload passports
      const updatedPax = await Promise.all(passengers.map(async (p) => {
        let path = p.passportPath || '';
        if (p.passportFile && !path) {
          path = await uploadPassport(p.passportFile, token);
        }
        return { ...p, passportPath: path };
      }));
      setPassengers(updatedPax);

      // Build passengers payload
      const passengersPayload = updatedPax.map(p => ({
        type: p.type,
        name: `${p.title} ${p.firstName} ${p.lastName}`.trim(),
        title: p.title,
        first_name: p.firstName,
        last_name: p.lastName,
        passport_no: p.passportNo,
        passport_issue: p.passportIssue,
        passport_expiry: p.passportExpiry,
        dob: p.dob,
        country: p.country,
        passport_path: p.passportPath || '',
        family_id: p.familyId,
        family_label: p.familyLabel,
        is_family_head: p.isFamilyHead || false,
        family_head_name: p.isFamilyHead ? `${p.firstName} ${p.lastName}`.trim() : '',
        family_head_passport: p.isFamilyHead ? p.passportNo : ''
      }));

      const payload = {
        package_details: buildPackageDetails(),
        rooms_selected: buildRoomsSelected(),
        passengers: passengersPayload,
        total_passengers: passengers.length,
        total_amount: grandTotal,
        discount_group_id: discountGroup ? (discountGroup._id || discountGroup.id) : null,
        discount_amount: discountAmount || 0,
        payment_details: {
          payment_method: paymentMethod,
          payment_status: 'unpaid'
        },
        booking_status: 'underprocess',
        // ── SAR/PKR dual pricing (aggregated across all families) ──
        sar_to_pkr_rate: riyalRate?.rate || 1,
        ...(() => {
          const exc = riyalRate?.rate || 1;
          const isVisaPKR = riyalRate?.is_visa_pkr ?? false;
          const isHotelPKR = riyalRate?.is_hotel_pkr ?? false;
          const isTransPKR = riyalRate?.is_transport_pkr ?? true;
          const isFoodPKR = riyalRate?.is_food_pkr ?? true;
          const isZiaratPKR = riyalRate?.is_ziarat_pkr ?? true;

          let totalVisaNat = 0, totalVisaPKR = 0;
          let totalHotelNat = 0, totalHotelPKR = 0;
          let totalTransNat = 0, totalTransPKR = 0;
          let totalFoodNat = 0, totalFoodPKR = 0;
          let totalZiaratNat = 0, totalZiaratPKR = 0;

          families.forEach(fam => {
            const inv = buildFamilyInvoice(fam);
            totalVisaNat += inv.totalVisaNative || 0;
            totalVisaPKR += inv.totalVisaPKR || 0;
            totalHotelNat += inv.accomNative || 0;
            totalHotelPKR += inv.accomPKR || 0;
            totalTransNat += inv.transportNative || 0;
            totalTransPKR += inv.transportNet || 0;
            totalFoodNat += inv.foodNative || 0;
            totalFoodPKR += inv.foodPKR || 0;
            totalZiaratNat += inv.ziaratNative || 0;
            totalZiaratPKR += inv.ziaratPKR || 0;
          });

          return {
            visa_cost_sar: isVisaPKR ? null : totalVisaNat,
            visa_cost_pkr: totalVisaPKR,
            hotel_cost_sar: isHotelPKR ? null : totalHotelNat,
            hotel_cost_pkr: totalHotelPKR,
            transport_cost_sar: isTransPKR ? null : totalTransNat,
            transport_cost_pkr: totalTransPKR,
            food_cost_sar: isFoodPKR ? null : totalFoodNat,
            food_cost_pkr: totalFoodPKR,
            ziyarat_cost_sar: isZiaratPKR ? null : totalZiaratNat,
            ziyarat_cost_pkr: totalZiaratPKR,
          };
        })()
      };

      const res = await fetch(`${API}/api/custom-bookings/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to create booking');
      }

      const data = await res.json();
      setCreatedBooking(data);
      setPaymentData(prev => ({ ...prev, amount: grandTotal }));
      updateStep(3);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── If booking fully done ──
  if (isBooked && createdBooking) {
    return <SuccessView booking={createdBooking} onBack={onBack} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ─ Header ─ */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-black text-xs uppercase tracking-widest">
            <ArrowLeft size={16} /> Back to Calculator
          </button>
          {/* Step Indicators */}
          <div className="flex items-center gap-6">
            <StepIndicator step={1} label="Passengers" active={currentStep === 1} done={currentStep > 1} />
            <div className="w-8 h-px bg-slate-200 hidden md:block" />
            <StepIndicator step={2} label="Review" active={currentStep === 2} done={currentStep > 2} />
            <div className="w-8 h-px bg-slate-200 hidden md:block" />
            <StepIndicator step={3} label="Payment" active={currentStep === 3} done={isBooked} />
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</p>
            <p className="text-lg font-black text-blue-600">{PKR(createdBooking?.total_amount || grandTotal)}</p>
          </div>
        </div>
      </div>

      {/* ─ Content ─ */}
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* Services banner */}
        {currentStep < 3 && <ServicesSummaryCard calculatorData={calculatorData} />}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm font-bold">
            <X size={16} className="shrink-0" /> {error}
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-700"><X size={14} /></button>
          </div>
        )}

        {/* Step 1 */}
        {currentStep === 1 && (
          <StepOnePassengers
            passengers={passengers}
            setPassengers={setPassengers}
            expandedPax={expandedPax}
            setExpandedPax={setExpandedPax}
            onNext={() => updateStep(2)}
          />
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <StepTwoReview
            passengers={passengers}
            calculatorData={calculatorData}
            grandTotal={grandTotal}
            familyInvoices={familyInvoices}
            isLoading={isLoading}
            onEdit={() => updateStep(1)}
            onNext={handleCreateBooking}
            discountGroup={discountGroup}
            discountAmount={discountAmount}
            subtotal={subtotal}
          />
        )}

        {/* Step 3 */}
        {currentStep === 3 && createdBooking && (
          <StepThreePayment
            booking={createdBooking}
            totalAmount={createdBooking.total_amount || grandTotal}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            paymentData={paymentData}
            setPaymentData={setPaymentData}
            expiryMins={null}
            onConfirm={() => setIsBooked(true)}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setError={setError}
            discountGroup={discountGroup}
            discountAmount={discountAmount}
          />
        )}
      </div>
    </div>
  );
};

export default CustomBookingPage;
