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
  streaming: { soft: "bg-cat-streaming", text: "text-ink-fixed" },
  music: { soft: "bg-cat-music", text: "text-ink-fixed" },
  cloud: { soft: "bg-cat-cloud", text: "text-ink-fixed" },
  software: { soft: "bg-cat-software", text: "text-ink-fixed" },
  mobile: { soft: "bg-cat-mobile", text: "text-ink-fixed" },
  internet: { soft: "bg-cat-internet", text: "text-ink-fixed" },
  gaming: { soft: "bg-cat-gaming", text: "text-ink-fixed" },
  fitness: { soft: "bg-cat-fitness", text: "text-ink-fixed" },
  finance: { soft: "bg-cat-finance", text: "text-ink-fixed" },
  education: { soft: "bg-cat-education", text: "text-ink-fixed" },
  other: { soft: "bg-cat-other", text: "text-ink-fixed" },
};

export function categoryColor(id: CategoryId): string {
  return `var(--color-cat-${id})`;
}

export function categorySoftColor(id: CategoryId): string {
  return `var(--color-cat-${id}-soft)`;
}
