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
