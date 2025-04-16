import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

export default function SectionNavigator(props: {
  sections: { label: string; id: string }[];
  className?: string;
}) {
  const { sections, className } = props;

  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const updateActiveSection = () => {
      sections.forEach((section) => {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
            setActiveSection(section.id);
          }
        }
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -80% 0px", threshold: 0.1 },
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    updateActiveSection(); // Update on page load

    return () => {
      sections.forEach((section) => {
        const element = document.getElementById(section.id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [sections]);

  return (
    <div className={cn("sticky top-4 left-0 flex flex-col w-52", className)}>
      {sections.map((section) => (
        <Button
          key={section.id}
          className={cn(
            "justify-start bg-transparent shadow-none text-gray-700 hover:bg-black/5",
            activeSection === section.id && "text-primary-500 font-semibold",
          )}
          onClick={() => {
            const element = document.getElementById(section.id);
            if (element) {
              element.scrollIntoView();
            }
          }}
        >
          {section.label}
        </Button>
      ))}
    </div>
  );
}
