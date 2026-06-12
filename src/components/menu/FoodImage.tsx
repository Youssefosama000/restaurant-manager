import { useState } from "react";
import { foodEmoji } from "../../utils/foodEmoji";

interface Props {
  name: string;
  imageUrl?: string;
  className?: string;
  emojiSize?: string;
}

function spoonacularUrl(name: string): string {
  return `https://spoonacular.com/cdn/ingredients_100x100/${name.toLowerCase().replace(/\s+/g, "-")}.jpg`;
}

export default function FoodImage({ name, imageUrl, className = "", emojiSize = "text-xl" }: Props) {
  const [failed, setFailed] = useState(false);
  const src = imageUrl || spoonacularUrl(name);

  if (failed) {
    return (
      <div className={`bg-cream flex items-center justify-center ${emojiSize} ${className}`}>
        {foodEmoji(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
