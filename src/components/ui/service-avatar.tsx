import { cn } from "@/lib/utils/cn";

type AvatarSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "size-9 text-lg rounded-xl",
  md: "size-11 text-xl rounded-2xl",
  lg: "size-14 text-2xl rounded-2xl",
};

interface ServiceAvatarProps {
  emoji: string;
  size?: AvatarSize;
  className?: string | undefined;
}

export function ServiceAvatar({ emoji, size = "md", className }: ServiceAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center border border-line bg-bone",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {emoji}
    </span>
  );
}
