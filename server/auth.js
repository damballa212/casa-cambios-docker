import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Configuración de usuarios (en producción esto debería estar en base de datos)
const USERS = [
  {
    id: 1,
    username: 'admin',
    // Password: 'admin123' (hasheado)
    password: '$2a$12$TdC8WX5yrUOC.29XIdugn.yldbIjTIWQpaY4ars0/hkNufUb39nJK',
    role: 'admin'
  },
  {
    id: 2,
    username: 'gabriel',
    // Password: 'gabriel123' (hasheado)
    password: '$2a$12$Gd98fTg4LJjqoHaJnPd0Q.dMkrU06sOvxml3jGtZ7.rblQP79VUqW',
    role: 'owner'
  }
];

// Generar token JWT
export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'casa-de-cambios-secret-key-2024',
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
    }
  );
};

// Verificar token JWT
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'casa-de-cambios-secret-key-2024');
  } catch (error) {
    return null;
  }
};

// Middleware de autenticación
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Token de acceso requerido',
      code: 'NO_TOKEN' 
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ 
      error: 'Token inválido o expirado',
      code: 'INVALID_TOKEN' 
    });
  }

  req.user = decoded;
  next();
};

// Middleware de autorización por rol
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Permisos insuficientes',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

// Autenticar usuario
export const authenticateUser = async (username, password) => {
  const user = USERS.find(u => u.username === username);
  
  if (!user) {
    return { success: false, error: 'Usuario no encontrado' };
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  
  if (!isValidPassword) {
    return { success: false, error: 'Contraseña incorrecta' };
  }

  const token = generateToken(user);
  
  return {
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
};

// Hashear contraseña (utilidad para crear nuevos usuarios)
export const hashPassword = async (password) => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, rounds);
};

// Validar fuerza de contraseña
export const validatePassword = (password) => {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`La contraseña debe tener al menos ${minLength} caracteres`);
  }
  
  if (!hasUpperCase) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }
  
  if (!hasLowerCase) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }
  
  if (!hasNumbers) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Obtener información del usuario actual
export const getCurrentUser = (req) => {
  return req.user || null;
};

// Logging de eventos de autenticación
export const logAuthEvent = (event, username, ip, userAgent) => {
  const timestamp = new Date().toISOString();
  console.log(`[AUTH] ${timestamp} - ${event} - User: ${username} - IP: ${ip} - UA: ${userAgent}`);
};