import { generateAvatar } from '../utils/avatarGenerator.js';

export const createFiel = async (data, file) => {
  let avatar;

  // 📸 se enviou imagem
  if (file) {
    avatar = {
      type: 'image',
      url: `/uploads/avatars/${file.filename}`
    };
  } else {
    avatar = generateAvatar(data.name);
  }

  const user = {
    ...data,
    avatar
  };

  // 👉 aqui você salva no banco
  return user;
};