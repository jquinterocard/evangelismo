import {
  Anchor, BookOpen, Compass, Feather, Flame, Footprints, Gift, HandHeart, HandHelping, Heart,
  HeartHandshake, Infinity as InfinityIcon, MessageCircleHeart, Sparkles, Sprout, Sunrise, Undo2, Users, Wand2,
} from "lucide-react";
import type { ComponentType } from "react";
import { LatinCrossIcon } from "./LatinCrossIcon";

const icons: Record<string, ComponentType<{ className?: string }>> = {
  Cross: LatinCrossIcon,
  Anchor, BookOpen, Compass, Feather, Flame, Footprints, Gift, HandHeart, HandHelping, Heart,
  HeartHandshake, Infinity: InfinityIcon, MessageCircleHeart, Sparkles, Sprout, Sunrise, Undo2, Users, Wand2,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Heart;
  return <Icon className={className} aria-hidden />;
}
