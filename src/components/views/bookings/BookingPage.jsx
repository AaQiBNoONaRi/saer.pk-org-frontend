import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
  Users,
  User,
  Plane,
  Calendar,
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
  CheckCircle,
  CreditCard,
  Wallet,
  Building2,
  ShieldCheck,
  ArrowRight,
  Info,
  ChevronUp,
  X,
  ArrowLeft,
  FileText,
  Smartphone,
  Clock,
  ArrowLeftRight
} from 'lucide-react';
import SearchableSelect from '../../ui/SearchableSelect';

const API = 'http://localhost:8000';

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
    p.passport && p.dob && p.passportIssue && p.passportExpiry && p.country;

  if (!basicFields) return false;

  const age = calculateAge(p.dob);
  if (p.type === 'Adult' && age < 18) return false;
  if (p.type === 'Child' && (age >= 18 || age < 2)) return false;
  if (p.type === 'Infant' && age >= 2) return false;

  return true;
};

const BookingPage = ({ bookingData, onBack, resumeId }) => {
  // --- STATE MANAGEMENT ---
  const [currentStep, setCurrentStep] = useState(() => {
    if (resumeId) return 3;
    const match = window.location.pathname.match(/\/ticket-booking\/step-(\d+)/);
    return match ? parseInt(match[1]) : 1;
  });
  const [paxCount, setPaxCount] = useState({ adults: 1, children: 0, infants: 0 });
  const [passengers, setPassengers] = useState([]);
  const [expandedPax, setExpandedPax] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('bank'); // Default to bank transfer
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null); // Store booking after Step 2
  const [discountGroup, setDiscountGroup] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const [agentAccounts, setAgentAccounts] = useState([]);
  const [beneficiaryAccounts, setBeneficiaryAccounts] = useState([]);
  const [slipFile, setSlipFile] = useState(null);

  // Payment form state
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    note: '',
    beneficiaryAccount: '',
    agentAccount: '',
    transferAccount: null,
    transferAccountName: '',
    transferPhone: '',
    transferCNIC: '',
    transferAccountNumber: '',
    slipFile: null,
    // For cash
    bankName: '',
    depositorName: '',
    depositorCNIC: ''
  });

  /* —— URL Synchronization —— */
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const match = path.match(/\/ticket-booking\/step-(\d+)/);
      if (match) {
        const step = parseInt(match[1]);
        if (step !== currentStep) {
          setCurrentStep(step);
        }
      } else if (path === '/ticket') {
        onBack();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentStep, onBack]);

  // Push initial route if not present
  useEffect(() => {
    const path = window.location.pathname;
    if (!path.includes('/ticket-booking/step-')) {
      if (!resumeId) {
        window.history.pushState({ step: 1 }, '', `/ticket-booking/step-1${window.location.search}`);
        setCurrentStep(1);
      } else {
        window.history.pushState({ step: 3 }, '', `/ticket-booking/step-3${window.location.search}`);
        setCurrentStep(3);
      }
    } else {
      const match = path.match(/\/ticket-booking\/step-(\d+)/);
      if (match) setCurrentStep(parseInt(match[1]));
    }
  }, [resumeId]);

  // Fetch booking if resuming
  useEffect(() => {
    if (resumeId) {
      const fetchBooking = async () => {
        try {
          const token = localStorage.getItem('access_token');
          const res = await fetch(`${API}/api/ticket-bookings/${resumeId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setCreatedBooking(data);

            // Pre-fill payment amount from the booking
            if (data.grand_total) {
              setPaymentData(prev => ({ ...prev, amount: data.grand_total }));
            }

            // Map passengers from API format to component format
            if (data.passengers && data.passengers.length > 0) {
              const mappedPax = data.passengers.map((p, idx) => ({
                id: idx,
                type: p.type || 'Adult',
                title: p.title || '',
                firstName: p.first_name || '',
                lastName: p.last_name || '',
                passport: p.passport || p.passport_number || '',
                gender: p.gender || '',
                dob: p.dob || p.date_of_birth || '',
                passportIssue: p.passportIssue || p.passport_issue_date || '',
                passportExpiry: p.passportExpiry || p.passport_expiry_date || '',
                country: p.country || ''
              }));
              setPassengers(mappedPax);

              const adults = data.passengers.filter(p => p.type === 'Adult').length;
              const children = data.passengers.filter(p => p.type === 'Child').length;
              const infants = data.passengers.filter(p => p.type === 'Infant').length;
              setPaxCount({ adults, children, infants });
            }

            setCurrentStep(3);
            window.history.pushState({ step: 3 }, '', `/ticket-booking/step-3${window.location.search}`);
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
    window.history.pushState({ step }, '', `/ticket-booking/step-${step}${window.location.search}`);
  };

  // --- DERIVED DATA ---
  const totalPax = paxCount.adults + paxCount.children + paxCount.infants;

  // Calculate prices based on passenger types from ticket API
  // Note: adult_selling, child_selling, infant_selling are FINAL customer prices (already include tax/service)
  const ticketData = bookingData?.fullTicketData || createdBooking?.ticket_details || {};
  const adultPrice = ticketData.adult_selling || 0;
  const childPrice = ticketData.child_selling || adultPrice; // fallback to adult if child price not set
  const infantPrice = ticketData.infant_selling || 0;

  // Count actual passenger types from the passengers array (not from paxCount)
  const actualAdults = passengers.filter(p => p.type === 'Adult').length;
  const actualChildren = passengers.filter(p => p.type === 'Child').length;
  const actualInfants = passengers.filter(p => p.type === 'Infant').length;

  // Calculate total based on actual passenger types selected by user
  const adultSubtotal = actualAdults * adultPrice;
  const childSubtotal = actualChildren * childPrice;
  const infantSubtotal = actualInfants * infantPrice;
  const subtotalBeforeDiscount = adultSubtotal + childSubtotal + infantSubtotal;
  const grandTotal = Math.max(0, subtotalBeforeDiscount - discountAmount);

  // For breakdown display
  const subtotal = subtotalBeforeDiscount;
  const totalTax = 0;
  const totalService = 0;

  // --- EFFECTS ---
  // Sync passenger array with count
  useEffect(() => {
    const total = paxCount.adults + paxCount.children + paxCount.infants;
    setPassengers(prev => {
      const newArr = [...prev];
      if (newArr.length < total) {
        for (let i = newArr.length; i < total; i++) {
          newArr.push({
            id: i,
            type: i < paxCount.adults ? 'Adult' : (i < paxCount.adults + paxCount.children ? 'Child' : 'Infant'),
            title: '',
            firstName: '',
            lastName: '',
            passport: '',
            dob: '',
            passportIssue: '',
            passportExpiry: '',
            country: '',
            gender: ''
          });
        }
      } else {
        return newArr.slice(0, total);
      }
      return newArr;
    });
  }, [paxCount]);

  // Fetch Agency Discount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const isAdmin = !!localStorage.getItem('admin_data');
    if (isAdmin) return;

    // Fetch agency details to get discount_group_id
    fetch('http://localhost:8000/api/agencies/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(async (agency) => {
        if (agency && agency.discount_group_id) {
          // Fetch the specific discount group
          const discountRes = await fetch(`http://localhost:8000/api/discounts/${agency.discount_group_id}`, {
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

  // Calculate discount when discount group is loaded or subtotal changes
  useEffect(() => {
    if (discountGroup && discountGroup.ticket_discount) {
      if (discountGroup.ticket_discount_type === 'percentage') {
        // Calculate percentage discount
        const percentageDiscount = (subtotalBeforeDiscount * discountGroup.ticket_discount) / 100;
        setDiscountAmount(Math.round(percentageDiscount));
      } else {
        // Fixed discount
        setDiscountAmount(discountGroup.ticket_discount);
      }
    } else {
      setDiscountAmount(0);
    }
  }, [discountGroup, subtotalBeforeDiscount]);

  // Fetch Bank Accounts for Payment Step
  useEffect(() => {
    if (currentStep === 3) {
      const fetchAccounts = async () => {
        try {
          const token = localStorage.getItem('access_token');
          const res = await fetch(`${API}/api/bank-accounts/?include_system=true`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            // Backend already scopes accounts based on the logged-in user's role
            // Organization type = where the agency should deposit to (beneficiary)
            // Agency type = the agency's own accounts
            const orgAccs = data.filter(a => a.account_type === 'Organization');
            const agAccs = data.filter(a => a.account_type === 'Agency');
            setBeneficiaryAccounts(
              orgAccs.map(a => `${a.account_title ? a.account_title + ' - ' : ''}${a.bank_name} (Acc: ${a.account_number}) (Org)`)
            );
            setAgentAccounts(
              agAccs.map(a => `${a.account_title ? a.account_title + ' - ' : ''}${a.bank_name} (Acc: ${a.account_number}) (Agency)`)
            );
          } else {
            console.error('Failed to fetch bank accounts:', res.status);
          }
        } catch (e) {
          console.error('Error fetching bank accounts:', e);
        }
      };
      fetchAccounts();
    }
  }, [currentStep]);

  // --- HANDLERS ---
  const updatePaxCount = (type, delta) => {
    const minVal = type === 'adults' ? 1 : 0;
    setPaxCount(prev => ({
      ...prev,
      [type]: Math.max(minVal, prev[type] + delta)
    }));
  };

  const handlePassengerChange = (index, field, value) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleNextStep = async () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // If moving from step 1 to step 2, just advance
    if (currentStep === 1) {
      updateStep(2);
      return;
    }

    // If on step 2, create booking and move to step 3
    if (currentStep === 2) {
      await handleBookingSubmit();
    }
  };

  const handleBookingSubmit = async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      console.log('🔐 Token check:', token ? `Token found (${token.substring(0, 20)}...)` : 'NO TOKEN');

      if (!token) {
        alert('You are not logged in. Please login first.');
        window.location.reload();
        return;
      }

      // Prepare booking payload with detailed pricing
      const bookingPayload = {
        ticket_id: bookingData.ticketId,
        booking_type: 'ticket',
        ticket_details: ticketData, // Send complete ticket information
        passengers: passengers.map(p => ({
          type: p.type,
          title: p.title,
          first_name: p.firstName,
          last_name: p.lastName,
          passport_no: p.passport,
          dob: p.dob,
          passport_issue: p.passportIssue,
          passport_expiry: p.passportExpiry,
          country: p.country
        })),
        total_passengers: totalPax,
        // Selling prices are final customer prices
        base_price_per_person: totalPax > 0 ? Math.round(grandTotal / totalPax) : 0,
        tax_per_person: 0,
        service_charge_per_person: 0,
        subtotal: subtotalBeforeDiscount,
        total_tax: 0,
        total_service_charge: 0,
        grand_total: grandTotal,
        discount_group_id: discountGroup?._id || discountGroup?.id,
        discount_amount: discountAmount,
        // Payment fields will be null until step 3 (payment) is completed
        payment_details: {
          payment_method: null,
          payment_status: null
        },
        booking_status: 'underprocess',
        notes: `Adults: ${actualAdults} @ PKR ${adultPrice}, Children: ${actualChildren} @ PKR ${childPrice}, Infants: ${actualInfants} @ PKR ${infantPrice}${discountAmount > 0 ? ` | Discount: PKR ${discountAmount}` : ''}`
      };

      console.log('📦 Submitting booking:', bookingPayload);

      const response = await fetch(`${API}/api/ticket-bookings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Booking Error:', errorData);

        // Handle authentication errors specifically
        if (response.status === 401) {
          alert('Your session has expired. Please login again.');
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_type');
          localStorage.removeItem('agency_id');
          localStorage.removeItem('agency_name');
          window.location.reload();
          return;
        }

        throw new Error(errorData.detail || 'Failed to create booking');
      }

      const data = await response.json();
      console.log('✅ Booking created successfully:', data);

      // Save booking data for Step 3
      setCreatedBooking(data);
      setPaymentData(prev => ({ ...prev, amount: grandTotal }));

      setIsLoading(false);
      // Move to step 3 (payment) after successful booking
      updateStep(3);
    } catch (error) {
      setIsLoading(false);
      console.error('🔥 Error creating booking:', error);
      alert('Error creating booking: ' + error.message);
    }
  };

  // --- VALIDATION ---
  const isStep1Valid = passengers.length > 0 && passengers.every(isPaxComplete);

  // --- HEADER DETAILS (works for both normal and resume flow) ---
  const resumedTicket = createdBooking?.ticket_details;
  const headerRoute = bookingData?.itemDetails?.route
    || (resumedTicket?.departure_trip ? `${resumedTicket.departure_trip.departure_city} → ${resumedTicket.departure_trip.arrival_city}` : '');
  const headerDates = bookingData?.itemDetails?.dates
    || (resumedTicket?.departure_trip?.departure_datetime
      ? new Date(resumedTicket.departure_trip.departure_datetime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '');
  const headerTotal = createdBooking?.grand_total || grandTotal;

  if (isBooked) return <SuccessView bookingReference={createdBooking?.booking_reference || 'N/A'} />;

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-slate-900 pb-20">
      {/* 1. TOP SUMMARY CARD */}
      <div className="px-4 lg:px-8 pt-8 max-w-6xl mx-auto animate-in fade-in duration-500">
        <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
              <Plane size={28} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[2px]">{bookingData?.type || 'Flight'} Booking</h2>
              <p className="text-xl font-black text-slate-900 tracking-tight">{headerRoute}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:flex items-center gap-6 w-full md:w-auto">
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Travel Dates</p>
              <p className="text-sm font-bold text-slate-700">{headerDates}</p>
            </div>
            <div className="text-right md:text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Total</p>
              <p className="text-lg font-black text-blue-600">PKR {headerTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PROGRESS BAR */}
      <div className="px-4 lg:px-8 py-10 max-w-6xl mx-auto overflow-x-auto scrollbar-hide">
        <div className="flex items-center justify-between min-w-[600px] lg:min-w-0">
          <StepIndicator
            step={1}
            label="Passenger Info"
            active={currentStep === 1}
            done={currentStep > 1}
          />
          <div className={`flex-1 h-[2px] mx-4 transition-all duration-500 ${currentStep > 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
          <StepIndicator
            step={2}
            label="Review & Pricing"
            active={currentStep === 2}
            done={currentStep > 2}
          />
          <div className={`flex-1 h-[2px] mx-4 transition-all duration-500 ${currentStep > 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
          <StepIndicator
            step={3}
            label="Confirmation"
            active={currentStep === 3}
            done={isBooked}
          />
        </div>
      </div>

      {/* 3. MAIN CONTENT AREA */}
      <main className="px-4 lg:px-8 max-w-6xl mx-auto">
        <div className="transition-all duration-300 ease-in-out">
          {currentStep === 1 && (
            <StepOne
              paxCount={paxCount}
              updatePaxCount={updatePaxCount}
              passengers={passengers}
              handlePassengerChange={handlePassengerChange}
              expandedPax={expandedPax}
              setExpandedPax={setExpandedPax}
              onNext={handleNextStep}
              isValid={isStep1Valid}
            />
          )}
          {currentStep === 2 && (
            <StepTwo
              passengers={passengers}
              bookingData={bookingData}
              grandTotal={subtotalBeforeDiscount}
              subtotal={subtotalBeforeDiscount}
              tax={totalTax}
              service={totalService}
              actualAdults={actualAdults}
              actualChildren={actualChildren}
              actualInfants={actualInfants}
              adultPrice={adultPrice}
              childPrice={childPrice}
              infantPrice={infantPrice}
              onEdit={() => setCurrentStep(1)}
              onNext={handleNextStep}
              isLoading={isLoading}
            />
          )}
          {currentStep === 3 && createdBooking && (
            <StepThree
              booking={createdBooking}
              ticketData={createdBooking.ticket_details || ticketData}
              passengers={passengers}
              totalAmount={createdBooking.grand_total || grandTotal}
              actualAdults={actualAdults}
              actualChildren={actualChildren}
              actualInfants={actualInfants}
              adultPrice={adultPrice}
              childPrice={childPrice}
              infantPrice={infantPrice}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              paymentData={paymentData}
              setPaymentData={setPaymentData}
              slipFile={slipFile}
              setSlipFile={setSlipFile}
              beneficiaryAccounts={beneficiaryAccounts}
              agentAccounts={agentAccounts}
              termsAccepted={termsAccepted}
              setTermsAccepted={setTermsAccepted}
              onConfirm={() => setIsBooked(true)}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              discountGroup={discountGroup}
              discountAmount={discountAmount}
            />
          )}
        </div>
      </main>
    </div>
  );
};

// --- SUB-VIEWS ---

const StepOne = ({ paxCount, updatePaxCount, passengers, handlePassengerChange, expandedPax, setExpandedPax, onNext, isValid }) => (
  <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
    {/* Passenger Details List */}
    <div className="space-y-4">
      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight ml-2">Passengers Passport Detail</h3>
      {passengers.map((p, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 transition-all shadow-sm">
          <button
            onClick={() => setExpandedPax(expandedPax === i ? null : i)}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors rounded-2xl"
          >
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isPaxComplete(p) ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                {isPaxComplete(p) ? <CheckCircle size={14} /> : i + 1}
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{p.firstName ? `${p.title} ${p.firstName} ${p.lastName}` : `Pax${i + 1}`}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.type || 'Not Set'} Passenger</p>
              </div>
            </div>
            {expandedPax === i ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
          </button>

          <div className={`transition-all duration-300 ${expandedPax === i ? 'max-h-[800px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="p-6 pt-0 border-t border-slate-50 space-y-4">
              {/* Row 1: Type, Title, Name, Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SelectField
                  label="Type"
                  options={['Adult', 'Child', 'Infant']}
                  value={p.type}
                  onChange={(v) => handlePassengerChange(i, 'type', v)}
                />
                <SelectField
                  label="Title"
                  options={['Mr', 'Mrs', 'Ms', 'Miss', 'Dr']}
                  value={p.title}
                  onChange={(v) => handlePassengerChange(i, 'title', v)}
                />
                <InputField
                  label="Name"
                  placeholder="First Name"
                  value={p.firstName}
                  onChange={(v) => handlePassengerChange(i, 'firstName', v)}
                />
                <InputField
                  label="Last Name"
                  placeholder="Last Name"
                  value={p.lastName}
                  onChange={(v) => handlePassengerChange(i, 'lastName', v)}
                />
              </div>

              {/* Row 2: Passport Number, DOB, Passport Issue, Passport Expiry */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <InputField
                  label="Passport Number"
                  placeholder="e.g. AB123456"
                  value={p.passport}
                  onChange={(v) => handlePassengerChange(i, 'passport', v)}
                />
                <InputField
                  label="DOB"
                  type="date"
                  value={p.dob}
                  onChange={(v) => handlePassengerChange(i, 'dob', v)}
                />
                <InputField
                  label="Passport Issue"
                  type="date"
                  value={p.passportIssue}
                  onChange={(v) => handlePassengerChange(i, 'passportIssue', v)}
                />
                <InputField
                  label="Passport Expiry"
                  type="date"
                  value={p.passportExpiry}
                  onChange={(v) => handlePassengerChange(i, 'passportExpiry', v)}
                />
              </div>

              {/* Row 3: Country */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SearchableCountryField
                  label="Country"
                  value={p.country}
                  onChange={(v) => handlePassengerChange(i, 'country', v)}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>

    <div className="flex justify-between items-center pt-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => updatePaxCount('adults', 1)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg"
        >
          <Plus size={16} /> Add Passenger
        </button>
        {passengers.length > 1 && (
          <button
            onClick={() => updatePaxCount('adults', -1)}
            className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-red-100 transition-all flex items-center gap-2 border border-red-200"
          >
            <Minus size={16} /> Remove
          </button>
        )}
      </div>

      <div className="flex flex-col items-end gap-2">
        <p className="text-[10px] font-bold text-slate-400">
          {passengers.filter(isPaxComplete).length} / {passengers.length} Passengers Complete
        </p>
        <button
          disabled={!isValid}
          onClick={onNext}
          className={`px-12 py-5 rounded-2xl font-black uppercase tracking-[3px] text-xs transition-all flex items-center gap-3 shadow-xl ${isValid ? 'bg-blue-600 text-white shadow-blue-500/30 hover:scale-105 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
        >
          Continue <ChevronRight size={18} />
        </button>
      </div>
    </div>
  </div>
);

const StepTwo = ({ passengers, bookingData, grandTotal, subtotal, tax, service, actualAdults, actualChildren, actualInfants, adultPrice, childPrice, infantPrice, onEdit, onNext, isLoading }) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-right-4 duration-500">
    {/* Info Side */}
    <div className="lg:col-span-7 space-y-8">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[4px] ml-2">Review Manifest</h3>
      <div className="space-y-3">
        {passengers.map((p, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><User size={20} /></div>
              <div>
                <p className="text-sm font-black text-slate-900 uppercase">{p.title} {p.firstName} {p.lastName}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Passport: {p.passport} • DOB: {p.dob}</p>
              </div>
            </div>
            <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md tracking-tighter uppercase">{p.type}</span>
          </div>
        ))}
      </div>
      <button onClick={onEdit} className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:underline">
        <ArrowLeft size={14} /> Edit Passenger Info
      </button>
    </div>

    {/* Pricing Side */}
    <div className="lg:col-span-5">
      <div className="bg-white rounded-3xl border-2 border-blue-50 shadow-lg overflow-hidden sticky top-32">
        <div className="p-8 border-b border-slate-50 bg-blue-50/20">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Price Breakdown</h3>
        </div>
        <div className="p-8 space-y-4">
          {/* Passenger type breakdown */}
          {actualAdults > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-medium">{actualAdults} Adult{actualAdults > 1 ? 's' : ''} × PKR {adultPrice.toLocaleString()}</span>
              <span className="font-bold text-slate-900">PKR {(actualAdults * adultPrice).toLocaleString()}</span>
            </div>
          )}
          {actualChildren > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-medium">{actualChildren} Child{actualChildren > 1 ? 'ren' : ''} × PKR {childPrice.toLocaleString()}</span>
              <span className="font-bold text-slate-900">PKR {(actualChildren * childPrice).toLocaleString()}</span>
            </div>
          )}
          {actualInfants > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-medium">{actualInfants} Infant{actualInfants > 1 ? 's' : ''} × PKR {infantPrice.toLocaleString()}</span>
              <span className="font-bold text-slate-900">PKR {(actualInfants * infantPrice).toLocaleString()}</span>
            </div>
          )}
          <div className="pt-4 mt-4 border-t-2 border-slate-200 flex items-center justify-between">
            <span className="text-sm font-black uppercase tracking-widest text-slate-900">Total Amount</span>
            <span className="text-2xl font-black text-blue-600">PKR {grandTotal.toLocaleString()}</span>
          </div>
        </div>
        <div className="px-8 pb-8">
          <button
            onClick={onNext}
            disabled={isLoading}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-[3px] text-xs shadow-xl flex items-center justify-center gap-3 transition-all ${isLoading
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 text-white shadow-blue-500/30 hover:scale-[1.02] active:scale-95'
              }`}
          >
            {isLoading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Creating Booking...</>
            ) : (
              <>Confirm Booking <CheckCircle size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
);

const StepThree = ({
  booking,
  ticketData,
  passengers,
  totalAmount,
  actualAdults,
  actualChildren,
  actualInfants,
  adultPrice,
  childPrice,
  infantPrice,
  paymentMethod,
  setPaymentMethod,
  paymentData,
  setPaymentData,
  slipFile,
  setSlipFile,
  beneficiaryAccounts,
  agentAccounts,
  termsAccepted,
  setTermsAccepted,
  onConfirm,
  isLoading,
  setIsLoading,
  discountGroup = null,
  discountAmount = 0
}) => {

  const handlePaymentDataChange = (field, value) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSlipFile(file);
    }
  };

  const handleHoldBooking = () => {
    window.location.href = '/booking-history';
  };

  const handleConfirmOrder = async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');

      // Validation
      if (!paymentData.amount || paymentData.amount <= 0) {
        alert('Invalid amount. Please enter a valid amount before confirming.');
        setIsLoading(false);
        return;
      }

      // Optional validations - warn but allow to continue
      if ((paymentMethod === 'bank' || paymentMethod === 'cheque') && !paymentData.beneficiaryAccount) {
        if (!confirm('⚠️ No beneficiary account selected. Continue anyway?')) {
          setIsLoading(false);
          return;
        }
      }

      if ((paymentMethod === 'bank' || paymentMethod === 'cheque') && !paymentData.agentAccount) {
        if (!confirm('⚠️ No agent account selected. Continue anyway?')) {
          setIsLoading(false);
          return;
        }
      }

      if (paymentMethod === 'cash' && (!paymentData.bankName || !paymentData.depositorName || !paymentData.depositorCNIC)) {
        if (!confirm('⚠️ Cash deposit details incomplete. Continue anyway?')) {
          setIsLoading(false);
          return;
        }
      }

      if (paymentMethod === 'transfer' && (!paymentData.transferAccount || !paymentData.transferAccountName || !paymentData.transferPhone || !paymentData.transferCNIC || !paymentData.transferAccountNumber)) {
        if (!confirm('⚠️ Transfer details incomplete. Continue anyway?')) {
          setIsLoading(false);
          return;
        }
      }

      // Note: Slip file is optional - just warn if missing
      if ((paymentMethod === 'bank' || paymentMethod === 'cheque' || paymentMethod === 'transfer') && !slipFile) {
        if (!confirm('⚠️ No payment slip uploaded. Continue anyway?')) {
          setIsLoading(false);
          return;
        }
      }

      // For Credit Payment - Use centralized payments API for verification
      if (paymentMethod === 'credit') {
        const formData = new FormData();
        formData.append('booking_id', booking._id || booking.id);
        formData.append('booking_type', 'ticket');
        formData.append('payment_method', 'credit');
        formData.append('amount', totalAmount);
        formData.append('payment_date', paymentData.date);
        if (paymentData.note) formData.append('note', paymentData.note);

        const paymentResponse = await fetch(`${API}/api/payments/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!paymentResponse.ok) {
          const errorData = await paymentResponse.json();
          throw new Error(errorData.detail || 'Failed to process credit payment');
        }

        alert('✅ Booking confirmed! Paid with credit.');
        setIsLoading(false);
        onConfirm();
        return;
      }

      // For Bank Transfer, Cash, Cheque, Transfer - Create Payment Request
      const formData = new FormData();
      formData.append('booking_id', booking._id || booking.id);
      formData.append('booking_type', 'ticket');
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

      if (slipFile) {
        formData.append('slip_file', slipFile);
      }

      const paymentResponse = await fetch(`${API}/api/payments/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.detail || 'Failed to submit payment request');
      }

      alert('✅ Booking confirmed! Payment is pending verification.');
      setIsLoading(false);
      onConfirm();
    } catch (error) {
      console.error('Error confirming order:', error);
      alert('Error confirming order: ' + error.message);
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
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm font-bold text-blue-200">{booking.total_passengers} passengers</p>
            <span className="inline-block px-4 py-2 bg-blue-500 rounded-xl font-black text-sm uppercase">
              {booking.booking_status || 'Under Process'}
            </span>
          </div>
        </div>
      </div>

      {/* Agency Discount (if applicable) */}
      {discountAmount > 0 && discountGroup && (
        <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-green-900 uppercase tracking-tight">Agency Discount Applied</h3>
              <p className="text-xs font-bold text-green-600">{discountGroup.name}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Total Amount</span>
              <span className="text-lg font-bold text-slate-900">PKR {(totalAmount + discountAmount).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-sm font-medium text-green-700">Discount Applied</span>
              <span className="text-lg font-bold text-green-600">- PKR {discountAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-slate-900 uppercase">Amount After Discount</span>
              <span className="text-2xl font-black text-blue-600">PKR {totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Passenger Price Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-4">Passenger Details & Pricing</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-black text-slate-400 uppercase">Type</th>
                <th className="text-left py-3 px-4 text-xs font-black text-slate-400 uppercase">Title</th>
                <th className="text-left py-3 px-4 text-xs font-black text-slate-400 uppercase">First Name</th>
                <th className="text-left py-3 px-4 text-xs font-black text-slate-400 uppercase">Last Name</th>
                <th className="text-left py-3 px-4 text-xs font-black text-slate-400 uppercase">Passport</th>
                <th className="text-right py-3 px-4 text-xs font-black text-slate-400 uppercase">Fare</th>
              </tr>
            </thead>
            <tbody>
              {passengers.map((p, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-3 px-4 text-sm font-bold text-slate-600">{p.type}</td>
                  <td className="py-3 px-4 text-sm font-bold text-slate-600">{p.title}</td>
                  <td className="py-3 px-4 text-sm font-bold text-slate-900">{p.firstName}</td>
                  <td className="py-3 px-4 text-sm font-bold text-slate-900">{p.lastName}</td>
                  <td className="py-3 px-4 text-sm font-bold text-slate-600">{p.passport}</td>
                  <td className="py-3 px-4 text-right text-sm font-black text-slate-900">
                    PKR {(p.type === 'Adult' ? adultPrice : p.type === 'Child' ? childPrice : infantPrice).toLocaleString()}
                  </td>
                </tr>
              ))}
              {/* Total Row */}
              <tr className="border-t-2 border-slate-300 bg-blue-50">
                <td colSpan="5" className="py-4 px-4 text-right text-base font-black text-slate-900 uppercase">
                  Total Amount:
                </td>
                <td className="py-4 px-4 text-right text-xl font-black text-blue-600">
                  PKR {totalAmount.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

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
            active={false}
            disabled={true}
            onClick={() => { }}
          />
          <PaymentMethodCard
            label="Transfer"
            icon={<ArrowLeftRight size={24} />}
            active={paymentMethod === 'transfer'}
            onClick={() => setPaymentMethod('transfer')}
          />
        </div>

        {/* Payment Form Fields */}
        {paymentMethod === 'bank' && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Beneficiary Account (Company)"
                options={beneficiaryAccounts.length > 0 ? beneficiaryAccounts : ['No accounts found']}
                value={paymentData.beneficiaryAccount}
                onChange={(v) => handlePaymentDataChange('beneficiaryAccount', v)}
              />
              <SelectField
                label="Agent Account"
                options={agentAccounts.length > 0 ? agentAccounts : ['No accounts found']}
                value={paymentData.agentAccount}
                onChange={(v) => handlePaymentDataChange('agentAccount', v)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Amount"
                type="number"
                placeholder="Enter amount"
                value={paymentData.amount}
                onChange={(v) => handlePaymentDataChange('amount', parseFloat(v) || 0)}
              />
              <InputField
                label="Date"
                type="date"
                value={paymentData.date}
                onChange={(v) => handlePaymentDataChange('date', v)}
              />
              <InputField
                label="Note (Optional)"
                placeholder="Add note"
                value={paymentData.note}
                onChange={(v) => handlePaymentDataChange('note', v)}
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Upload Payment Slip *</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="mt-2 w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-blue-50 focus:bg-white focus:border-blue-200 transition-all"
              />
              {slipFile && (
                <p className="text-xs font-bold text-green-600 mt-2">✓ File selected: {slipFile.name}</p>
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
                onChange={(v) => handlePaymentDataChange('transferAccount', v)}
                placeholder="Select Organization Account..."
              />
              <InputField
                label="Client Account Number"
                placeholder="Enter client's account number"
                value={paymentData.transferAccountNumber}
                onChange={(v) => handlePaymentDataChange('transferAccountNumber', v)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Transfer Account Name"
                placeholder="Enter account name"
                value={paymentData.transferAccountName}
                onChange={(v) => handlePaymentDataChange('transferAccountName', v)}
              />
              <InputField
                label="Phone Number"
                placeholder="03XXXXXXXXX"
                value={paymentData.transferPhone}
                onChange={(v) => handlePaymentDataChange('transferPhone', v)}
              />
              <InputField
                label="CNIC Number"
                placeholder="12345-1234567-1"
                value={paymentData.transferCNIC}
                onChange={(v) => handlePaymentDataChange('transferCNIC', v)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Amount"
                type="number"
                placeholder="Enter amount"
                value={paymentData.amount}
                onChange={(v) => handlePaymentDataChange('amount', parseFloat(v) || 0)}
              />
              <InputField
                label="Date"
                type="date"
                value={paymentData.date}
                onChange={(v) => handlePaymentDataChange('date', v)}
              />
              <InputField
                label="Note (Optional)"
                placeholder="Add note"
                value={paymentData.note}
                onChange={(v) => handlePaymentDataChange('note', v)}
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Upload Payment Slip *</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="mt-2 w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-blue-50 focus:bg-white focus:border-blue-200 transition-all"
              />
              {slipFile && (
                <p className="text-xs font-bold text-green-600 mt-2">✓ File selected: {slipFile.name}</p>
              )}
            </div>
          </div>
        )}

        {paymentMethod === 'cash' && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Bank Name"
                placeholder="Enter bank name"
                value={paymentData.bankName}
                onChange={(v) => handlePaymentDataChange('bankName', v)}
              />
              <InputField
                label="Cash Depositor Name"
                placeholder="Full name"
                value={paymentData.depositorName}
                onChange={(v) => handlePaymentDataChange('depositorName', v)}
              />
              <InputField
                label="Depositor CNIC"
                placeholder="12345-1234567-1"
                value={paymentData.depositorCNIC}
                onChange={(v) => handlePaymentDataChange('depositorCNIC', v)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Amount"
                type="number"
                placeholder="Enter amount"
                value={paymentData.amount}
                onChange={(v) => handlePaymentDataChange('amount', parseFloat(v) || 0)}
              />
              <InputField
                label="Date"
                type="date"
                value={paymentData.date}
                onChange={(v) => handlePaymentDataChange('date', v)}
              />
            </div>
          </div>
        )}

        {paymentMethod === 'credit' && (
          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200 mt-4">
            <p className="text-sm font-bold text-blue-900">
              💳 <strong>Credit Payment Selected:</strong> Your booking will be confirmed and the amount will be deducted from your agency's credit limit.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleHoldBooking}
          disabled={isLoading}
          className="py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-sm disabled:opacity-50"
        >
          Hold Booking
        </button>
        <button
          onClick={handleConfirmOrder}
          disabled={isLoading}
          className="py-4 px-6 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Confirm Order <ArrowRight size={18} /></>
          )}
        </button>
      </div>
    </div>
  );
};

const PaymentMethodCard = ({ label, icon, active, disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-4 rounded-2xl border-2 transition-all text-center space-y-2 ${active
      ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
      : disabled
        ? 'border-slate-200 bg-slate-50 opacity-40 cursor-not-allowed'
        : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
      }`}
  >
    <div className={`flex items-center justify-center ${active ? 'text-blue-600' : disabled ? 'text-slate-400' : 'text-slate-600'
      }`}>{icon}</div>
    <p className="text-xs font-black text-slate-900 uppercase">{label}</p>
    {disabled && <p className="text-[9px] font-bold text-slate-400">Coming Soon</p>}
  </button>
);

const SuccessView = ({ bookingReference = '#BK-991204' }) => (
  <div className="min-h-screen flex items-center justify-center p-6 bg-white">
    <div className="max-w-md w-full text-center space-y-8 animate-in zoom-in-95 duration-700">
      <div className="w-24 h-24 bg-green-50 rounded-[40px] flex items-center justify-center text-green-500 mx-auto shadow-inner shadow-green-100/50">
        <CheckCircle size={48} className="animate-bounce" />
      </div>
      <div>
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Booking Secured!</h2>
        <p className="text-slate-500 font-medium mt-3">
          Your confirmation reference is <span className="text-blue-600 font-black">{bookingReference}</span>.
          {' '}Payment verification is pending.
        </p>
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

// --- ATOMIC UI HELPERS ---

const StepIndicator = ({ step, label, active, done }) => (
  <div className={`flex items-center gap-3 transition-all duration-500 ${active ? 'opacity-100 scale-110' : done ? 'opacity-100' : 'opacity-40'}`}>
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-200 text-slate-500'
      }`}>
      {done ? <CheckCircle size={20} /> : step}
    </div>
    <span className={`hidden md:block text-[11px] font-black uppercase tracking-widest ${active ? 'text-slate-900' : 'text-slate-400'}`}>
      {label}
    </span>
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

const InputField = ({ label, placeholder, type = "text", value, onChange }) => (
  <div className="space-y-2 text-left">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-blue-50 focus:bg-white focus:border-blue-200 transition-all"
    />
  </div>
);

const SelectField = ({ label, options, value, onChange }) => (
  <div className="space-y-2 text-left">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-blue-50 focus:bg-white focus:border-blue-200 transition-all appearance-none cursor-pointer"
    >
      <option value="">Select</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const SearchableCountryField = ({ label, value, onChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
    'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia',
    'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
    'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia',
    'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
    'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
    'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia',
    'Fiji', 'Finland', 'France',
    'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
    'Haiti', 'Honduras', 'Hungary',
    'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
    'Jamaica', 'Japan', 'Jordan',
    'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
    'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius',
    'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
    'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
    'Oman',
    'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
    'Qatar',
    'Romania', 'Russia', 'Rwanda',
    'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
    'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands',
    'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
    'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
    'Turkmenistan', 'Tuvalu',
    'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
    'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
    'Yemen',
    'Zambia', 'Zimbabwe'
  ];

  const filteredCountries = countries.filter(country =>
    country.toLowerCase().includes((searchTerm || value || '').toLowerCase())
  );

  return (
    <div className="space-y-2 text-left relative z-10">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="Search country..."
          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-blue-50 focus:bg-white focus:border-blue-200 transition-all"
        />
        {isOpen && filteredCountries.length > 0 && (
          <div className="absolute z-[100] w-full mt-2 bg-white border-2 border-slate-300 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
            {filteredCountries.slice(0, 10).map((country) => (
              <button
                key={country}
                type="button"
                onClick={() => {
                  onChange(country);
                  setSearchTerm('');
                  setIsOpen(false);
                }}
                className="w-full px-5 py-3 text-left text-sm font-bold hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0 first:rounded-t-2xl last:rounded-b-2xl"
              >
                {country}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PaymentOption = ({ label, active, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 group ${active ? 'border-blue-600 bg-blue-50 shadow-lg' : 'border-slate-100 bg-white hover:border-slate-200'
      }`}
  >
    <div className={`p-3 rounded-xl transition-all ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'}`}>{icon}</div>
    <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-blue-600' : 'text-slate-400'}`}>{label}</span>
  </button>
);

const PriceRow = ({ label, amount }) => (
  <div className="flex items-center justify-between text-sm font-bold text-slate-600">
    <span className="uppercase tracking-widest text-[10px] font-black text-slate-400">{label}</span>
    <span className="text-slate-900">PKR {amount.toLocaleString()}</span>
  </div>
);

const EditIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);

export default BookingPage;
