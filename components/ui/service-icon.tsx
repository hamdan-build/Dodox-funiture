import {
  Compass,
  Hammer,
  Package,
  ShieldCheck,
  Store,
  Trees,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  tree: Trees,
  truck: Truck,
  shield: ShieldCheck,
  store: Store,
  hammer: Hammer,
  compass: Compass,
  wallet: Wallet,
  package: Package,
};

export function ServiceIcon({
  name,
  size = 20,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Icon = icons[name] ?? Hammer;
  return <Icon size={size} strokeWidth={1.25} className={className} aria-hidden="true" />;
}
