import { useState } from "react";
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
  const [selectedCat, setSelectedCat] = useState("Tất cả");
  const sharedP = { favs, onFav: toggleFav, onAdd: addToCart };

  const handleCategorySelect = (catName) => {
    setSelectedCat(catName);
    const showroomEl = document.getElementById("showroom");
    if (showroomEl) {
      showroomEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <Hero />
      <Categories onSelectCategory={handleCategorySelect} />
      <Showcase />
      <FlashSale {...sharedP} />
      <NewArrivals {...sharedP} />
      <Showroom {...sharedP} selectedCategory={selectedCat} onCategoryChange={setSelectedCat} />
      <Collections />
      <BigImage />
      <Trust />
      <News />
      <Partners />
      <CTA />
    </>
  );
}
