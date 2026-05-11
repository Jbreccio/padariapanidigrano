// backend/api/src/middleware/validation.js
import { body, param, query, validationResult } from 'express-validator';

// Middleware de validação
export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    res.status(400).json({
      error: 'Erro de validação',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  };
};

// Validações de autenticação
export const loginValidation = [
  body('email')
    .isEmail().withMessage('E-mail inválido')
    .normalizeEmail(),
  body('senha')
    .isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
];

export const registerValidation = [
  body('nome')
    .notEmpty().withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),
  body('email')
    .isEmail().withMessage('E-mail inválido')
    .normalizeEmail(),
  body('senha')
    .isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Senha deve conter letras e números'),
  body('celular')
    .optional()
    .isMobilePhone('pt-BR').withMessage('Celular inválido (formato: (11) 99999-9999)')
];

// Validações de recuperação de senha
export const forgotPasswordValidation = [
  body('email')
    .isEmail().withMessage('E-mail inválido')
    .normalizeEmail()
];

export const resetPasswordValidation = [
  body('email')
    .isEmail().withMessage('E-mail inválido'),
  body('token')
    .notEmpty().withMessage('Token é obrigatório')
    .isLength({ min: 6, max: 6 }).withMessage('Token deve ter 6 dígitos'),
  body('novaSenha')
    .isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Senha deve conter letras e números')
];

// Validações do perfil do fiel
export const perfilValidation = [
  body('nome')
    .optional()
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),
  body('email')
    .optional()
    .isEmail().withMessage('E-mail inválido')
    .normalizeEmail(),
  body('telefone')
    .optional()
    .isMobilePhone('pt-BR').withMessage('Telefone inválido'),
  body('pastoral')
    .optional()
    .isString().withMessage('Pastoral inválida')
];

// Validações para contribuições de voz
export const contribuicaoVozValidation = [
  body('audio')
    .notEmpty().withMessage('Áudio é obrigatório'),
  body('livro')
    .notEmpty().withMessage('Livro é obrigatório')
    .isString().withMessage('Livro inválido'),
  body('capitulo')
    .isInt({ min: 1, max: 150 }).withMessage('Capítulo inválido'),
  body('versiculo')
    .isInt({ min: 1, max: 176 }).withMessage('Versículo inválido'),
  body('texto')
    .notEmpty().withMessage('Texto é obrigatório')
    .isLength({ max: 500 }).withMessage('Texto muito longo')
];

// Validações para velas
export const velaValidation = [
  body('name')
    .notEmpty().withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .isEmail().withMessage('E-mail inválido')
    .normalizeEmail(),
  body('intention')
    .notEmpty().withMessage('Intenção é obrigatória')
    .isLength({ max: 500 }).withMessage('Intenção muito longa'),
  body('city')
    .optional()
    .isLength({ max: 100 }).withMessage('Cidade inválida')
];

// Validações para pedidos de oração
export const oracaoValidation = [
  body('name')
    .notEmpty().withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .isEmail().withMessage('E-mail inválido')
    .normalizeEmail(),
  body('prayerRequest')
    .notEmpty().withMessage('Pedido de oração é obrigatório')
    .isLength({ max: 1200 }).withMessage('Pedido muito longo (máx. 1200 caracteres)'),
  body('city')
    .optional()
    .isLength({ max: 100 }).withMessage('Cidade inválida')
];

// Validações para dados do sistema (admin)
export const dadosSistemaValidation = [
  body('carrossel')
    .optional()
    .isArray().withMessage('Carrossel deve ser um array'),
  body('momentosLiturgicos')
    .optional()
    .isArray().withMessage('Momentos litúrgicos deve ser um array'),
  body('horariosMissas')
    .optional()
    .isArray().withMessage('Horários de missas deve ser um array'),
  body('popups')
    .optional()
    .isArray().withMessage('Popups deve ser um array')
];

// Validação de ID
export const idValidation = [
  param('id')
    .isUUID().withMessage('ID inválido')
];

export default {
  validate,
  loginValidation,
  registerValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  perfilValidation,
  contribuicaoVozValidation,
  velaValidation,
  oracaoValidation,
  dadosSistemaValidation,
  idValidation
};