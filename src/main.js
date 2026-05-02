import L from 'leaflet';
import { createClient } from '@supabase/supabase-js';
import { createIcons, Plus, Share2, MapPin, Check, RefreshCcw, Search, User, Trash2 } from 'lucide';
import './style.css';

// --- CONFIGURATION ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// --- PRIVACY & COMMUNITY LOGIC ---
const urlParams = new URLSearchParams(window.location.search);
const communityId = urlParams.get('cid') || 'global';
const GRID_SIZE = 1.8; 

// --- INITIALIZE UI ---
const memberCountEl = document.getElementById('memberCount');
const joinBtn = document.getElementById('joinBtn');
const joinPanel = document.getElementById('joinPanel');
const closeSidebar = document.getElementById('closeSidebar');
const joinForm = document.getElementById('joinForm');
const nicknameInput = document.getElementById('nickname');
const selectionStatus = document.getElementById('selectionStatus');
const tabJoin = document.getElementById('tabJoin');
const tabSearch = document.getElementById('tabSearch');
const sectionJoin = document.getElementById('sectionJoin');
const sectionSearch = document.getElementById('sectionSearch');
const sectionProfile = document.getElementById('sectionProfile');
const driverList = document.getElementById('driverList');
const searchInput = document.getElementById('searchInput');
const backToList = document.getElementById('backToList');
const retireBtn = document.getElementById('retireBtn');

// Initialize Lucide Icons
const initIcons = () => {
  document.getElementById('joinIcon').setAttribute('data-lucide', 'plus');
  document.getElementById('mapPinIcon').setAttribute('data-lucide', 'map-pin');
  document.getElementById('userIcon').setAttribute('data-lucide', 'user');
  createIcons({
    icons: { Plus, Share2, MapPin, Check, RefreshCcw, Search, User, Trash2 }
  });
};
initIcons();

// --- MAP INITIALIZATION ---
const map = L.map('map', { zoomControl: false, attributionControl: false, minZoom: 3, worldCopyJump: true }).setView([20, 0], 3);
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

// --- DATA LAYER ---
let supabase = null;
let isDemoMode = true;
let markers = [];
let proposedLocation = null;
let proposedMarker = null;
let proposedCircle = null;
let tempHoverCircle = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  isDemoMode = false;
} else {
  markers = JSON.parse(localStorage.getItem(`f1_map_${communityId}`) || '[]');
}

const snapToGridCenter = (val) => Math.floor(val / GRID_SIZE) * GRID_SIZE + (GRID_SIZE / 2);

const updateRetireButton = () => {
  const enteredName = nicknameInput.value.trim();
  const storedName = localStorage.getItem('my_grid_nickname');
  
  // Use entered name if present, otherwise fallback to stored
  const targetName = enteredName || storedName;
  
  if (!targetName) {
    retireBtn.classList.add('hidden');
    return;
  }

  // Find the exact marker to get correct casing
  const marker = markers.find(m => m.name.toLowerCase() === targetName.toLowerCase());
  
  if (marker) {
    retireBtn.classList.remove('hidden');
    retireBtn.innerText = `Retire ${marker.name} from Grid`;
    retireBtn.dataset.target = marker.name;
  } else {
    // Only hide if we don't have a stored name to fallback to
    if (!enteredName && storedName) {
        const storedMarker = markers.find(m => m.name.toLowerCase() === storedName.toLowerCase());
        if (storedMarker) {
            retireBtn.classList.remove('hidden');
            retireBtn.innerText = `Retire ${storedMarker.name} from Grid`;
            retireBtn.dataset.target = storedMarker.name;
            return;
        }
    }
    retireBtn.classList.add('hidden');
  }
};

const showProfile = (driver) => {
  document.getElementById('profileName').innerText = driver.name;
  document.getElementById('profileDate').innerText = new Date(driver.timestamp).toLocaleDateString();
  sectionJoin.classList.add('hidden'); sectionSearch.classList.add('hidden'); sectionProfile.classList.remove('hidden');
  tabJoin.classList.remove('active'); tabSearch.classList.remove('active'); joinPanel.classList.add('active');
};

const clearMapLayers = () => {
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker || layer instanceof L.Circle) {
      if (layer !== proposedMarker && layer !== proposedCircle) map.removeLayer(layer);
    }
  });
};

const renderMarkers = (data) => {
  data.forEach(entry => {
    const circle = L.circle([entry.lat, entry.lng], { color: '#e10600', fillColor: '#e10600', fillOpacity: 0.1, radius: 100000, weight: 1 }).addTo(map);
    const markerIcon = L.divIcon({ className: 'f1-marker', iconSize: [12, 12], iconAnchor: [6, 6] });
    const marker = L.marker([entry.lat, entry.lng], { icon: markerIcon }).addTo(map);
    marker.on('click', (e) => { L.DomEvent.stopPropagation(e); showProfile(entry); });
    circle.on('click', (e) => { L.DomEvent.stopPropagation(e); showProfile(entry); });
  });
  const mode = isDemoMode ? 'OFFLINE' : 'LIVE';
  memberCountEl.innerText = `${data.length} DRIVERS ON GRID (${mode}: ${communityId.toUpperCase()})`;
  updateRetireButton(); // Re-check button state whenever grid updates
};

const fetchDrivers = async () => {
  if (isDemoMode) { clearMapLayers(); renderMarkers(markers); return; }
  try {
    const { data, error } = await supabase.from('drivers').select('*').eq('community_id', communityId);
    if (error) throw error;
    markers = data || [];
    clearMapLayers(); renderMarkers(markers);
  } catch (err) { console.error('[Race Control] Fetch Error:', err.message); }
};

const renderDriverList = (filter = '') => {
  driverList.innerHTML = '';
  const filtered = markers.filter(m => m.name.toLowerCase().includes(filter.toLowerCase())).sort((a, b) => b.timestamp - a.timestamp);
  if (filtered.length === 0) { driverList.innerHTML = '<div style="color: #444; text-align: center; margin-top: 2rem;">No drivers found</div>'; return; }
  filtered.forEach(m => {
    const item = document.createElement('div');
    item.className = 'driver-item';
    item.innerHTML = `<div class="driver-name">${m.name}</div><div class="driver-meta">Sector Verified</div>`;
    item.addEventListener('click', () => { showProfile(m); map.setView([m.lat, m.lng], 8); });
    driverList.appendChild(item);
  });
};

const lockToSector = (lat, lng) => {
  const sLat = snapToGridCenter(lat); const sLng = snapToGridCenter(lng);
  proposedLocation = { lat: sLat, lng: sLng };
  if (proposedMarker) proposedMarker.remove(); if (proposedCircle) proposedCircle.remove();
  proposedCircle = L.circle([sLat, sLng], { color: '#e10600', fillColor: '#e10600', fillOpacity: 0.2, radius: 100000, weight: 2, dashArray: '5, 5' }).addTo(map);
  const markerIcon = L.divIcon({ className: 'f1-marker-proposed', iconSize: [16, 16], iconAnchor: [8, 8] });
  proposedMarker = L.marker([sLat, sLng], { icon: markerIcon }).addTo(map);
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = false; submitBtn.innerText = 'Confirm Grid Position';
  selectionStatus.querySelector('span').innerText = 'Sector Locked - Ready to Join';
  map.setView([sLat, sLng], 7);
};

// --- ACTIONS ---
joinBtn.addEventListener('click', () => { tabJoin.click(); updateRetireButton(); joinPanel.classList.add('active'); map.getContainer().style.cursor = 'crosshair'; });
closeSidebar.addEventListener('click', () => { joinPanel.classList.remove('active'); clearProposed(); map.getContainer().style.cursor = ''; });
backToList.addEventListener('click', () => { tabSearch.click(); });

nicknameInput.addEventListener('input', () => {
  updateRetireButton();
});

document.getElementById('locateBtn').addEventListener('click', () => {
  const btn = document.getElementById('locateBtn'); btn.innerText = 'Detecting...';
  navigator.geolocation.getCurrentPosition(
    (pos) => { lockToSector(pos.coords.latitude, pos.coords.longitude); btn.innerText = 'Location Detected'; setTimeout(() => btn.innerText = 'Detect My Location', 2000); },
    (err) => { alert('Could not detect location. Please tap the map manually.'); btn.innerText = 'Detect My Location'; },
    { enableHighAccuracy: false, timeout: 5000 }
  );
});

retireBtn.addEventListener('click', async () => {
  const targetName = retireBtn.dataset.target;
  if (!targetName) return;
  if (confirm(`Retire from the race and remove ${targetName} from the grid?`)) {
    if (isDemoMode) {
      markers = markers.filter(m => m.name.toLowerCase() !== targetName.toLowerCase());
      localStorage.setItem(`f1_map_${communityId}`, JSON.stringify(markers));
    } else {
      const { error } = await supabase.from('drivers').delete().eq('name', targetName).eq('community_id', communityId);
      if (error) { alert('Race Control Error: Could not retire driver.'); return; }
    }
    
    if (localStorage.getItem('my_grid_nickname') === targetName) {
        localStorage.removeItem('my_grid_nickname');
    }
    
    await fetchDrivers();
    updateRetireButton();
    joinPanel.classList.remove('active');
    alert(`${targetName} has retired from the grid.`);
  }
});

const clearProposed = () => {
  if (proposedMarker) proposedMarker.remove(); if (proposedCircle) proposedCircle.remove();
  proposedLocation = null;
  const submitBtn = document.getElementById('submitBtn'); submitBtn.disabled = true; submitBtn.innerText = 'Select a Location First';
};

tabJoin.addEventListener('click', () => { tabJoin.classList.add('active'); tabSearch.classList.remove('active'); sectionJoin.classList.remove('hidden'); sectionSearch.classList.add('hidden'); sectionProfile.classList.add('hidden'); });
tabSearch.addEventListener('click', () => { tabSearch.classList.add('active'); tabJoin.classList.remove('active'); sectionSearch.classList.remove('hidden'); sectionJoin.classList.add('hidden'); sectionProfile.classList.add('hidden'); renderDriverList(); });
searchInput.addEventListener('input', (e) => { renderDriverList(e.target.value); });

map.on('click', (ev) => { if (!joinPanel.classList.contains('active') || !sectionJoin.offsetParent) return; lockToSector(ev.latlng.lat, ev.latlng.lng); });

map.on('mousemove', (ev) => {
  if (!joinPanel.classList.contains('active') || !sectionJoin.offsetParent) return;
  const lat = snapToGridCenter(ev.latlng.lat); const lng = snapToGridCenter(ev.latlng.lng);
  if (tempHoverCircle) tempHoverCircle.remove();
  tempHoverCircle = L.circle([lat, lng], { color: '#e10600', fillColor: '#e10600', fillOpacity: 0.05, radius: 100000, weight: 1, dashArray: '2, 2' }).addTo(map);
});

joinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!proposedLocation) return;
  const nickname = nicknameInput.value.trim();
  if (!nickname) return;
  
  // Fetch IP for spam prevention
  let userIp = '0.0.0.0';
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    userIp = data.ip;
  } catch (e) { console.warn('Could not fetch IP, using fallback'); }

  const newEntry = { 
    name: nickname, 
    lat: proposedLocation.lat, 
    lng: proposedLocation.lng, 
    timestamp: Date.now(), 
    community_id: communityId,
    ip_address: userIp
  };

  if (isDemoMode) {
    const idx = markers.findIndex(m => m.name.toLowerCase() === nickname.toLowerCase());
    if (idx > -1) markers[idx] = newEntry; else markers.push(newEntry);
    localStorage.setItem(`f1_map_${communityId}`, JSON.stringify(markers));
  } else {
    const { error } = await supabase.from('drivers').upsert(newEntry, { onConflict: 'name, community_id' });
    if (error) {
       const { data: ext } = await supabase.from('drivers').select('id').eq('name', nickname).eq('community_id', communityId).single();
       if (ext) await supabase.from('drivers').update(newEntry).eq('id', ext.id);
       else await supabase.from('drivers').insert(newEntry);
    }
  }
  
  localStorage.setItem('my_grid_nickname', nickname);
  await fetchDrivers();
  updateRetireButton();
  joinPanel.classList.remove('active'); clearProposed(); map.getContainer().style.cursor = ''; map.setView([newEntry.lat, newEntry.lng], 6);
});

const startLights = () => {
  const lights = [1, 2, 3, 4, 5].map(id => document.getElementById(`light${id}`));
  const loaderText = document.querySelector('.loader-text');
  let currentLight = 0;
  const interval = setInterval(() => {
    if (currentLight < 5) { lights[currentLight].classList.add('active'); currentLight++; }
    else {
      clearInterval(interval);
      const checkReadiness = async () => {
        if (map.getZoom() !== undefined && document.readyState === 'complete') {
          await fetchDrivers();
          if (!isDemoMode) { supabase.channel('drivers_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'drivers', filter: `community_id=eq.${communityId}` }, () => fetchDrivers()).subscribe(); }
          setTimeout(() => {
            lights.forEach(l => l.classList.remove('active')); loaderText.innerText = "LIGHTS OUT AND AWAY WE GO!"; loaderText.style.color = "#fff";
            setTimeout(() => {
              const app = document.getElementById('app'); document.getElementById('loader').classList.add('fade-out'); app.classList.remove('hidden');
              const inv = () => map.invalidateSize({ animate: false });
              inv(); setTimeout(inv, 200); setTimeout(inv, 500); setTimeout(inv, 1000); setTimeout(inv, 2000); 
            }, 500);
          }, 800);
        } else { setTimeout(checkReadiness, 100); }
      };
      checkReadiness();
    }
  }, 400);
};

document.addEventListener('DOMContentLoaded', startLights);
