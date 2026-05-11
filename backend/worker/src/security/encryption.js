export async function encrypt(text) {
  return btoa(text); // simples (depois pode usar AES real)
}

export async function decrypt(text) {
  return atob(text);
}