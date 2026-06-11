import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { createRestaurantApplication } from "../api/restaurants";
import locationsData from "../data/egypt-locations.json";

/* ─── Leaflet icon fix ─────────────────────────────────── */
const redPin = L.divIcon({
  className: "",
  html: `<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="#E53E3E"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
    <circle cx="14" cy="14" r="3" fill="#E53E3E"/>
  </svg>`,
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -40],
});

/* ─── Inner map helpers ─────────────────────────────────── */
function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], 15, { duration: 1.2 }); }, [lat, lng, map]);
  return null;
}

function ClickToPlace({ onPlace }: { onPlace: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPlace(e.latlng.lat, e.latlng.lng) });
  return null;
}

/* ─── Data types ────────────────────────────────────────── */
type Area = { name: string; lat: number; lng: number };
type City = { id: string; name: string; lat: number; lng: number; areas: Area[] };
const cities: City[] = locationsData.cities;

/* ═══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Step 1 – business info */
  const [form, setForm] = useState({
    kitchenName:   "",
    firstName:     "",
    lastName:      "",
    companyEmail:  "",
    ownerEmail:    "",
    restaurantType:"",
    branch:        "1",
    ownerMobile:   "",
    companyMobile: "",
    description:   "",
  });

  /* Step 2 – address + pin */
  const [address, setAddress] = useState({
    buildingName: "",
    street:       "",
    streetNumber: "",
    city:         "",
    area:         "",
    lat:          30.0444,
    lng:          31.2357,
    wantsUpdates: true,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const selectedCity = cities.find((c) => c.name === address.city);
  const selectedArea = selectedCity?.areas.find((a) => a.name === address.area);

  /* ─── Handlers ──────────────────────────────────────────── */
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddressChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const extra: Partial<typeof address> = {};

    if (name === "city") {
      extra.area = "";
      const c = cities.find((x) => x.name === value);
      if (c) { extra.lat = c.lat; extra.lng = c.lng; }
    } else if (name === "area") {
      const a = selectedCity?.areas.find((x) => x.name === value);
      if (a) { extra.lat = a.lat; extra.lng = a.lng; }
    }

    setAddress((prev) => ({ ...prev, [name]: value, ...extra }));
  };

  const pinMoved = (lat: number, lng: number) =>
    setAddress((prev) => ({ ...prev, lat, lng }));

  /* ─── Step navigation ───────────────────────────────────── */
  const handleStep1Next = () => {
    if (!form.kitchenName || !form.firstName || !form.companyEmail ||
        !form.ownerEmail  || !form.ownerMobile) {
      setError("Please fill in all required fields.");
      return;
    }
    setError(null);
    setStep(2);
  };

  /* ─── Submit ────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!address.buildingName || !address.city) {
      setError("Please fill in all required fields.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await createRestaurantApplication({
        brandName:           form.kitchenName,
        ownerFirstName:      form.firstName,
        ownerLastName:       form.lastName,
        companyEmail:        form.companyEmail,
        OwnerEmail:          form.ownerEmail,
        ownerMobileNumber:   form.ownerMobile,
        companyMobileNumber: form.companyMobile || form.ownerMobile,
        restaurantType:      form.restaurantType || "official",
        branchCount:         parseInt(form.branch) || 1,
        description:         form.description || `${form.kitchenName} restaurant application`,
        mainBranchAddress: {
          city:         address.city,
          area:         address.area || address.city,
          streetName:   address.street || address.buildingName,
          streetNumber: address.streetNumber || "1",
          latitude:     address.lat,
          longitude:    address.lng,
        },
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col font-inter">

      {/* ── Header — exact Slyce-Frontend CSS ── */}
      <div
        id="nav"
        className="z-10 flex w-full items-center justify-between bg-[#FFFAF0] px-4 md:px-68 py-8 font-inter text-base text-[#4CB050]"
      >
        <div id="logo" className="flex items-center text-lg font-medium tracking-tight text-[#4CB050]">
          <img src="/greenLogo.png" alt="" className="w-[52px] h-[52px] object-contain" />
          <p className="hidden md:block">for Merchant</p>
        </div>

        <ul id="nav-links" className="hidden space-x-11 text-base font-semibold md:flex text-[#4CB050]">
          <li><a href="#" className="transition-all duration-150 hover:border-b hover:border-[#4CB050]">Pricing</a></li>
          <li><a href="#" className="transition-all duration-150 hover:border-b hover:border-[#4CB050]">Business Types</a></li>
          <li><a href="#" className="transition-all duration-150 hover:border-b hover:border-[#4CB050]">Questions</a></li>
          <li><a href="#" className="transition-all duration-150 hover:border-b hover:border-[#4CB050]">Contact</a></li>
        </ul>

        <div id="buttons" className="flex h-10 items-center space-x-5 font-bold">
          <button className="flex h-full items-center justify-around gap-3 rounded-full border border-[#4CB050] px-1 py-1">
            <svg width="28px" height="28px" viewBox="0 0 73.768 73.768" xmlns="http://www.w3.org/2000/svg" fill="#4CB050">
              <path d="M117.606,385.2a36.884,36.884,0,1,0,36.884,36.884A36.926,36.926,0,0,0,117.606,385.2Zm33.846,35.383H136.366a48.681,48.681,0,0,0-3.047-16.068,36.786,36.786,0,0,0,8.781-5.808A33.752,33.752,0,0,1,151.452,420.586Zm-32.346-31.072a36.534,36.534,0,0,1,6.069,6.387,39.467,39.467,0,0,1,4.176,7.028,33.843,33.843,0,0,1-10.245,2.061Zm3.534-.935a33.762,33.762,0,0,1,17.292,8.051,33.809,33.809,0,0,1-7.772,5.116A41.252,41.252,0,0,0,122.64,388.579ZM110.19,395.9a36.615,36.615,0,0,1,5.916-6.261v15.35a33.789,33.789,0,0,1-10.116-2.013A39.5,39.5,0,0,1,110.19,395.9Zm-7.013,5.906a33.8,33.8,0,0,1-7.9-5.177,33.757,33.757,0,0,1,17.469-8.074A41.244,41.244,0,0,0,103.177,401.807Zm12.929,6.183v12.6H102a45.607,45.607,0,0,1,2.835-14.838A36.83,36.83,0,0,0,116.106,407.99Zm0,15.6v12.386a36.8,36.8,0,0,0-11.018,2.146A42.373,42.373,0,0,1,102,423.587Zm0,15.386v15.252a47.106,47.106,0,0,1-9.792-13.361A33.819,33.819,0,0,1,116.106,438.973Zm-2.86,16.708a33.755,33.755,0,0,1-18.084-8.24,33.786,33.786,0,0,1,8.306-5.426A48.955,48.955,0,0,0,113.246,455.681Zm5.86-1.313v-15.4a33.8,33.8,0,0,1,9.922,1.94A47.081,47.081,0,0,1,119.106,454.368Zm12.762-12.294a33.846,33.846,0,0,1,8.182,5.367,33.759,33.759,0,0,1-17.909,8.217A48.888,48.888,0,0,0,131.868,442.074Zm-12.762-6.1V423.587h14.257a42.352,42.352,0,0,1-3.106,14.582A36.818,36.818,0,0,0,119.106,435.973Zm0-15.386v-12.6a36.806,36.806,0,0,0,11.4-2.291,45.562,45.562,0,0,1,2.854,14.888ZM93.112,398.711a36.8,36.8,0,0,0,8.91,5.871A48.7,48.7,0,0,0,99,420.587H83.76A33.757,33.757,0,0,1,93.112,398.711ZM83.76,423.587H99a45.675,45.675,0,0,0,3.256,15.683A36.807,36.807,0,0,0,93,445.35,33.755,33.755,0,0,1,83.76,423.587Zm58.447,21.764a36.8,36.8,0,0,0-9.122-6.022,45.69,45.69,0,0,0,3.279-15.742h15.088A33.759,33.759,0,0,1,142.207,445.351Z" transform="translate(-80.722 -385.203)" />
            </svg>
            <p className="pr-3 text-2xl">EN</p>
          </button>
          <Link to="/login" className="h-full rounded-full flex items-center bg-[#4CB050] px-7 py-3 text-white">
            Login
          </Link>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-[#4CB050] p-2">
            {mobileOpen ? <span>x</span> : <span>=</span>}
          </button>
        </div>

        {/* Mobile sidebar */}
        <div className={`fixed top-0 right-0 h-screen w-64 bg-white shadow-lg transform ${mobileOpen ? "translate-x-0" : "translate-x-full"} transition-transform duration-300 ease-in-out md:hidden z-50`}>
          <ul className="flex flex-col p-6 space-y-6">
            <li><a href="#" className="text-lg font-semibold" onClick={() => setMobileOpen(false)}>Pricing</a></li>
            <li><a href="#" className="text-lg font-semibold" onClick={() => setMobileOpen(false)}>Business Types</a></li>
            <li><a href="#" className="text-lg font-semibold" onClick={() => setMobileOpen(false)}>Questions</a></li>
            <li><a href="#" className="text-lg font-semibold" onClick={() => setMobileOpen(false)}>Contact</a></li>
          </ul>
        </div>
      </div>

      {/* ── Hero + Form ── */}
      <div className="relative w-full -mt-2 z-0">
        <img src="/images/landingpage.png" alt="Landing" className="w-full object-cover min-h-[900px]" />

        {/* Form card */}
        <div className="absolute top-6 left-[5%] md:top-10 md:left-[10%] w-[90%] md:w-[450px] flex flex-col gap-4 rounded-3xl border border-[#D9D9D9] bg-white px-5 pt-8 pb-8 shadow-sm z-20 overflow-hidden">

          {/* ── Success ── */}
          {success ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-[#4CB050]/10 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4CB050" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-base font-semibold text-[#333333]">Application submitted!</p>
              <p className="text-sm text-[#9A9A9A] mt-1">Redirecting to login…</p>
            </div>

          /* ── Step 1: Business info ── */
          ) : step === 1 ? (
            <>
              <div className="flex flex-col gap-3 text-[#333333]">
                <p className="text-2xl font-bold leading-snug">Enjoy 10% commission<br />on first month!</p>
                <p className="text-sm font-light text-black">
                  Partner with Slyce to help drive growth and take your business to the next level.
                </p>
              </div>

              <div className="flex flex-col gap-3 text-sm">
                {error && <p className="text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">{error}</p>}

                <input name="kitchenName" value={form.kitchenName} onChange={handleFormChange}
                  placeholder="Kitchen name *"
                  className="rounded-lg border border-[#E8E8E8] bg-[#F7F7F7] px-3 py-3 outline-none focus:border-black" />

                <div className="flex gap-3">
                  <input name="firstName" value={form.firstName} onChange={handleFormChange}
                    placeholder="First name *"
                    className="flex-1 rounded-lg border border-[#E8E8E8] bg-[#F7F7F7] px-3 py-3 outline-none focus:border-black" />
                  <input name="lastName" value={form.lastName} onChange={handleFormChange}
                    placeholder="Last name"
                    className="w-[47%] rounded-lg border border-[#E8E8E8] bg-[#F7F7F7] px-3 py-3 outline-none focus:border-black" />
                </div>

                <input name="companyEmail" type="email" value={form.companyEmail} onChange={handleFormChange}
                  placeholder="Company email *"
                  className="rounded-lg border border-[#E8E8E8] bg-[#F7F7F7] px-3 py-3 outline-none focus:border-black" />
                <input name="ownerEmail" type="email" value={form.ownerEmail} onChange={handleFormChange}
                  placeholder="Owner email *"
                  className="rounded-lg border border-[#E8E8E8] bg-[#F7F7F7] px-3 py-3 outline-none focus:border-black" />

                <div className="relative">
                  <select name="restaurantType" value={form.restaurantType} onChange={handleFormChange}
                    className="w-full rounded-lg border border-[#E8E8E8] bg-[#F7F7F7] px-3 py-3 outline-none focus:border-black appearance-none">
                    <option value="" disabled>Restaurant Type</option>
                    <option value="official">Official Brand</option>
                    <option value="Homekitchen">Home Kitchen</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9A9A] pointer-events-none" />
                </div>

                <input name="branch" type="number" value={form.branch} onChange={handleFormChange}
                  placeholder="Branch count"
                  className="rounded-lg border border-[#E8E8E8] bg-[#F7F7F7] px-3 py-3 outline-none focus:border-black" />

                <input name="ownerMobile" type="tel" value={form.ownerMobile} onChange={handleFormChange}
                  placeholder="Owner mobile *"
                  className="rounded-lg border border-[#E8E8E8] bg-[#F7F7F7] px-3 py-3 outline-none focus:border-black" />
                <input name="companyMobile" type="tel" value={form.companyMobile} onChange={handleFormChange}
                  placeholder="Company mobile"
                  className="rounded-lg border border-[#E8E8E8] bg-[#F7F7F7] px-3 py-3 outline-none focus:border-black" />

                <textarea name="description" value={form.description} onChange={handleFormChange}
                  placeholder="Description (e.g. Meal Plans Tailored Just for You!)"
                  rows={2}
                  className="rounded-lg border border-[#E8E8E8] bg-[#F7F7F7] px-3 py-3 outline-none focus:border-black resize-none text-sm" />
              </div>

              <button type="button" onClick={handleStep1Next}
                className="font-bold rounded-lg bg-[#4CB050] px-3 py-3 text-white transition hover:bg-[#43a046]">
                Next →
              </button>
            </>

          /* ── Step 2: Address + interactive map ── */
          ) : (
            <>
              <div className="flex flex-col gap-1 text-[#333333]">
                <p className="text-xl font-bold">Where is your restaurant?</p>
                <p className="text-xs text-[#9A9A9A]">
                  Select city &amp; area, then drag the pin or tap the map to set the exact location.
                </p>
              </div>

              <div className="flex flex-col gap-3 text-sm">
                {error && <p className="text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">{error}</p>}

                <input name="buildingName" value={address.buildingName} onChange={handleAddressChange}
                  placeholder="Building or Place Name *"
                  className="rounded-lg border border-[#E8E8E8] bg-[#F7F7F7] px-3 py-3 outline-none focus:border-black" />

                <div className="flex gap-3">
                  <input name="street" value={address.street} onChange={handleAddressChange}
                    placeholder="Street"
                    className="flex-1 rounded-lg border border-[#E8E8E8] bg-[#F7F7F7] px-3 py-3 outline-none focus:border-black" />
                  <input name="streetNumber" value={address.streetNumber} onChange={handleAddressChange}
                    placeholder="Street numb..."
                    className="w-[120px] rounded-lg border border-[#E8E8E8] bg-[#F7F7F7] px-3 py-3 outline-none focus:border-black" />
                </div>

                <div className="relative">
                  <select name="city" value={address.city} onChange={handleAddressChange}
                    className="w-full rounded-lg border border-[#E8E8E8] bg-[#F7F7F7] px-3 py-3 outline-none focus:border-black appearance-none">
                    <option value="" disabled>City *</option>
                    {cities.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9A9A] pointer-events-none" />
                </div>

                <div className="relative">
                  <select name="area" value={address.area} onChange={handleAddressChange}
                    disabled={!selectedCity}
                    className="w-full rounded-lg border border-[#E8E8E8] bg-[#F7F7F7] px-3 py-3 outline-none focus:border-black appearance-none disabled:opacity-50">
                    <option value="">Area</option>
                    {selectedCity?.areas.map((a) => (
                      <option key={a.name} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9A9A] pointer-events-none" />
                </div>

                {/* ── Interactive map ── */}
                <div className="rounded-xl overflow-hidden border border-[#E8E8E8]" style={{ height: 200 }}>
                  <MapContainer
                    center={[address.lat, address.lng]}
                    zoom={15}
                    style={{ width: "100%", height: "100%" }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <FlyTo lat={address.lat} lng={address.lng} />
                    <ClickToPlace onPlace={pinMoved} />
                    <Marker
                      position={[address.lat, address.lng]}
                      icon={redPin}
                      draggable
                      eventHandlers={{
                        dragend(e) {
                          const pos = (e.target as L.Marker).getLatLng();
                          pinMoved(pos.lat, pos.lng);
                        },
                      }}
                    />
                  </MapContainer>
                </div>

                {/* Coordinates badge */}
                <div className="flex items-center gap-1.5 text-xs text-[#9A9A9A] bg-[#F7F7F7] rounded-lg px-3 py-2">
                  <MapPin size={12} className="text-red-500 shrink-0" />
                  <span>
                    {address.lat.toFixed(6)}, {address.lng.toFixed(6)}
                    {(selectedArea ?? selectedCity)
                      ? ` — ${selectedArea?.name ?? selectedCity?.name}`
                      : " — drag the pin to your exact location"}
                  </span>
                </div>

                {/* Newsletter checkbox */}
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <div className="relative mt-0.5 shrink-0">
                    <input type="checkbox" checked={address.wantsUpdates}
                      onChange={(e) => setAddress({ ...address, wantsUpdates: e.target.checked })}
                      className="sr-only" />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${address.wantsUpdates ? "bg-[#4CB050] border-[#4CB050]" : "border-[#D9D9D9] bg-white"}`}>
                      {address.wantsUpdates && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-[#333333]">
                    I'd like to get updates &amp; promotions by Slyce
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => { setStep(1); setError(null); }}
                  className="flex-1 rounded-lg border border-[#E8E8E8] px-3 py-3 text-[#333333] text-sm hover:bg-gray-50 transition-colors">
                  ← Back
                </button>
                <button type="button" onClick={handleSubmit} disabled={loading}
                  className="flex-[2] font-bold rounded-lg bg-[#4CB050] px-3 py-3 text-white hover:bg-[#43a046] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {loading ? "Submitting…" : "Get Started"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <section className="flex justify-center items-center py-24 bg-[#FFFAF0]">
        <div className="text-[#333333] flex flex-col items-center text-center px-8">
          <h1 className="text-2xl md:text-5xl font-bold">
            Fuel more goals, grow your <span className="text-[#4CB050]">profits</span>
          </h1>
          <p className="text-sm md:text-base font-semibold mt-3 max-w-md">
            Your gateway to customers who value nutrition, fitness, and hassle-free meal subscriptions.
          </p>
        </div>
      </section>
    </div>
  );
}
