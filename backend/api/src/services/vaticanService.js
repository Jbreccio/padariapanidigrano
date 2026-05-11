import axios from "axios";

export async function fetchFromVatican(nome) {
  try {
    const url = `https://www.vaticannews.va/pt/search.html?q=${encodeURIComponent(nome)}`;
    return {
      fonte: "Vatican News",
      link: url
    };
  } catch {
    return null;
  }
}
