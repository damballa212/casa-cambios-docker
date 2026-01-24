import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configurar Supabase para autenticación
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos en auth.js');
  console.error('SUPABASE_URL:', supabaseUrl ? 'Configurado' : 'Faltante');
  console.error('SUPABASE_KEY:', supabaseKey ? 'Configurado' : 'Faltante');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuración de tokens
const JWT_SECRET = process.env.JWT_SECRET || 'casa-de-cambios-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'; // Access token más corto
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // Refresh token más largo

// Generar access token JWT
export const generateAccessToken = (user) => {
  const jti = crypto.randomUUID(); // Unique token ID
  return {
    token: jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        jti: jti,
        type: 'access'
      },
      JWT_SECRET,
      { 
        expiresIn: JWT_EXPIRES_IN 
      }
    ),
    jti: jti
  };
};

// Generar refresh token
export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Función legacy para compatibilidad
export const generateToken = (user) => {
  return generateAccessToken(user).token;
};

// Verificar token JWT
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Verificar refresh token
export const verifyRefreshToken = async (refreshToken) => {
  try {
    // 1. Obtener sesión
    const { data: session, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('refresh_token', refreshToken)
      .eq('is_active', true)
      .single();

    if (error || !session) {
      return null;
    }

    // 2. Obtener usuario asociado (desacoplado para evitar errores de FK)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, role, status')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      console.error('Session found but user not found:', session.user_id);
      return null;
    }

    // Verificar si el token ha expirado
    if (new Date(session.expires_at) < new Date()) {
      // Marcar sesión como inactiva
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', session.id);
      return null;
    }

    // Verificar si el usuario está activo
    if (user.status !== 'active') {
      return null;
    }

    return {
      sessionId: session.id,
      user: user
    };
  } catch (error) {
    console.error('Error verifying refresh token:', error);
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

    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    // Mapear super_admin a admin para compatibilidad
    const userRole = req.user.role === 'super_admin' ? 'admin' : req.user.role;

    if (!userRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Permisos insuficientes',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: userRoles,
        current: userRole
      });
    }

    next();
  };
};

// Autenticar usuario desde base de datos
export const authenticateUser = async (username, password, ipAddress = null, userAgent = null) => {
  try {
    // Buscar usuario en la base de datos
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, password_hash, role, failed_login_attempts, locked_until')
      .eq('username', username)
      .single();

    if (error || !user) {
      await logAuthEvent('LOGIN_FAILED_USER_NOT_FOUND', username, ipAddress, userAgent, false, 'Usuario no encontrado');
      return { success: false, error: 'Credenciales inválidas' };
    }

    // Verificar si la cuenta está bloqueada
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      await logAuthEvent('LOGIN_FAILED_ACCOUNT_LOCKED', username, ipAddress, userAgent, false, 'Cuenta bloqueada temporalmente');
      return { 
        success: false, 
        error: 'Cuenta bloqueada temporalmente. Intente más tarde.',
        lockedUntil: user.locked_until
      };
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      // Incrementar contador de intentos fallidos
      const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
      const shouldLock = newFailedAttempts >= 5;
      
      const updateData = {
        failed_login_attempts: newFailedAttempts,
        ...(shouldLock && {
          locked_until: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutos
        })
      };
      
      await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);
      
      await logAuthEvent('LOGIN_FAILED_INVALID_PASSWORD', username, ipAddress, userAgent, false, 'Contraseña incorrecta');
      
      return { 
        success: false, 
        error: shouldLock ? 
          'Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.' : 
          'Credenciales inválidas'
      };
    }
    
    // Login exitoso - resetear intentos fallidos y actualizar último login
    await supabase
      .from('users')
      .update({
        failed_login_attempts: 0,
        locked_until: null,
        last_login: new Date().toISOString()
      })
      .eq('id', user.id);
    
    await logAuthEvent('LOGIN_SUCCESS', username, ipAddress, userAgent, true, 'Login exitoso');
    
    return { 
       success: true, 
       user: {
         id: user.id,
         username: user.username,
         email: user.email,
         role: user.role
       }
     };
    
  } catch (error) {
    console.error('Error in authenticateUser:', error);
    await logAuthEvent('LOGIN_ERROR', username, ipAddress, userAgent, false, error.message);
    return { success: false, error: 'Error interno del servidor' };
  }
};

// Crear sesión con refresh token
export const createUserSession = async (userId, accessTokenJti, ipAddress = null, userAgent = null) => {
  try {
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
    
    try {
      const { data: session, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          refresh_token: refreshToken,
          access_token_jti: accessTokenJti,
          expires_at: expiresAt.toISOString(),
          ip_address: ipAddress,
          user_agent: userAgent,
          is_active: true
        })
        .select()
        .single();
      
      if (error) {
        console.log('ℹ️ Supabase user_sessions no disponible, usando fallback. Error:', error.message, error.details, error.hint);
        // Fallback: retornar token sin persistir en BD por ahora
        return refreshToken;
      }
      
      return refreshToken;
    } catch (supabaseError) {
      console.log('ℹ️ Usando fallback para user_sessions');
      return refreshToken; // Retornar token sin persistir en BD por ahora
    }
  } catch (error) {
    console.error('Error in createUserSession:', error);
    return null;
  }
};

// Renovar access token usando refresh token
export const refreshAccessToken = async (refreshToken, ipAddress = null, userAgent = null) => {
  try {
    const sessionData = await verifyRefreshToken(refreshToken);
    
    if (!sessionData) {
      return { success: false, error: 'Refresh token inválido o expirado' };
    }
    
    // Generar nuevo access token
    const { token: newAccessToken, jti } = generateAccessToken(sessionData.user);
    
    // Actualizar sesión con nuevo JTI
    await supabase
      .from('user_sessions')
      .update({
        access_token_jti: jti,
        last_used_at: new Date().toISOString()
      })
      .eq('id', sessionData.sessionId);
    
    await logAuthEvent('TOKEN_REFRESH_SUCCESS', sessionData.user.username, ipAddress, userAgent, true, 'Token renovado exitosamente');
    
    return {
      success: true,
      accessToken: newAccessToken,
      user: sessionData.user
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    await logAuthEvent('TOKEN_REFRESH_ERROR', 'unknown', ipAddress, userAgent, false, error.message);
    return { success: false, error: 'Error interno del servidor' };
  }
};

// Invalidar sesión (logout)
export const invalidateUserSession = async (refreshToken, username = null) => {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('refresh_token', refreshToken);
    
    if (error) {
      console.error('Error invalidating session:', error);
      return false;
    }
    
    await logAuthEvent('LOGOUT', username || 'unknown', null, null, true, 'Sesión cerrada exitosamente');
    return true;
  } catch (error) {
    console.error('Error in invalidateUserSession:', error);
    return false;
  }
};

// Limpiar sesiones expiradas
export const cleanupExpiredSessions = async () => {
  try {
    const { error } = await supabase
      .rpc('cleanup_expired_sessions');
    
    if (error) {
      console.error('Error cleaning up expired sessions:', error);
      return 0;
    }
    
    return true;
  } catch (error) {
    console.error('Error in cleanupExpiredSessions:', error);
    return 0;
  }
};

// Hashear contraseña (utilidad para crear nuevos usuarios)
export const hashPassword = async (password) => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, rounds);
};

// Crear nuevo usuario en base de datos
export const createUser = async (userData) => {
  try {
    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', userData.username)
      .single();
    
    if (existingUser) {
      return { success: false, error: 'El usuario ya existe' };
    }
    
    // Hashear contraseña
    const passwordHash = await hashPassword(userData.password);
    
    // Crear usuario
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        username: userData.username,
        email: userData.email,
        password_hash: passwordHash,
        role: userData.role || 'user',
        status: 'active',
        created_by: userData.createdBy || 'system',
        permissions: userData.permissions || {},
        profile: userData.profile || {}
      })
      .select('id, username, email, role, status, created_at')
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      return { success: false, error: 'Error al crear usuario' };
    }
    
    return {
      success: true,
      user: newUser
    };
  } catch (error) {
    console.error('Error in createUser:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

// Actualizar usuario en base de datos
export const updateUser = async (userId, userData) => {
  try {
    const updateData = {};
    
    if (userData.username) updateData.username = userData.username;
    if (userData.email) updateData.email = userData.email;
    if (userData.role) updateData.role = userData.role;
    if (userData.status) updateData.status = userData.status;
    if (userData.permissions) updateData.permissions = userData.permissions;
    if (userData.profile) updateData.profile = userData.profile;
    
    // Actualizar contraseña si se proporciona
    if (userData.password) {
      updateData.password_hash = await hashPassword(userData.password);
    }
    
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, username, email, role, status, updated_at')
      .single();
    
    if (error) {
      console.error('Error updating user:', error);
      return { success: false, error: 'Error al actualizar usuario' };
    }
    
    return {
      success: true,
      user: updatedUser
    };
  } catch (error) {
    console.error('Error in updateUser:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
};

// Obtener todos los usuarios
export const getAllUsers = async () => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, role, status, last_login, created_at, updated_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting users:', error);
      return [];
    }
    
    return users;
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return [];
  }
};

// Obtener usuario por ID
export const getUserById = async (userId) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, role, status, last_login, created_at, updated_at, permissions, profile')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error in getUserById:', error);
    return null;
  }
};

// Eliminar usuario
export const deleteUser = async (userId) => {
  try {
    // Verificar que no sea el último admin
    const { data: adminUsers } = await supabase
      .from('users')
      .select('id, role')
      .in('role', ['admin', 'owner'])
      .eq('status', 'active');
    
    const { data: userToDelete } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('id', userId)
      .single();
    
    if (!userToDelete) {
      return { success: false, error: 'Usuario no encontrado' };
    }
    
    if ((userToDelete.role === 'admin' || userToDelete.role === 'owner') && adminUsers.length <= 1) {
      return { success: false, error: 'No se puede eliminar el último administrador del sistema' };
    }
    
    // Invalidar todas las sesiones del usuario
    await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userId);
    
    // Eliminar usuario
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: 'Error al eliminar usuario' };
    }
    
    return {
      success: true,
      user: userToDelete
    };
  } catch (error) {
    console.error('Error in deleteUser:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
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
export const logAuthEvent = async (event, username, ip, userAgent, success = false, details = null) => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[AUTH] ${timestamp} - ${event} - User: ${username} - IP: ${ip} - UA: ${userAgent} - Success: ${success} - Details: ${details}`);
    
    // Opcional: guardar en base de datos para auditoría
    await supabase
      .from('auth_logs')
      .insert({
        event_type: event,
        username: username,
        ip_address: ip,
        user_agent: userAgent,
        success: success,
        details: details,
        created_at: timestamp
      });
  } catch (error) {
    console.error('Error logging auth event:', error);
  }
};