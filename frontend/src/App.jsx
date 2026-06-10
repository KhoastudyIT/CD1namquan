import { useState, useCallback } from "react";
import { useReveal, toast } from "./components/ui.jsx";
import { Header } from "./components/Header.jsx";
import { Drawer } from "./components/Drawer.jsx";
import { Hero } from "./components/Hero.jsx";
import { Categories } from "./components/Categories.jsx";
import { Showcase } from "./components/Showcase.jsx";
import { FlashSale } from "./components/FlashSale.jsx";
import { NewArrivals } from "./components/NewArrivals.jsx";
import { Showroom } from "./components/Showroom.jsx";
import { Collections } from "./components/Collections.jsx";
import { BigImage } from "./components/BigImage.jsx";
import { Trust } from "./components/Trust.jsx";
import { News } from "./components/News.jsx";
import { Partners } from "./components/Partners.jsx";
import { CTA } from "./components/CTA.jsx";
import { Footer } from "./components/Footer.jsx";

export default function App() {
  const [cart, setCart] = useState([]);
  const [favs, setFavs] = useState(() => new Set());
  const [menu, setMenu] = useState(false);
  useReveal();

  const addToCart = useCallback((p) => {
    setCart((c) => [...c, p.id]);
    toast("🛒 Đã thêm “" + p.name + "” vào giỏ hàng");
  }, []);

  const toggleFav = useCallback((id) => {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else { next.add(id); toast("❤ Đã thêm vào yêu thích"); }
      return next;
    });
  }, []);

  const sharedP = { favs, onFav: toggleFav, onAdd: addToCart };

  return (
    <>
      <Header cartCount={cart.length} favCount={favs.size} onMenu={() => setMenu(true)} />
      <Drawer open={menu} onClose={() => setMenu(false)} />
      <main>
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
      </main>
      <Footer />
    </>
  );
}
