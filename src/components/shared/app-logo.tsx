import Image from "next/image";
import { cn } from "@/lib/utils";

type AppLogoProps = {
  className?: string;
  alt?: string;
  priority?: boolean;
};

export function AppLogo({
  className,
  alt = "Logo SACDIA",
  priority = false,
}: AppLogoProps) {
  return (
    <Image
      src="/svg/LogoSACDIA.svg"
      alt={alt}
      width={64}
      height={64}
      priority={priority}
      className={cn("h-10 w-10 object-contain", className)}
    />
  );
}
