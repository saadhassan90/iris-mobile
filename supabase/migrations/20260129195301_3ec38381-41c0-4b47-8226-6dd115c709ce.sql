-- Create contacts table for storing scanned business card information
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  website TEXT,
  address TEXT,
  notes TEXT,
  source_image_url TEXT,
  raw_extracted_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for business card images
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-cards', 'business-cards', true);

-- Create storage policies for the business-cards bucket
CREATE POLICY "Business card images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'business-cards');

CREATE POLICY "Anyone can upload business card images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'business-cards');

CREATE POLICY "Anyone can update business card images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'business-cards');

CREATE POLICY "Anyone can delete business card images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'business-cards');