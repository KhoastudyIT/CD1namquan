import { Hero } from "../components/Hero.jsx";
import { Categories } from "../components/Categories.jsx";
import { Showcase } from "../components/Showcase.jsx";
import { FlashSale } from "../components/FlashSale.jsx";
import { NewArrivals } from "../components/NewArrivals.jsx";
import { Showroom } from "../components/Showroom.jsx";
import { Collections } from "../components/Collections.jsx";
import { BigImage } from "../components/BigImage.jsx";
import { Trust } from "../components/Trust.jsx";
import { News } from "../components/News.jsx";
import { Partners } from "../components/Partners.jsx";
import { CTA } from "../components/CTA.jsx";
import { useAppContext } from "../context.js";

export function Home() {
  const { favs, toggleFav, addToCart } = useAppContext();
  const sharedP = { favs, onFav: toggleFav, onAdd: addToCart };

  return (
    <>
      <Hero />
      <Categories />
      <Showcase />
      <FlashSale {...sharedP} />
      <NewArrivals {...sharedP} />
      <Showroom {...sharedP} />
      <Collections />
      <BigImage />
      <Trust />
      <News />
      <Partners />
      <CTA />
    </>
  );
}
