import React, { useMemo, useState, useEffect } from "react";
import TransportModelViewer from "./TransportModelViewer";
import "./TransportGallery.css";

type Category = "phones" | "aircraft";

type GalleryItem = {
  name: string;
  year: string;
  category: string;
  description: string;
};

const phoneItems: GalleryItem[] = [
  { name: "Motorola DynaTAC 8000X", year: "1983", category: "Vintage", description: "Early mobile phone" },
  { name: "Nokia 3310", year: "2000", category: "Classic", description: "Classic mobile phone" },
  { name: "BlackBerry 7230", year: "2003", category: "Classic", description: "Keyboard mobile phone" },
  { name: "Motorola RAZR V3", year: "2004", category: "Classic", description: "Flip mobile phone" },
  { name: "iPhone", year: "2007", category: "Smartphone", description: "Touchscreen smartphone" },
  { name: "Samsung Galaxy S", year: "2010", category: "Smartphone", description: "Android smartphone" },
  { name: "Nokia Lumia", year: "2011", category: "Smartphone", description: "Windows Phone" },
  { name: "Google Pixel", year: "2016", category: "Smartphone", description: "Google smartphone" },
  { name: "iPhone X", year: "2017", category: "Smartphone", description: "Modern iPhone design" },
  { name: "Samsung Galaxy Fold", year: "2019", category: "Foldable", description: "Foldable smartphone" },
  { name: "Galaxy Z Flip", year: "2020", category: "Foldable", description: "Flip smartphone" },
  { name: "Modern Smartphones", year: "2026", category: "Modern", description: "Modern phone collection" }
];

const aircraftItems: GalleryItem[] = [
  { name: "Wright Flyer", year: "1903", category: "Historic", description: "Early powered aircraft" },
  { name: "Douglas DC-3", year: "1935", category: "Passenger", description: "Historic transport aircraft" },
  { name: "Boeing 707", year: "1958", category: "Passenger", description: "Early jet airliner" },
  { name: "Concorde", year: "1976", category: "Supersonic", description: "Supersonic passenger aircraft" },
  { name: "Boeing 747", year: "1970", category: "Passenger", description: "Wide-body passenger aircraft" },
  { name: "Airbus A320", year: "1988", category: "Passenger", description: "Commercial passenger aircraft" },
  { name: "Boeing 777", year: "1995", category: "Passenger", description: "Long-range passenger aircraft" },
  { name: "Airbus A380", year: "2007", category: "Passenger", description: "Large passenger aircraft" },
  { name: "Boeing 787", year: "2011", category: "Passenger", description: "Modern passenger aircraft" },
  { name: "Cargo Aircraft", year: "Modern", category: "Cargo", description: "Air freight aircraft" },
  { name: "Private Aircraft", year: "Modern", category: "Private", description: "Private aviation aircraft" },
  { name: "Helicopters", year: "Modern", category: "Helicopter", description: "Rotary-wing aircraft" },
  { name: "Small Aircraft", year: "Modern", category: "Small", description: "Light aircraft" },
  { name: "Electric Aircraft", year: "2026", category: "Modern", description: "Electric aviation concept" },
  { name: "Modern Aircraft", year: "2026", category: "Modern", description: "Modern aircraft collection" }
];

function PhoneDrawing({ index }: { index: number }) {
  const colors = ["#152b48", "#263d57", "#111827", "#263b70", "#202a3a"];
  const body = colors[index % colors.length];
  const old = index < 4;
  const flip = index === 3 || index === 9 || index === 10;

  return (
    <svg viewBox="0 0 180 150" role="img" aria-label="Custom illustrated mobile phone">
      <defs>
        <linearGradient id="phoneBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#80dfff" />
          <stop offset=".35" stopColor={body} />
          <stop offset="1" stopColor="#07101f" />
        </linearGradient>
        <linearGradient id="phoneScreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#49d9ff" />
          <stop offset="1" stopColor="#124b9a" />
        </linearGradient>
        <filter id="phoneGlow">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <ellipse cx="90" cy="133" rx="42" ry="7" fill="#20aaff" opacity=".2" />
      <rect x="48" y="12" width="84" height="126" rx="15" fill="#23baff" opacity=".25" filter="url(#phoneGlow)" />
      {flip ? (
        <>
          <rect x="51" y="9" width="78" height="63" rx="11" fill="url(#phoneBody)" stroke="#a8eaff" strokeWidth="2" />
          <rect x="57" y="15" width="66" height="50" rx="7" fill="url(#phoneScreen)" />
          <path d="M57 48 Q85 20 123 42 L123 65 L57 65Z" fill="#a4efff" opacity=".2" />
          <path d="M55 74 H125" stroke="#8beaff" strokeWidth="4" />
          <rect x="51" y="78" width="78" height="62" rx="11" fill="url(#phoneBody)" stroke="#a8eaff" strokeWidth="2" />
          <rect x="57" y="84" width="66" height="48" rx="7" fill="#102c4d" />
          <circle cx="90" cy="108" r="9" fill="none" stroke="#59dfff" strokeWidth="2" />
        </>
      ) : (
        <>
          <rect x={old ? 58 : 49} y="7" width={old ? 64 : 82} height="136" rx={old ? 13 : 16} fill="url(#phoneBody)" stroke="#9ceaff" strokeWidth="2" />
          <rect x={old ? 64 : 55} y={old ? 24 : 16} width={old ? 52 : 70} height={old ? 82 : 111} rx="5" fill="url(#phoneScreen)" />
          <path d="M57 91 Q86 49 125 76 L125 124 L57 124Z" fill="#d0f6ff" opacity=".15" />
          {old ? (
            <g fill="#d8f5ff">
              <rect x="69" y="112" width="42" height="3" rx="1" />
              <circle cx="90" cy="130" r="5" fill="none" stroke="#a9edff" strokeWidth="2" />
            </g>
          ) : (
            <>
              <circle cx="90" cy="9" r="2" fill="#a7eaff" />
              <circle cx="90" cy="132" r="3" fill="#9ceaff" />
              <path d="M65 33 H112" stroke="#fff" strokeWidth="2" opacity=".35" />
            </>
          )}
        </>
      )}
      <path d="M72 18 L82 18" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

function AircraftDrawing({ index }: { index: number }) {
  const isVintage = index === 0 || index === 1;
  const isConcorde = index === 3;
  const isHelicopter = index === 11;

  return (
    <svg viewBox="0 0 220 150" role="img" aria-label="Custom illustrated aircraft">
      <defs>
        <linearGradient id="planeBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".48" stopColor="#a9d9f7" />
          <stop offset="1" stopColor="#3879b5" />
        </linearGradient>
        <linearGradient id="planeWing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#53d9ff" />
          <stop offset="1" stopColor="#14528e" />
        </linearGradient>
        <filter id="planeGlow">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <ellipse cx="110" cy="119" rx="78" ry="8" fill="#1aaaff" opacity=".2" filter="url(#planeGlow)" />
      {isHelicopter ? (
        <g strokeLinecap="round" strokeLinejoin="round">
          <path d="M42 42 H179" stroke="#8ceaff" strokeWidth="4" />
          <path d="M110 43 V59" stroke="#8ceaff" strokeWidth="3" />
          <path d="M52 79 Q58 57 88 57 H139 Q156 57 163 75 L149 91 H77 Q57 91 52 79Z" fill="url(#planeBody)" stroke="#a8eaff" strokeWidth="2" />
          <path d="M92 61 H127 L140 78 H92Z" fill="#164c77" stroke="#72dcff" strokeWidth="2" />
          <path d="M55 77 L25 90 L19 86 L45 69" fill="#4ca8db" stroke="#a8eaff" strokeWidth="2" />
          <path d="M70 94 L62 108 M145 94 L153 108 M55 108 H160" stroke="#b6efff" strokeWidth="3" />
          <path d="M109 58 V43" stroke="#b6efff" strokeWidth="3" />
        </g>
      ) : (
        <g strokeLinejoin="round">
          <path d={isVintage
            ? "M18 80 L90 70 L155 75 L195 84 L155 93 L90 94Z"
            : isConcorde
            ? "M15 81 L84 72 L195 78 L84 88Z"
            : "M14 80 Q25 72 57 72 L177 76 Q197 78 207 82 Q193 91 165 92 L57 91 Q26 90 14 80Z"}
            fill="url(#planeBody)" stroke="#a8eaff" strokeWidth="2" />
          <path d={isConcorde
            ? "M96 77 L145 22 L158 22 L132 82 L155 115 L142 115 L91 88Z"
            : "M91 78 L133 24 L154 24 L132 81 L165 119 L143 119 L85 90Z"}
            fill="url(#planeWing)" stroke="#8ceaff" strokeWidth="2" />
          <path d="M31 77 L53 48 L67 48 L61 82 L73 107 L59 107 L40 90Z"
            fill="#367eaf" stroke="#a8eaff" strokeWidth="2" />
          <path d="M174 77 L190 66 L197 67 L193 83" fill="#67c9f1" stroke="#b9f2ff" strokeWidth="2" />
          <path d="M25 80 Q110 74 195 83" stroke="#fff" strokeWidth="2" fill="none" opacity=".6" />
          {!isVintage && (
            <g fill="#164c77" stroke="#9beaff" strokeWidth="1">
              <circle cx="75" cy="81" r="2" />
              <circle cx="88" cy="81" r="2" />
              <circle cx="101" cy="81" r="2" />
              <circle cx="114" cy="81" r="2" />
              <circle cx="127" cy="81" r="2" />
              <circle cx="140" cy="81" r="2" />
            </g>
          )}
        </g>
      )}
    </svg>
  );
}

type Props = {
  initialTab?: Category;
  onSelect?: (type: Category, item: GalleryItem) => void;
};

export default function TransportGallery({ initialTab = "phones", onSelect }: Props) {
  const [tab, setTab] = useState<Category>(initialTab);

  useEffect(() => {
    setTab(initialTab);
    setFilter("All");
    setSearch("");
    setSelected(null);
  }, [initialTab]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  const items = tab === "phones" ? phoneItems : aircraftItems;

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map(item => item.category)))],
    [items]
  );

  const filtered = items.filter(item => {
    const text = `${item.name} ${item.year} ${item.category}`.toLowerCase();
    return text.includes(search.toLowerCase()) &&
      (filter === "All" || item.category === filter);
  });

  function changeTab(next: Category) {
    setTab(next);
    setFilter("All");
    setSearch("");
  }

  return (
    <section className="transport-gallery">
      <header className="tg-header">
        <div className="tg-logo">K</div>
        <div>
          <h2>KHOEM-AI Gallery</h2>
          <p>Explore the past, present and future</p>
        </div>
      </header>

      <div className="tg-tabs">
        <button className={tab === "phones" ? "active" : ""} onClick={() => changeTab("phones")}>
          Phone Gallery
        </button>
        <button className={tab === "aircraft" ? "active" : ""} onClick={() => changeTab("aircraft")}>
          Aircraft Gallery
        </button>
      </div>

      <label className="tg-search">
        <span>⌕</span>
        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder={tab === "phones" ? "Search phone models..." : "Search aircraft..."}
        />
      </label>

      <div className="tg-filters">
        {categories.map(category => (
          <button
            key={category}
            className={filter === category ? "selected" : ""}
            onClick={() => setFilter(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="tg-heading">
        <h3>{tab === "phones" ? "Mobile Phones" : "Aircraft Collection"}</h3>
        <span>{filtered.length} models</span>
      </div>

      <div className="tg-grid">
        {filtered.map(item => {
          const index = items.indexOf(item);
          return (
            <button
              className="tg-card"
              key={item.name}
              onClick={() => { setSelected(item); onSelect?.(tab, item); }}
            >
              <div className="tg-image">
                {tab === "phones"
                  ? <PhoneDrawing index={index} />
                  : <AircraftDrawing index={index} />}
              </div>
              <strong>{item.name}</strong>
              <small>{item.year} · {item.category}</small>
              <span className="tg-description">{item.description}</span>
              <span className="tg-view">VIEW DETAILS →</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="tg-empty">No models found. Try another search.</div>
      )}

      <footer className="tg-footer">
        KHOEM-AI · CUSTOM SVG MODEL COLLECTION
      </footer>

      {selected && (
        <div className="tg-modal" role="dialog" aria-modal="true">
          <div className="tg-modal-bar">
            <span>3D MODEL VIEWER</span>
            <button type="button" onClick={() => setSelected(null)}>
              CLOSE ✕
            </button>
          </div>
          <div className="tg-modal-content">
            <TransportModelViewer
              type={tab}
              name={selected.name}
            />
            <p className="tm-description">
              {selected.year} · {selected.category} · {selected.description}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
