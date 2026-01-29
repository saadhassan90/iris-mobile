import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, Phone, Building2, Briefcase, Globe, MapPin, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Contact {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  job_title?: string | null;
  website?: string | null;
  address?: string | null;
  source_image_url?: string | null;
}

interface ContactCardProps {
  contact: Contact;
  className?: string;
}

const ContactCard = ({ contact, className }: ContactCardProps) => {
  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(" ");
  
  const fields = [
    { icon: Mail, value: contact.email, href: contact.email ? `mailto:${contact.email}` : undefined },
    { icon: Phone, value: contact.phone, href: contact.phone ? `tel:${contact.phone}` : undefined },
    { icon: Building2, value: contact.company },
    { icon: Briefcase, value: contact.job_title },
    { icon: Globe, value: contact.website, href: contact.website?.startsWith('http') ? contact.website : contact.website ? `https://${contact.website}` : undefined },
    { icon: MapPin, value: contact.address },
  ].filter(field => field.value);

  return (
    <Card className={cn("bg-card/50 border-border/50 overflow-hidden", className)}>
      <CardContent className="p-4">
        {/* Header with name */}
        {fullName && (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/50">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{fullName}</h3>
              {contact.job_title && contact.company && (
                <p className="text-sm text-muted-foreground">
                  {contact.job_title} at {contact.company}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Contact details */}
        <div className="space-y-2">
          {fields.map((field, index) => {
            const Icon = field.icon;
            // Skip job_title and company if already shown in header
            if ((field.icon === Briefcase || field.icon === Building2) && fullName && contact.job_title && contact.company) {
              return null;
            }
            
            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                {field.href ? (
                  <a 
                    href={field.href}
                    target={field.icon === Globe ? "_blank" : undefined}
                    rel={field.icon === Globe ? "noopener noreferrer" : undefined}
                    className="text-primary hover:underline truncate flex items-center gap-1"
                  >
                    {field.value}
                    {field.icon === Globe && <ExternalLink className="h-3 w-3" />}
                  </a>
                ) : (
                  <span className="text-foreground truncate">{field.value}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Source image thumbnail */}
        {contact.source_image_url && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <a 
              href={contact.source_image_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              View original business card
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactCard;
