import type { ComponentType, SVGProps } from "react";
import {
  CloudIcon,
  EducationIcon,
  FinanceIcon,
  FitnessIcon,
  GamingIcon,
  InternetIcon,
  MobileIcon,
  MusicIcon,
  OtherIcon,
  SoftwareIcon,
  StreamingIcon,
} from "@/components/ui/icons";
import type { CategoryId } from "@/lib/domain/schema";

const CATEGORY_ICONS: Record<CategoryId, ComponentType<SVGProps<SVGSVGElement>>> = {
  streaming: StreamingIcon,
  music: MusicIcon,
  cloud: CloudIcon,
  software: SoftwareIcon,
  mobile: MobileIcon,
  internet: InternetIcon,
  gaming: GamingIcon,
  fitness: FitnessIcon,
  finance: FinanceIcon,
  education: EducationIcon,
  other: OtherIcon,
};

interface CategoryIconProps extends SVGProps<SVGSVGElement> {
  category: CategoryId;
}

export function CategoryIcon({ category, ...props }: CategoryIconProps) {
  const IconComponent = CATEGORY_ICONS[category];
  return <IconComponent {...props} />;
}

export interface CategoryTint {
  readonly soft: string;
  readonly text: string;
}

export const CATEGORY_TINTS: Record<CategoryId, CategoryTint> = {
  streaming: { soft: "bg-cat-streaming-soft", text: "text-cat-streaming" },
  music: { soft: "bg-cat-music-soft", text: "text-cat-music" },
  cloud: { soft: "bg-cat-cloud-soft", text: "text-cat-cloud" },
  software: { soft: "bg-cat-software-soft", text: "text-cat-software" },
  mobile: { soft: "bg-cat-mobile-soft", text: "text-cat-mobile" },
  internet: { soft: "bg-cat-internet-soft", text: "text-cat-internet" },
  gaming: { soft: "bg-cat-gaming-soft", text: "text-cat-gaming" },
  fitness: { soft: "bg-cat-fitness-soft", text: "text-cat-fitness" },
  finance: { soft: "bg-cat-finance-soft", text: "text-cat-finance" },
  education: { soft: "bg-cat-education-soft", text: "text-cat-education" },
  other: { soft: "bg-cat-other-soft", text: "text-cat-other" },
};

export function categoryColor(id: CategoryId): string {
  return `var(--color-cat-${id})`;
}

export function categorySoftColor(id: CategoryId): string {
  return `var(--color-cat-${id}-soft)`;
}
