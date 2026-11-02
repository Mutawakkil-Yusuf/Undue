import { CATEGORY_TINTS, CategoryIcon } from "@/components/ui/category-icon";
import type { CategoryId } from "@/lib/domain/schema";
import { cn } from "@/lib/utils/cn";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "size-9 rounded-xl",
  md: "size-11 rounded-2xl",
  lg: "size-14 rounded-[1.15rem]",
  xl: "size-20 rounded-[1.6rem]",
};

const ICON_SIZES: Record<AvatarSize, number> = {
  sm: 18,
  md: 21,
  lg: 26,
  xl: 36,
};

interface ServiceAvatarProps {
  category: CategoryId;
  size?: AvatarSize;
  className?: string | undefined;
}

export function ServiceAvatar({ category, size = "md", className }: ServiceAvatarProps) {
  const tint = CATEGORY_TINTS[category];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center ring-2 ring-ink-fixed/10",
        tint.soft,
        SIZE_CLASSES[size],
        className,
      )}
    >
      <CategoryIcon
        category={category}
        className={tint.text}
        width={ICON_SIZES[size]}
        height={ICON_SIZES[size]}
        strokeWidth={2}
      />
    </span>
  );
}
