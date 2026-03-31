import { useState } from 'react';
import { Search, Building2, Home, Briefcase, ShoppingBag, UtensilsCrossed, Truck, Car, GraduationCap, Camera, PartyPopper, HardHat, Laptop, Heart, Box } from 'lucide-react';
import { INDUSTRY_CATEGORIES, IndustryGroup } from '../lib/industryData';

interface IndustryGroupSelectorProps {
  selectedGroup: IndustryGroup | null;
  onSelect: (group: IndustryGroup) => void;
}

const INDUSTRY_ICONS: Record<IndustryGroup, typeof Building2> = {
  'Health and Wellness': Heart,
  'Home and Local Services': Home,
  'Professional Services': Briefcase,
  'Retail and Ecommerce': ShoppingBag,
  'Food and Hospitality': UtensilsCrossed,
  'Logistics and Transport': Truck,
  'Automotive': Car,
  'Education and Training': GraduationCap,
  'Media and Creative': Camera,
  'Events and Entertainment': PartyPopper,
  'Construction and Trades': HardHat,
  'Technology and SaaS': Laptop,
  'Nonprofit and Public': Building2,
  'Other': Box
};

export function IndustryGroupSelector({ selectedGroup, onSelect }: IndustryGroupSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGroups = INDUSTRY_CATEGORIES.filter(cat =>
    cat.group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search industries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredGroups.map((category) => {
            const Icon = INDUSTRY_ICONS[category.group];
            const isSelected = selectedGroup === category.group;

            return (
              <button
                key={category.group}
                onClick={() => onSelect(category.group)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50'
                }`}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-orange-500' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} strokeWidth={2} />
                  </div>
                  <span className={`text-sm font-semibold ${
                    isSelected ? 'text-orange-900' : 'text-gray-900'
                  }`}>
                    {category.group}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
