export interface BusinessOwner{
  id: string;
  name: string;
  email: string;
  business_name?: string | null;
  address?: string | null;
  state?: string | null;
  city?: string | null;
  code?: string | null;
  contactNumber?: string | null;
  detail?: string | null;
  logoFileInput?:string | null;
  primaryEmail?: string | null;
  stripe_id?: string | null;
  created_at: string;
}
