export type IndustryGroup =
  | 'Health and Wellness'
  | 'Home and Local Services'
  | 'Professional Services'
  | 'Retail and Ecommerce'
  | 'Food and Hospitality'
  | 'Logistics and Transport'
  | 'Automotive'
  | 'Education and Training'
  | 'Media and Creative'
  | 'Events and Entertainment'
  | 'Construction and Trades'
  | 'Technology and SaaS'
  | 'Nonprofit and Public'
  | 'Other';

export interface IndustryCategory {
  group: IndustryGroup;
  types: string[];
  description?: string;
}

export const INDUSTRY_CATEGORIES: IndustryCategory[] = [
  {
    group: 'Health and Wellness',
    types: [
      'General',
      'Medical Practice',
      'Dental Practice',
      'Optometry',
      'Physiotherapy',
      'Chiropractic',
      'Mental Health Therapy',
      'Veterinary',
      'Beauty and Aesthetics',
      'Fitness and Personal Training'
    ]
  },
  {
    group: 'Home and Local Services',
    types: [
      'General',
      'Plumbing',
      'Electrical',
      'HVAC',
      'Cleaning Services',
      'Landscaping',
      'Pest Control',
      'Moving Services',
      'Security Services'
    ]
  },
  {
    group: 'Professional Services',
    types: [
      'General',
      'Accounting and Bookkeeping',
      'Legal Services',
      'Consulting',
      'Marketing and Advertising',
      'Design and Branding',
      'IT Services and Support',
      'Real Estate Services',
      'Insurance Services',
      'HR and Recruitment'
    ]
  },
  {
    group: 'Retail and Ecommerce',
    types: [
      'General',
      'Retail Store',
      'Ecommerce Store',
      'Fashion and Apparel',
      'Electronics Retail',
      'Beauty Retail',
      'Grocery',
      'Pet Supplies'
    ]
  },
  {
    group: 'Food and Hospitality',
    types: [
      'General',
      'Restaurant',
      'Cafe',
      'Takeaway',
      'Catering',
      'Bakery',
      'Hotel and Accommodation',
      'Events Venue'
    ]
  },
  {
    group: 'Logistics and Transport',
    types: [
      'General',
      'Logistics and Freight',
      'Courier and Delivery',
      'Warehousing',
      'Fleet Services',
      'Travel Services'
    ]
  },
  {
    group: 'Automotive',
    types: [
      'General',
      'Auto Repair',
      'Auto Detailing',
      'Towing',
      'Tire Services'
    ]
  },
  {
    group: 'Education and Training',
    types: [
      'General',
      'Tutoring',
      'Online Courses',
      'Corporate Training',
      'Driving School',
      'Language School'
    ]
  },
  {
    group: 'Media and Creative',
    types: [
      'General',
      'Photography',
      'Videography',
      'Content Creation',
      'Podcasting',
      'Animation',
      'Social Media Management'
    ]
  },
  {
    group: 'Events and Entertainment',
    types: [
      'General',
      'Event Planning',
      'Wedding Services',
      'DJ and Entertainment',
      'Party Rentals',
      'Decor and Styling'
    ]
  },
  {
    group: 'Construction and Trades',
    types: [
      'General',
      'Construction and Renovation',
      'Carpentry',
      'Painting and Decorating',
      'Roofing',
      'Fabrication and Welding'
    ]
  },
  {
    group: 'Technology and SaaS',
    types: [
      'General',
      'SaaS',
      'Mobile App',
      'AI Services',
      'Hardware and IoT',
      'Cybersecurity'
    ]
  },
  {
    group: 'Nonprofit and Public',
    types: [
      'General',
      'Nonprofit',
      'Community Services',
      'Government Contractor'
    ]
  },
  {
    group: 'Other',
    types: ['Other']
  }
];

export function getIndustryTypes(group: IndustryGroup): string[] {
  const category = INDUSTRY_CATEGORIES.find(cat => cat.group === group);
  return category ? category.types : ['General'];
}

export function getIndustryGroupLabel(group: IndustryGroup): string {
  return group;
}

export function validateIndustrySelection(group: string, type?: string): boolean {
  const category = INDUSTRY_CATEGORIES.find(cat => cat.group === group);

  if (!category) return false;

  if (type && !category.types.includes(type)) return false;

  return true;
}

export function getIndustryContext(business: { industry_group?: string; industry_type?: string }): string {
  if (!business.industry_group) return 'General Business';

  if (business.industry_type && business.industry_type !== 'General') {
    return business.industry_type;
  }

  return business.industry_group;
}

export function getAllIndustryGroups(): IndustryGroup[] {
  return INDUSTRY_CATEGORIES.map(cat => cat.group);
}
