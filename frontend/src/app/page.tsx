import { Hero } from '@/components/Hero/Hero';
import { BarberPoleAnimation } from '@/components/BarberPoleAnimation/BarberPoleAnimation';
import { HomeSections } from '@/components/HomeSections/HomeSections';
import { OwnerNavWrapper } from '@/components/OwnerNavWrapper';

export default function Home() {
  return (
    <OwnerNavWrapper>
      <main>
        <Hero />
        <BarberPoleAnimation />
        <HomeSections />
      </main>
    </OwnerNavWrapper>
  );
}
