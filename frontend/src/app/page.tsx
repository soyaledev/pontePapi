import { Hero } from '@/components/Hero/Hero';
import { BarberPoleAnimation } from '@/components/BarberPoleAnimation/BarberPoleAnimation';
import { HomeSections } from '@/components/HomeSections/HomeSections';

export default function Home() {
  return (
    <main>
      <Hero />
      <BarberPoleAnimation />
      <HomeSections />
    </main>
  );
}
