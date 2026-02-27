import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  Plane, Building2, Users, ChevronRight, ChevronDown, ChevronUp,
  CheckCircle, ArrowLeft, Clock, Upload, X, Check, ShieldCheck,
  CreditCard, Banknote, Landmark, ArrowRight, Info, Star, Calendar, Globe,
  Truck, Utensils, MapPin, FileText, Smartphone, Wallet, ArrowLeftRight
} from 'lucide-react';
import SearchableSelect from '../../ui/SearchableSelect';

const API = 'http://localhost:8000';
const PKR = (n) => `PKR ${(Number(n) || 0).toLocaleString()}`;

const ROOM_CAPACITIES = { sharing: 1, quint: 5, quad: 4, triple: 3, double: 2, private: 1 };
const ROOM_LABELS = { sharing: 'Sharing', quint: 'Quint', quad: 'Quad', triple: 'Triple', double: 'Double', private: 'Private' };

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

const emptyPax = (id, roomType, roomIndex, slotInRoom) => ({
  id, roomType, roomIndex, slotInRoom,
  type: 'Adult', title: '', firstName: '', lastName: '',
  passportNo: '', dob: '', passportIssue: '', passportExpiry: '',
  country: '', passportFile: null, passportPath: '', familyHeadId: ''
});

const syncPassengers = (roomSel, childrenNoBed, infantCount, prev = []) => {
  const next = [];
  let idx = 0;

  Object.entries(roomSel).forEach(([rt, qty]) => {
    const cap = ROOM_CAPACITIES[rt] || 0;
    for (let ri = 1; ri <= qty; ri++) {
      for (let si = 1; si <= cap; si++) {
        const old = prev.find(p => p.roomType === rt && p.roomIndex === ri && p.slotInRoom === si);
        next.push(old ? { ...old, id: idx } : emptyPax(idx, rt, ri, si));
        idx++;
      }
    }
  });

  const oldExtra = prev.filter(p => !p.roomType);
  const extraTypes = [
    ...Array(childrenNoBed).fill('Child'),
    ...Array(infantCount).fill('Infant')
  ];
  extraTypes.forEach((type, i) => {
    const old = oldExtra[i];
    next.push(old ? { ...old, id: idx, type } : { ...emptyPax(idx, null, null, null), type });
    idx++;
  });

  return next;
};

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

/* —————————————————————————————————————————————————————————————————————————— */
/*  MAIN PAGE                                                                     */
/* —————————————————————————————————————————————————————————————————————————— */

const UmrahBookingPage = ({ packageData: initialPackage, flights = [], airlines = [], onBack, resumeId }) => {
  const [packageData, setPackageData] = useState(initialPackage || {});
  const [currentStep, setCurrentStep] = useState(resumeId ? 3 : 1);

  // Step 1 state
  const [roomSel, setRoomSel] = useState({});
  const [passengers, setPassengers] = useState([]);
  const [expandedPax, setExpandedPax] = useState(0);

  // Step 2 state - Discount
  const [discountGroup, setDiscountGroup] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Step 3 state
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [paymentData, setPaymentData] = useState({
    amount: 0, date: new Date().toISOString().split('T')[0], note: '',
    beneficiaryAccount: '', agentAccount: '',
    transferAccount: null, transferAccountName: '', transferPhone: '', transferCNIC: '',
    transferAccountNumber: ''
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [isBooked, setIsBooked] = useState(false);
  const [error, setError] = useState('');
  const [expiryMins, setExpiryMins] = useState(null);

  useEffect(() => {
    if (resumeId) {
      const fetchBooking = async () => {
        try {
          const token = localStorage.getItem('access_token');
          const res = await fetch(`${API}/api/umrah-bookings/${resumeId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setCreatedBooking(data);
            if (data.package_details) setPackageData(data.package_details);

            // Pre-fill payment amount from the booking
            if (data.total_amount) {
              setPaymentData(prev => ({ ...prev, amount: data.total_amount }));
            }

            // Map passengers back to frontend format
            if (data.passengers && data.passengers.length > 0) {
              const mappedPax = data.passengers.map((p, idx) => ({
                id: idx,
                roomType: p.room_type,
                roomIndex: p.room_index,
                slotInRoom: p.slot_in_room,
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
                familyHeadId: p.is_family_head ? idx : null // best effort
              }));
              setPassengers(mappedPax);
            }

            setCurrentStep(3);
            window.history.pushState({ step: 3 }, '', `/umrah-booking/step-3${window.location.search}`);
          }
        } catch (err) {
          console.error('Error fetching booking for resume:', err);
        }
      };
      fetchBooking();
    }
  }, [resumeId]);

  /* â”€â”€ resolved flight â”€â”€ */
  const rawFlight = useMemo(() => {
    const fid = typeof packageData.flight === 'object'
      ? packageData.flight?._id || packageData.flight?.id
      : packageData.flight;
    return flights.find(f => (f._id || f.id) === fid)
      || (typeof packageData.flight === 'object' ? packageData.flight : null);
  }, [packageData.flight, flights]);

  const getAirline = useCallback((id) => {
    if (!id) return '';
    const a = airlines.find(a =>
      (a.iata_code || '').toLowerCase() === String(id).toLowerCase() ||
      (a.airline_name || '').toLowerCase() === String(id).toLowerCase()
    );
    return a ? (a.airline_name || id) : id;
  }, [airlines]);

  /* â”€â”€ available rooms from package_prices â”€â”€ */
  const availableRooms = useMemo(() => {
    const rooms = Object.entries(packageData.package_prices || {})
      .filter(([, v]) => v && v.selling > 0).map(([k]) => k);
    // private room only if double is available
    if (rooms.includes('double') && !rooms.includes('private')) rooms.push('private');
    return rooms;
  }, [packageData]);

  /* —— base price (visa + flight + transport + other) —— */
  const adultBasePrice = useMemo(() =>
    (packageData.visa_pricing?.adult_selling || 0) +
    (rawFlight?.adult_selling || rawFlight?.departure_trip?.adult_selling || 0) +
    (packageData.transport?.selling || packageData.transport_pricing?.adult_selling || 0) +
    (packageData.food?.selling || packageData.other_pricing?.adult_selling || 0)
    , [packageData, rawFlight]);

  // private room price = base + (double - base) * 2
  const privateRoomPrice = useMemo(() => {
    const doublePrice = packageData.package_prices?.double?.selling || 0;
    const roomPortion = doublePrice - adultBasePrice;
    return adultBasePrice + (roomPortion * 2);
  }, [packageData, adultBasePrice]);

  /* —— pricing —— */
  const childNoBedPrice = useMemo(() =>
    (packageData.visa_pricing?.child_selling || 0) +
    (rawFlight?.child_selling || rawFlight?.departure_trip?.child_selling || 0) +
    (packageData.transport?.selling || packageData.transport_pricing?.child_selling || 0) +
    (packageData.food?.selling || packageData.other_pricing?.child_selling || 0)
    , [packageData, rawFlight]);

  const infantPrice = useMemo(() =>
    (packageData.visa_pricing?.infant_selling || 0) +
    (rawFlight?.infant_selling || rawFlight?.departure_trip?.infant_selling || 0) +
    (packageData.transport?.selling || packageData.transport_pricing?.infant_selling || 0) +
    (packageData.food?.selling || packageData.other_pricing?.infant_selling || 0)
    , [packageData, rawFlight]);

  const priceFor = useCallback((type, roomType) => {
    if (type === 'Adult' || type === 'Child') {
      if (roomType === 'private') return privateRoomPrice;
      return roomType ? packageData.package_prices?.[roomType]?.selling || 0 : childNoBedPrice;
    }
    if (type === 'Infant') return infantPrice;
    return 0;
  }, [packageData, childNoBedPrice, infantPrice, privateRoomPrice]);

  /* â”€â”€ grand total â”€â”€ */
  const subtotalAmount = useMemo(() => {
    return passengers.reduce((sum, p) => sum + priceFor(p.type, p.roomType), 0);
  }, [passengers, priceFor]);

  const grandTotal = useMemo(() => {
    const total = subtotalAmount - discountAmount;
    return Math.max(0, total);
  }, [subtotalAmount, discountAmount]);

  // infants without bed (for private rooms)
  const [extraInfants, setExtraInfants] = useState(0);

  /* sync passengers when room counts or extra infants change */
  useEffect(() => {
    setPassengers(prev => syncPassengers(roomSel, 0, extraInfants, prev));
  }, [roomSel, extraInfants]);

  /* â”€â”€ fetch expiry â”€â”€ */
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API}/api/others/booking-expiry/active`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setExpiryMins((d.umrah_booking_hours || 0) * 60 + (d.umrah_booking_minutes || 0)); })
      .catch(() => { });
  }, []);

  /* Fetch discount groups */
  useEffect(() => {
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

  /* Calculate discount when discount group is loaded or subtotal changes */
  useEffect(() => {
    if (discountGroup && discountGroup.package_discount) {
      if (discountGroup.package_discount_type === 'percentage') {
        // Calculate percentage discount
        const percentageDiscount = (subtotalAmount * discountGroup.package_discount) / 100;
        setDiscountAmount(Math.round(percentageDiscount));
      } else {
        // Fixed discount
        setDiscountAmount(discountGroup.package_discount);
      }
    } else {
      setDiscountAmount(0);
    }
  }, [discountGroup, subtotalAmount]);

  /* â”€â”€ step navigation â”€â”€ */
  const handleNext = async () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setError('');
    if (currentStep === 1) {
      if (passengers.length === 0) { setError('Please select at least one room.'); return; }
      if (!passengers.every(isPaxComplete)) { setError('Please complete all passenger details before proceeding.'); return; }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      await createBooking();
    }
  };


  const createBooking = async () => {
    setIsLoading(true);
    setError('');
    const token = localStorage.getItem('access_token');
    try {
      // Upload passport files
      const uploadedPax = await Promise.all(passengers.map(async (p) => {
        if (!p.passportFile) return p;
        const fd = new FormData();
        fd.append('file', p.passportFile);
        const res = await fetch(`${API}/api/umrah-bookings/upload-passport`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd
        });
        if (!res.ok) return p;
        const { path } = await res.json();
        return { ...p, passportPath: path };
      }));

      const rooms_selected = Object.entries(roomSel)
        .filter(([, q]) => q > 0)
        .map(([rt, q]) => ({
          room_type: rt,
          quantity: q,
          price_per_person: rt === 'private' ? privateRoomPrice : (packageData.package_prices?.[rt]?.selling || 0)
        }));

      // ── Family head: first Adult per room; fallback to first pax if no adult ──
      const familyHeadMap = {};
      uploadedPax.forEach(p => {
        if (!p.roomType) return;
        const key = `${p.roomType}_${p.roomIndex}`;
        if (!familyHeadMap[key] && p.type === 'Adult') familyHeadMap[key] = p;
      });
      uploadedPax.forEach(p => {
        if (!p.roomType) return;
        const key = `${p.roomType}_${p.roomIndex}`;
        if (!familyHeadMap[key]) familyHeadMap[key] = p;
      });

      const payload = {
        package_id: packageData._id || packageData.id,
        package_details: { ...packageData, flight: rawFlight || packageData.flight },  // embed full flight object
        rooms_selected,
        passengers: uploadedPax.map(p => {
          const familyKey = p.roomType ? `${p.roomType}_${p.roomIndex}` : null;
          const headPax = familyKey ? familyHeadMap[familyKey] : null;
          const isFamilyHead = !!headPax && headPax.id === p.id;
          return {
            type: p.type.toLowerCase(), room_type: p.roomType, room_index: p.roomIndex,
            slot_in_room: p.slotInRoom, name: `${p.firstName} ${p.lastName}`.trim(),
            title: p.title, first_name: p.firstName, last_name: p.lastName,
            passport_no: p.passportNo, dob: p.dob,
            passport_issue: p.passportIssue, passport_expiry: p.passportExpiry,
            country: p.country, passport_path: p.passportPath || '',
            family_id: familyKey || null,
            family_label: familyKey ? `${ROOM_LABELS[p.roomType] || p.roomType} Room ${p.roomIndex}` : null,
            is_family_head: isFamilyHead,
            family_head_name: headPax ? `${headPax.firstName} ${headPax.lastName}`.trim() : null,
            family_head_passport: headPax ? headPax.passportNo : null
          };
        }),
        total_passengers: uploadedPax.length,
        total_amount: grandTotal,
        discount_group_id: discountGroup ? (discountGroup._id || discountGroup.id) : null,
        discount_amount: discountAmount || 0,
        booking_status: 'underprocess',
        payment_details: {
          payment_method: null,
          payment_status: null
        }
      };

      const res = await fetch(`${API}/api/umrah-bookings/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || 'Booking creation failed');
      }

      const booking = await res.json();
      setCreatedBooking(booking);
      setPaymentData(prev => ({ ...prev, amount: grandTotal }));
      setCurrentStep(3);
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaxChange = (id, field, value) => {
    setPassengers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const isStep1Valid = passengers.length > 0 && passengers.every(isPaxComplete);

  if (isBooked && createdBooking) {
    return <SuccessView booking={createdBooking} expiryMins={expiryMins} onBack={onBack} />;
  }

  const airlineName = rawFlight ? getAirline(rawFlight.airline || rawFlight.departure_trip?.airline) : null;
  const depCity = rawFlight?.departure_city || rawFlight?.departure_trip?.departure_city;
  const arrCity = rawFlight?.arrival_city || rawFlight?.departure_trip?.arrival_city;
  const flightNo = rawFlight?.flight_number || rawFlight?.departure_trip?.flight_number || '';
  const depTime = rawFlight?.departure_time || rawFlight?.departure_trip?.departure_time || '';
  const arrTime = rawFlight?.arrival_time || rawFlight?.departure_trip?.arrival_time || '';

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-slate-900 pb-20">

      {/* â”€â”€ TOP PACKAGE CARD (always visible) â”€â”€ */}
      <div className="px-4 lg:px-8 pt-8 max-w-6xl mx-auto animate-in fade-in duration-500">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-6 hover:text-slate-700 transition-colors">
          <ArrowLeft size={16} /> Back to Packages
        </button>

        <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex items-center gap-5 flex-1">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner shrink-0">
                <Star size={26} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Umrah Package Booking</p>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{packageData.title}</h2>
                {airlineName && (
                  <div className="mt-1 space-y-0.5">
                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Plane size={12} className="text-blue-400 shrink-0" />
                      {airlineName}{flightNo ? ` (${flightNo})` : ''}
                      {depCity && <span className="text-slate-400 mx-1">|</span>}
                      {depCity && <span>{depCity} &gt; {arrCity}</span>}
                    </p>
                    {(depTime || arrTime) && (
                      <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1 ml-4">
                        <Clock size={10} className="shrink-0" />
                        {depTime && <span>Dep: {depTime}</span>}
                        {depTime && arrTime && <span className="mx-1">|</span>}
                        {arrTime && <span>Arr: {arrTime}</span>}
                      </p>
                    )}
                  </div>
                )}
                {/* Inclusions row */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {packageData.transport && (
                    <span className="text-[9px] font-black bg-violet-50 text-violet-700 border border-violet-200 rounded-lg px-2 py-1 flex items-center gap-1">
                      <Truck size={10} /> {packageData.transport.sector || 'Transport'}
                    </span>
                  )}
                  {(packageData.food_included || packageData.food) && (
                    <span className="text-[9px] font-black bg-orange-50 text-orange-700 border border-orange-200 rounded-lg px-2 py-1 flex items-center gap-1">
                      <Utensils size={10} /> Food Included
                    </span>
                  )}
                  {(packageData.ziyarat_included || packageData.ziyarat) && (
                    <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-2 py-1 flex items-center gap-1">
                      <MapPin size={10} /> Ziyarat Included
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {(packageData.hotels || []).map((h, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
                  <Building2 size={14} className="text-blue-500 shrink-0" />
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{h.city}</p>
                    <p className="text-xs font-black text-slate-800">{h.name}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-right shrink-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Total</p>
              <p className="text-2xl font-black text-blue-600">{PKR(createdBooking?.total_amount || grandTotal)}</p>
              <p className="text-[10px] font-bold text-slate-400">{createdBooking?.total_passengers || passengers.length} pax</p>
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ STEP INDICATOR â”€â”€ */}
      <div className="px-4 lg:px-8 py-10 max-w-6xl mx-auto overflow-x-auto">
        <div className="flex items-center justify-between min-w-[500px] lg:min-w-0">
          <StepIndicator step={1} label="Passengers & Rooms" active={currentStep === 1} done={currentStep > 1} />
          <div className={`flex-1 h-[2px] mx-4 transition-all duration-500 ${currentStep > 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
          <StepIndicator step={2} label="Review & Pricing" active={currentStep === 2} done={currentStep > 2} />
          <div className={`flex-1 h-[2px] mx-4 transition-all duration-500 ${currentStep > 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
          <StepIndicator step={3} label="Payment" active={currentStep === 3} done={isBooked} />
        </div>
      </div>

      {/* â”€â”€ Error Banner â”€â”€ */}
      {error && (
        <div className="px-4 lg:px-8 max-w-6xl mx-auto mb-6">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-xs font-bold flex items-center gap-3">
            <Info size={16} className="shrink-0" /> {error}
          </div>
        </div>
      )}

      {/* â”€â”€ STEP CONTENT â”€â”€ */}
      <main className="px-4 lg:px-8 max-w-6xl mx-auto">
        {currentStep === 1 && (
          <StepOneRoomsAndPax
            packageData={packageData}
            availableRooms={availableRooms}
            roomSel={roomSel}
            setRoomSel={setRoomSel}
            passengers={passengers}
            expandedPax={expandedPax}
            setExpandedPax={setExpandedPax}
            onPaxChange={handlePaxChange}
            isValid={isStep1Valid}
            onNext={handleNext}
            privateRoomPrice={privateRoomPrice}
            extraInfants={extraInfants}
            setExtraInfants={setExtraInfants}
          />
        )}
        {currentStep === 2 && (
          <StepTwoReview
            passengers={passengers}
            packageData={packageData}
            grandTotal={grandTotal}
            priceFor={priceFor}
            childNoBedPrice={childNoBedPrice}
            infantPriceVal={infantPrice}
            isLoading={isLoading}
            onEdit={() => { setError(''); setCurrentStep(1); }}
            onNext={handleNext}
            discountGroup={discountGroup}
            discountAmount={discountAmount}
          />
        )}
        {currentStep === 3 && createdBooking && (
          <StepThreePayment
            booking={createdBooking}
            totalAmount={createdBooking.total_amount || grandTotal}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            paymentData={paymentData}
            setPaymentData={setPaymentData}
            termsAccepted={termsAccepted}
            setTermsAccepted={setTermsAccepted}
            expiryMins={expiryMins}
            onConfirm={() => setIsBooked(true)}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setError={setError}
            discountGroup={discountGroup}
            discountAmount={discountAmount}
          />
        )}
      </main>
    </div>
  );
};



const StepOneRoomsAndPax = ({
  packageData, availableRooms, roomSel, setRoomSel,
  passengers, expandedPax, setExpandedPax, onPaxChange,
  isValid, onNext, privateRoomPrice, extraInfants, setExtraInfants
}) => {
  const adjRoom = (rt, delta) => setRoomSel(prev => {
    const cur = prev[rt] || 0;
    let next = Math.max(0, cur + delta);
    if (rt === 'sharing' && next > 1) next = 1; // Sharing limited to max 1 room
    if (next === 0) { const n = { ...prev }; delete n[rt]; return n; }
    return { ...prev, [rt]: next };
  });

  const hasPrivateRooms = (roomSel['private'] || 0) > 0;

  // Compute family head per room for display in accordions
  const familyHeadMap = {};
  passengers.forEach(p => {
    if (!p.roomType) return;
    const key = `${p.roomType}_${p.roomIndex}`;
    if (!familyHeadMap[key] && p.type === 'Adult') familyHeadMap[key] = p;
  });
  passengers.forEach(p => {
    if (!p.roomType) return;
    const key = `${p.roomType}_${p.roomIndex}`;
    if (!familyHeadMap[key]) familyHeadMap[key] = p;
  });

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">

      {/* â”€â”€ Room Selection â”€â”€ */}
      <section className="space-y-5">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight ml-2">Select Rooms</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableRooms.map(rt => {
            const qty = roomSel[rt] || 0;
            const isPrivate = rt === 'private';
            const price = isPrivate ? privateRoomPrice : (packageData.package_prices?.[rt]?.selling || 0);
            return (
              <div key={rt} className={`bg-white rounded-2xl border-2 shadow-sm transition-all ${qty > 0 ? 'border-blue-500 shadow-blue-50' : 'border-slate-200'}`}>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      {ROOM_LABELS[rt]}&nbsp;
                      {isPrivate
                        ? <span className="text-slate-400 font-bold normal-case text-xs">(1 adult · infants ok)</span>
                        : <span className="text-slate-400 font-bold normal-case text-xs">({ROOM_CAPACITIES[rt]} pax)</span>
                      }
                    </p>
                    {qty > 0 && <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-1 rounded-lg">{qty} room{qty > 1 ? 's' : ''}</span>}
                  </div>
                  {isPrivate && (
                    <p className="text-[9px] font-bold text-violet-500 bg-violet-50 rounded-lg px-2 py-1 mb-2">
                      Double room — 1 person pays for full room (both beds)
                    </p>
                  )}
                  <p className="text-lg font-black text-blue-600 mb-4">{PKR(price)} <span className="text-[10px] font-bold text-slate-400">/ {isPrivate ? 'room' : 'person'}</span></p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => adjRoom(rt, -1)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center font-black text-lg transition-all">-</button>
                    <span className="flex-1 text-center text-xl font-black text-slate-900">{qty}</span>
                    <button onClick={() => adjRoom(rt, +1)} className="w-10 h-10 rounded-xl bg-slate-900 text-white hover:bg-blue-600 flex items-center justify-center font-black text-lg transition-all">+</button>
                  </div>
                  {qty > 0 && (
                    <p className="text-[10px] font-bold text-emerald-600 mt-3 text-center bg-emerald-50 rounded-xl py-1.5">
                      {isPrivate
                        ? `${qty} room${qty > 1 ? 's' : ''} × ${PKR(price)} = ${PKR(qty * price)}`
                        : `${qty * ROOM_CAPACITIES[rt]} pax × ${PKR(price)} = ${PKR(qty * ROOM_CAPACITIES[rt] * price)}`
                      }
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Infants without bed — shown when private rooms are selected */}
        {hasPrivateRooms && (
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-black text-violet-900 uppercase tracking-tight">Infants (No Bed)</p>
              <p className="text-[10px] font-bold text-violet-500 mt-0.5">
                Infants travelling with private room — added to booking, no bed assigned
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setExtraInfants(n => Math.max(0, n - 1))}
                className="w-10 h-10 rounded-xl bg-white border border-violet-200 hover:bg-red-50 hover:text-red-600 flex items-center justify-center font-black text-lg transition-all"
              >-</button>
              <span className="text-xl font-black text-violet-900 w-6 text-center">{extraInfants}</span>
              <button
                onClick={() => setExtraInfants(n => n + 1)}
                className="w-10 h-10 rounded-xl bg-violet-600 text-white hover:bg-violet-700 flex items-center justify-center font-black text-lg transition-all"
              >+</button>
            </div>
          </div>
        )}
      </section>

      {/* â”€â”€ Passenger Passport Details â”€â”€ */}
      {passengers.length > 0 && (
        <section className="space-y-5">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight ml-2">Passengers Passport Detail</h3>
          <div className="space-y-4">
            {passengers.map((p, i) => {
              const fKey = p.roomType ? `${p.roomType}_${p.roomIndex}` : null;
              const headPax = fKey ? familyHeadMap[fKey] : null;
              const isFamilyHead = !!headPax && headPax.id === p.id;
              const familyHeadName = (!isFamilyHead && headPax && headPax.firstName)
                ? `${headPax.firstName} ${headPax.lastName}`.trim()
                : null;
              return (
                <PaxAccordion
                  key={p.id}
                  pax={p}
                  index={i}
                  expanded={expandedPax === i}
                  onToggle={() => setExpandedPax(expandedPax === i ? null : i)}
                  onChange={(field, val) => onPaxChange(p.id, field, val)}
                  isFamilyHead={isFamilyHead}
                  familyHeadName={familyHeadName}
                />
              );
            })}
          </div>
        </section>
      )}

      <div className="flex items-center justify-between pt-4">
        <p className="text-xs font-bold text-slate-400 ml-2">
          {passengers.filter(isPaxComplete).length} / {passengers.length} passengers complete
        </p>
        <button
          disabled={!isValid}
          onClick={onNext}
          className={`px-12 py-5 rounded-2xl font-black uppercase tracking-[3px] text-xs transition-all flex items-center gap-3 shadow-xl ${isValid
            ? 'bg-blue-600 text-white shadow-blue-500/30 hover:scale-105 active:scale-95'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
        >
          Review & Price <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

/* â”€â”€ Passenger Accordion Card â”€â”€ */
const PaxAccordion = ({ pax, index, expanded, onToggle, onChange, isFamilyHead, familyHeadName }) => {
  const fileRef = useRef();
  const complete = isPaxComplete(pax);
  const roomLabel = pax.roomType
    ? `${ROOM_LABELS[pax.roomType]} Room ${pax.roomIndex} · Seat ${pax.slotInRoom}`
    : pax.type === 'Infant' ? 'Infant (No Bed)' : pax.type;
  const displayName = pax.firstName
    ? `${pax.title} ${pax.firstName} ${pax.lastName}`
    : `Pax${index + 1}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors rounded-2xl"
      >
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs transition-all ${complete ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'
            }`}>
            {complete ? <CheckCircle size={14} /> : index + 1}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{displayName}</p>
              {isFamilyHead && (
                <span className="text-[8px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg uppercase tracking-wider">Family Head</span>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {roomLabel}
              {familyHeadName && <span className="text-slate-300 mx-1">·</span>}
              {familyHeadName && <span className="text-blue-400 normal-case font-bold">Head: {familyHeadName}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {complete && <span className="text-[9px] font-black bg-green-100 text-green-700 px-2 py-1 rounded-lg uppercase hidden sm:block">Complete</span>}
          {expanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
        </div>
      </button>

      {/* Expanded Form */}
      <div className={`transition-all duration-300 ${expanded ? 'max-h-[900px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="p-6 pt-0 border-t border-slate-50 space-y-5">

          {/* Row 1: Type, Title, First Name, Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SelectField
              label="Passenger Type"
              options={['Adult', 'Child', 'Infant']}
              value={pax.type}
              onChange={v => onChange('type', v)}
            />
            <SelectField
              label="Title"
              options={['Mr.', 'Mrs.', 'Ms.', 'Miss', 'Mstr.']}
              value={pax.title}
              onChange={v => onChange('title', v)}
            />
            <InputField label="First Name" placeholder="First Name" value={pax.firstName} onChange={v => onChange('firstName', v)} />
            <InputField label="Last Name" placeholder="Last Name" value={pax.lastName} onChange={v => onChange('lastName', v)} />
          </div>

          {/* Row 2: Passport No, DOB, Issue, Expiry */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <InputField label="Passport Number" placeholder="AB1234567" value={pax.passportNo} onChange={v => onChange('passportNo', v)} />
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
                <span className="text-[10px] font-bold text-green-600 truncate hidden sm:block ml-1">- {pax.passportFile.name}</span>
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
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
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
      </div>
    </div>
  );
};



const StepTwoReview = ({
  passengers, packageData, grandTotal, priceFor, childNoBedPrice, infantPriceVal,
  isLoading, onEdit, onNext,
  discountGroup = null, discountAmount = 0
}) => {
  // Build grouped price rows
  const priceRows = [];
  const seen = {};
  let subtotalAmount = 0;
  passengers.forEach(p => {
    const price = priceFor(p.type, p.roomType);
    subtotalAmount += price;
    const key = `${p.type}_${p.roomType || 'none'}`;
    if (!seen[key]) {
      const lbl = p.type === 'Infant' ? 'Infant'
        : (!p.roomType && p.type === 'Child') ? 'Child (No Bed)'
          : `${p.type} - ${ROOM_LABELS[p.roomType] || p.roomType}`;
      seen[key] = { label: lbl, price, count: 0 };
      priceRows.push(seen[key]);
    }
    seen[key].count++;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-right-4 duration-500">

      {/* â”€â”€ Manifest â”€â”€ */}
      <div className="lg:col-span-7 space-y-8">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[4px] ml-2">Review Manifest</h3>
        <div className="space-y-3">
          {passengers.map((p) => (
            <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 uppercase">
                    {p.title} {p.firstName} {p.lastName}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Passport: {p.passportNo} | DOB: {p.dob}
                    {p.roomType && ` | ${ROOM_LABELS[p.roomType]} Rm ${p.roomIndex}`}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md tracking-tighter uppercase">{p.type}</span>
                {p.passportFile && (
                  <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-md flex items-center gap-1">
                    <Check size={9} /> Passport
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <button onClick={onEdit} className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:underline ml-2">
          <ArrowLeft size={14} /> Edit Passenger Info
        </button>
      </div>

      {/* â”€â”€ Price Card â”€â”€ */}
      <div className="lg:col-span-5">
        <div className="bg-white rounded-3xl border-2 border-blue-50 shadow-lg overflow-hidden sticky top-32">
          <div className="p-8 border-b border-slate-50 bg-blue-50/20">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Price Breakdown</h3>
          </div>
          <div className="p-8 space-y-4">
            {priceRows.map(r => (
              <div key={r.label} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 font-medium">{r.count} x {r.label}</span>
                <span className="font-bold text-slate-900">{PKR(r.count * r.price)}</span>
              </div>
            ))}

            {/* Grand Total */}
            <div className="pt-4 mt-4 border-t-2 border-slate-200 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-widest text-slate-900">Grand Total</span>
              <span className="text-2xl font-black text-blue-600">{PKR(subtotalAmount)}</span>
            </div>
          </div>
          <div className="px-8 pb-8">
            <button
              onClick={onNext}
              disabled={isLoading}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-[3px] text-xs shadow-xl flex items-center justify-center gap-3 transition-all ${isLoading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white shadow-blue-500/30 hover:scale-[1.02] active:scale-95'
                }`}
            >
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating Booking...</>
              ) : (
                <>Proceed to Payment <CheckCircle size={18} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};



const StepThreePayment = ({
  booking, totalAmount, paymentMethod, setPaymentMethod,
  paymentData, setPaymentData,
  termsAccepted, setTermsAccepted,
  expiryMins, onConfirm, isLoading, setIsLoading, setError,
  discountGroup = null, discountAmount = 0
}) => {
  const fileRef = useRef();
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

      // Validation
      if (!paymentData.amount || paymentData.amount <= 0) {
        alert('Invalid amount. Please enter a valid amount before confirming.');
        setIsLoading(false);
        return;
      }

      const isManualPayment = ['bank', 'cash'].includes(paymentMethod);

      if (isManualPayment && paymentMethod === 'bank' && !paymentData.beneficiaryAccount) {
        if (!window.confirm('⚠️ No beneficiary account selected. Continue anyway?')) {
          setIsLoading(false);
          return;
        }
      }

      if (isManualPayment && paymentMethod === 'bank' && !paymentData.agentAccount) {
        if (!window.confirm('⚠️ No agent account selected. Continue anyway?')) {
          setIsLoading(false);
          return;
        }
      }

      if (isManualPayment && paymentMethod === 'cash' && (!paymentData.bankName || !paymentData.depositorName || !paymentData.depositorCNIC)) {
        if (!window.confirm('⚠️ Cash deposit details incomplete. Continue anyway?')) {
          setIsLoading(false);
          return;
        }
      }

      if (paymentMethod === 'transfer' && (!paymentData.transferAccount || !paymentData.transferAccountName || !paymentData.transferPhone || !paymentData.transferCNIC || !paymentData.transferAccountNumber)) {
        if (!window.confirm('⚠️ Transfer details incomplete. Continue anyway?')) {
          setIsLoading(false);
          return;
        }
      }

      if ((isManualPayment || paymentMethod === 'transfer') && (paymentMethod === 'bank' || paymentMethod === 'transfer') && !paymentData.slipFile) {
        if (!window.confirm('⚠️ No payment slip uploaded. Continue anyway?')) {
          setIsLoading(false);
          return;
        }
      }


      // Bank / Cash - Use centralized payments API
      const formData = new FormData();
      formData.append('booking_id', id);
      formData.append('booking_type', 'umrah');
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

      alert('✅ Booking confirmed! Payment is pending verification.');
      setIsLoading(false);
      onConfirm();
    } catch (e) {
      setError(e.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">

      {/* Booking Reference Card */}
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
          <PaymentMethodCard
            label="Bank Transfer"
            icon={<Building2 size={24} />}
            active={paymentMethod === 'bank'}
            onClick={() => setPaymentMethod('bank')}
          />
          <PaymentMethodCard
            label="Cash"
            icon={<Wallet size={24} />}
            active={paymentMethod === 'cash'}
            onClick={() => setPaymentMethod('cash')}
          />
          <PaymentMethodCard
            label="Transfer"
            icon={<ArrowLeftRight size={24} />}
            active={paymentMethod === 'transfer'}
            onClick={() => setPaymentMethod('transfer')}
          />
          <PaymentMethodCard
            label="KuikPay"
            icon={<Smartphone size={24} />}
            active={false}
            disabled={true}
            onClick={() => { }}
          />
        </div>

        {/* Bank / Cash Forms (Dynamic) */}
        {(paymentMethod === 'bank') && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Beneficiary Account (Company)"
                options={beneficiaryAccounts.length > 0 ? beneficiaryAccounts : ['Loading accounts...']}
                value={paymentData.beneficiaryAccount}
                onChange={v => upd('beneficiaryAccount', v)}
              />
              <SelectField
                label="Agent Account (Your Bank)"
                options={agentAccounts.length > 0 ? agentAccounts : ['Loading accounts...']}
                value={paymentData.agentAccount}
                onChange={v => upd('agentAccount', v)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Amount"
                type="number"
                placeholder="Enter amount"
                value={paymentData.amount}
                onChange={v => upd('amount', parseFloat(v) || 0)}
              />
              <InputField
                label="Date"
                type="date"
                value={paymentData.date}
                onChange={v => upd('date', v)}
              />
              <InputField
                label="Note (Optional)"
                placeholder="Add payment reference or notes"
                value={paymentData.note}
                onChange={v => upd('note', v)}
              />
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
                <input
                  type="file"
                  ref={fileRef}
                  accept="image/*,.pdf"
                  onChange={e => { if (e.target.files[0]) upd('slipFile', e.target.files[0]); }}
                  className="mt-2 w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-blue-50 transition-all cursor-pointer"
                />
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
              <InputField
                label="Amount"
                type="number"
                placeholder="Enter amount"
                value={paymentData.amount}
                onChange={(v) => upd('amount', parseFloat(v) || 0)}
              />
              <InputField
                label="Date"
                type="date"
                value={paymentData.date}
                onChange={(v) => upd('date', v)}
              />
              <InputField
                label="Note (Optional)"
                placeholder="Add payment reference or notes"
                value={paymentData.note}
                onChange={(v) => upd('note', v)}
              />
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
                <input
                  type="file"
                  ref={fileRef}
                  accept="image/*,.pdf"
                  onChange={e => { if (e.target.files[0]) upd('slipFile', e.target.files[0]); }}
                  className="mt-2 w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-blue-50 transition-all cursor-pointer"
                />
              )}
            </div>
          </div>
        )}

        {/* Cash Form */}
        {paymentMethod === 'cash' && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Bank Name"
                placeholder="Enter bank name"
                value={paymentData.bankName}
                onChange={v => upd('bankName', v)}
              />
              <InputField
                label="Cash Depositor Name"
                placeholder="Full name"
                value={paymentData.depositorName}
                onChange={v => upd('depositorName', v)}
              />
              <InputField
                label="Depositor CNIC"
                placeholder="12345-1234567-1"
                value={paymentData.depositorCNIC}
                onChange={v => upd('depositorCNIC', v)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Amount"
                type="number"
                placeholder="Enter amount"
                value={paymentData.amount}
                onChange={v => upd('amount', parseFloat(v) || 0)}
              />
              <InputField
                label="Date"
                type="date"
                value={paymentData.date}
                onChange={v => upd('date', v)}
              />
            </div>
          </div>
        )}

        {/* Credit Info */}
        {paymentMethod === 'credit' && (
          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200 mt-4">
            <p className="text-sm font-bold text-blue-900">
              💳 <strong>Credit Payment Selected:</strong> Your booking will be confirmed and the amount will be deducted from your agency's credit limit.
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
    </div >
  );
};

/* —————————————————————————————————————————————————————————————————————————— */
/*  SUCCESS VIEW                                                                  */
/* —————————————————————————————————————————————————————————————————————————— */

const SuccessView = ({ booking, expiryMins, onBack }) => (
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
      {expiryMins != null && (
        <div className="flex items-center gap-2 justify-center text-amber-600 text-xs font-bold bg-amber-50 rounded-2xl px-5 py-3">
          <Clock size={14} /> Expires in {expiryMins} minutes if not confirmed
        </div>
      )}
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

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
/*  SHARED ATOMIC COMPONENTS (identical style to BookingPage)                    */
/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const StepIndicator = ({ step, label, active, done }) => (
  <div className={`flex items-center gap-3 transition-all duration-500 ${active ? 'opacity-100 scale-110' : done ? 'opacity-100' : 'opacity-40'}`}>
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-200 text-slate-500'
      }`}>
      {done ? <CheckCircle size={20} /> : step}
    </div>
    <span className={`hidden md:block text-[11px] font-black uppercase tracking-widest ${active ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
  </div>
);

const CountControl = ({ label, sub, count, onUpdate }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
    <div className="text-left">
      <p className="text-xs font-black text-slate-900 uppercase leading-none mb-1">{label}</p>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{sub}</p>
    </div>
    <div className="flex items-center gap-4">
      <button onClick={() => onUpdate(-1)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">-</button>
      <span className="text-xl font-black text-slate-900 min-w-[20px] text-center tabular-nums">{count}</span>
      <button onClick={() => onUpdate(1)} className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black hover:bg-blue-600 transition-all shadow-md">+</button>
    </div>
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
                onClick={() => { onChange(c); setTerm(''); setIsOpen(false); }}
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
  <button onClick={onClick}
    disabled={disabled}
    className={`p-4 rounded-2xl border-2 transition-all text-center space-y-2 ${active
      ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
      : disabled
        ? 'border-slate-200 bg-slate-50 opacity-40 cursor-not-allowed'
        : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
      }`}>
    <div className={`flex items-center justify-center ${active ? 'text-blue-600' : disabled ? 'text-slate-400' : 'text-slate-600'}`}>{icon}</div>
    <p className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-blue-600' : 'text-slate-900'}`}>{label}</p>
    {disabled && <p className="text-[9px] font-bold text-slate-400">Coming Soon</p>}
  </button>
);

export default UmrahBookingPage;
