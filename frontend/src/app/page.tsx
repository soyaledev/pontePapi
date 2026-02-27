import { Hero } from '@/components/Hero/Hero';
import { BarberPoleAnimation } from '@/components/BarberPoleAnimation/BarberPoleAnimation';
import { HomeSections } from '@/components/HomeSections/HomeSections';
import { OwnerNavWrapper } from '@/components/OwnerNavWrapper';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <OwnerNavWrapper>
      <main>
        <Hero />
        <BarberPoleAnimation />
        <HomeSections />
      </main>
      <Footer />
    </OwnerNavWrapper>
  );
}
