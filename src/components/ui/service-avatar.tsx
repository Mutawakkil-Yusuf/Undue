import { CategoryIcon } from "@/components/ui/category-icon";
import type { CategoryId } from "@/lib/domain/schema";
import { cn } from "@/lib/utils/cn";

type AvatarSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "size-9 rounded-xl",
  md: "size-11 rounded-2xl",
  lg: "size-14 rounded-2xl",
};

const ICON_SIZES: Record<AvatarSize, number> = {
  sm: 18,
  md: 20,
  lg: 26,
};

interface ServiceAvatarProps {
  category: CategoryId;
  size?: AvatarSize;
  className?: string | undefined;
}

export function ServiceAvatar({ category, size = "md", className }: ServiceAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center border border-line bg-bone text-ink/70",
        SIZE_CLASSES[size],
        className,
      )}
    >
      <CategoryIcon
        category={category}
        width={ICON_SIZES[size]}
        height={ICON_SIZES[size]}
      />
    </span>
  );
}
