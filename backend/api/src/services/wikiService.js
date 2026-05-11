import axios from "axios";

export async function fetchFromWikipedia(nome) {
  const title = nome.replace(/ /g, "_");
  const url = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

  try {
    const { data } = await axios.get(url);

    return {
      descricao: data.description || "",
      historia: data.extract || "",
      imagem: data.thumbnail?.source || null,
      fonte: "Wikipédia"
    };
  } catch {
    return null;
  }
}
