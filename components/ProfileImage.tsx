// components/ProfileImage.tsx
import { Avatar } from "@/components/ui/avatar";
import Image from "next/image";

interface ProfileImageProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 32,
  md: 48,
  lg: 96
};

export function ProfileImage({ src, alt, size = 'md' }: ProfileImageProps) {
  const dimension = sizes[size];
  
  return (
    <Avatar className={`w-${dimension} h-${dimension}`}>
      <Image
        src={src || "/placeholder-avatar.png"}
        alt={alt}
        width={dimension}
        height={dimension}
        className="rounded-full object-cover"
      />
    </Avatar>
  );
}