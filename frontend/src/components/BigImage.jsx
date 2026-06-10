import { Img } from "./ui.jsx";
import { IMG } from "../data.js";

export function BigImage() {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="bigimg reveal"><Img src={IMG.bigRoom} alt="Không gian trưng bày" label="ảnh không gian" /></div>
      </div>
    </section>
  );
}
