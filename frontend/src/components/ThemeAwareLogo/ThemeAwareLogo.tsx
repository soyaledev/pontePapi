'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';

type ThemeAwareLogoProps = {
  width?: number;
  height?: number;
  className?: string;
  imageClassName?: string;
  href?: string;
  priority?: boolean;
};

export function ThemeAwareLogo({
  width = 160,
  height = 48,
  className,
  imageClassName,
  href,
  priority = false,
}: ThemeAwareLogoProps) {
  const { theme } = useTheme();
  const logoSrc = theme === 'dark' ? '/images/LogoFooter.webp' : '/images/LogoFooterDM.webp';

  const image = (
    <Image
      src={logoSrc}
      alt="PontePapi"
      width={width}
      height={height}
      priority={priority}
      className={imageClassName ?? className}
      style={{ height: 'auto', width: 'auto' }}
    />
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-label="PontePapi - Inicio">
        {image}
      </Link>
    );
  }

  return <span className={className}>{image}</span>;
}
