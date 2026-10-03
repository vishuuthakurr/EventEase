import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Search, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

const CATEGORIES = ['All', 'Tech', 'Cultural', 'Workshop', 'Sports'];

export default function StudentCatalog({ events, onSelectEventToRegister, isLoading }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      const matchesCategory = selectedCategory === 'All' || evt.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        evt.title.toLowerCase().includes(q) ||
        evt.venue.toLowerCase().includes(q) ||
        evt.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [events, searchQuery, selectedCategory]);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-8 sm:p-12 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-8 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Campus Hackathon & Event Portal 2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Discover. Register. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-200">
              Check in with QR.
            </span>
          </h1>

          <p className="text-indigo-200/90 text-sm sm:text-base leading-relaxed">
            No more scattered Google Forms or paper checklists. Explore all upcoming college events, check real-time seat availability, and receive your instant digital QR pass.
          </p>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        
        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px] lg:min-w-[320px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by event title, venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-pulse">
              <div className="w-full h-44 bg-slate-200 rounded-xl"></div>
              <div className="h-5 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-100 rounded w-full"></div>
              <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No events matched your search</h3>
          <p className="text-xs sm:text-sm text-slate-500">Try choosing another category or clearing your search keywords.</p>
          <button
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(evt => {
            const isSoldOut = evt.seats_left === 0;
            const isLowSeats = evt.seats_left > 0 && evt.seats_left <= Math.max(5, Math.floor(evt.capacity * 0.25));

            return (
              <div 
                key={evt.id}
                className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Banner Thumbnail */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                  <img
                    src={evt.banner_url || `https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80`}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                  
                  {/* Category Chip */}
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-lg text-xs font-bold bg-white/90 backdrop-blur-md text-slate-800 shadow-sm">
                    {evt.category}
                  </span>

                  {/* Dynamic Seat Badge */}
                  <div className="absolute top-3 right-3">
                    {isSoldOut ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white shadow-md flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Sold Out</span>
                      </span>
                    ) : isLowSeats ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-white shadow-md animate-pulse flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>Only {evt.seats_left} left!</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-md flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{evt.seats_left} seats left</span>
                      </span>
                    )}
                  </div>

                  {/* Registered count bar */}
                  <div className="absolute bottom-2 left-3 right-3">
                    <div className="w-full bg-white/30 backdrop-blur-sm rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isSoldOut ? 'bg-rose-400' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min(100, (evt.registered_count / evt.capacity) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>

                  {/* Details metadata */}
                  <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      <span className="font-medium">{evt.date}</span>
                      <span className="text-slate-300">•</span>
                      <Clock className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      <span>{evt.time}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      <span className="truncate">{evt.venue}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Total Capacity: {evt.capacity}</span>
                      <span>Enrolled: {evt.registered_count}</span>
                    </div>
                  </div>

                  {/* Registration Action */}
                  <button
                    onClick={() => onSelectEventToRegister(evt)}
                    disabled={isSoldOut}
                    className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition-all ${
                      isSoldOut
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 active:scale-[0.98]'
                    }`}
                  >
                    <span>{isSoldOut ? 'Capacity Reached' : 'Register Now'}</span>
                    {!isSoldOut && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
