import {
  Anchor, BookOpen, Compass, Cross, Feather, Flame, Footprints, Gift, HandHeart, HandHelping, Heart,
  HeartHandshake, Infinity as InfinityIcon, MessageCircleHeart, Sparkles, Sprout, Sunrise, Undo2, Users, Wand2,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  Anchor, BookOpen, Compass, Cross, Feather, Flame, Footprints, Gift, HandHeart, HandHelping, Heart,
  HeartHandshake, Infinity: InfinityIcon, MessageCircleHeart, Sparkles, Sprout, Sunrise, Undo2, Users, Wand2,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Heart;
  return <Icon className={className} aria-hidden />;
}
