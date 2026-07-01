export interface User {
  id_user: number;
  nom: string;
  prenom: string;
  email: string;
  roles: { role: { name: string } }[];
}

export interface Company {
  id_company: number;
  company_name: string;
  sector?: string;
  description?: string;
  website?: string;
  logo_url?: string;
  address?: string;
  is_verified: boolean;
}

export interface Offer {
  id_offer: number;
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  salary?: number;
  deadline?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  company: {
    company_name: string;
    logo_url?: string;
    sector?: string;
  };
  categories: { category: { id_category: number; name: string } }[];
}

export interface Application {
  id_application: number;
  motivation?: string;
  status: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE';
  applied_at: string;
  offer: {
    id_offer: number;
    title: string;
    company: { company_name: string };
  };
}