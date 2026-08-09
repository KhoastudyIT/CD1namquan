import { useState, useEffect } from "react";
import { useSettings } from "../context.js";

function initialsOf(name) {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "NQ";
  return words.slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

export function Logo() {
  const { companyName, slogan, logo } = useSettings();
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [logo]);

  const showImage = Boolean(logo) && !broken;

  return (
    <div className="logo">
      {showImage ? (
        <span className="mark mark-img">
          <img src={logo} alt={companyName} onError={() => setBroken(true)} />
        </span>
      ) : (
        <span className="mark">{initialsOf(companyName)}</span>
      )}
      <span>
        {companyName}
        {slogan && <small>{slogan}</small>}
      </span>
    </div>
  );
}
