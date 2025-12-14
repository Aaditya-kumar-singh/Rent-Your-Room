import HeroSection from "@/components/home/HeroSection";
import FeaturedRooms from "@/components/home/FeaturedRooms";
import HowItWorks from "@/components/home/HowItWorks";
import CallToAction from "@/components/home/CallToAction";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturedRooms />
      <HowItWorks />
      <CallToAction />
    </div>
  );
}
